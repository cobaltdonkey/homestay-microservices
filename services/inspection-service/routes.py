import os
import uuid
import json
from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError
from models import InspectionReport
from db import db
from shared.constants import *

main = Blueprint('main', __name__)

@main.route('/health', methods=['GET'])
def health():
    return jsonify({
        "code": 200,
        "data": {
            "status": "ok",
            "service": os.environ.get('SERVICE_NAME', 'inspection-service')
        },
        "message": "success"
    }), 200

@main.route('/', methods=['POST'])
@main.route('/inspections', methods=['POST'])
def create_inspection():
    data = request.json or {}
    stay_id = data.get('stayId')
    host_id = data.get('hostId')
    condition_result = data.get('conditionResult')
    photos = data.get('photos', [])
    notes = data.get('notes', '')

    if not all([stay_id, host_id, condition_result]):
        return jsonify({"code": 400, "data": {}, "message": "Missing required fields"}), 400

    if condition_result not in ['GOOD', 'MINOR_DAMAGE', 'MAJOR_DAMAGE']:
        return jsonify({"code": 400, "data": {}, "message": "Invalid condition result"}), 400

    if not isinstance(photos, list):
        return jsonify({"code": 400, "data": {}, "message": "photos must be a list"}), 400

    inspection_id = str(uuid.uuid4())
    photos_str = json.dumps(photos) if photos else None

    new_report = InspectionReport(
        inspection_id=inspection_id,
        stay_id=stay_id,
        host_id=host_id,
        condition_result=condition_result,
        photos=photos_str,
        notes=notes
    )

    try:
        db.session.add(new_report)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"code": 409, "data": {}, "message": "Inspection for this stayId already exists"}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({"code": 500, "data": {}, "message": str(e)}), 500

    return jsonify({
        "code": 201,
        "data": {
            "inspectionId": inspection_id,
            "conditionResult": condition_result
        },
        "message": "Inspection created successfully"
    }), 201

@main.route('/<string:inspection_id>', methods=['GET'])
@main.route('/inspections/<string:inspection_id>', methods=['GET'])
def get_inspection(inspection_id):
    report = InspectionReport.query.get(inspection_id)
    if not report:
        return jsonify({"code": 404, "data": {}, "message": "Inspection not found"}), 404
        
    return jsonify({
        "code": 200,
        "data": report.to_dict(),
        "message": "success"
    }), 200

@main.route('/by-stay/<string:stay_id>', methods=['GET'])
@main.route('/inspections/by-stay/<string:stay_id>', methods=['GET'])
def get_inspection_by_stay(stay_id):
    report = InspectionReport.query.filter_by(stay_id=stay_id).first()
    if not report:
        return jsonify({"code": 404, "data": {}, "message": "Inspection not found for this stay"}), 404
        
    return jsonify({
        "code": 200,
        "data": report.to_dict(),
        "message": "success"
    }), 200
