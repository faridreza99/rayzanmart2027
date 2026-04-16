import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { uploadToCloudinary, getOptimizedUrl } from "@/lib/cloudinary";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface CloudinaryImageUploadProps {
    label: string;
    value: string;
    onChange: (url: string) => void;
}

export const SingleImageUpload = ({
    label,
    value,
    onChange,
}: CloudinaryImageUploadProps) => {
    const { language } = useLanguage();
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error(
                language === "bn"
                    ? "শুধুমাত্র ছবি ফাইল আপলোড করুন"
                    : "Please upload image files only"
            );
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error(
                language === "bn"
                    ? "ফাইল সাইজ ৫MB এর কম হতে হবে"
                    : "File size must be less than 5MB"
            );
            return;
        }

        setUploading(true);
        setProgress(0);

        try {
            const result = await uploadToCloudinary(file, setProgress);
            onChange(result.secure_url);
            toast.success(
                language === "bn" ? "ছবি আপলোড সফল" : "Image uploaded successfully"
            );
        } catch (error) {
            toast.error(
                language === "bn"
                    ? "ছবি আপলোড ব্যর্থ হয়েছে"
                    : "Image upload failed"
            );
            console.error("Upload error:", error);
        } finally {
            setUploading(false);
            setProgress(0);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleDrop = useCallback(
        async (e: React.DragEvent) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (!file || !file.type.startsWith("image/")) return;

            setUploading(true);
            setProgress(0);

            try {
                const result = await uploadToCloudinary(file, setProgress);
                onChange(result.secure_url);
            } catch (error) {
                toast.error(
                    language === "bn"
                        ? "ছবি আপলোড ব্যর্থ হয়েছে"
                        : "Image upload failed"
                );
            } finally {
                setUploading(false);
                setProgress(0);
            }
        },
        [onChange, language]
    );

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />

            {value ? (
                <div className="relative group rounded-lg overflow-hidden border bg-muted">
                    <img
                        src={getOptimizedUrl(value, 400, 400)}
                        alt="Product"
                        className="w-full h-40 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                        >
                            {language === "bn" ? "পরিবর্তন" : "Change"}
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => onChange("")}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ) : (
                <div
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors"
                >
                    {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="text-sm text-muted-foreground">
                                {progress}%
                            </span>
                            <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Upload className="h-8 w-8" />
                            <span className="text-sm">
                                {language === "bn"
                                    ? "ছবি আপলোড করুন"
                                    : "Upload image"}
                            </span>
                            <span className="text-xs">
                                {language === "bn"
                                    ? "ক্লিক করুন বা ড্র্যাগ করুন"
                                    : "Click or drag & drop"}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- Gallery Upload (multiple images, max 4) ---

interface GalleryImageUploadProps {
    label: string;
    value: string[];
    onChange: (urls: string[]) => void;
    max?: number;
}

export const GalleryImageUpload = ({
    label,
    value,
    onChange,
    max = 4,
}: GalleryImageUploadProps) => {
    const { language } = useLanguage();
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const remaining = max - value.length;
        if (remaining <= 0) {
            toast.error(
                language === "bn"
                    ? `সর্বোচ্চ ${max}টি ছবি আপলোড করা যাবে`
                    : `Maximum ${max} images allowed`
            );
            return;
        }

        const filesToUpload = Array.from(files).slice(0, remaining);
        setUploading(true);

        try {
            const urls: string[] = [];
            for (let i = 0; i < filesToUpload.length; i++) {
                const file = filesToUpload[i];
                if (!file.type.startsWith("image/")) continue;
                if (file.size > 5 * 1024 * 1024) continue;

                setProgress(Math.round(((i) / filesToUpload.length) * 100));
                const result = await uploadToCloudinary(file, (p) => {
                    setProgress(
                        Math.round(((i + p / 100) / filesToUpload.length) * 100)
                    );
                });
                urls.push(result.secure_url);
            }

            onChange([...value, ...urls]);
            toast.success(
                language === "bn"
                    ? `${urls.length}টি ছবি আপলোড সফল`
                    : `${urls.length} image(s) uploaded`
            );
        } catch (error) {
            toast.error(
                language === "bn"
                    ? "ছবি আপলোড ব্যর্থ হয়েছে"
                    : "Image upload failed"
            );
        } finally {
            setUploading(false);
            setProgress(0);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const removeImage = (index: number) => {
        onChange(value.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-2">
            <Label>
                {label} ({value.length}/{max})
            </Label>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
            />

            <div className="grid grid-cols-4 gap-2">
                {value.map((url, index) => (
                    <div
                        key={index}
                        className="relative group aspect-square rounded-lg overflow-hidden border bg-muted"
                    >
                        <img
                            src={getOptimizedUrl(url, 200, 200)}
                            alt={`Gallery ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                        <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 rounded-full bg-destructive text-destructive-foreground p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ))}

                {value.length < max && (
                    <button
                        type="button"
                        onClick={() => !uploading && fileInputRef.current?.click()}
                        disabled={uploading}
                        className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-muted/50 transition-colors cursor-pointer disabled:opacity-50"
                    >
                        {uploading ? (
                            <div className="flex flex-col items-center gap-1">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                <span className="text-[10px] text-muted-foreground">
                                    {progress}%
                                </span>
                            </div>
                        ) : (
                            <>
                                <ImagePlus className="h-5 w-5 text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground">
                                    {language === "bn" ? "যোগ করুন" : "Add"}
                                </span>
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};
