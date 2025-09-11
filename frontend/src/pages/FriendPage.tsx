import React, { useState } from "react";
import type { Friend } from "../types/friend";


const holderFriends: Friend[] = [ //Sample data until backend is ready
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
    avatar: "https://i.pinimg.com/736x/05/8a/71/058a71d92cefa339b732ab19787ce8da.jpg",
  },
];

const Friends: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>(holderFriends);

  const removeFriend = (id: number) => {
    setFriends((prev) => prev.filter((friend) => friend.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-6">Friends</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {friends.length === 0 ? (
          <p className="text-gray-500 text-center col-span-full">
            Add some friends to your account!
          </p>
        ) : friends.map((friend) => (
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
              <button
                onClick={() => removeFriend(friend.id)}
                className="mt-3 bg-red-400 text-white px-3 py-1.5 rounded-md text-sm hover:bg-red-500 transition"
              >
                Remove Friend
              </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Friends;
