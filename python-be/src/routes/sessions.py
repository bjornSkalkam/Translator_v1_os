import azure.cognitiveservices.speech as speechsdk
import os
from flask_restx import Namespace, Resource, reqparse
from flask import request, Response
from werkzeug.datastructures import FileStorage
from db.sql import db
from models.session import Session
from models.translation import Translation
from models.language import LanguageSetting
import requests

from services.voices import list_voices

from config import (
    MODEL_URL_MAP,
    LANGUAGES,
    DEFAULT_AUDIO_PATH,
    STATUS_LANGUAGE_SET,
    STATUS_ONGOING,
    STATUS_FINISHED,
    AZURE_SPEECH_KEY,
    AZURE_SPEECH_REGION,
)

from services.transcription_service import transcribe_audio
from services.translation_service import translate_text


def make_speech_config() -> speechsdk.SpeechConfig:

    return speechsdk.SpeechConfig(
        subscription=AZURE_SPEECH_KEY,
        region=AZURE_SPEECH_REGION,
    )


ns_sessions = Namespace("sessions", description="Session-related endpoints")

audio_parser = reqparse.RequestParser()
audio_parser.add_argument("audio", type=FileStorage, location="files")


@ns_sessions.route("/start-session")
class StartSession(Resource):
    def post(self):
        session = Session()
        db.session.add(session)
        db.session.commit()
        return {"session_id": session.id, "status": session.status}


@ns_sessions.route("/available-languages")
class AvailableLanguages(Resource):
    def get(self):
        """
        Returns enabled languages from database settings.
        Falls back to hardcoded LANGUAGES config if database is empty.
        Danish (da-DK) is excluded as it's always the "other" language.
        """
        # Try to get enabled languages from database
        db_languages = (
            LanguageSetting.query.filter_by(enabled=True)
            .filter(LanguageSetting.code != "da-DK")
            .order_by(LanguageSetting.code)
            .all()
        )

        if db_languages:
            # Get voice info for locale names
            voices = list_voices()
            voice_map = {v["locale"]: v for v in voices}

            return [
                {
                    "code": lang.code,
                    "english_name": voice_map.get(lang.code, {}).get(
                        "locale_english_name", lang.code
                    ),
                    "native_name": voice_map.get(lang.code, {}).get(
                        "locale_native_name", lang.code
                    ),
                    "voice": lang.voice,
                }
                for lang in db_languages
            ]

        # Fallback to hardcoded config if no database settings
        return [
            {
                "code": code,
                "english_name": details["english_name"],
                "native_name": details["native_name"],
                "region": details["region"],
            }
            for code, details in LANGUAGES.items()
            if code != "da-DK"
        ]


@ns_sessions.route("/select-language")
class SelectLanguage(Resource):
    def post(self):
        payload = request.get_json()
        session_id = payload.get("session_id")
        language = payload.get("language")

        session_obj = Session.query.get(session_id)
        if not session_obj:
            return {"error": "Session not found"}, 404

        # Try to get language settings from database first
        db_lang = LanguageSetting.query.filter_by(code=language).first()
        db_danish = LanguageSetting.query.filter_by(code="da-DK").first()

        if db_lang and db_lang.enabled:
            # Use database settings
            model_a = {
                "transcribeModel": db_lang.transcribe_model or "azure_speech",
                "translationModel": db_lang.translation_model or "gpt4o-mini",
                "summaryModel": db_lang.summary_model or "gpt4o-mini",
            }
        elif language in LANGUAGES:
            # Fallback to hardcoded config
            model_a = LANGUAGES[language]["models"]
        else:
            return {"error": "Unsupported language"}, 400

        if db_danish:
            model_b = {
                "transcribeModel": db_danish.transcribe_model or "azure_speech",
                "translationModel": db_danish.translation_model or "gpt4o-mini",
                "summaryModel": db_danish.summary_model or "gpt4o-mini",
            }
        else:
            model_b = LANGUAGES.get("da-DK", {}).get("models", {
                "transcribeModel": "azure_speech",
                "translationModel": "gpt4o-mini",
                "summaryModel": "gpt4o-mini",
            })

        danish = "da-DK"
        session_obj.language_a = language
        session_obj.language_b = danish
        session_obj.model_a = model_a
        session_obj.model_b = model_b
        session_obj.status = STATUS_LANGUAGE_SET
        db.session.commit()

        return session_obj.to_dict()


@ns_sessions.route("/translate")
class Translate(Resource):
    @ns_sessions.expect(audio_parser)
    def post(self):
        args = audio_parser.parse_args()
        audio_file = args.get("audio")
        form = request.form or request.json or {}
        session_id = form.get("session_id")
        from_lang = form.get("from")
        to_lang = form.get("to")
        text = form.get("text")

        session_obj = Session.query.get(session_id)
        if not session_obj:
            return {"error": "Session not found"}, 404

        # Try database settings first, then fallback to hardcoded config
        db_lang = LanguageSetting.query.filter_by(code=from_lang).first()
        lang_config = LANGUAGES.get(from_lang)

        if db_lang:
            transcribe_model = db_lang.transcribe_model or "azure_speech"
            translation_model = db_lang.translation_model or "gpt4o-mini"
        elif lang_config:
            transcribe_model = lang_config["models"].get("transcribeModel", "azure_speech")
            translation_model = lang_config["models"].get("translationModel", "gpt4o-mini")
        else:
            return {"error": f"Unsupported language: {from_lang}"}, 400

        # Step 1: Possibly transcribe
        if audio_file or not text:
            # We have audio or empty text, so do transcription
            audio_path = DEFAULT_AUDIO_PATH
            if audio_file:
                temp_path = os.path.join("/tmp", audio_file.filename)
                audio_file.save(temp_path)
                audio_path = temp_path

            try:
                original = transcribe_audio(audio_path, transcribe_model, from_lang)
            except Exception as e:
                return {"error": str(e)}, 500
            finally:
                # Clean up if file saved
                if audio_file and os.path.exists(audio_path):
                    os.remove(audio_path)
        else:
            # No audio, use the provided text directly
            original = text

        # Step 2: Translate (translation_model already set above)
        try:
            translated = translate_text(original, translation_model, from_lang, to_lang)
        except Exception as e:
            return {"error": str(e)}, 500

        # Step 3: Save result
        new_translation = Translation(
            session_id=session_id,
            from_lang=from_lang,
            to_lang=to_lang,
            original=original,
            translated=translated,
        )
        db.session.add(new_translation)
        session_obj.status = STATUS_ONGOING
        db.session.commit()

        return {
            "session_id": session_id,
            "from": from_lang,
            "to": to_lang,
            "original": original,
            "translated": translated,
        }


@ns_sessions.route("/finish-session")
class FinishSession(Resource):
    def post(self):
        payload = request.get_json()
        session_id = payload.get("session_id")
        session_obj = Session.query.get(session_id)
        if not session_obj:
            return {"error": "Session not found"}, 404

        session_obj.status = STATUS_FINISHED
        db.session.commit()
        return {"session_id": session_id, "status": STATUS_FINISHED}


@ns_sessions.route("/recap")
class Recap(Resource):
    def get(self):
        session_id = request.args.get("session_id")
        session_obj = Session.query.get(session_id)
        if not session_obj:
            return {"error": "Session not found"}, 404

        lang_code = session_obj.language_a or "en"

        # Try database settings first, then fallback to hardcoded config
        db_lang = LanguageSetting.query.filter_by(code=lang_code).first()
        lang_config = LANGUAGES.get(lang_code)

        if db_lang:
            summary_model_key = db_lang.summary_model or "gpt4o-mini"
        elif lang_config:
            summary_model_key = lang_config["models"].get("summaryModel", "gpt4o-mini")
        else:
            return {"error": f"Unsupported language for recap: {lang_code}"}, 400

        # Build appropriate headers
        if summary_model_key in ["gpt4o-mini", "gpt35"]:
            headers = {
                "Content-Type": "application/json",
                "api-key": os.getenv("AZURE_OPENAI_KEY"),
            }
        elif summary_model_key == "promte_4o":
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {os.getenv('PROMTE_API_KEY')}",
            }
        else:
            return {"error": f"Unknown summary model: {summary_model_key}"}, 400

        summary_url = MODEL_URL_MAP[summary_model_key]

        if not summary_url:
            return {
                "error": f"Summary model URL not found for {summary_model_key}"
            }, 500

        translations = session_obj.translations
        if not translations:
            return {
                "session_id": session_id,
                "summary": "No conversation data available.",
                "translations": [],
            }

        conversation_lines = []
        for t in translations:
            time_str = t.created_at.strftime("%Y-%m-%d %H:%M:%S")
            line = (
                f"[{time_str}] {t.from_lang.upper()}: {t.original}\n"
                f"[{time_str}] {t.to_lang.upper()}: {t.translated}"
            )
            conversation_lines.append(line)

        conversation_text = "\n\n".join(conversation_lines)
        payload = {
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are a helpful assistant. Summarize the following bilingual conversation. "
                        "Be brief and clear. "
                        "Keep in mind the conversation is between a citizen (one language that is not danish) and a government person (Danish). They do not know how to speak each others languages."
                        "Please return your recap in the two languages used in the chat. Don't use language codes like EN-GB or DA-DK, just write it in normal like 'English: xxx', and 'Dansk: yyyy'."
                    ),
                },
                {"role": "user", "content": conversation_text},
            ],
            "temperature": 0.4,
        }

        resp = requests.post(summary_url, headers=headers, json=payload)
        if resp.status_code != 200:
            return {"error": "Summary failed", "details": resp.text}, 500

        if summary_model_key in ["gpt4o-mini", "gpt35", "promte_4o"]:
            summary_text = resp.json()["choices"][0]["message"]["content"].strip()
        else:
            summary_text = resp.text.strip()

        return {
            "session_id": session_id,
            "summary": summary_text,
            "translations": [t.to_dict() for t in translations],
        }


@ns_sessions.route("/list")
class ListSessions(Resource):
    def get(self):
        sessions = Session.query.order_by(Session.created_at.desc()).all()
        return [s.to_dict() for s in sessions]


@ns_sessions.route("/<string:session_id>")
class GetSession(Resource):
    def get(self, session_id):
        session_obj = Session.query.get(session_id)
        if not session_obj:
            return {"error": "Session not found"}, 404

        return {
            **session_obj.to_dict(),
            "translations": [t.to_dict() for t in session_obj.translations],
        }


@ns_sessions.route("/transcribe")
class Transcribe(Resource):
    @ns_sessions.expect(audio_parser)
    def post(self):
        """
        This route just transcribes the audio.
        No DB insertion or translation is done.
        Returns a JSON with {"original": <recognized_text>}.
        """
        args = audio_parser.parse_args()
        audio_file = args.get("audio")
        form = request.form or request.json or {}
        from_lang = form.get("from")

        if not audio_file:
            return {"error": "No audio provided"}, 400

        # Pull model from config, or default to azure
        lang_config = LANGUAGES.get(from_lang)
        if not lang_config:
            return {"error": f"Unsupported language: {from_lang}"}, 400
        transcribe_model = lang_config["models"].get("transcribeModel", "azure_speech")

        audio_path = DEFAULT_AUDIO_PATH
        if audio_file:
            temp_path = os.path.join("/tmp", audio_file.filename)
            audio_file.save(temp_path)
            audio_path = temp_path

        try:
            recognized_text = transcribe_audio(audio_path, transcribe_model, from_lang)
        except Exception as e:
            return {"error": str(e)}, 500
        finally:
            if audio_file and os.path.exists(audio_path):
                os.remove(audio_path)

        return {"original": recognized_text}


@ns_sessions.route("/available-voices")
class AvailableVoices(Resource):
    def get(self):
        return list_voices()


@ns_sessions.route("/tts")
class TextToSpeech(Resource):
    """
    JSON body expectations
    ----------------------
    {
        "text": "Hello world!",          # required
        "voice": "en-US-JennyNeural",    # optional – hard-override
        "lang": "fr-FR",                 # optional – pick default_voice for this lang
        "session_id": "<uuid>"           # optional – derive lang from the session
    }
    """

    def post(self):
        data = request.get_json(force=True)

        # --- 1. validate -----------------------------------------------------
        text = (data or {}).get("text", "").strip()
        if not text:
            return {"error": "No text supplied"}, 400

        # --- 2. decide which voice to use -----------------------------------
        #   priority: explicit voice  >  lang key  >  derive from session  >  fallback
        voice = data.get("voice")

        if not voice:
            # use explicit language hint if provided
            lang_code = data.get("lang")

            # or derive language from the session (if present)
            if not lang_code and (sid := data.get("session_id")):
                sess = Session.query.get(sid)
                if sess:
                    # very simple heuristic: if the text is Danish, talk Danish,
                    # otherwise match the other conversation language.
                    lang_code = (
                        sess.language_b if text.startswith("da-") else sess.language_a
                    )

            # lookup default voice - check database first, then fallback to hardcoded config
            if lang_code:
                db_lang = LanguageSetting.query.filter_by(code=lang_code).first()
                if db_lang and db_lang.voice:
                    voice = db_lang.voice
                elif lang_code in LANGUAGES:
                    voice = LANGUAGES[lang_code]["default_voice"]

        # final safety net
        if not voice:
            voice = "en-GB-LibbyNeural"

        # --- 3. synthesise ---------------------------------------------------
        speech_config = make_speech_config()
        speech_config.speech_synthesis_voice_name = voice
        synthesizer = speechsdk.SpeechSynthesizer(speech_config, audio_config=None)

        result = synthesizer.speak_text_async(text).get()
        if result.reason != speechsdk.ResultReason.SynthesizingAudioCompleted:
            return {"error": "TTS failed"}, 500

        return Response(result.audio_data, 200, mimetype="audio/wav")
