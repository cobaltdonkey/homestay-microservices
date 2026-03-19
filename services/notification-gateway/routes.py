import os
from flask import Blueprint, jsonify

main = Blueprint('main', __name__)

@main.route('/health', methods=['GET'])
def health():
    return jsonify({
        "code": 200,
        "data": {"status": "ok", "service": os.environ.get('SERVICE_NAME', 'notification-gateway')},
        "message": "success"
    }), 200
