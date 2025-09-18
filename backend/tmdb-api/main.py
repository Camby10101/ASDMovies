# IMPORTS NEEDED FOR API

# Standard library module: used here for OS inteface
# Used here to access environment variables (API Key) via os.environ.get()
import os 

# Typing module: provides type hints (used for code documentation and IDE support)
# Any: represents any type, used when you don't know or care about type
# Optional: shorthand for a Union[Type, None], indicates a value that can be the specified type or None
# List: generic type for lists, e.g. List[str] means a list of strings
# Literal: restricts values to specific literal values, e.g. Literal["day", "week"]
from typing import Any, Optional, List, Literal

# Async HTTP client library
# Used to make HTTP requests to the TMDB API asynchronously
import httpx

# FastAPI is a web framwork for building APIs
# - FastAPI: the main app class for creating the web application
# - HTTPException: exception class for returning HTTP error responses
# - Query: dependency for defining query parameters with validation and documentation
from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles

# Criss-Origin Resource Sharing middleware
# Allows the API to be accessed from web browsers running on different domains/ ports
from fastapi.middleware.cors import CORSMiddleware

# Data validation lobrary used for type annotations
# - Base Model: class used for reating data models with automatic validation and serialisation
from pydantic import BaseModel

# Simple logger
import logging

logger = logging.getLogger(__name__)


# DEFINING CONSTANTS

TMDB_BASE = "https://api.themoviedb.org/3" # The base URL for TMBD API v3

# String variable: retrueves the TMBD API bearer token from the env variables
# returns none or " " if the variable cannot be found
TMDB_BEARER = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjYjI5ZTI5NGUzMTFiYTMzZWU4Yjc2NzRiNTMxNDE3ZiIsIm5iZiI6MTc1NDk1OTc3MS45MjgsInN1YiI6IjY4OWE4ZjliNjViMzFlMzdjZjhlYjNmYyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.-3kAUYHK5lUok0WYc8OF8h-k4Capvk6_PC_6DPS0vcc"

POSTER_BASE = "https://image.tmdb.org/t/p"

# APPLICATION SETUP

# Creates a FastAPI application instance
# This is the main application object that handles all HTTP requests
app = FastAPI()

app.add_middleware(
    CORSMiddleware, # Adds a middleware class
    allow_origins=["http://localhost:5173"], # allowed origin domains (NEED TO CHANGE)
    allow_methods=["*"], # allowed HTTP methods (* means all)
    allow_headers=["*"], # allowed HTTP headers (* means all)

)



# DATA MODELS SECTION
class MovieOut(BaseModel):
    """
    Pydantic model for defining the structure of movie data returned by the API
    BaseModel provides automatic JSON serialization and deserialization + validation
    """
    id: int
    title: str
    year: str
    poster: str # URL to movie poster
    genre: str
    rating: str
    description: str


# UTILITY FUNCTIONS

"""
    Function that will construct the full poster URL's

    PARAMS:
    - path: Optional[str] - the poster path from TMDB (can be None)
    - size: str = "w500" - we default the width of the image to 500px wide

    RETURNS:
    - str: the complete URL to the poster image
"""
def poster_url(path: Optional[str], size: str = "w500") -> str:
    # Ternary operator
    # f-string: allows us to embed the poster link
    # If the pth exists then construct the link, otherwise put in a place holder
    return f"{POSTER_BASE}/{size}{path}" if path else "https://via.placeholder.com/500x750?text=No+Poster"


"""
    Async function that makes HTTP GET requests to the TMDB API

    PARAMS:
    - path: str - API endpoint path ("/search/movie")
    - params: Optional[dict[str, Any]] - query parameters as key-value pairs
    
    RETURNS:
    - dict - parsed JSON response from TMDB API
"""
async def tmdb_get(path: str, params: Optional[dict[str, Any]] = None):
    # Check if the token is available
    if not TMDB_BEARER:
        # throws an exception
        raise RuntimeError("TMDB_BEARER not set.")

    # Dictionary with HTTP headers for authentication
    headers = {"Authorization": f"Bearer {TMDB_BEARER}"}

    # async with: asynchronous context manager for resource management
    # we are creating an async HTTP client with 10 second timeout
    # await: keyword for asyc operations to complete
    async with httpx.AsyncClient(timeout=10.0) as client:
        # makes a async GET request with constructed URL, auth headers and query params
        r = await client.get(f"{TMDB_BASE}{path}", headers=headers, params=params)

    # Checking if our HTTP request was successful
    if r.status_code != 200:
        # Raise an error if not
        raise HTTPException(status_code=r.status_code, detail=r.text)
    # Parse and return JSON as a python dict
    return r.json()


# GLOBAL DATA STRUCTURES

# Dictionary (hash map) data structure storing genre mappings
# Key: int (genre ID from TMDB)
# Value: str (human readable genre name)
# Initially empty, populated during app startup
genre_map: dict[int, str] = {}


# API ENDPOINTS

@app.get("/")
def begin():
    return {"API IS WORKING BABY": True}

# Decorator: defines HTTP GET endpoint at "/health" path
@app.get("/health")
def health():
    return {"ok": True} # Returns a dict, FastAPI converts to JSON

# Decorator: defines the function to run when the app starts up

"""
    Async startup function that pre-loads genre mappings from TMDB
    Called once when the FastAPI application starts

    TODO: If we want to populate our database when we startup everytime
    we can do it here
"""
@app.on_event("startup")
async def warm_genres():
    try: # begin exception handling block

        # fetch the genre list from TMDB API
        data = await tmdb_get("/genre/movie/list", params={"language": "en-US"})

        # Dictionary comprehension to build a genre map
        # Syntax {key_expr: value_expr for item in iterable if condition}
        # genre_map.update({g["id"]: g["name"] for g in data.get("genres", [])})

        for g in data.get("genres", []):
            gid, name = g["id"], g["name"]
            print(f"Adding genre {gid} -> {name}")
            genre_map[gid] = name
        # data.get("genres", []): gets "genres" key from dict, defaults to empty list if not found
        # updates global genere_map dictionary with id-> name mapping
    except Exception:
        pass

"""
    This is the function that transforms the raw TMDB movie data into our MovieOut model

    Parameters:
    - m: dict - raw movie data dictionary from TMDB API

    Returns: MovieOut - Structured movie data object
"""
def simplify(m: dict) -> MovieOut:

    # Extract the year from release_date string, taking first 4 characters
    year = (m.get("release_date") or "")[:4] or "—"
    # Uses String slicing: [:4] gets first four characters
    # Chained operators: if release_date is None/empty, use empty string, then slice, then default to "-"

    # Build comma-separated genre string
    genre = ", ".join(genre_map.get(gid, "") for gid in m.get("genre_ids", []) if genre_map.get(gid)) or "—"
    # Generator expression inside join(): (genre_map.get(gid, "")) for gid in m.get("genre_ids", []) if genre_map.get(gid))
    # - Iterates over genre IDs from movie data
    # - Looks up each ID in genre_map from movie database
    # - Filters out empty results with if condition
    # str.join(): concatenates sequence of strings with ", " separator


    # Return new MovieOut instance with preocessed data
    return MovieOut(
        id=m["id"],
        title=m.get("title") or m.get("name") or "Untitled", # Try multiple fields; fallback to untitled
        year=year,
        poster=poster_url(m.get("poster_path")), # Convert poster path to full URL
        genre=genre,
        rating=f'{(m.get("vote_average") or 0):.1f}', # Format rating as string with 1 decimal place
        description=m.get("overview") or "", # Movie plot overview, default to empty string
    )


"""
    Async endpoint function for searching movies
    
    PARAMETERS:
    - q: str - search query string, defaults to empty (Query dependency provides validation/docs)

    RETURNS:
    - List[MoviesOut] - List of movie objects
"""

@app.get("/search/movies", response_model=List[MovieOut])
async def search_movies(q: str = Query("", description="Empty => popular")):

    # Conditional API call based on whether query is provided
    data = (
        await tmdb_get("/search/movie", params={"query": q, "include_adult": "false", "language": "en-US", "page": 1})
        if q.strip() # check if query has whitespace
        else await tmdb_get("/movie/popular", params={"language": "en-US", "page": 1})
        # else we just get the popular movies
    )
    # note: the parantheses allow for multi-line conditional statements

    results = data.get("results", [])[:24]

    # List comprehension: [expression for item in iterable]
    return [simplify(m) for m in results] # transform each raw movie dict into MovieOut object

"""
    Async endpoint for getting trending movies

    PARAMETERS:
    - period: Literal["day", "week"] - time period for trending, restricted to 'day' or 'week'

    RETURNS:
    - List[MovieOut] - list of trending movie objects
"""
@app.get("/trending", response_model=List[MovieOut]) # GET endpoint for trending movies
async def trending(period: Literal["day", "week"] = "day"):

    # Make API call with dynamic period parameter
    data = await tmdb_get(f"/trending/movie/{period}", params={"language": "en-US"})

    results = data.get("results", [])[:24] # limit to first 24 results
    return [simplify(m) for m in results] # transofrm and return movie objects


frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.isdir(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")
"""
    Function for fetting a individual movie
"""

@app.get("/movies/{movie_id}", response_model=MovieOut)
async def movie_details(movie_id: int):
    # Full details for a single movie
    data = await tmdb_get(f"/movie/{movie_id}", params={"language": "en-US"})
    # genres are objects
    genre = ", ".join([g.get("name", "") for g in data.get("genres", [])]) or "—"
    return MovieOut(
        id=data["id"],
        title=data.get("title", "Untitled"),
        year=(data.get("release_date") or "")[:4] or "—",
        poster=poster_url(data.get("poster_path")),
        genre=genre,
        rating=f'{(data.get("vote_average") or 0):.1f}',
        description=data.get("overview") or "",
    )
