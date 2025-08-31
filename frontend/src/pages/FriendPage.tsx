import React from "react";

interface Friend {
  id: number;
  name: string;
  favoriteMovie: string;
  avatar: string;
}

const friends: Friend[] = [ //Sample data until backend is ready
  {
    id: 1,
    name: "Alice",
    favoriteMovie: "Inception",
    avatar: "https://i.pravatar.cc/100?img=1",
  },
  {
    id: 2,
    name: "Bob",
    favoriteMovie: "Interstellar",
    avatar: "https://i.pravatar.cc/100?img=2",
  },
  {
    id: 3,
    name: "Charlie",
    favoriteMovie: "The Dark Knight",
    avatar: "https://i.pravatar.cc/100?img=3",
  },
];

const Friends: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-6">Friends</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {friends.map((friend) => (
          <div
            key={friend.id}
            className="bg-white shadow-md rounded-2xl p-4 flex flex-col items-center text-center hover:shadow-lg transition"
          >
            <img
              src={friend.avatar}
              alt={friend.name}
              className="w-20 h-20 rounded-full mb-4"
            />
            <h2 className="text-xl font-semibold">{friend.name}</h2>
            <p className="text-gray-600 text-sm mt-2">
              Favorite Movie: <span className="font-medium">{friend.favoriteMovie}</span>
            </p>
            <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
              View Profile
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Friends;
