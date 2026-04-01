from db import db
from datetime import datetime
import uuid

class UserProfile(db.Model):
    __tablename__ = "user_profile"
    __table_args__ = {"schema": "user_db"}

    user_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), nullable=False, unique=True)
    phone_number = db.Column(db.String(20), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    password = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "userId": self.user_id,
            "name": self.name,
            "email": self.email,
            "phoneNumber": self.phone_number,
            "role": self.role,
            "createdAt": self.created_at.isoformat() if self.created_at else None
        }


class UserSession(db.Model):
    __tablename__ = "user_session"
    __table_args__ = {"schema": "user_db"}

    session_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), nullable=False)
    logged_in_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    logged_out_at = db.Column(db.DateTime, nullable=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)