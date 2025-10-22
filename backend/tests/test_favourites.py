import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, call
from main import app

client = TestClient(app)

@pytest.fixture
def supabase_chain():
    fake_execute = MagicMock(data=[{"user_id": "123", "movie_id": 101}])
    chain = MagicMock()
    chain.select.return_value = chain
    chain.insert.return_value = chain
    chain.update.return_value = chain
    chain.delete.return_value = chain
    chain.eq.return_value = chain
    chain.order.return_value = chain
    chain.execute.return_value = fake_execute
    return chain

# --GET--
@patch("routes.favourite_movies_routes.supabase_admin")
def test_get_favourite_movies_by_user_id(mock_supabase, supabase_chain):
    supabase_chain.execute.return_value.data = [{"movie_id": 101}, {"movie_id": 202}]
    mock_supabase.table.return_value = supabase_chain

    response = client.get("/api/favourite_movies/123")
    assert response.status_code == 200
    assert response.json() == [101, 202]


@patch("routes.favourite_movies_routes.supabase_admin")
def test_is_movie_favourite_true(mock_supabase, supabase_chain):
    supabase_chain.execute.return_value.data = [{"movie_id": 101}]
    mock_supabase.table.return_value = supabase_chain

    response = client.get("/api/favourite_movies/123/101")
    assert response.status_code == 200
    assert response.json() is True


@patch("routes.favourite_movies_routes.supabase_admin")
def test_is_movie_favourite_false(mock_supabase, supabase_chain):
    supabase_chain.execute.return_value.data = []
    mock_supabase.table.return_value = supabase_chain

    response = client.get("/api/favourite_movies/123/999")
    assert response.status_code == 200
    assert response.json() is False


# --POST--
@patch("routes.favourite_movies_routes.supabase_admin")
def test_add_favourite_movie(mock_supabase, supabase_chain):
    supabase_chain.execute.return_value.data = [{"user_id": "123", "movie_id": 101}]
    mock_supabase.table.return_value = supabase_chain

    response = client.post("/api/favourite_movies/123/101")
    assert response.status_code == 200
    assert response.json()["message"] == "New favourite movie added successfully"
    assert response.json()["user"] == "123"
    assert response.json()["movie"] == 101

# --DELETE--
@patch("routes.favourite_movies_routes.supabase_admin")
def test_remove_favourite_movie(mock_supabase, supabase_chain):
    supabase_chain.execute.return_value.data = [{"user_id": "123", "movie_id": 101}]
    mock_supabase.table.return_value = supabase_chain

    response = client.delete("/api/favourite_movies/123/101")
    assert response.status_code == 200
    assert response.json()["message"] == "Favourite movie removed successfully"
    assert response.json()["movie"] == 101