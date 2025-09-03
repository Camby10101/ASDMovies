# tests/test_api.py
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from main import app, simplify, poster_url

client = TestClient(app)

def test_health_endpoint():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"ok": True}

# @app.get("/")
# def root(): return {"message": "API IS WORKING BABY"}
def test_root_endpoint():
    r = client.get("/")
    assert r.status_code == 200
    body = r.json()
    assert body.get("API IS WORKING BABY") is True
def test_poster_url_with_path():
    assert poster_url("/abc123.jpg") == "https://image.tmdb.org/t/p/w500/abc123.jpg"

def test_poster_url_without_path():
    assert "placeholder" in poster_url(None)

def test_simplify_movie_data():
    mock_movie = {
        "id": 123,          
        "title": "Test Movie",
        "release_date": "2023-01-01",
        "poster_path": "/test.jpg",
        "genre_ids": [],
        "vote_average": 7.5,
        "overview": "A test movie",
    }
    result = simplify(mock_movie)
    assert result.id == 123
    assert result.title == "Test Movie"
    assert result.year == "2023"
    assert result.rating == "7.5"

@patch("main.tmdb_get", new_callable=AsyncMock)  
def test_search_movies_endpoint(mock_tmdb_get: AsyncMock):
    mock_tmdb_get.return_value = {
        "results": [
            {
                "id": 42,  
                "title": "Mock Movie",
                "release_date": "2023-01-01",
                "poster_path": "/mock.jpg",
                "genre_ids": [],
                "vote_average": 8.0,
                "overview": "A mock movie",
            }
        ]
    }
    r = client.get("/search/movies?q=test")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) == 1
    item = data[0]

    for key in ("id", "title", "year", "poster", "genre", "rating", "description"):
        assert key in item
    assert item["id"] == 42
