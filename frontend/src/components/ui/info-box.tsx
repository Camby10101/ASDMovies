import { Typography } from "@/components/ui/typography";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent} from "@/components/ui/card";
import { PenLine } from "lucide-react"
import { Check } from "lucide-react"

interface InfoBoxProps {
    header: string;
    text: string;
    maxLength?: number;
    onChange: (newValue: string) => void;
    isEditable?: boolean;
}

export function InfoBox({header, text, maxLength = 200, onChange, isEditable = false}: InfoBoxProps) {
    const [mode, setMode] = useState<"view" | "edit">("view");

    const handleSave = () => {
        setMode("view");
    };

    const handleEdit = () => {
        setMode("edit");
        onChange(text);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Typography size="h2">{header}</Typography>
                
                    {isEditable ? (
                        mode === "view" ? (
                            <Button className="w-7 h-7" onClick={handleEdit}>
                                <PenLine/>
                            </Button>
                        ) : (
                            <Button className="w-7 h-7" onClick={handleSave}>
                                <Check/>
                            </Button>
                        )
                    ) : null}
                </div>
            </CardHeader>
            <CardContent>
                {mode === "edit" ? (
                    <div className="w-full h-full flex flex-col">
                        <textarea
                            className="w-full h-full border border-gray-400 rounded p-2 outline-none resize-none"
                            rows={3}
                            value={text}
                            maxLength={maxLength}
                            onChange={(e) => onChange(e.target.value)}
                            autoFocus
                        />
                        {/* <div className="flex justify-end mt-2">
                            <Typography>
                                {text.length}/{maxLength}
                            </Typography>
                        </div> */}
                    </div>
                    
                ) : (
                    <div className={"w-full relative flex flex-col"}>
                        <div className="flex flex-1">
                            <textarea
                                className="w-full h-full border border-white rounded p-2 outline-none resize-none -ml-2"
                                rows={3}
                                value={text}
                                maxLength={maxLength}
                                onChange={(e) => onChange(e.target.value)}
                                readOnly={true}
                            />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
