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
      <Card className="w-full rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-200">
        <CardHeader className="p-0 relative">
          <img src={poster} alt={`${title} poster`} className="w-full h-auto object-cover"/>

          {rating !== undefined && (
            <div className="w-1/2 absolute right-1 top-1 flex items-center justify-center bg-white rounded-md px-1 py-1">
              <StarRating value={rating} readOnly={true}/> 
            </div>
          )}
        </CardHeader>

        <CardContent className="-mt-6 p-2 pb-0 h-20 flex flex-col">
          <div 
            className="grid grid-cols-2"
            style={{ gridTemplateColumns: "75% 25%"}}
          >
            <Typography size="body" className="line-clamp-2 break-words text-left">
              {title}
            </Typography>
            <Typography size="body" className="text-right">
              {year}
            </Typography>
          </div>
          <Typography size="body" className="mt-auto line-clamp-1 break-words text-left" color={"gray"}>
            {genre}
          </Typography>
          
        </CardContent>
      </Card>
    </Link>
  )
}
