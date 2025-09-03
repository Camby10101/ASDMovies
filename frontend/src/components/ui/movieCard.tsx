import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "react-router"

interface MovieCardProps {
  id: number
  title: string
  year: string
  poster: string
  genre: string
  rating: string | number
  description: string
}

export default function MovieCard(props: MovieCardProps) {
  const { id, title, year, poster, genre, rating, description } = props
  return (
    <Link to={`/movies/${id}`} className="block">  {/* clickable card */}
      <Card className="w-full max-w-xs rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition">
        <img src={poster} alt={`${title} poster`} className="w-full h-80 object-cover" />
        <CardHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold truncate">{title}</h3>
            <span className="text-sm text-gray-500">{year}</span>
          </div>
          <p className="text-sm text-gray-600">{genre}</p>
        </CardHeader>
        <CardContent className="p-4 space-y-2">
          <p className="text-sm text-gray-700 line-clamp-3">{description}</p>
          <div className="flex items-center justify-between pt-2">
            <span className="text-yellow-500 font-bold">⭐ {rating} TMDB</span>
            <Button size="sm" variant="secondary">Add</Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
