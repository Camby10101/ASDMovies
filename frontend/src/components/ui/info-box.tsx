import { Typography } from "@/components/ui/typography";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface InfoBoxProps {
    text: string;
    maxLength?: number;
    size?: "large" | "small";
    onChange: (newValue: string) => void;
    isEditable?: boolean;
}

export function InfoBox({text, maxLength = 200, size = "large", onChange, isEditable = false}: InfoBoxProps) {
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
                <div className={`w-full border border-gray-400 rounded flex p-2 ${
                    size === "large" ? "min-h-40" : "h-full"
                }`}
                >
                    <textarea
                    className="w-full h-full text-left resize-none border-none outline-none"
                    value={text}
                    maxLength={maxLength}
                    onChange={(e) => onChange(e.target.value)}
                    />
                    <div className="flex flex-col border-none outline-none justify-between border">
                        <Button onClick={handleSave}>Save</Button>
                        <Typography align="center">
                            {text.length + "/" + maxLength}
                        </Typography>
                    </div>
                    
                </div>
            ) : (
                <div className={`w-full p-2 relative flex flex-col ${
                    size === "large" ? "min-h-40" : "h-full"
                }`}
                >
                    <div className="flex flex-1 items-center justify-center">
                        <Typography size="body" align="center">
                        {text}
                        </Typography>
                    </div>
                    {isEditable ? (
                        <div className="absolute top-2 right-2">
                            <Button onClick={handleEdit}>Edit</Button>
                        </div>
                    ) : null}
                </div>
            )}
        </>   
    )
}
