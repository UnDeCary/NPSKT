from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_endpoint_returns_ok():
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_login_returns_access_token_for_seeded_admin():
    with TestClient(app) as seeded_client:
        response = seeded_client.post("/api/auth/login", json={"login": "admin", "password": "admin123"})

    assert response.status_code == 200
    assert response.json()["access_token"]


def test_home_dashboard_shape_is_available_after_startup_seed():
    with TestClient(app) as seeded_client:
        response = seeded_client.get(
            "/api/dashboard/home?wave=I%20%D0%BF%D0%BE%D0%BB%D1%83%D0%B3%D0%BE%D0%B4%D0%B8%D0%B5%202026&periodicity=year"
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["title"] == "Главная"
    assert payload["primary"]["key"] == "total"


def test_b2b_product_pages_are_available_with_tz_comparison_sets():
    expected = {
        "b2b-internet": ("b2b-internet", 4),
        "b2b-ict": ("b2b-ict", 4),
        "b2b-video": ("b2b-video", 2),
    }

    with TestClient(app) as seeded_client:
        for product_key, (primary_key, comparison_count) in expected.items():
            response = seeded_client.get(
                f"/api/dashboard/product/{product_key}?wave=I%20%D0%BF%D0%BE%D0%BB%D1%83%D0%B3%D0%BE%D0%B4%D0%B8%D0%B5%202026&periodicity=year"
            )

            assert response.status_code == 200
            payload = response.json()
            assert payload["primary"]["key"] == primary_key
            assert len(payload["comparisons"]) == comparison_count
