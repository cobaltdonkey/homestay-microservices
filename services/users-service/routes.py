# ═══════════════════════════════════════════
# OUTSYSTEMS INTEGRATION NOTE (IS213 Report)
# ═══════════════════════════════════════════
# To expose Users as an OutSystems service:
# 1. In OutSystems, create a REST API with two methods:
#    - GetUserProfile: GET /users/{userId}/profile
#    - GetUserContact: GET /users/{userId}/contact
#    Both return JSON matching the envelope format.
# 2. Set env vars in docker-compose.yml:
#    OUTSYSTEMS_MODE: "true"
#    OUTSYSTEMS_BASE_URL: <your OutSystems endpoint>
# 3. All other services continue calling users-service
#    via Kong unchanged. The switch is transparent.
# ═══════════════════════════════════════════

import os
import uuid
import requests
from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError
from werkzeug.security import generate_password_hash, check_password_hash
from models import UserProfile, UserSession
from db import db
from shared.constants import ROLE_GUEST, ROLE_HOST
from datetime import datetime

OUTSYSTEMS_MODE = os.environ.get("OUTSYSTEMS_MODE", "false").lower() == "true"
OUTSYSTEMS_BASE_URL = os.environ.get("OUTSYSTEMS_BASE_URL", "")

main = Blueprint('main', __name__)

# ─────────────────────────────────────────
# Helper responses
# ─────────────────────────────────────────
def success_response(data, code=200, message="success"):
    return jsonify({"code": code, "data": data, "message": message}), code

def error_response(message, code=400):
    return jsonify({"code": code, "data": None, "message": message}), code


# ─────────────────────────────────────────
# Health check
# ─────────────────────────────────────────
@main.route('/health', methods=['GET'])
def health():
    return jsonify({
        "code": 200,
        "data": {"status": "ok", "service": "users-service"},
        "message": "success"
    }), 200


# ─────────────────────────────────────────
# POST /users — create account
# ─────────────────────────────────────────
@main.route('/', methods=['POST'])
@main.route('/users', methods=['POST'])
def create_user():
    data = request.json or {}

    name         = data.get('name')
    email        = data.get('email')
    phone_number = data.get('phoneNumber')
    role         = data.get('role')
    password     = data.get('password')

    if not all([name, email, phone_number, role, password]):
        return error_response("Missing required fields: name, email, phoneNumber, role, password", 400)

    if role not in [ROLE_GUEST, ROLE_HOST]:
        return error_response("Invalid role — must be guest or host", 400)

    if len(password) < 6:
        return error_response("Password must be at least 6 characters", 400)

    new_user = UserProfile(
        user_id      = str(uuid.uuid4()),
        name         = name,
        email        = email,
        phone_number = phone_number,
        role         = role,
        password     = generate_password_hash(password)
    )

    try:
        db.session.add(new_user)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return error_response("Email already registered", 409)
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)

    return success_response(new_user.to_dict(), 201, "User created successfully")


# ─────────────────────────────────────────
# POST /users/login — login
# ─────────────────────────────────────────
@main.route('/users/login', methods=['POST'])
def login():
    data = request.json or {}

    email    = data.get('email')
    password = data.get('password')

    if not email or not password:
        return error_response("Email and password required", 400)

    user = UserProfile.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.password, password):
        return error_response("Invalid email or password", 401)

    # Create a session record
    session = UserSession(
        session_id   = str(uuid.uuid4()),
        user_id      = user.user_id,
        logged_in_at = datetime.utcnow(),
        is_active    = True
    )

    db.session.add(session)
    db.session.commit()

    return success_response({
        "userId":    user.user_id,
        "name":      user.name,
        "email":     user.email,
        "role":      user.role,
        "sessionId": session.session_id
    }, 200, "Login successful")


# ─────────────────────────────────────────
# POST /users/logout — logout
# ─────────────────────────────────────────
@main.route('/users/logout', methods=['POST'])
def logout():
    data = request.json or {}
    session_id = data.get('sessionId')

    if not session_id:
        return error_response("sessionId required", 400)

    session = UserSession.query.filter_by(
        session_id=session_id,
        is_active=True
    ).first()

    if not session:
        return error_response("Session not found or already logged out", 404)

    session.logged_out_at = datetime.utcnow()
    session.is_active     = False
    db.session.commit()

    return success_response({"sessionId": session_id}, 200, "Logged out successfully")


# ─────────────────────────────────────────
# GET /users/<user_id>/profile — get profile
# ─────────────────────────────────────────
@main.route('/<string:user_id>/profile', methods=['GET'])
@main.route('/users/<string:user_id>/profile', methods=['GET'])
def get_user_profile(user_id):
    if OUTSYSTEMS_MODE:
        r = requests.get(f"{OUTSYSTEMS_BASE_URL}/users/{user_id}/profile", timeout=10)
        if r.status_code == 200:
            return success_response(r.json())
        return error_response("OutSystems error", r.status_code)

    user = UserProfile.query.get(user_id)
    if not user:
        return error_response("User not found", 404)

    return success_response(user.to_dict())


# ─────────────────────────────────────────
# GET /users/<user_id>/contact — get contact
# ─────────────────────────────────────────
@main.route('/<string:user_id>/contact', methods=['GET'])
@main.route('/users/<string:user_id>/contact', methods=['GET'])
def get_user_contact(user_id):
    if OUTSYSTEMS_MODE:
        r = requests.get(f"{OUTSYSTEMS_BASE_URL}/users/{user_id}/contact", timeout=10)
        if r.status_code == 200:
            return success_response(r.json())
        return error_response("OutSystems error", r.status_code)

    user = UserProfile.query.get(user_id)
    if not user:
        return error_response("User not found", 404)

    return success_response({
        "userId":      user.user_id,
        "phoneNumber": user.phone_number,
        "email":       user.email
    })


# ─────────────────────────────────────────
# GET /users/<user_id>/sessions — login history
# ─────────────────────────────────────────
@main.route('/users/<string:user_id>/sessions', methods=['GET'])
def get_sessions(user_id):
    user = UserProfile.query.get(user_id)
    if not user:
        return error_response("User not found", 404)

    sessions = UserSession.query.filter_by(user_id=user_id)\
               .order_by(UserSession.logged_in_at.desc()).all()

    return success_response([{
        "sessionId":    s.session_id,
        "loggedInAt":   s.logged_in_at.isoformat(),
        "loggedOutAt":  s.logged_out_at.isoformat() if s.logged_out_at else None,
        "isActive":     s.is_active
    } for s in sessions])