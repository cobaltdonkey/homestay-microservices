import uuid
from datetime import datetime
from db import db

class UserProfile(db.Model):
    __tablename__ = 'user_profile'
    
    user_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), nullable=False, unique=True)
    phone_number = db.Column(db.String(20), nullable=False)
    role = db.Column(db.Enum('guest', 'host', name='user_roles'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "userId": self.user_id,
            "name": self.name,
            "email": self.email,
            "phoneNumber": self.phone_number,
            "role": self.role,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None
        }
