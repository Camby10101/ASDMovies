import { Typography } from "@/components/ui/typography";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PenLine } from "lucide-react"
import { Check } from "lucide-react"

interface InfoLineProps {
    text: string;
    maxLength?: number;
    onChange: (newValue: string) => void;
    isEditable?: boolean;
}

export function InfoLine({text, maxLength = 200, onChange, isEditable = false}: InfoLineProps) {
    const [mode, setMode] = useState<"view" | "edit">("view");

    const handleSave = () => {
        setMode("view");
    };

    const handleEdit = () => {
        setMode("edit");
        onChange(text);
    };

    return (
        <div className="flex items-center gap-2">
            {mode === "edit" ? (
                <textarea
                    className="w-full h-full border border-gray-400 rounded p-2 outline-none resize-none"
                    rows={1}
                    value={text}
                    maxLength={maxLength}
                    onChange={(e) => onChange(e.target.value)}
                />
            ) : (
                <div className={"w-full relative flex flex-col"}>
                    <div className="flex flex-1">
                        <Typography size="h1" className="text-left">
                        {text}
                        </Typography>
                    </div>
                </div>
            )}

            {isEditable ? (
                mode === "view" ? (
                    <Button className="w-7 h-7" onClick={handleEdit}>
                        <PenLine/>
                    </Button>
                ) : (
                    <>
                    <Button className="w-7 h-7" onClick={handleSave}>
                        <Check/>
                    </Button>
                    </>
                )
            ) : null}
        </div>
    )
}
