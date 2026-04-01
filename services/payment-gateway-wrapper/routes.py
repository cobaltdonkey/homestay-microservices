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

@main.route('/gateway/create-payment-intent', methods=['POST'])
@main.route('/create-payment-intent', methods=['POST'])
def create_payment_intent():
    data = request.json or {}
    amount = data.get('amount')
    booking_id = data.get('bookingId')
    currency = data.get('currency', 'sgd').lower()
    capture_method = data.get('capture_method', 'automatic') # automatic or manual

    if not all([amount, booking_id]):
        return jsonify({"code": 400, "data": {}, "message": "Missing amount or bookingId"}), 400

    if DEMO_MODE:
        return jsonify({
            "code": 200, 
            "data": {
                "clientSecret": f"demo_secret_{uuid.uuid4().hex}",
                "paymentIntentId": demo_txn_id()
            }, 
            "message": "success (DEMO)"
        }), 200

    try:
        intent = stripe.PaymentIntent.create(
            amount=int(float(amount) * 100),
            currency=currency,
            capture_method=capture_method,
            metadata={"bookingId": booking_id},
            automatic_payment_methods={"enabled": True},
        )
        return jsonify({
            "code": 200,
            "data": {
                "clientSecret": intent.client_secret,
                "paymentIntentId": intent.id
            },
            "message": "success"
        }), 200
    except stripe.error.StripeError as e:
        return jsonify({"code": 402, "data": {}, "message": str(e)}), 402


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
    payment_intent_id = data.get('paymentIntentId') # New: confirm an existing intent
    idempotency_key = data.get('idempotencyKey')

    if not any([payment_method_id, payment_intent_id]):
         return jsonify({"code": 400, "data": {}, "message": "Missing paymentMethodId or paymentIntentId"}), 400

    if DEMO_MODE:
        print(f"[DEMO] Stripe call simulated: capture booking={booking_id} amount={amount}", flush=True)
        txn_id = payment_intent_id or demo_txn_id()
        return jsonify({"code": 200, "data": {
            "paymentTxnId": txn_id, "amount": amount, "status": "SUCCESS"
        }, "message": "success"}), 200

    try:
        if payment_intent_id:
            # If we already have a payment intent confirmed on client, we just retrieve/verify it
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            if intent.status == 'succeeded':
                return jsonify({"code": 200, "data": {
                    "paymentTxnId": intent.id, "amount": amount, "status": "SUCCESS"
                }, "message": "success"}), 200
            else:
                return jsonify({"code": 402, "data": {}, "message": f"Payment status: {intent.status}"}), 402
        else:
            # Legacy flow: create and confirm on server
            intent = stripe.PaymentIntent.create(
                amount=int(float(amount) * 100),
                currency="sgd",
                payment_method=payment_method_id,
                capture_method="automatic",
                confirm=True,
                metadata={"bookingId": booking_id},
                idempotency_key=idempotency_key,
                automatic_payment_methods={"enabled": True, "allow_redirects": "never"},
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
    payment_intent_id = data.get('paymentIntentId')
    idempotency_key = data.get('idempotencyKey')

    if not any([payment_method_id, payment_intent_id]):
         return jsonify({"code": 400, "data": {}, "message": "Missing paymentMethodId or paymentIntentId"}), 400

    if DEMO_MODE:
        print(f"[DEMO] Stripe call simulated: authorise booking={booking_id} amount={amount}", flush=True)
        txn_id = payment_intent_id or demo_txn_id()
        return jsonify({"code": 200, "data": {
            "paymentTxnId": txn_id, "amount": amount, "status": "AUTHORIZED"
        }, "message": "success"}), 200

    try:
        if payment_intent_id:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            if intent.status == 'requires_capture':
                return jsonify({"code": 200, "data": {
                    "paymentTxnId": intent.id, "amount": amount, "status": "AUTHORIZED"
                }, "message": "success"}), 200
            else:
                return jsonify({"code": 402, "data": {}, "message": f"Payment status: {intent.status}"}), 402
        else:
            intent = stripe.PaymentIntent.create(
                amount=int(float(amount) * 100),
                currency="sgd",
                payment_method=payment_method_id,
                capture_method="manual",
                confirm=True,
                metadata={"bookingId": booking_id},
                idempotency_key=idempotency_key,
                automatic_payment_methods={"enabled": True, "allow_redirects": "never"},
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
    booking_amount = data.get('bookingAmount')
    deposit_amount = data.get('depositAmount')
    payment_method_id = data.get('paymentMethodId')
    idempotency_key = data.get('idempotencyKey')

    if not all([booking_id, payment_method_id, idempotency_key]):
        return jsonify({"code": 400, "data": {}, "message": "Missing required fields"}), 400

    if not booking_amount and not deposit_amount:
        return jsonify({"code": 400, "data": {}, "message": "Provide either bookingAmount or depositAmount"}), 400

    if DEMO_MODE:
        print(f"[DEMO] Stripe call simulated: pre-auth booking={booking_amount} deposit={deposit_amount}", flush=True)
        return jsonify({"code": 200, "data": {
            "paymentTxnId": demo_txn_id() if booking_amount else None,
            "depositTxnId": demo_txn_id() if deposit_amount else None,
            "status": "HELD"
        }, "message": "success"}), 200

    try:
        results = {}
        payment_intent_id = data.get('paymentIntentId')

        # 1. Booking Amount — if frontend already confirmed an intent, reuse it
        if booking_amount:
            if payment_intent_id:
                # Frontend already confirmed this intent (manual capture = requires_capture)
                # Just retrieve and verify it
                booking_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
                results["paymentTxnId"] = booking_intent.id
                results["paymentStatus"] = booking_intent.status
            else:
                # No existing intent — create a new authorization hold
                booking_intent = stripe.PaymentIntent.create(
                    amount=int(float(booking_amount) * 100),
                    currency="sgd",
                    payment_method=payment_method_id,
                    capture_method="manual",
                    confirm=True,
                    metadata={"bookingId": booking_id, "type": "booking_hold"},
                    idempotency_key=f"{idempotency_key}-bk"
                )
                results["paymentTxnId"] = booking_intent.id
                results["paymentStatus"] = booking_intent.status

        # 2. Deposit Amount — always create a separate intent
        if deposit_amount:
            deposit_intent = stripe.PaymentIntent.create(
                amount=int(float(deposit_amount) * 100),
                currency="sgd",
                payment_method=payment_method_id,
                capture_method="manual",
                confirm=True,
                metadata={"bookingId": booking_id, "type": "deposit_hold"},
                idempotency_key=f"{idempotency_key}-dp"
            )
            results["depositTxnId"] = deposit_intent.id
            results["depositStatus"] = deposit_intent.status

        return jsonify({"code": 200, "data": {
            **results,
            "status": "HELD",
            "message": "Authorisation hold successful"
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
