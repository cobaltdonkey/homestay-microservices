import os
import requests
from flask import Blueprint, request, jsonify
from models import ListingIndex
from db import db

main = Blueprint('main', __name__)

@main.route('/health', methods=['GET'])
def health():
    return jsonify({
        "code": 200,
        "data": {
            "status": "ok",
            "service": os.environ.get('SERVICE_NAME', 'listings-search-service')
        },
        "message": "success"
    }), 200

@main.route('/listings/index', methods=['POST'])
@main.route('/search/listings/index', methods=['POST'])
def index_listing():
    data = request.json or {}
    listing_id = data.get('listingId')
    host_id = data.get('hostId')
    title = data.get('title')
    location = data.get('location')
    price_per_night = data.get('pricePerNight')
    booking_mode = data.get('bookingMode')

    if not all([listing_id, host_id, title, location, price_per_night, booking_mode]):
        return jsonify({"code": 400, "data": {}, "message": "Missing required fields"}), 400

    if booking_mode not in ['INSTANT', 'REQUEST']:
        return jsonify({"code": 400, "data": {}, "message": "Invalid bookingMode"}), 400

    listing = ListingIndex.query.get(listing_id)
    if listing:
        listing.host_id = host_id
        listing.title = title
        listing.location = location
        listing.price_per_night = price_per_night
        listing.booking_mode = booking_mode
        listing.availability_status = 'AVAILABLE'
    else:
        listing = ListingIndex(
            listing_id=listing_id,
            host_id=host_id,
            title=title,
            location=location,
            price_per_night=price_per_night,
            booking_mode=booking_mode,
            availability_status='AVAILABLE'
        )
        db.session.add(listing)

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"code": 500, "data": {}, "message": str(e)}), 500

    return jsonify({
        "code": 201,
        "data": listing.to_dict(),
        "message": "Listing indexed successfully"
    }), 201


@main.route('/listings', methods=['GET'])
@main.route('/search/listings', methods=['GET'])
def search_listings():
    location = request.args.get('location')
    max_price = request.args.get('maxPrice')
    limit_str = request.args.get('limit', '5')
    check_in_date = request.args.get('checkInDate')
    check_out_date = request.args.get('checkOutDate')

    if not location:
        return jsonify({"code": 400, "data": {}, "message": "location query parameter is required"}), 400

    try:
        limit = int(limit_str)
    except ValueError:
        return jsonify({"code": 400, "data": {}, "message": "Invalid limit format"}), 400

    query = ListingIndex.query.filter(
        ListingIndex.location.ilike(f"%{location}%"),
        ListingIndex.availability_status == 'AVAILABLE'
    )

    if max_price is not None:
        try:
            max_p = float(max_price)
            query = query.filter(ListingIndex.price_per_night <= max_p)
        except ValueError:
            return jsonify({"code": 400, "data": {}, "message": "Invalid maxPrice format"}), 400

    # Fetch initial potential matches directly from DB 
    listings = query.all()
    
    # If explicit chronological dates provided, perform remote availability RPC
    if check_in_date and check_out_date:
        available_listings = []
        for l in listings:
            try:
                # Use internal Docker routing strictly for performance bridging 
                avail_url = f"http://availability-service:5005/?listingId={l.listing_id}&checkInDate={check_in_date}&checkOutDate={check_out_date}"
                resp = requests.get(avail_url, timeout=3)
                if resp.status_code == 200:
                    resp_data = resp.json().get('data', {})
                    if resp_data.get('available') is True:
                        available_listings.append(l)
            except Exception:
                pass # Skip if failure
        listings = available_listings
        
    listings = listings[:limit]

    return jsonify({
        "code": 200,
        "data": {
            "query": {
                "location": location,
                "maxPrice": max_price,
                "limit": limit,
                "checkInDate": check_in_date,
                "checkOutDate": check_out_date
            },
            "results": [l.to_dict() for l in listings]
        },
        "message": "success"
    }), 200
