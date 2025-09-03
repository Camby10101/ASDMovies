// IMPORTS SECTUIB
import { useEffect, useState } from "react"
// Named imports from the React library:
// - useEffect: the react hooks for side effects (API calls, subscriptions, etc)
//    runs after a component renders and can clean up when deps. change
// - useState: React Hook for managing component state
//    returns [currentValue, setterFunction] tuple for state management
//
import MovieCard from "@/components/ui/movieCard"
// Default import of our movie card component
//    displays our movie data

import { fetchMovies, type Movie } from "@/lib/tmdb-api-helper"
// Named import from our utility module
// - fetchMovies: function that makes API calls to fetch the movie data
// - type Movie: TS definition imported with typeKeyword

import { Input } from "@/components/ui/input"
// Input UI from shad

// REACT FUNCTIONAL COMPONENT DEFINITION

// This is the default export of this module
// Returns JSX elements to render
export default function MovieGridPage() {

  // STATE MANAGMENT SECTION - Using React Hooks

  // useState Hook #1: Search query state
  const [q, setQ] = useState("")
  // Array destructuring: extracts [value, setter] from useState return
  // useState<string>("") - TS Generic value inferred as string
  // q: current search query string
  // setQ: function to update the search query (triggers re-render)

  // useState Hook #2: Movies data state
  const [movies, setMovies] = useState<Movie[]>([])
  // Explicit TypeScript generic: useState<Movie[]>
  // Movie[]: TypeScript array containing movie objects
  // movies: current array of movie objects
  // setMovies: function to update the movies
  // []: initial state is empty array
  

  // useState Hook #3: Loading State
  const [loading, setLoading] = useState(true)
  // Boolean state for tracking loading status
  // Starts as true (loading initially)

  // useState Hook #4: Error State
  const [err, setErr] = useState<string | null>(null)
  // Union type: string | null (can be a string error message or null)
  // Starts as null (no error initially)

  // SIDE EFFECTS SECTION - useEffect Hook
  useEffect(() => {
    // useEffect callback function will run after component renders
    // This handles API calls when the search query changes

    // ABORT CONTROLLER - Handles cancelling HTTP requests
    const ctrl = new AbortController()
    // AbortController: Web API for cancelling async operations
    // Prevents memory leaks and race conditions when component unmounts
    // or when a new search is triggered before the previous one completes

    // STATE UPDATES - prepares for new API calls
    setLoading(true)  // Set loading to true
    setErr(null)  // Clear any previous errors

    // PROMISE CHAIN - handling async API calls
    fetchMovies(q, ctrl.signal) // Call API function with search query and abort signal
      .then(setMovies)          // Promise.then(): on succes, update movies state
                                // setMovies is passed directly as a callback function
      .catch((e) => { // Promise.catch(): on error, handle the exception)
        // arrow function with param 'e' (caught function)
        if (e.name !== "AbortError") setErr(e.message ?? "Failed to load")
        // Conditional: only set error if it's not an AbortError
        // e.message ?? "Failed to load": nullish coalescing operator
        // Uses e.message if truthy, otherwise defaults to "Failed to load"
      })
      .finally(() => setLoading(false)) // Promise.finally() always runs after then/catch
                                        // Arrow function that sets loading to false

    // CLEANUP FUNCTION - useEffect return value =
    return () => ctrl.abort()
    // Arrow function returned from useEffect
    // Runs when:
    // 1. Comonent unmounts
    // 2. Dependencies change
    // 3. Component re-renders with new dependencies
    // Aborts any pending HTTP requests to prevent memory leaks

  }, [q]) // DEPENDENCY ARRAY
  // Array that contains values that trigger the effect re-run when changed
  // [q]: effect runs when 'q' (search query) changes
  // Empty array [] would run once on mount
  // No array would run on every render (not desired)

  // JSX RETURN STATEMENT
  return (

    <div className="mx-auto max-w-7xl p-6">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Movies</h1>
        <Input
          value={q}                                       // Controlled Component: value from state
          onChange={(e) => setQ(e.target.value)}          // Event handler function
          placeholder="Search movies…"                    // Placeholder
          className="w-full max-w-md"                     // w-full: width 100%
        />
      </header>

        {/* CONTROLLED COMPONENT pattern:
            - value={q}: input value controlled by React state
            - onChange handler updates state when user types
            - (e) => setQ(e.target.value): arrow function extracting input value
            - e: SyntheticEvent (React's cross-browser event wrapper)
            - e.target: the DOM element that triggered the event
            - e.target.value: current value of the input field */}

      {/* CONDITIONAL RENDERING using JSX expressions */}
      {loading && <p className="text-muted-foreground">Loading…</p>}
      {/* {expression}: JSX expression - JavaScript evaluated and rendered
          loading && <element>: logical AND operator
          - If loading is true, renders the <p> element
          - If loading is false, renders nothing (short-circuit evaluation) */}

      {err && <p className="text-red-600">Error: {err}</p>}
      {/* Similar pattern for error display
          text-red-600: red color from Tailwind palette
          {err}: JSX expression displaying the error message */}

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">


        {/* CONDITIONAL RENDERING FOR THE MOVIES */}
        {!loading && !err && movies.length > 0 ? (
          // if all above contions met:
          movies.map((m) => (
            // Transforms each array element (returns JSX:)
            <MovieCard
              key={m.title + m.year} // React key prop for list irem identification
              id={m.id}
              title={m.title}
              year={m.year}
              poster={m.poster}
              genre={m.genre}
              rating={m.rating}
              description={m.description}
            />
            // COMPONENT PROPS: data passed from parent to child componet
          ))
        ) : (
            !loading && !err && <p className="text-muted-foreground">No movies found.</p>
          )}
      </div>
    </div>
  )
}

