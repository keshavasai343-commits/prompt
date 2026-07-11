import pytest
from unittest.mock import AsyncMock, patch


def test_save_prompt(client, auth_headers):
    response = client.post("/api/v1/prompts", json={
        "title": "Test Prompt",
        "original_input": "build login page",
        "enhanced_prompt": "Act as a senior engineer. Build a login page...",
        "category": "coding",
        "target_ai": "chatgpt",
    }, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Prompt"
    assert data["is_favorite"] is False


def test_list_prompts(client, auth_headers):
    client.post("/api/v1/prompts", json={
        "title": "Prompt 1",
        "original_input": "input 1",
        "enhanced_prompt": "enhanced 1",
        "category": "coding",
        "target_ai": "chatgpt",
    }, headers=auth_headers)

    response = client.get("/api/v1/prompts", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert data["total"] >= 1


def test_toggle_favorite(client, auth_headers):
    create_resp = client.post("/api/v1/prompts", json={
        "title": "Fav Prompt",
        "original_input": "fav input",
        "enhanced_prompt": "fav enhanced",
        "category": "general",
        "target_ai": "chatgpt",
    }, headers=auth_headers)
    prompt_id = create_resp.json()["id"]

    update_resp = client.put(f"/api/v1/prompts/{prompt_id}", json={"is_favorite": True}, headers=auth_headers)
    assert update_resp.status_code == 200
    assert update_resp.json()["is_favorite"] is True


def test_delete_prompt(client, auth_headers):
    create_resp = client.post("/api/v1/prompts", json={
        "title": "Delete Me",
        "original_input": "delete input",
        "enhanced_prompt": "delete enhanced",
        "category": "general",
        "target_ai": "chatgpt",
    }, headers=auth_headers)
    prompt_id = create_resp.json()["id"]

    delete_resp = client.delete(f"/api/v1/prompts/{prompt_id}", headers=auth_headers)
    assert delete_resp.status_code == 204

    get_resp = client.get(f"/api/v1/prompts/{prompt_id}", headers=auth_headers)
    assert get_resp.status_code == 404


def test_search_prompts(client, auth_headers):
    client.post("/api/v1/prompts", json={
        "title": "React Dashboard",
        "original_input": "build react dashboard",
        "enhanced_prompt": "Build a React dashboard...",
        "category": "coding",
        "target_ai": "cursor",
        "tags": "react,dashboard",
    }, headers=auth_headers)

    response = client.get("/api/v1/prompts?search=dashboard", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["total"] >= 1
