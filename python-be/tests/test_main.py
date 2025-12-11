import os
import pytest
from app import app


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


API_KEY_HEADER = {"x-api-key": "change-me-in-production"}


def test_ping(client):
    response = client.get("/api/v1/misc/ping", headers=API_KEY_HEADER)
    assert response.status_code == 200
    assert response.json == {"message": "pong"}


def test_echo(client):
    os.environ["TEST_ENV_VAR"] = "test-value"
    response = client.post(
        "/api/v1/misc/echo", json={"message": "hello test"}, headers=API_KEY_HEADER
    )
    assert response.status_code == 200
    assert response.json == {
        "you_sent": {"message": "hello test"},
        "env_msg": "test-value",
    }
