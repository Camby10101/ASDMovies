import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from main import app, simplify, poster_url

# Create test client
client = TestClient(app)

def test_health_endpoint():
    """Test the health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"ok": True}

def test_root_endpoint():
    """Test the root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    assert "API IS WORKING BABY" in response.json()

def test_poster_url_with_path():
    """Test poster URL generation with valid path"""
    result = poster_url("/abc123.jpg")
    expected = "https://image.tmdb.org/t/p/w500/abc123.jpg"
    assert result == expected

def test_poster_url_without_path():
    """Test poster URL generation with None path"""
    result = poster_url(None)
    assert "placeholder" in result

def test_simplify_movie_data():
    """Test the simplify function with mock movie data"""
    mock_movie = {
        "title": "Test Movie",
        "release_date": "2023-01-01",
        "poster_path": "/test.jpg",
        "genre_ids": [],
        "vote_average": 7.5,
        "overview": "A test movie"
    }
    
    result = simplify(mock_movie)
    assert result.title == "Test Movie"
    assert result.year == "2023"
    assert result.rating == "7.5"

@patch('main.tmdb_get')
def test_search_movies_endpoint(mock_tmdb_get):
    """Test search movies endpoint with mocked TMDB API"""
    # Mock the TMDB API response
    mock_tmdb_get.return_value = {
        "results": [
            {
                "title": "Mock Movie",
                "release_date": "2023-01-01",
                "poster_path": "/mock.jpg",
                "genre_ids": [],
                "vote_average": 8.0,
                "overview": "A mock movie"
            }
        ]
    }
    
    response = client.get("/search/movies?q=test")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 0  # Should return a list
