import React from "react";
import * as LucideIcons from "lucide-react";
import { LucideProps } from "lucide-react";

interface DynamicIconProps extends LucideProps {
    name: string | null;
    fallback?: React.ReactNode;
}

export const DynamicIcon = ({ name, fallback, ...props }: DynamicIconProps) => {
    if (!name) return <>{fallback}</>;

    const trimmedName = name.trim();

    // Support common storage variants like "laptop", "Laptop", and "LucideLaptop".
    const normalizedName = trimmedName.charAt(0).toUpperCase() + trimmedName.slice(1);
    const withoutLucidePrefix = normalizedName.startsWith("Lucide")
      ? normalizedName.slice("Lucide".length)
      : normalizedName;

    const IconComponent =
      (LucideIcons as any)[normalizedName] || (LucideIcons as any)[withoutLucidePrefix];

    if (IconComponent) {
        return <IconComponent {...props} />;
    }

    // Fallback to rendering the name itself (for emojis or plain text)
    return <span {...(props as any)}>{name}</span>;
};
