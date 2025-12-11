import uuid
from db.sql import db


class LanguageSetting(db.Model):
    """
    Language settings - compatible with existing Azure database schema.
    Stores per-language configuration for voices and AI models.
    """

    __tablename__ = "language_settings"

    id = db.Column(
        db.String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    code = db.Column(db.String(16), unique=True, nullable=False)  # e.g., "nl-NL", "iu-Cans-CA"
    enabled = db.Column(db.Boolean, default=False)
    voice = db.Column(db.String(64))  # e.g., "nl-NL-FennaNeural"
    transcribe_model = db.Column(db.String(32))  # e.g., "azure_speech", "promte_whisper"
    translation_model = db.Column(db.String(32))  # e.g., "gpt4o-mini", "promte_4o"
    summary_model = db.Column(db.String(32))  # e.g., "gpt4o-mini", "promte_4o"

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "enabled": self.enabled,
            "voice": self.voice,
            "transcribe_model": self.transcribe_model,
            "translation_model": self.translation_model,
            "summary_model": self.summary_model,
        }
