import os
import uuid
from flask import Blueprint, request, jsonify

main = Blueprint('main', __name__)

DEMO_MODE = os.environ.get('STRIPE_DEMO_MODE', 'true').lower() == 'true'

if not DEMO_MODE:
    import stripe
    stripe.api_key = os.environ.get('STRIPE_SECRET_KEY', '')

def demo_txn_id():
    return f"demo_pi_{uuid.uuid4().hex[:12]}"

@main.route('/health', methods=['GET'])
def health():
    return jsonify({
        "code": 200,
        "data": {"status": "ok", "service": os.environ.get('SERVICE_NAME', 'payment-gateway-wrapper')},
        "message": "success"
    }), 200

@main.route('/capture', methods=['POST'])
@main.route('/gateway/capture', methods=['POST'])
@main.route('/gateway/charge', methods=['POST'])
def capture():
    data = request.json or {}
    booking_id = data.get('bookingId')
    amount = data.get('amount')
    payment_method_id = data.get('paymentMethodId')
    idempotency_key = data.get('idempotencyKey')

    if not all([booking_id, amount, payment_method_id, idempotency_key]):
        return jsonify({"code": 400, "data": {}, "message": "Missing required fields"}), 400

    if DEMO_MODE:
        print(f"[DEMO] Stripe call simulated: capture booking={booking_id} amount={amount}", flush=True)
        txn_id = demo_txn_id()
        return jsonify({"code": 200, "data": {
            "paymentTxnId": txn_id, "amount": amount, "status": "SUCCESS"
        }, "message": "success"}), 200

    try:
        intent = stripe.PaymentIntent.create(
            amount=int(float(amount) * 100),
            currency="sgd",
            payment_method=payment_method_id,
            capture_method="automatic",
            confirm=True,
            metadata={"bookingId": booking_id},
            idempotency_key=idempotency_key
        )
        return jsonify({"code": 200, "data": {
            "paymentTxnId": intent.id, "amount": amount, "status": "SUCCESS"
        }, "message": "success"}), 200
    except stripe.error.StripeError as e:
        return jsonify({"code": 402, "data": {}, "message": str(e)}), 402

@main.route('/authorise', methods=['POST'])
@main.route('/gateway/authorise', methods=['POST'])
@main.route('/gateway/authorize', methods=['POST'])
def authorise():
    data = request.json or {}
    booking_id = data.get('bookingId')
    amount = data.get('amount')
    payment_method_id = data.get('paymentMethodId')
    idempotency_key = data.get('idempotencyKey')

    if not all([booking_id, amount, payment_method_id, idempotency_key]):
        return jsonify({"code": 400, "data": {}, "message": "Missing required fields"}), 400

    if DEMO_MODE:
        print(f"[DEMO] Stripe call simulated: authorise booking={booking_id} amount={amount}", flush=True)
        txn_id = demo_txn_id()
        return jsonify({"code": 200, "data": {
            "paymentTxnId": txn_id, "amount": amount, "status": "AUTHORIZED"
        }, "message": "success"}), 200

    try:
        intent = stripe.PaymentIntent.create(
            amount=int(float(amount) * 100),
            currency="sgd",
            payment_method=payment_method_id,
            capture_method="manual",
            confirm=True,
            metadata={"bookingId": booking_id},
            idempotency_key=idempotency_key
        )
        return jsonify({"code": 200, "data": {
            "paymentTxnId": intent.id, "amount": amount, "status": "AUTHORIZED"
        }, "message": "success"}), 200
    except stripe.error.StripeError as e:
        return jsonify({"code": 402, "data": {}, "message": str(e)}), 402

@main.route('/void', methods=['POST'])
@main.route('/gateway/void', methods=['POST'])
def void():
    data = request.json or {}
    payment_txn_id = data.get('paymentTxnId')
    reason = data.get('reason', '')
    idempotency_key = data.get('idempotencyKey')

    if not all([payment_txn_id, idempotency_key]):
        return jsonify({"code": 400, "data": {}, "message": "Missing required fields"}), 400

    if DEMO_MODE:
        print(f"[DEMO] Stripe call simulated: void txnId={payment_txn_id} reason={reason}", flush=True)
        return jsonify({"code": 200, "data": {
            "paymentTxnId": payment_txn_id, "status": "VOIDED"
        }, "message": "success"}), 200

    try:
        stripe.PaymentIntent.cancel(payment_txn_id, idempotency_key=idempotency_key)
        return jsonify({"code": 200, "data": {
            "paymentTxnId": payment_txn_id, "status": "VOIDED"
        }, "message": "success"}), 200
    except stripe.error.StripeError as e:
        return jsonify({"code": 402, "data": {}, "message": str(e)}), 402

@main.route('/pre-auth', methods=['POST'])
@main.route('/gateway/pre-auth', methods=['POST'])
def pre_auth():
    data = request.json or {}
    booking_id = data.get('bookingId')
    deposit_amount = data.get('depositAmount')
    payment_method_id = data.get('paymentMethodId')
    idempotency_key = data.get('idempotencyKey')

    if not all([booking_id, deposit_amount, payment_method_id, idempotency_key]):
        return jsonify({"code": 400, "data": {}, "message": "Missing required fields"}), 400

    if DEMO_MODE:
        print(f"[DEMO] Stripe call simulated: pre-auth deposit booking={booking_id} amount={deposit_amount}", flush=True)
        txn_id = demo_txn_id()
        return jsonify({"code": 200, "data": {
            "depositTxnId": txn_id, "depositAmount": deposit_amount, "status": "HELD"
        }, "message": "success"}), 200

    try:
        intent = stripe.PaymentIntent.create(
            amount=int(float(deposit_amount) * 100),
            currency="sgd",
            payment_method=payment_method_id,
            capture_method="manual",
            confirm=True,
            metadata={"bookingId": booking_id, "type": "deposit"},
            idempotency_key=idempotency_key
        )
        return jsonify({"code": 200, "data": {
            "depositTxnId": intent.id, "depositAmount": deposit_amount, "status": "HELD"
        }, "message": "success"}), 200
    except stripe.error.StripeError as e:
        return jsonify({"code": 402, "data": {}, "message": str(e)}), 402

@main.route('/deposits/release', methods=['POST'])
@main.route('/gateway/deposits/release', methods=['POST'])
def release_deposit():
    data = request.json or {}
    deposit_txn_id = data.get('depositTxnId')
    reason = data.get('reason', '')
    idempotency_key = data.get('idempotencyKey')

    if not all([deposit_txn_id, idempotency_key]):
        return jsonify({"code": 400, "data": {}, "message": "Missing required fields"}), 400

    if DEMO_MODE:
        print(f"[DEMO] Stripe call simulated: deposit release txnId={deposit_txn_id} reason={reason}", flush=True)
        return jsonify({"code": 200, "data": {
            "depositTxnId": deposit_txn_id, "status": "RELEASED"
        }, "message": "success"}), 200

    try:
        stripe.PaymentIntent.cancel(deposit_txn_id, idempotency_key=idempotency_key)
        return jsonify({"code": 200, "data": {
            "depositTxnId": deposit_txn_id, "status": "RELEASED"
        }, "message": "success"}), 200
    except stripe.error.StripeError as e:
        return jsonify({"code": 402, "data": {}, "message": str(e)}), 402

@main.route('/deposits/capture', methods=['POST'])
@main.route('/gateway/deposits/capture', methods=['POST'])
def capture_deposit():
    data = request.json or {}
    deposit_txn_id = data.get('depositTxnId')
    reason = data.get('reason', '')
    idempotency_key = data.get('idempotencyKey')

    if not all([deposit_txn_id, idempotency_key]):
        return jsonify({"code": 400, "data": {}, "message": "Missing required fields"}), 400

    if DEMO_MODE:
        print(f"[DEMO] Stripe call simulated: deposit capture txnId={deposit_txn_id} reason={reason}", flush=True)
        return jsonify({"code": 200, "data": {
            "depositTxnId": deposit_txn_id, "status": "CAPTURED"
        }, "message": "success"}), 200

    try:
        stripe.PaymentIntent.capture(deposit_txn_id, idempotency_key=idempotency_key)
        return jsonify({"code": 200, "data": {
            "depositTxnId": deposit_txn_id, "status": "CAPTURED"
        }, "message": "success"}), 200
    except stripe.error.StripeError as e:
        return jsonify({"code": 402, "data": {}, "message": str(e)}), 402
