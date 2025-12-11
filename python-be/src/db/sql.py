import os
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

load_dotenv()

MYSQL_USER = os.getenv("MYSQL_USER")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")
MYSQL_HOST = os.getenv("MYSQL_HOST")
MYSQL_PORT = os.getenv("MYSQL_PORT", 3306)
MYSQL_DB = os.getenv("MYSQL_DB")

# SSL is only required for cloud databases (Azure, AWS, etc.)
# Set MYSQL_SSL=true in .env for cloud deployments
MYSQL_SSL = os.getenv("MYSQL_SSL", "false").lower() == "true"

DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"

db = SQLAlchemy()


def init_db(app):
    app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    engine_options = {
        # Ping connections before each use
        "pool_pre_ping": True,
        # Reconnect if a connection is older than X seconds
        "pool_recycle": 3600,
        "pool_size": 5,
        "max_overflow": 2,
    }

    # Only enable SSL for cloud databases
    if MYSQL_SSL:
        engine_options["connect_args"] = {"ssl": {"ssl_verify_cert": True}}

    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = engine_options
    db.init_app(app)

    # Auto-create tables if they don't exist
    with app.app_context():
        db.create_all()
