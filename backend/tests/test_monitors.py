from fastapi.testclient import TestClient

def register_user_and_login(client: TestClient, email: str, password: str) -> str:
    resp = client.post(
        "/api/v1/users",
        json={"email": email, "password": password}
    )
    assert resp.status_code == 201

    resp = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    return data["access_token"]


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def create_project(client: TestClient, token: str, name: str = "Test project") -> dict:
    resp = client.post(
        "/api/v1/projects",
        json={"name": name, "description": "test_project"},
        headers=auth_headers(token)
    )
    assert resp.status_code == 201
    return resp.json()


def test_create_monitor_for_project(client: TestClient):
    token = register_user_and_login(client, "user1@example.com", "password123")
    project = create_project(client, token)
    project_id = project["id"]

    resp = client.post(
        f"/api/v1/monitors/projects/{project_id}",
        json={
            "name": "Main API",
            "target_url": "https://example.com/",
            "check_interval_sec": 60,
            "is_active": True,
        },
        headers=auth_headers(token)
    )

    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Main API"
    assert data["project_id"] == project_id
    assert data["target_url"] == "https://example.com/"


def test_check_monitor_now(client: TestClient):
    token = register_user_and_login(client, "user2@example.com", "password123")
    project = create_project(client, token)
    project_id = project["id"]

    resp = client.post(
        f"/api/v1/monitors/projects/{project_id}",
        json={
            "name": "Health monitor",
            "target_url": "https://httpbin.org/status/200",
            "check_interval_sec": 60,
            "is_active": True,
        },
        headers=auth_headers(token),
    )
    assert resp.status_code == 201
    monitor = resp.json()
    monitor_id = monitor["id"]

    resp = client.post(
        f"/api/v1/monitors/{monitor_id}/check",
        headers=auth_headers(token)
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["monitor_id"] == monitor_id
    assert "is_up" in data
    assert "checked_at" in data


def test_list_recent_checks(client: TestClient):
    token = register_user_and_login(client, "user3@example.com", "password123")
    project = create_project(client, token)
    project_id = project["id"]

    resp = client.post(
        f"/api/v1/monitors/projects/{project_id}",
        json = {
            "name": "History monitor",
            "target_url": "https://httpbin.org/status/200",
            "check_interval": 60,
            "is_active": True,
        },
        headers=auth_headers(token)
    )
    assert resp.status_code == 201
    monitor = resp.json()
    monitor_id = monitor["id"]

    for _ in range(3):
        r = client.post(
            f"/api/v1/monitors/{monitor_id}/check",
            headers=auth_headers(token)
        )
        assert r.status_code == 201

    resp = client.get(
        f"/api/v1/monitors/{monitor_id}/checks",
        params={"limit": 2},
        headers=auth_headers(token)
    )

    assert resp.status_code == 200
    items = resp.json()
    assert len(items) <= 2
    for item in items:
        assert item["monitor_id"] == monitor_id


def test_cannot_access_other_users_monitor(client: TestClient):
    # user X
    token_x = register_user_and_login(client, "owner@example.com", "password123")
    project_x = create_project(client, token_x)
    project_x_id = project_x["id"]

    resp = client.post(
        f"/api/v1/monitors/projects/{project_x_id}",
        json = {
            "name": "Private monitor",
            "target_url": "https://example.com",
            "check_interval_sec": 60,
            "is_active": True,
        },
        headers=auth_headers(token_x)
    )
    assert resp.status_code == 201
    monitor_x = resp.json()
    monitor_x_id = monitor_x["id"]

    # user Y
    token_y = register_user_and_login(client, "other@example.com", "password123")

    # user Y try to get monitor X
    resp = client.get(
        f"/api/v1/monitors/{monitor_x_id}",
        headers=auth_headers(token_y)
    )
    assert resp.status_code in (403, 404)

    # user Y try to do check with monitor Y
    resp = client.post(
        f"/api/v1/monitors/{monitor_x_id}/check",
        headers=auth_headers(token_y)
    )
    assert resp.status_code in (403, 404)


























