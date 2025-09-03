import { useState } from "react";
import { Typography } from "@/components/ui/typography";
import { InfoBox } from "@/components/ui/info-box";

import type { User } from "@/types/user";
import type { Movie } from "@/types/movie";

const user: User = {
    id: "1",
    name: "BobMovieGuy123",
    bio: "Hi, I'm Bob and I love movies!",
    avatar: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTVVzFIs00C1WVmivQSlqsGgRu2ouRc4slMmQ&s",
    email: "bob@user.com",
    phone: "412 345 678",
    favouriteMovies: ["1", "2", "3"]
};

const movies: Movie[] = [
    {
        id: "1",
        name: "The Departed",
        poster: "https://image.tmdb.org/t/p/original/f1JUHBq8JoXBz2NVNWeUpL2eVZs.jpg"
    },
    {
        id: "2",
        name: "Django Unchained",
        poster: "https://image.tmdb.org/t/p/original/vmUqhTP6NjkuchJbOzC2q20v5pT.jpg"
    },
    {
        id: "3",
        name: "Shutter Island",
        poster: "https://image.tmdb.org/t/p/original/4GDy0PHYX3VRXUtwK5ysFbg3kEx.jpg"
    },
];



const ProfilePage = () => {
    const [bio, setBio] = useState(user.bio);
    const [email, setEmail] = useState(user.email);
    const [phone, setPhone] = useState(user.phone);
    
    return(
        <>
            <div className="flex justify-center">
                <div className="w-1/2 min-h-screen">
                    <div className="flex flex-col items-center p-4 space-y-4">
                        <Typography size="h1" align="center">
                            Edit Profile
                        </Typography>
                        <img className="w-1/5 h-1/5 rounded-full mb-4"
                            src={user.avatar}
                            alt={user.name}
                        />
                        <div className="w-full bg-gray-900 flex items-center justify-center p-2">
                            <Typography size="h1" align="center" color="white">
                                @{user.name}
                            </Typography>
                        </div>
                        
                        <Typography size="h2" align="center">
                            Bio
                        </Typography>

                        <InfoBox 
                            text={bio}
                            onChange={setBio}
                            isEditable={true}
                        />
                    </div>  

                    <hr></hr>

                    <div className="flex flex-col items-center p-4 space-y-4">
                        <Typography size="h2" align="center">
                            Details
                        </Typography>
                        <Typography size="h3" align="center">
                            Email
                        </Typography>
                        <InfoBox 
                            text={email}
                            maxLength={50}
                            size="small"
                            onChange={setEmail}
                            isEditable={true}
                        />
                        <Typography size="h3" align="center">
                            Phone
                        </Typography>
                        <InfoBox 
                            text={phone}
                            maxLength={9}
                            size="small"
                            onChange={setPhone}
                            isEditable={true}
                        />
                    </div>

                    <hr></hr>

                    <div className="flex flex-col items-center p-4 space-y-4">
                        <Typography size="h2" align="center">
                            Favourites
                        </Typography>
                        <div className="grid grid-cols-3 gap-1">
                            {movies
                                .filter((movie) => user.favouriteMovies.includes(movie.id))
                                .map((movie) => (
                                <div key={movie.id}>
                                    <img className=""
                                        src={movie.poster}
                                        alt={movie.name} 
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    
                </div>
            </div>
            

            
            
        </>
    );
}

export default ProfilePage;