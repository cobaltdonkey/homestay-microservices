import os
import json
import time
import uuid
import pika

RABBITMQ_URL = os.environ.get('RABBITMQ_URL', 'amqp://guest:guest@rabbitmq:5672/')
DEMO_MODE = os.environ.get('TWILIO_DEMO_MODE', 'true').lower() == 'true'


def send_sms(app, to_number, body, event_type, reference_id, recipient_id):
    """Send SMS (demo or live) without database persistence."""
    status = 'SIMULATED'
    
    if not to_number:
        print(f"[SMS SKIP] No phone number provided for {recipient_id} on event {event_type}", flush=True)
        return 'SKIPPED'

    if DEMO_MODE:
        print(f"[DEMO SMS] To:{to_number} | Msg:{body} | Ref:{reference_id}", flush=True)
        status = 'SIMULATED'
    else:
        try:
            print(f"[LIVE SMS] Attempting to send to {to_number} via Twilio...", flush=True)
            from twilio.rest import Client
            account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
            auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
            from_number = os.environ.get('TWILIO_FROM_NUMBER', '+15186346622') # Match .env (or just use env var)
            
            if not all([account_sid, auth_token]):
                print("[SMS ERROR] TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN missing!", flush=True)
                return 'CONFIG_ERROR'

            client = Client(account_sid, auth_token)
            msg = client.messages.create(
                body=body,
                from_=os.environ.get('TWILIO_FROM_NUMBER', from_number),
                to=to_number
            )
            status = 'SENT'
            print(f"[LIVE SMS] Successfully sent! SID: {msg.sid} | To: {to_number}", flush=True)
        except Exception as e:
            print(f"[LIVE SMS][ERROR] Failed to send message to {to_number}: {str(e)}", flush=True)
            status = 'FAILED'

    return status


def handle_message(app, routing_key, data):
    """Route an event to the appropriate SMS handler(s)."""
    booking_id = data.get('bookingId', '')
    stay_id = data.get('stayId', '')
    
    guest_contact = data.get('guestContact', {})
    host_contact = data.get('hostContact', {})
    guest_phone = guest_contact.get('phoneNumber', '')
    host_phone = host_contact.get('phoneNumber', '')
    guest_id = data.get('guestId', '')
    host_id = data.get('hostId', '')
    check_in = data.get('checkInDate', '')
    check_out = data.get('checkOutDate', '')

    if routing_key == 'booking.confirmed':
        send_sms(app,
            guest_phone,
            f"Your booking is confirmed! ID: {booking_id}. Check-in: {check_in}, Check-out: {check_out}.",
            'booking.confirmed', booking_id, guest_id
        )
        send_sms(app,
            host_phone,
            f"New confirmed booking! ID: {booking_id}. Guest arrives: {check_in}.",
            'booking.confirmed', booking_id, host_id
        )

    elif routing_key == 'booking.requested':
        listing_title = data.get('listingTitle', 'your homestay')
        send_sms(app,
            guest_phone,
            f"Request sent! Booking ID: {booking_id} for '{listing_title}'. Stay: {check_in} to {check_out}. Awaiting host approval within 48 hours.",
            'booking.requested', booking_id, guest_id
        )
        send_sms(app,
            host_phone,
            f"New booking request for '{listing_title}'! ID: {booking_id}. Guest: {guest_contact.get('name', 'Someone')} ({check_in} – {check_out}). Please approve or decline within 48 hours.",
            'booking.requested', booking_id, host_id
        )

    elif routing_key == 'booking.declined':
        alt_listings = data.get('alternativeListings', [])[:3]
        alt_str = ', '.join([f"{l.get('title','?')} (${l.get('pricePerNight','?')}/night)" for l in alt_listings]) or 'None available'
        send_sms(app,
            guest_phone,
            f"Booking {booking_id} was not approved. Alternatives: {alt_str}",
            'booking.declined', booking_id, guest_id
        )

    elif routing_key == 'booking.expired':
        alt_listings = data.get('alternativeListings', [])[:3]
        alt_str = ', '.join([f"{l.get('title','?')} (${l.get('pricePerNight','?')}/night)" for l in alt_listings]) or 'None available'
        send_sms(app,
            guest_phone,
            f"Booking request {booking_id} expired - no host response. Try: {alt_str}",
            'booking.expired', booking_id, guest_id
        )

    elif routing_key == 'deposit.resolved':
        action = data.get('action', '')
        amount = data.get('amount', 0)
        guest_phone = data.get('guestContact', {}).get('phoneNumber', '')
        host_phone = data.get('hostContact', {}).get('phoneNumber', '')
        guest_id = data.get('guestId', '')
        host_id = data.get('hostId', '')

        if action in ('RELEASE', 'AUTO_RELEASE'):
            send_sms(app,
                guest_phone,
                f"Good news! Your deposit of ${amount} for stay {stay_id} has been fully released.",
                'deposit.resolved', stay_id, guest_id
            )
            send_sms(app,
                host_phone,
                f"Deposit released for stay {stay_id}.",
                'deposit.resolved', stay_id, host_id
            )
        elif action == 'CAPTURE':
            send_sms(app,
                guest_phone,
                f"A damage deposit of ${amount} was charged for stay {stay_id}. Contact support to dispute.",
                'deposit.resolved', stay_id, guest_id
            )
            send_sms(app,
                host_phone,
                f"Damage deposit of ${amount} captured for stay {stay_id}.",
                'deposit.resolved', stay_id, host_id
            )


def start_consumer(app):
    """Start RabbitMQ consumer with reconnect loop."""
    retries = 0
    max_retries = 10

    while True:
        try:
            print("Connecting to RabbitMQ...", flush=True)
            parameters = pika.URLParameters(RABBITMQ_URL)
            connection = pika.BlockingConnection(parameters)
            channel = connection.channel()

            # Declare exchange
            channel.exchange_declare(
                exchange='booking_events',
                exchange_type='topic',
                durable=True
            )

            # Set up notification_queue
            channel.queue_declare(queue='notification_queue', durable=True)
            channel.queue_bind(exchange='booking_events', queue='notification_queue', routing_key='booking.*')

            # Set up notification_deposit_queue
            channel.queue_declare(queue='notification_deposit_queue', durable=True)
            channel.queue_bind(exchange='booking_events', queue='notification_deposit_queue', routing_key='deposit.*')

            def make_callback(queue_name):
                def callback(ch, method, properties, body):
                    try:
                        data = json.loads(body)
                        routing_key = method.routing_key
                        print(f"[Notification] Received {routing_key} from {queue_name}", flush=True)
                        handle_message(app, routing_key, data)
                    except Exception as e:
                        print(f"[Notification] Error processing message: {e}", flush=True)
                    finally:
                        ch.basic_ack(delivery_tag=method.delivery_tag)
                return callback

            channel.basic_consume(
                queue='notification_queue',
                on_message_callback=make_callback('notification_queue')
            )
            channel.basic_consume(
                queue='notification_deposit_queue',
                on_message_callback=make_callback('notification_deposit_queue')
            )

            retries = 0  # reset on successful connect
            print("Notification consumer running...", flush=True)
            channel.start_consuming()

        except pika.exceptions.AMQPConnectionError as e:
            retries += 1
            if retries > max_retries:
                print(f"[Notification] Max retries reached. Giving up.", flush=True)
                break
            print(f"[Notification] RabbitMQ connection error (attempt {retries}/{max_retries}): {e}. Retrying in 5s...", flush=True)
            time.sleep(5)
        except Exception as e:
            print(f"[Notification] Unexpected error: {e}. Reconnecting in 5s...", flush=True)
            time.sleep(5)
