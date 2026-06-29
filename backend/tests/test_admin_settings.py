from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


def _login(client: TestClient, login: str, password: str) -> dict[str, str]:
    response = client.post("/api/auth/login", json={"login": login, "password": password})
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_settings_api_is_admin_only_and_supports_user_lifecycle():
    suffix = uuid4().hex[:8]
    login = f"viewer_{suffix}"
    email = f"{login}@example.com"

    with TestClient(app) as client:
        admin_headers = _login(client, "admin", "admin123")
        created = client.post(
            "/api/admin/users",
            headers=admin_headers,
            json={
                "login": login,
                "email": email,
                "full_name": "Test viewer",
                "password": "password123",
                "role": "viewer",
                "is_active": True,
            },
        )
        assert created.status_code == 200
        user_id = created.json()["id"]

        viewer_headers = _login(client, login, "password123")
        assert client.get("/api/admin/users", headers=viewer_headers).status_code == 403

        password_update = client.patch(
            f"/api/admin/users/{user_id}",
            headers=admin_headers,
            json={"password": "newpassword123"},
        )
        assert password_update.status_code == 200
        _login(client, login, "newpassword123")

        blocked = client.patch(
            f"/api/admin/users/{user_id}",
            headers=admin_headers,
            json={"is_active": False},
        )
        assert blocked.status_code == 200
        assert blocked.json()["is_active"] is False

        deleted = client.delete(f"/api/admin/users/{user_id}", headers=admin_headers)
        assert deleted.status_code == 200


def test_admin_cannot_delete_own_account():
    with TestClient(app) as client:
        headers = _login(client, "admin", "admin123")
        current = client.get("/api/auth/me", headers=headers)
        response = client.delete(f"/api/admin/users/{current.json()['id']}", headers=headers)

    assert response.status_code == 400


def test_plan_and_minimum_base_crud():
    suffix = uuid4().hex[:8]
    scope_key = f"test-scope-{suffix}"

    with TestClient(app) as client:
        headers = _login(client, "admin", "admin123")
        plan = client.post(
            "/api/admin/plans",
            headers=headers,
            json={
                "segment": "B2C",
                "product": "Интернет",
                "company": "Beeline",
                "technology": None,
                "wave": "I полугодие 2026",
                "target": 123,
            },
        )
        assert plan.status_code == 200
        plan_id = plan.json()["id"]
        assert client.delete(f"/api/admin/plans/{plan_id}", headers=headers).status_code == 200

        minimum = client.post(
            "/api/admin/minimum-bases",
            headers=headers,
            json={"scope_key": scope_key, "minimum_n": 42},
        )
        assert minimum.status_code == 200
        minimum_id = minimum.json()["id"]
        assert client.delete(f"/api/admin/minimum-bases/{minimum_id}", headers=headers).status_code == 200
