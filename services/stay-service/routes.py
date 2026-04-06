import os
import uuid
import requests
from datetime import datetime, time
from concurrent.futures import ThreadPoolExecutor
from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError
from models import Stay
from db import db
from shared.constants import *

main = Blueprint('main', __name__)

@main.route('/health', methods=['GET'])
@main.route('/stays/health', methods=['GET'])
def health():
    return jsonify({
        "code": 200,
        "data": {
            "status": "ok",
            "service": os.environ.get('SERVICE_NAME', 'stay-service')
        },
        "message": "success"
    }), 200

@main.route('/', methods=['GET'])
@main.route('/stays', methods=['GET'])
def list_stays():
    host_id = request.args.get('hostId')
    guest_id = request.args.get('guestId')
    status = request.args.get('status')
    enrich = request.args.get('enrich', 'false').lower() == 'true'
    
    query = Stay.query
    if host_id:
        query = query.filter_by(host_id=host_id)
    if guest_id:
        query = query.filter_by(guest_id=guest_id)
        
    if status == 'ACTIVE':
        # Active stay: guest has checked in but not yet checked out
        today = datetime.utcnow().date()
        query = query.filter(Stay.check_in_date <= today, Stay.check_out_date >= today)
    elif status == 'PAST':
        # Past stay: checkout time has already passed
        now = datetime.utcnow()
        query = query.filter(Stay.checkout_time <= now)
        
    stays = query.order_by(Stay.check_in_date.desc()).all()
    stays_data = [s.to_dict() for s in stays]

    if enrich and stays_data:
        # Identify unique IDs
        listing_ids = list(set(s['listingId'] for s in stays_data if s.get('listingId')))
        guest_ids = list(set(s['guestId'] for s in stays_data if s.get('guestId')))

        # Fetch in parallel
        with ThreadPoolExecutor(max_workers=10) as executor:
            # Listing lookups
            listing_futures = {lid: executor.submit(requests.get, f"{LISTINGS_SERVICE_URL}/listings/{lid}", timeout=5) for lid in listing_ids}
            # Guest lookups
            guest_futures = {gid: executor.submit(requests.get, f"{USERS_SERVICE_URL}/users/{gid}/profile", timeout=5) for gid in guest_ids}

            # Gather results
            listings_map = {}
            for lid, future in listing_futures.items():
                try:
                    resp = future.result()
                    if resp.status_code == 200:
                        listings_map[lid] = resp.json().get('data', {})
                except Exception: pass

            guests_map = {}
            for gid, future in guest_futures.items():
                try:
                    resp = future.result()
                    if resp.status_code == 200:
                        guests_map[gid] = resp.json().get('data', {})
                except Exception: pass

        # Merge - return partial data if lookup fails (per user request)
        for s in stays_data:
            lid = s.get('listingId')
            gid = s.get('guestId')
            if lid in listings_map:
                s['listingData'] = listings_map[lid]
            if gid in guests_map:
                s['guestData'] = guests_map[gid]

    return jsonify({
        "code": 200,
        "data": stays_data,
        "message": "success"
    }), 200

@main.route('/', methods=['POST'])
@main.route('/stays', methods=['POST'])
def create_stay():
    data = request.json or {}
    booking_id = data.get('bookingId')
    guest_id = data.get('guestId')
    host_id = data.get('hostId')
    listing_id = data.get('listingId')
    check_in_str = data.get('checkInDate')
    check_out_str = data.get('checkOutDate')
    deposit_txn_id = data.get('depositTxnId')
    deposit_amount = data.get('depositAmount')
    checkout_time_str = data.get('checkoutTime')

    if not all([booking_id, guest_id, host_id, listing_id, check_in_str, check_out_str]):
        return jsonify({"code": 400, "data": {}, "message": "Missing required fields"}), 400

    try:
        check_in_date = datetime.strptime(check_in_str, '%Y-%m-%d').date()
        check_out_date = datetime.strptime(check_out_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({"code": 400, "data": {}, "message": "Invalid date format, use YYYY-MM-DD"}), 400

    if checkout_time_str:
        try:
            checkout_time = datetime.fromisoformat(checkout_time_str.replace('Z', '+00:00'))
            checkout_time = checkout_time.replace(tzinfo=None)
        except ValueError:
            return jsonify({"code": 400, "data": {}, "message": "Invalid checkout time format"}), 400
    else:
        # Default to checkOutDate at 11:00:00 UTC+8 (which is 03:00:00 UTC)
        checkout_time = datetime.combine(check_out_date, time(hour=3, minute=0, second=0))

    stay_id = str(uuid.uuid4())
    new_stay = Stay(
        stay_id=stay_id,
        booking_id=booking_id,
        guest_id=guest_id,
        host_id=host_id,
        listing_id=listing_id,
        check_in_date=check_in_date,
        check_out_date=check_out_date,
        deposit_txn_id=deposit_txn_id,
        deposit_amount=deposit_amount,
        checkout_time=checkout_time,
        deposit_status='HELD'
    )

    try:
        db.session.add(new_stay)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"code": 409, "data": {}, "message": "A stay for this bookingId already exists"}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({"code": 500, "data": {}, "message": str(e)}), 500

    return jsonify({
        "code": 201,
        "data": new_stay.to_dict(),
        "message": "Stay created successfully"
    }), 201

@main.route('/<string:stay_id>', methods=['GET'])
@main.route('/stays/<string:stay_id>', methods=['GET'])
def get_stay(stay_id):
    stay = Stay.query.get(stay_id)
    if not stay:
        return jsonify({"code": 404, "data": {}, "message": "Stay not found"}), 404
        
    return jsonify({
        "code": 200,
        "data": stay.to_dict(),
        "message": "success"
    }), 200

@main.route('/<string:stay_id>/deposit-status', methods=['PATCH'])
@main.route('/stays/<string:stay_id>/deposit-status', methods=['PATCH'])
def update_deposit_status(stay_id):
    data = request.json or {}
    deposit_status = data.get('depositStatus')
    
    if not deposit_status or deposit_status not in ['HELD', 'RELEASED', 'CAPTURED', 'RESOLVED']:
        return jsonify({"code": 400, "data": {}, "message": "Invalid deposit status"}), 400

    stay = Stay.query.get(stay_id)
    if not stay:
        return jsonify({"code": 404, "data": {}, "message": "Stay not found"}), 404

    try:
        stay.deposit_status = deposit_status
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"code": 500, "data": {}, "message": str(e)}), 500

    return jsonify({
        "code": 200,
        "data": stay.to_dict(),
        "message": "Deposit status updated successfully"
    }), 200
