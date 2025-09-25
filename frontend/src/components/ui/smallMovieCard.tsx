import { Card, CardHeader } from "@/components/ui/card"
import { Link } from "react-router-dom"
import { StarRating } from "@/components/ui/ratings"

interface MovieCardProps {
  id: number
  title: string
  year: string
  poster: string
  genre: string
  rating?: number  // 👈 optional, so you can show a user’s rating
}

export default function SmallMovieCard({ id, title, year, poster, genre, rating }: MovieCardProps) {
  return (
    <Link to={`/movies/${id}`} className="block">
      <Card className="w-full max-w-sm rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-200">
        <img src={poster} alt={`${title} poster`} className="w-full h-80 object-cover" />
        <CardHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold truncate">{title}</h3>
            <span className="text-sm text-gray-500">{year}</span>
          </div>
          <p className="text-sm text-gray-600">{genre}</p>
          {rating !== undefined && (
            <div className="mt-2 flex items-center gap-2">
              <StarRating value={rating} disabled /> 
              <span className="text-sm text-gray-500">{rating}/5</span>
            </div>
          )}
        </CardHeader>
      </Card>
    </Link>
  )
}
