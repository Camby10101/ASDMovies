import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useNavigate } from "react-router-dom";

interface Group {
  id: string;
  creator_user_id: string;
  created_at: string;
  group_colour?: string;
  group_name?: string;
}

interface Friend {
  user_id: string;
  email: string | null;
}


const GroupsPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [groupName, setGroupName] = useState<string>("");
  const [groupColour, setGroupColour] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  // Load groups
  useEffect(() => {
    loadGroups();
  }, []);

  // Load friends when dialog opens
  useEffect(() => {
    if (isCreateDialogOpen) {
      loadFriends();
    }
  }, [isCreateDialogOpen]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const response = await api("/api/groups", { method: "GET" });
      if (!response.ok) {
        throw new Error(`Failed to load groups (${response.status})`);
      }
      const data = await response.json();
      setGroups(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  const loadFriends = async () => {
    try {
      const response = await api("/api/friends", { method: "GET" });
      if (!response.ok) {
        throw new Error(`Failed to load friends (${response.status})`);
      }
      const data = await response.json();
      setFriends(data.friends ?? []);
    } catch (e: any) {
      console.error("Failed to load friends:", e);
    }
  };

  const handleCreateGroup = async () => {
    try {
      setIsCreating(true);
      const response = await api("/api/groups", {
        method: "POST",
        body: JSON.stringify({
          group_name: groupName || null,
          group_colour: groupColour || null,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create group (${response.status})`);
      }

      const newGroup = await response.json();
      
      // Add selected friends to the group
      if (selectedFriends.length > 0) {
        for (const friendId of selectedFriends) {
          await api(`/api/groups/${newGroup.id}/members`, {
            method: "POST",
            body: JSON.stringify({
              user_id: friendId,
            }),
          });
        }
      }

      // Reload groups
      await loadGroups();
      
      // Reset form
      setSelectedFriends([]);
      setGroupName("");
      setGroupColour("");
      setIsCreateDialogOpen(false);
    } catch (e: any) {
      setError(e?.message ?? "Failed to create group");
    } finally {
      setIsCreating(false);
    }
  };

  const handleFriendToggle = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: "var(--color-background)", color: "var(--color-foreground)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Groups</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>Create Group</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
                <DialogDescription>
                  Create a new group and invite friends to join.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Group Name</label>
                  <Input
                    type="text"
                    placeholder="Enter group name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Group Color (optional)</label>
                  <Input
                    type="color"
                    value={groupColour}
                    onChange={(e) => setGroupColour(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Select Friends</label>
                  <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
                    {friends.length === 0 ? (
                      <p className="text-sm text-gray-500">No friends available</p>
                    ) : (
                      friends.map((friend) => (
                        <label key={friend.user_id} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedFriends.includes(friend.user_id)}
                            onChange={() => handleFriendToggle(friend.user_id)}
                            className="rounded"
                          />
                          <span className="text-sm">
                            {friend.email || friend.user_id}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateGroup} disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Group"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {loading && <div>Loading groups...</div>}
        {error && <div className="text-red-600 mb-4">{error}</div>}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">No groups yet</p>
                <p className="text-gray-400">Create your first group to get started!</p>
              </div>
            ) : (
              groups.map((group) => (
                <Card key={group.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">
                        {group.group_name ?? "Unnamed Group"}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Created {formatDate(group.created_at)}
                      </p>
                    </div>
                    {group.group_colour && (
                      <div
                        className="w-6 h-6 rounded-full border"
                        style={{ backgroundColor: group.group_colour }}
                      />
                    )}
                  </div>

                  <p className="text-sm text-gray-500 mb-3">ID: {group.id.slice(0, 8)}...</p>

                  <div className="space-y-2">
                    {/* View details (existing) */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => navigate(`/groups/${group.id}`)}
                    >
                      View Details
                    </Button>

                    {/* NEW: Generate Recommendations */}
                    <Button
                      size="sm"
                      className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-md hover:shadow-lg hover:opacity-95 transition-all rounded-xl py-5 font-medium"
                      onClick={() => navigate(`/groups/${group.id}/recommendations`)}
                    >
                      🔮 Generate Recommendations
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupsPage;