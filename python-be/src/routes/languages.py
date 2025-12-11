from flask_restx import Namespace, Resource, fields
from flask import request
from db.sql import db
from models.language import LanguageSetting

ns_languages = Namespace("languages", description="Language settings management")

# API models for documentation
language_model = ns_languages.model(
    "LanguageSetting",
    {
        "id": fields.String(description="UUID of the setting"),
        "code": fields.String(required=True, description="Language code (e.g., 'nl-NL')"),
        "enabled": fields.Boolean(description="Whether this language is enabled"),
        "voice": fields.String(description="Default TTS voice (e.g., 'nl-NL-FennaNeural')"),
        "transcribe_model": fields.String(description="Model for speech-to-text"),
        "translation_model": fields.String(description="Model for translation"),
        "summary_model": fields.String(description="Model for conversation recap"),
    },
)

language_update_model = ns_languages.model(
    "LanguageSettingUpdate",
    {
        "enabled": fields.Boolean(description="Whether this language is enabled"),
        "voice": fields.String(description="Default TTS voice"),
        "transcribe_model": fields.String(description="Model for speech-to-text"),
        "translation_model": fields.String(description="Model for translation"),
        "summary_model": fields.String(description="Model for conversation recap"),
    },
)

bulk_update_item = ns_languages.model(
    "BulkUpdateItem",
    {
        "code": fields.String(required=True, description="Language code"),
        "enabled": fields.Boolean(description="Whether this language is enabled"),
        "voice": fields.String(description="Default TTS voice"),
        "transcribe_model": fields.String(description="Transcription model"),
        "translation_model": fields.String(description="Translation model"),
        "summary_model": fields.String(description="Summary/recap model"),
    },
)


@ns_languages.route("/")
class LanguageList(Resource):
    @ns_languages.marshal_list_with(language_model)
    def get(self):
        """Get all language settings"""
        languages = LanguageSetting.query.order_by(LanguageSetting.code).all()
        return [lang.to_dict() for lang in languages]


@ns_languages.route("/<string:code>")
class LanguageDetail(Resource):
    @ns_languages.marshal_with(language_model)
    def get(self, code):
        """Get settings for a specific language"""
        lang = LanguageSetting.query.filter_by(code=code).first()
        if not lang:
            ns_languages.abort(404, f"Language '{code}' not found")
        return lang.to_dict()

    @ns_languages.expect(language_update_model)
    @ns_languages.marshal_with(language_model)
    def put(self, code):
        """Update settings for a specific language"""
        lang = LanguageSetting.query.filter_by(code=code).first()
        if not lang:
            ns_languages.abort(404, f"Language '{code}' not found")

        data = request.get_json()
        if "enabled" in data:
            lang.enabled = data["enabled"]
        if "voice" in data:
            lang.voice = data["voice"]
        if "transcribe_model" in data:
            lang.transcribe_model = data["transcribe_model"]
        if "translation_model" in data:
            lang.translation_model = data["translation_model"]
        if "summary_model" in data:
            lang.summary_model = data["summary_model"]

        db.session.commit()
        return lang.to_dict()


@ns_languages.route("/bulk")
class LanguageBulkUpdate(Resource):
    @ns_languages.expect([bulk_update_item])
    def put(self):
        """Update multiple language settings at once"""
        data = request.get_json()
        if not isinstance(data, list):
            ns_languages.abort(400, "Expected a list of language updates")

        updated = []
        for item in data:
            code = item.get("code")
            if not code:
                continue

            lang = LanguageSetting.query.filter_by(code=code).first()
            if not lang:
                # Create new language entry if it doesn't exist
                lang = LanguageSetting(code=code)
                db.session.add(lang)

            if "enabled" in item:
                lang.enabled = item["enabled"]
            if "voice" in item:
                lang.voice = item["voice"]
            if "transcribe_model" in item:
                lang.transcribe_model = item["transcribe_model"]
            if "translation_model" in item:
                lang.translation_model = item["translation_model"]
            if "summary_model" in item:
                lang.summary_model = item["summary_model"]

            updated.append(lang)

        db.session.commit()
        return {"updated": len(updated), "languages": [l.to_dict() for l in updated]}


@ns_languages.route("/enabled")
class EnabledLanguages(Resource):
    @ns_languages.marshal_list_with(language_model)
    def get(self):
        """Get only enabled languages (for the translator dropdown)"""
        languages = (
            LanguageSetting.query.filter_by(enabled=True)
            .order_by(LanguageSetting.code)
            .all()
        )
        return [lang.to_dict() for lang in languages]


# Languages enabled by default for new installations
DEFAULT_ENABLED_LANGUAGES = {
    "da-DK",   # Danish (always needed as the "other" language)
    "en-US",   # English (United States)
    "en-GB",   # English (United Kingdom)
    "de-DE",   # German
    "fr-FR",   # French
    "es-ES",   # Spanish (Spain)
    "nl-NL",   # Dutch
    "pl-PL",   # Polish
    "uk-UA",   # Ukrainian
    "ar-SA",   # Arabic (Saudi Arabia)
    "tr-TR",   # Turkish
    "sv-SE",   # Swedish
    "pt-PT",   # Portuguese (Portugal)
    "it-IT",   # Italian
    "ro-RO",   # Romanian
}


@ns_languages.route("/seed")
class SeedLanguages(Resource):
    def post(self):
        """
        Seed languages from Azure voices.
        This creates LanguageSetting entries for all available voice locales.
        Common languages are enabled by default.
        """
        from services.voices import list_voices

        voices = list_voices()
        seen_codes = set()
        created = 0
        enabled_count = 0

        for voice in voices:
            code = voice["locale"]  # e.g., "nl-NL"
            if code in seen_codes:
                continue
            seen_codes.add(code)

            # Check if language already exists
            existing = LanguageSetting.query.filter_by(code=code).first()
            if existing:
                continue

            # Enable common languages by default
            is_enabled = code in DEFAULT_ENABLED_LANGUAGES
            if is_enabled:
                enabled_count += 1

            # Create new language entry
            lang = LanguageSetting(
                code=code,
                enabled=is_enabled,
                voice=voice["short_name"],
                transcribe_model="azure_speech",
                translation_model="gpt4o-mini",
                summary_model="gpt4o-mini",
            )
            db.session.add(lang)
            created += 1

        db.session.commit()
        return {
            "created": created,
            "enabled_by_default": enabled_count,
            "total_locales": len(seen_codes),
        }
