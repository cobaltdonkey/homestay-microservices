import uuid
from datetime import datetime
from db import db

class NotificationMessage(db.Model):
    __tablename__ = 'notification_message'

    notification_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    recipient_id = db.Column(db.String(36))
    recipient_phone = db.Column(db.String(20), nullable=False)
    channel = db.Column(db.Enum('SMS', name='channel_enum'), nullable=False, default='SMS')
    message_body = db.Column(db.Text, nullable=False)
    event_type = db.Column(db.String(50), nullable=False)
    reference_id = db.Column(db.String(36))
    status = db.Column(db.Enum('SENT', 'FAILED', 'SIMULATED', name='notif_status_enum'), nullable=False, default='SIMULATED')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
