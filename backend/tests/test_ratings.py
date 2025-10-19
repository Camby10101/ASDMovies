import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app

# Creates test client that simulates HTTP requests to the FastAPI app without running a server 
client = TestClient(app)

# Reusable mock of a query builder for Supabase
# Each method returns the chain itself: return_value = chain
@pytest.fixture
def supabase_chain():
    fake_execute = MagicMock(data=[{"user_id": "123", "tmdb_id": 101, "rating": 5}])
    chain = MagicMock()
    chain.select.return_value = chain
    chain.insert.return_value = chain
    chain.update.return_value = chain
    chain.delete.return_value = chain
    chain.upsert.return_value = chain
    chain.eq.return_value = chain
    chain.order.return_value = chain
    chain.maybe_single.return_value = chain
    chain.execute.return_value = fake_execute
    return chain

# Get all ratings for a user
@patch("routes.rated_movies_route.supabase_admin")
def test_get_ratings_by_user_id_with_ratings(mock_supabase, supabase_chain):
    supabase_chain.execute.return_value.data = [
        {"tmdb_id": 101, "rating": 5, "created_at": "2025-01-15T10:00:00"},
        {"tmdb_id": 202, "rating": 4, "created_at": "2025-01-14T09:00:00"},
        {"tmdb_id": 303, "rating": 3, "created_at": "2025-01-13T08:00:00"}
    ]
    mock_supabase.table.return_value = supabase_chain
    
    # Make a GET request to the endpoint
    response = client.get("/api/ratings/123")
    
    # Verify successful response
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == "123"
    assert len(data["ratings"]) == 3
    assert data["ratings"][0]["tmdb_id"] == 101
    assert data["ratings"][0]["rating"] == 5

# Testing a bad request fails properly
@patch("routes.rated_movies_route.supabase_admin")
def test_get_ratings_by_user_id_error(mock_supabase, supabase_chain):
    supabase_chain.execute.side_effect = Exception("Database connection failed")
    mock_supabase.table.return_value = supabase_chain
    
    response = client.get("/api/ratings/123")
    assert response.status_code == 500
    assert "Failed to fetch user ratings" in response.json()["detail"]["message"]

# Get specific movie rating
@patch("routes.rated_movies_route.supabase_admin")
def test_get_rating_for_movie_exists(mock_supabase, supabase_chain):
    supabase_chain.execute.return_value.data = {"rating": 4}
    mock_supabase.table.return_value = supabase_chain
    
    response = client.get("/api/ratings/123/101")
    
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == "123"
    assert data["tmdb_id"] == 101
    assert data["rating"] == 4

#  Upsert (create/update) rating test
@patch("routes.rated_movies_route.supabase_admin")
def test_upsert_rating_create_new(mock_supabase, supabase_chain):
    supabase_chain.execute.return_value.data = [
        {"user_id": "123", "tmdb_id": 101, "rating": 5}
    ]
    mock_supabase.table.return_value = supabase_chain
    
    response = client.post("/api/ratings/123/101", json={"rating": 5})
    
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Rating upserted"
    assert data["user_id"] == "123"
    assert data["tmdb_id"] == 101
    assert data["rating"] == 5
    assert len(data["data"]) == 1

@patch("routes.rated_movies_route.supabase_admin")
def test_upsert_rating_database_error(mock_supabase, supabase_chain):
    supabase_chain.execute.side_effect = Exception("Unique constraint violation")
    mock_supabase.table.return_value = supabase_chain
    
    response = client.post("/api/ratings/123/101", json={"rating": 4})
    
    assert response.status_code == 500
    assert "Failed to upsert rating" in response.json()["detail"]["message"]

