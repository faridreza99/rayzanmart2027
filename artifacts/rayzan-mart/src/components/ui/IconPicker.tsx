import React, { useState, useMemo } from "react";
import * as LucideIcons from "lucide-react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DynamicIcon } from "./DynamicIcon";

interface IconPickerProps {
    value: string;
    onChange: (value: string) => void;
    fallback?: string;
}

const ALL_ICONS = Object.keys(LucideIcons).filter(
    (key) =>
        /^[A-Z]/.test(key) &&
        typeof (LucideIcons as any)[key] !== "undefined" &&
        !['LucideProps', 'LucideIcon', 'Icon', 'createLucideIcon'].includes(key)
);

export const IconPicker = ({ value, onChange, fallback = "📦" }: IconPickerProps) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    const filteredIcons = useMemo(() => {
        if (!searchTerm) return ALL_ICONS.slice(0, 100); // Show first 100 by default
        return ALL_ICONS.filter((name) =>
            name.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 200); // Limit results for performance
    }, [searchTerm]);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className="w-10 h-10 p-0 flex items-center justify-center border rounded-md bg-muted/50"
                >
                    <DynamicIcon name={value} className="h-6 w-6 text-primary" fallback={fallback} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
                <div className="p-3 border-b">
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search icons..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 h-8 text-sm"
                            autoFocus
                        />
                    </div>
                </div>
                <ScrollArea className="h-72 p-2">
                    <div className="grid grid-cols-6 gap-2">
                        {filteredIcons.map((iconName) => (
                            <Button
                                key={iconName}
                                variant="ghost"
                                className={`h-10 w-10 p-0 ${value === iconName ? "bg-primary/10 border-primary" : ""}`}
                                onClick={() => {
                                    onChange(iconName);
                                    setIsOpen(false);
                                    setSearchTerm("");
                                }}
                                title={iconName}
                            >
                                <DynamicIcon name={iconName} className="h-5 w-5" />
                            </Button>
                        ))}
                        {filteredIcons.length === 0 && (
                            <div className="col-span-6 py-4 text-center text-xs text-muted-foreground">
                                No icons found
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <div className="p-2 border-t bg-muted/30 text-[10px] text-muted-foreground text-center">
                    Showing {filteredIcons.length} icons. Try searching for more.
                </div>
            </PopoverContent>
        </Popover>
    );
};
