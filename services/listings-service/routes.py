import os
import uuid
from flask import Blueprint, request, jsonify
from models import PropertyDetails
from db import db
from shared.constants import BOOKING_MODE_INSTANT, BOOKING_MODE_REQUEST, LISTINGS_SEARCH_SERVICE_URL
import requests

main = Blueprint('main', __name__)

@main.route('/health', methods=['GET'])
def health():
    return jsonify({
        "code": 200,
        "data": {
            "status": "ok",
            "service": os.environ.get('SERVICE_NAME', 'listings-service')
        },
        "message": "success"
    }), 200

@main.route('/', methods=['POST'])
@main.route('/listings', methods=['POST'])
def create_listing():
    data = request.json or {}
    host_id = data.get('hostId')
    title = data.get('title')
    location = data.get('location')
    price_per_night = data.get('pricePerNight')
    booking_mode = data.get('bookingMode')

    if not all([host_id, title, location, price_per_night, booking_mode]):
        return jsonify({"code": 400, "data": {}, "message": "Missing required fields"}), 400

    if booking_mode not in [BOOKING_MODE_INSTANT, BOOKING_MODE_REQUEST]:
        return jsonify({"code": 400, "data": {}, "message": "Invalid booking mode"}), 400

    listing_id = str(uuid.uuid4())
    new_listing = PropertyDetails(
        listing_id=listing_id,
        host_id=host_id,
        title=title,
        location=location,
        price_per_night=price_per_night,
        booking_mode=booking_mode,
        status='ACTIVE'
    )

    try:
        db.session.add(new_listing)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"code": 500, "data": {}, "message": str(e)}), 500

    # Index listing for search
    try:
        requests.post(f"{LISTINGS_SEARCH_SERVICE_URL}/listings/index", json=new_listing.to_dict(), timeout=3)
    except Exception as e:
        print(f"Warning: Failed to index listing {listing_id}: {e}")

    return jsonify({
        "code": 201,
        "data": new_listing.to_dict(),
        "message": "Listing created successfully"
    }), 201

@main.route('/<string:listing_id>', methods=['GET'])
@main.route('/listings/<string:listing_id>', methods=['GET'])
def get_listing(listing_id):
    listing = PropertyDetails.query.get(listing_id)
    if not listing:
        return jsonify({"code": 404, "data": {}, "message": "Listing not found"}), 404
        
    if listing.status != 'ACTIVE':
        return jsonify({"code": 400, "data": {}, "message": f"Listing is not ACTIVE (current status: {listing.status})"}), 400
        
    return jsonify({
        "code": 200,
        "data": listing.to_dict(),
        "message": "success"
    }), 200

@main.route('/<string:listing_id>/status', methods=['PUT'])
@main.route('/listings/<string:listing_id>/status', methods=['PUT'])
def update_status(listing_id):
    data = request.json or {}
    new_status = data.get('status')
    
    if not new_status or new_status not in ['ACTIVE', 'INACTIVE', 'SUSPENDED']:
        return jsonify({"code": 400, "data": {}, "message": "Invalid status"}), 400

    listing = PropertyDetails.query.get(listing_id)
    if not listing:
        return jsonify({"code": 404, "data": {}, "message": "Listing not found"}), 404

    try:
        listing.status = new_status
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"code": 500, "data": {}, "message": str(e)}), 500

    return jsonify({
        "code": 200,
        "data": listing.to_dict(),
        "message": "Status updated successfully"
    }), 200
