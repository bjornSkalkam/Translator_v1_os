from datetime import datetime
from db.sql import db

class Translation(db.Model):
    __tablename__ = "translations"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    session_id = db.Column(db.String(36), db.ForeignKey("sessions.id"))
    from_lang = db.Column(db.String(10))
    to_lang = db.Column(db.String(10))
    original = db.Column(db.Text)
    translated = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "from": self.from_lang,
            "to": self.to_lang,
            "original": self.original,
            "translated": self.translated,
        }
