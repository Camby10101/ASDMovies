import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app

client = TestClient(app)

@pytest.fixture
def supabase_chain():
    """
    Mock Supabase query chain that simulates the fluent API pattern.
    Supports: .select() .eq() .order() .maybe_single() .upsert() .execute()
    """
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

# ============================================================================
# GET /api/ratings/{user_id} - Get all ratings for a user
# ============================================================================

@patch("routes.rated_movies_route.supabase_admin")
def test_get_ratings_by_user_id_with_ratings(mock_supabase, supabase_chain):
    """Test getting ratings when user has rated movies."""
    supabase_chain.execute.return_value.data = [
        {"tmdb_id": 101, "rating": 5, "created_at": "2025-01-15T10:00:00"},
        {"tmdb_id": 202, "rating": 4, "created_at": "2025-01-14T09:00:00"},
        {"tmdb_id": 303, "rating": 3, "created_at": "2025-01-13T08:00:00"}
    ]
    mock_supabase.table.return_value = supabase_chain
    
    response = client.get("/api/ratings/123")
    
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == "123"
    assert len(data["ratings"]) == 3
    assert data["ratings"][0]["tmdb_id"] == 101
    assert data["ratings"][0]["rating"] == 5

@patch("routes.rated_movies_route.supabase_admin")
def test_get_ratings_by_user_id_empty(mock_supabase, supabase_chain):
    """Test getting ratings when user has no ratings."""
    supabase_chain.execute.return_value.data = []
    mock_supabase.table.return_value = supabase_chain
    
    response = client.get("/api/ratings/999")
    
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == "999"
    assert data["ratings"] == []

@patch("routes.rated_movies_route.supabase_admin")
def test_get_ratings_by_user_id_none_data(mock_supabase, supabase_chain):
    """Test handling when Supabase returns None for data."""
    supabase_chain.execute.return_value.data = None
    mock_supabase.table.return_value = supabase_chain
    
    response = client.get("/api/ratings/123")
    
    assert response.status_code == 200
    data = response.json()
    assert data["ratings"] == []

@patch("routes.rated_movies_route.supabase_admin")
def test_get_ratings_by_user_id_error(mock_supabase, supabase_chain):
    """Test error handling when database query fails."""
    supabase_chain.execute.side_effect = Exception("Database connection failed")
    mock_supabase.table.return_value = supabase_chain
    
    response = client.get("/api/ratings/123")
    
    assert response.status_code == 500
    assert "Failed to fetch user ratings" in response.json()["detail"]["message"]

# ============================================================================
# GET /api/ratings/{user_id}/{tmdb_id} - Get specific movie rating
# ============================================================================

@patch("routes.rated_movies_route.supabase_admin")
def test_get_rating_for_movie_exists(mock_supabase, supabase_chain):
    """Test getting a rating when user has rated the movie."""
    supabase_chain.execute.return_value.data = {"rating": 4}
    mock_supabase.table.return_value = supabase_chain
    
    response = client.get("/api/ratings/123/101")
    
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == "123"
    assert data["tmdb_id"] == 101
    assert data["rating"] == 4

@patch("routes.rated_movies_route.supabase_admin")
def test_get_rating_for_movie_not_rated(mock_supabase, supabase_chain):
    """Test getting a rating when user hasn't rated the movie (returns null)."""
    supabase_chain.execute.return_value.data = None
    mock_supabase.table.return_value = supabase_chain
    
    response = client.get("/api/ratings/123/999")
    
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == "123"
    assert data["tmdb_id"] == 999
    assert data["rating"] is None

@patch("routes.rated_movies_route.supabase_admin")
def test_get_rating_for_movie_empty_dict(mock_supabase, supabase_chain):
    """Test handling when Supabase returns empty dict."""
    supabase_chain.execute.return_value.data = {}
    mock_supabase.table.return_value = supabase_chain
    
    response = client.get("/api/ratings/123/101")
    
    assert response.status_code == 200
    data = response.json()
    assert data["rating"] is None

@patch("routes.rated_movies_route.supabase_admin")
def test_get_rating_for_movie_error(mock_supabase, supabase_chain):
    """Test error handling when database query fails."""
    supabase_chain.execute.side_effect = Exception("Network error")
    mock_supabase.table.return_value = supabase_chain
    
    response = client.get("/api/ratings/123/101")
    
    assert response.status_code == 500
    assert "Failed to fetch rating" in response.json()["detail"]["message"]

# ============================================================================
# POST /api/ratings/{user_id}/{tmdb_id} - Upsert (create/update) rating
# ============================================================================

@patch("routes.rated_movies_route.supabase_admin")
def test_upsert_rating_create_new(mock_supabase, supabase_chain):
    """Test creating a new rating for a movie."""
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
def test_upsert_rating_update_existing(mock_supabase, supabase_chain):
    """Test updating an existing rating."""
    supabase_chain.execute.return_value.data = [
        {"user_id": "123", "tmdb_id": 101, "rating": 3}
    ]
    mock_supabase.table.return_value = supabase_chain
    
    response = client.post("/api/ratings/123/101", json={"rating": 3})
    
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Rating upserted"
    assert data["rating"] == 3

@patch("routes.rated_movies_route.supabase_admin")
def test_upsert_rating_minimum_value(mock_supabase, supabase_chain):
    """Test creating a rating with minimum value (1)."""
    supabase_chain.execute.return_value.data = [
        {"user_id": "123", "tmdb_id": 101, "rating": 1}
    ]
    mock_supabase.table.return_value = supabase_chain
    
    response = client.post("/api/ratings/123/101", json={"rating": 1})
    
    assert response.status_code == 200
    assert response.json()["rating"] == 1

@patch("routes.rated_movies_route.supabase_admin")
def test_upsert_rating_maximum_value(mock_supabase, supabase_chain):
    """Test creating a rating with maximum value (5)."""
    supabase_chain.execute.return_value.data = [
        {"user_id": "123", "tmdb_id": 101, "rating": 5}
    ]
    mock_supabase.table.return_value = supabase_chain
    
    response = client.post("/api/ratings/123/101", json={"rating": 5})
    
    assert response.status_code == 200
    assert response.json()["rating"] == 5

@patch("routes.rated_movies_route.supabase_admin")
def test_upsert_rating_invalid_too_low(mock_supabase, supabase_chain):
    """Test validation fails for rating below minimum (0)."""
    mock_supabase.table.return_value = supabase_chain
    
    response = client.post("/api/ratings/123/101", json={"rating": 0})
    
    assert response.status_code == 422  # Validation error

@patch("routes.rated_movies_route.supabase_admin")
def test_upsert_rating_invalid_too_high(mock_supabase, supabase_chain):
    """Test validation fails for rating above maximum (6)."""
    mock_supabase.table.return_value = supabase_chain
    
    response = client.post("/api/ratings/123/101", json={"rating": 6})
    
    assert response.status_code == 422  # Validation error

@patch("routes.rated_movies_route.supabase_admin")
def test_upsert_rating_missing_payload(mock_supabase, supabase_chain):
    """Test error when rating payload is missing."""
    mock_supabase.table.return_value = supabase_chain
    
    response = client.post("/api/ratings/123/101", json={})
    
    assert response.status_code == 422  # Validation error

@patch("routes.rated_movies_route.supabase_admin")
def test_upsert_rating_invalid_type(mock_supabase, supabase_chain):
    """Test validation fails for non-integer rating."""
    mock_supabase.table.return_value = supabase_chain
    
    response = client.post("/api/ratings/123/101", json={"rating": "five"})
    
    assert response.status_code == 422  # Validation error

@patch("routes.rated_movies_route.supabase_admin")
def test_upsert_rating_database_error(mock_supabase, supabase_chain):
    """Test error handling when upsert fails."""
    supabase_chain.execute.side_effect = Exception("Unique constraint violation")
    mock_supabase.table.return_value = supabase_chain
    
    response = client.post("/api/ratings/123/101", json={"rating": 4})
    
    assert response.status_code == 500
    assert "Failed to upsert rating" in response.json()["detail"]["message"]

