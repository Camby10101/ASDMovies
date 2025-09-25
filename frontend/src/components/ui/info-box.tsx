import { Typography } from "@/components/ui/typography";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface InfoBoxProps {
    text: string;
    maxLength?: number;
    onChange: (newValue: string) => void;
    isEditable?: boolean;
}

export function InfoBox({text, maxLength = 200, onChange, isEditable = false}: InfoBoxProps) {
    const [mode, setMode] = useState<"view" | "edit">("view");

    const handleSave = () => {
        setMode("view");
    };

    const handleEdit = () => {
        setMode("edit");
        onChange(text);
    };

    return (
        <>
        {mode === "edit" ? (
            <div className="w-full h-full flex flex-col">
                <textarea
                    className="w-full h-full border border-gray-400 rounded p-2 outline-none"
                    rows={3}
                    value={text}
                    maxLength={maxLength}
                    onChange={(e) => onChange(e.target.value)}
                />
                <div className="flex justify-between items-center mt-2">
                    <Button onClick={handleSave}>Save</Button>
                    <Typography>
                    {text.length}/{maxLength}
                    </Typography>
                </div>
            </div>
            
        ) : (
            <div
            className={`w-full relative flex flex-col`}
            >
            <div className="flex flex-1">
                <Typography size="body" className="text-left">
                {text}
                </Typography>
            </div>
            {isEditable ? (
                <div className="ml pt-5">
                <Button onClick={handleEdit}>Edit</Button>
                </div>
            ) : null}
            </div>
        )}
        </>
  
    )
}
