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
from models import UserProfile
from db import db
from shared.constants import ROLE_GUEST, ROLE_HOST

OUTSYSTEMS_MODE = os.environ.get("OUTSYSTEMS_MODE", "false").lower() == "true"
OUTSYSTEMS_BASE_URL = os.environ.get("OUTSYSTEMS_BASE_URL", "")

main = Blueprint('main', __name__)

@main.route('/health', methods=['GET'])
def health():
    return jsonify({
        "code": 200,
        "data": {
            "status": "ok",
            "service": os.environ.get('SERVICE_NAME', 'users-service')
        },
        "message": "success"
    }), 200

# Mapping both root (/) and /users just in case Kong strip_path handles them flexibly
@main.route('/', methods=['POST'])
@main.route('/users', methods=['POST'])
def create_user():
    data = request.json or {}
    name = data.get('name')
    email = data.get('email')
    phone_number = data.get('phoneNumber')
    role = data.get('role')

    if not all([name, email, phone_number, role]):
        return jsonify({"code": 400, "data": {}, "message": "Missing required fields"}), 400

    if role not in [ROLE_GUEST, ROLE_HOST]:
        return jsonify({"code": 400, "data": {}, "message": "Invalid role"}), 400

    user_id = str(uuid.uuid4())
    new_user = UserProfile(
        user_id=user_id,
        name=name,
        email=email,
        phone_number=phone_number,
        role=role
    )

    try:
        db.session.add(new_user)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"code": 409, "data": {}, "message": "Email already exists"}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({"code": 500, "data": {}, "message": str(e)}), 500

    return jsonify({
        "code": 201,
        "data": new_user.to_dict(),
        "message": "User created successfully"
    }), 201

@main.route('/<string:user_id>/profile', methods=['GET'])
@main.route('/users/<string:user_id>/profile', methods=['GET'])
def get_user_profile(user_id):
    if OUTSYSTEMS_MODE:
        r = requests.get(
            f"{OUTSYSTEMS_BASE_URL}/users/{user_id}/profile",
            timeout=10)
        if r.status_code == 200:
            return jsonify({"code": 200, "data": r.json(),
                "message": "success"}), 200
        else:
            return jsonify({"code": r.status_code, "data": None,
                "message": "OutSystems error"}), r.status_code

    user = UserProfile.query.get(user_id)
    if not user:
        return jsonify({"code": 404, "data": {}, "message": "User not found"}), 404

    return jsonify({
        "code": 200,
        "data": user.to_dict(),
        "message": "success"
    }), 200

@main.route('/<string:user_id>/contact', methods=['GET'])
@main.route('/users/<string:user_id>/contact', methods=['GET'])
def get_user_contact(user_id):
    if OUTSYSTEMS_MODE:
        r = requests.get(
            f"{OUTSYSTEMS_BASE_URL}/users/{user_id}/contact",
            timeout=10)
        if r.status_code == 200:
            return jsonify({"code": 200, "data": r.json(),
                "message": "success"}), 200
        else:
            return jsonify({"code": r.status_code, "data": None,
                "message": "OutSystems error"}), r.status_code

    user = UserProfile.query.get(user_id)
    if not user:
        return jsonify({"code": 404, "data": {}, "message": "User not found"}), 404

    return jsonify({
        "code": 200,
        "data": {
            "userId": user.user_id,
            "phoneNumber": user.phone_number,
            "email": user.email
        },
        "message": "success"
    }), 200
