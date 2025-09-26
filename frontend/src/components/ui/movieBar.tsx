import { Card } from "@/components/ui/card"
import { Typography } from "@/components/ui/typography";
import { GripVertical } from 'lucide-react';
// import { Link } from "react-router-dom"
// import { useState, useEffect } from "react";

interface MovieCardProps {
  id: number
  title: string
  year: string
  poster: string
  genre: string
  rank: number
}

export default function MovieBar({ id, title, year, poster, genre, rank }: MovieCardProps) {
  // const [isOpen, setIsOpen] = useState(false)

  return (
	<section className="w-full hover:shadow-xl transition-shadow duration-200 rounded-lg">
		<div className="flex items-center justify-center grid grid-cols-5 my-2 border-2 border-gray-200 rounded-lg" style={{ gridTemplateColumns: "4% 6% 60% 10% 20%"}}>
			<div className="w-full h-full bg-gray-200 flex items-center justify-center">
				<GripVertical className="w-full h-full"/>
			</div>
			<Typography align="center">#{rank}</Typography>
			<Typography>{title}</Typography>
			<Typography>{year}</Typography>
			<Typography>{genre}</Typography>
		</div>
	</section>
  )
}
