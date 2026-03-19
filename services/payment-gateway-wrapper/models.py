import uuid
from datetime import datetime
from db import db
from shared.constants import *

class HealthCheck(db.Model):
    __tablename__ = 'health_check'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
