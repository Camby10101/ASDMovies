import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Link } from "react-router-dom"
import { StarRating } from "@/components/ui/ratings"
import { Typography } from "@/components/ui/typography"

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
      <Card className="w-50 rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-200">
        <CardHeader className="p-0">
          <img src={poster} alt={`${title} poster`} className="w-full h-auto object-cover"/>
        </CardHeader>

        <CardContent className="-mt-6 p-2 pb-0 h-25">
          <Typography size="body" weight="bold" className="flex items-center justify-between">
            {title} ({year})
          </Typography>
          <p className="text-sm text-gray-600">{genre}</p>
          {rating !== undefined && (
            <div className="mt-2 flex items-center gap-2">
              <StarRating value={rating} /> 
              <span className="text-sm text-gray-500">{rating}/5</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
