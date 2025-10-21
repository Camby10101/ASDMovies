import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";

interface Group {
  id: string;
  creator_user_id: string;
  created_at: string;
  group_colour?: string;
  group_name?: string;
}

interface GroupMember {
  user_id: string;
  group_id: string;
  is_admin: boolean;
  joined_at: string;
  user_email: string | null;
}

const GroupDetailsPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [groupName, setGroupName] = useState("");
  const [groupColour, setGroupColour] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");


  useEffect(() => {
    if (groupId) {
      loadGroupDetails();
      loadMembers();
    }
  }, [groupId]);

  const loadGroupDetails = async () => {
    const response = await api(`/api/groups/${groupId}`, { method: "GET" });
    const data = await response.json();
    setGroup(data);
    setGroupName(data.group_name || "");
    setGroupColour(data.group_colour || "");
    setLoading(false);
    console.log(group);
  };

  const loadMembers = async () => {
    const response = await api(`/api/groups/${groupId}/members`, { method: "GET" });
    const data = await response.json();
    setMembers(data);
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMessage(""); // clear previous message
    try {
        const response = await api(`/api/groups/${groupId}`, {
        method: "PUT",
        body: JSON.stringify({
            group_colour: groupColour,
            group_name: groupName,
        }),
        });

        if (!response.ok) {
        throw new Error("Failed to save changes");
        }

        await loadGroupDetails();
        setStatusMessage("Changes saved successfully");
    } catch {
        setStatusMessage("You do not have Permission!");
    } finally {
        setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen p-6 grid grid-cols-1 md:grid-cols-3 gap-6" style={{ backgroundColor: groupColour || "#f9fafb" }}>
      {/* Left: Members */}
      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-4">Members</h2>
        <ul className="space-y-2">
          {members.map((m) => (
            <li key={m.user_id} className="text-sm">
              {m.user_email || m.user_id} {m.is_admin && <span className="text-xs text-blue-500">(Admin)</span>}
            </li>
          ))}
        </ul>
      </Card>

      {/* Right: Group settings */}
      <Card className="p-4 md:col-span-2">
        <h2 className="text-xl font-semibold mb-4">
            {"Settings"}
            {/* Could add group name later here instead if we have time*/}
        </h2>
        <p className="text-gray-500">Group ID: {groupId}</p>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Group Name</label>
            <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Group Colour</label>
            <Input type="color" value={groupColour} onChange={(e) => setGroupColour(e.target.value)} />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
            {statusMessage && (
                <p className="mt-2 text-sm text-green-600">{statusMessage}</p>
            )}
        </div>
      </Card>
    </div>
  );
};

export default GroupDetailsPage;
