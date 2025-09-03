import { Typography } from "@/components/ui/typography";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface InfoBoxProps {
    text: string;
    onChange: (newValue: string) => void;
    isEditable?: boolean;
}

export function InfoBox({text, onChange, isEditable = false}: InfoBoxProps) {
    const [mode, setMode] = useState<"view" | "edit">("view");

    const handleSave = () => {
        setMode("view");
        // persist text somewhere
    };

    const handleEdit = () => {
        setMode("edit");
        onChange(text);
    };

    return (
        <>
            {mode === "edit" ? (
                <div className="w-full h-full border border-gray-400 rounded flex p-2">
                    <textarea
                    className="w-full h-full text-left resize-none border-none outline-none"
                    value={text}
                    onChange={(e) => onChange(e.target.value)}
                    />
                    <Button onClick={handleSave}>Save</Button>
                </div>
            ) : (
                <div className="w-full min-h-40 p-2 relative flex flex-col">
                    <div className="flex flex-1 items-center justify-center">
                        <Typography size="body" align="center">
                        {text}
                        </Typography>
                    </div>
                    {isEditable ? (
                        <div className="absolute bottom-2 right-2">
                            <Button onClick={handleEdit}>Edit</Button>
                        </div>
                    ) : null}
                </div>
            )}
        </>   
    )
}
