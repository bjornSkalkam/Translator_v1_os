import uuid
from datetime import datetime
from db.sql import db
from config import STATUS_CREATED


class Session(db.Model):
    __tablename__ = "sessions"

    id = db.Column(
        db.String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    status = db.Column(db.String(50), nullable=False, default=STATUS_CREATED)
    language_a = db.Column(db.String(10))
    language_b = db.Column(db.String(10))
    model_a = db.Column(db.JSON)
    model_b = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    translations = db.relationship("Translation", backref="session", lazy=True)

    def to_dict(self):
        return {
            "session_id": self.id,
            "status": self.status,
            "language_a": self.language_a,
            "language_b": self.language_b,
            "model_a": self.model_a,
            "model_b": self.model_b,
        }
