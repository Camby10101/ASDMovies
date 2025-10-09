import requests
import time
import os
from typing import List, Dict
from pathlib import Path
from dotenv import load_dotenv, find_dotenv

class TMDBBatchUploader:
    def __init__(self, TMDB_KEY: str, supabase_url: str, supabase_key: str):
        self.TMDB_KEY = TMDB_KEY
        self.tmdb_base_url = "https://api.themoviedb.org/3"
        
        # Initialize Supabase client
        from supabase import create_client
        self.supabase = create_client(supabase_url, supabase_key)
        
        # Fetch genre mapping once (TMDB uses genre IDs)
        self.genre_map = self._fetch_genres()
        
    def _fetch_genres(self) -> Dict[int, str]:
        """
        Fetch genre ID to name mapping from TMDB
        """
        url = f"{self.tmdb_base_url}/genre/movie/list"
        params = {"language": "en-US"}
        headers = {"Authorization": f"Bearer {self.TMDB_KEY}"}
        
        try:
            response = requests.get(url, params=params, headers=headers)
            response.raise_for_status()
            genres = response.json().get("genres", [])
            return {g["id"]: g["name"] for g in genres}
        except Exception as e:
            print(f"Error fetching genres: {e}")
            return {}
    
    def fetch_popular_movies(self, total_movies: int = 200) -> List[Dict]:
        """
        Fetch popular movies from TMDB
        """
        movies = []
        pages_needed = (total_movies // 20) + 1  # TMDB returns 20 per page
        headers = {"Authorization": f"Bearer {self.TMDB_KEY}"}
        
        for page in range(1, pages_needed + 1):
            url = f"{self.tmdb_base_url}/movie/popular"
            params = {
                "page": page,
                "language": "en-US"
            }
            
            try:
                response = requests.get(url, params=params, headers=headers)
                response.raise_for_status()
                data = response.json()
                
                movies.extend(data.get("results", []))
                print(f"Fetched page {page}/{pages_needed} - Total movies: {len(movies)}")
                
                if len(movies) >= total_movies:
                    break
                    
                # Rate limiting
                time.sleep(0.25)
                
            except requests.exceptions.RequestException as e:
                print(f"Error fetching page {page}: {e}")
                break
        
        return movies[:total_movies]
    
    def transform_movie_data(self, movie: Dict) -> Dict:
        """
        Transform TMDB movie data to match your Movies schema
        """
        release_date = movie.get("release_date", "")
        release_year = int(release_date.split("-")[0]) if release_date else None
        
        genre_ids = movie.get("genre_ids", [])
        genre = self.genre_map.get(genre_ids[0]) if genre_ids else None
        
        poster_path = movie.get("poster_path")
        poster_url = f"https://image.tmdb.org/t/p/w500{poster_path}" if poster_path else None
        
        return {
            "tmdb_id": movie.get("id"),
            "title": movie.get("title"),
            "release_year": release_year,
            "genre": genre,
            "poster": poster_url,
            "rating": movie.get("vote_average"),
            "description": movie.get("overview")
        }
    
    def upload_to_supabase(self, movies: List[Dict], batch_size: int = 50):
        """
        Upload movies to Supabase in batches
        """
        # Filter out any movies with missing critical data and deduplicate by tmdb_id
        seen_ids = set()
        transformed_movies = []
        for movie in movies:
            transformed = self.transform_movie_data(movie)
            # Only include movies with at least a title and tmdb_id, and no duplicates
            if transformed["title"] and transformed["tmdb_id"] and transformed["tmdb_id"] not in seen_ids:
                transformed_movies.append(transformed)
                seen_ids.add(transformed["tmdb_id"])
        
        print(f"📊 Deduplicated: {len(movies)} → {len(transformed_movies)} unique movies\n")
        
        total_uploaded = 0
        total_batches = (len(transformed_movies) // batch_size) + 1
        
        for i in range(0, len(transformed_movies), batch_size):
            batch = transformed_movies[i:i + batch_size]
            
            try:
                # Use upsert to insert new movies or update existing ones (based on tmdb_id)
                response = self.supabase.table("movies").upsert(batch, on_conflict="tmdb_id").execute()
                
                total_uploaded += len(batch)
                print(f"Uploaded batch {(i//batch_size) + 1}/{total_batches} - "
                      f"Total: {total_uploaded}/{len(transformed_movies)}")
                
            except Exception as e:
                print(f"Error uploading batch: {e}")
                # Continue with next batch even if one fails
                continue
        
        print(f"\n✅ Upload complete! {total_uploaded} movies uploaded/updated in Supabase")
        return total_uploaded
    
    def run(self, total_movies: int = 200):
        """
        Main execution method - simple and straightforward
        """
        print(f"🎬 Starting batch upload of {total_movies} popular movies...\n")
        
        # Fetch movies from TMDB
        movies = self.fetch_popular_movies(total_movies)
        print(f"\n📥 Fetched {len(movies)} movies from TMDB\n")
        
        # Upload to Supabase
        if movies:
            self.upload_to_supabase(movies)
        else:
            print("❌ No movies to upload")


# Usage
if __name__ == "__main__":
    # Load environment variables from backend/.env
    # Try to find .env in the backend directory (parent of tmdb-api)
    backend_dir = Path(__file__).resolve().parent.parent
    env_path = backend_dir / ".env"
    
    if env_path.exists():
        load_dotenv(env_path)
        print(f"✅ Loaded environment variables from {env_path}")
    else:
        # Fallback to automatic .env discovery
        env_path = find_dotenv(usecwd=True)
        if env_path:
            load_dotenv(env_path)
            print(f"✅ Loaded environment variables from {env_path}")
        else:
            print("⚠️ No .env file found. Please ensure backend/.env exists with required keys.")
    
    # Get credentials from environment variables
    TMDB_KEY = os.getenv("TMDB_KEY")
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    # Use SERVICE_ROLE_KEY for batch uploads to bypass RLS
    SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")
    
    # Validate required environment variables
    if not TMDB_KEY:
        raise RuntimeError("TMDB_KEY not found in environment variables. Please add it to backend/.env")
    if not SUPABASE_URL:
        raise RuntimeError("SUPABASE_URL not found in environment variables. Please add it to backend/.env")
    if not SUPABASE_KEY:
        raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY) not found in environment variables. Please add it to backend/.env")
    
    print(f"🔑 Using Supabase URL: {SUPABASE_URL}")
    print(f"🔑 Using SERVICE_ROLE_KEY (bypasses RLS for admin operations)")
    print(f"🔑 TMDB API Key: {TMDB_KEY[:8]}..." if TMDB_KEY else "🔑 TMDB API Key: Not set")
    
    # Create uploader and run
    uploader = TMDBBatchUploader(
        TMDB_KEY=TMDB_KEY,
        supabase_url=SUPABASE_URL,
        supabase_key=SUPABASE_KEY
    )
    
    # Upload 200 popular movies (or specify a different number)
    uploader.run(total_movies=200)