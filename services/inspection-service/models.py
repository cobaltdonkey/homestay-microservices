import uuid
import json
from datetime import datetime
from db import db

class InspectionReport(db.Model):
    __tablename__ = 'inspection_report'
    __table_args__ = {"schema": "inspection_db"}

    inspection_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    stay_id = db.Column(db.String(36), nullable=False, unique=True)
    host_id = db.Column(db.String(36), nullable=False)
    condition_result = db.Column(db.Enum('GOOD', 'MINOR_DAMAGE', 'MAJOR_DAMAGE', name='condition_enum'), nullable=False)
    photos = db.Column(db.Text)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        photos_list = []
        if self.photos:
            try:
                photos_list = json.loads(self.photos)
            except json.JSONDecodeError:
                photos_list = [self.photos]

        return {
            "inspectionId": self.inspection_id,
            "stayId": self.stay_id,
            "hostId": self.host_id,
            "conditionResult": self.condition_result,
            "photos": photos_list,
            "notes": self.notes,
            "createdAt": self.created_at.isoformat() if self.created_at else None
        }
