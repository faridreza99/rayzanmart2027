import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, X, AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";

export interface VariantOption {
    name: string;
    values: string[];
}

export interface VariantFormData {
    id?: string;
    name_en: string;
    name_bn: string;
    sku: string;
    price: number;
    cost_price: number;
    stock: number;
    attributes: Record<string, string>;
    is_active: boolean;
}

interface ProductVariantsFormProps {
    baseProductNameEn: string;
    baseProductNameBn: string;
    basePrice: number;
    options: VariantOption[];
    setOptions: (options: VariantOption[]) => void;
    variants: VariantFormData[];
    setVariants: (variants: VariantFormData[]) => void;
}

export const ProductVariantsForm = ({
    baseProductNameEn,
    baseProductNameBn,
    basePrice,
    options,
    setOptions,
    variants,
    setVariants,
}: ProductVariantsFormProps) => {
    const { language, t } = useLanguage();
    const [newOptionName, setNewOptionName] = useState("");
    const [newValueMap, setNewValueMap] = useState<Record<number, string>>({});

    const handleAddOption = () => {
        if (!newOptionName.trim()) return;
        setOptions([...options, { name: newOptionName.trim(), values: [] }]);
        setNewOptionName("");
    };

    const handleRemoveOption = (index: number) => {
        const newOptions = [...options];
        newOptions.splice(index, 1);
        setOptions(newOptions);
        // Warning: this invalidates generated variants if they depend on this option
    };

    const handleAddValue = (optionIndex: number) => {
        const val = newValueMap[optionIndex]?.trim();
        if (!val) return;

        const newOptions = [...options];
        if (!newOptions[optionIndex].values.includes(val)) {
            newOptions[optionIndex].values.push(val);
            setOptions(newOptions);
        }

        setNewValueMap({ ...newValueMap, [optionIndex]: "" });
    };

    const handleRemoveValue = (optionIndex: number, valueIndex: number) => {
        const newOptions = [...options];
        newOptions[optionIndex].values.splice(valueIndex, 1);
        setOptions(newOptions);
    };

    // Cartesian product to generate combinations
    const generateVariants = () => {
        if (options.length === 0 || options.some((o) => o.values.length === 0)) return;

        // Build array of arrays of {name, value} objects
        const optionValues = options.map((opt) =>
            opt.values.map((val) => ({ name: opt.name, value: val }))
        );

        const cartesian = (arr: any[][]): any[][] =>
            arr.reduce(
                (a, b) => a.flatMap((d) => b.map((e) => [d, e].flat())),
                [[]]
            );

        const combinations = cartesian(optionValues);

        const generatedVariants: VariantFormData[] = combinations.map((combo) => {
            const attributes: Record<string, string> = {};
            combo.forEach((c: { name: string; value: string }) => {
                attributes[c.name] = c.value;
            });

            const variantSuffixEn = combo.map((c: any) => c.value).join(" - ");
            const variantSuffixBn = combo.map((c: any) => c.value).join(" - ");

            // Check if we already have this variant in state to preserve its values
            const existing = variants.find((v) => {
                const existingKeys = Object.keys(v.attributes);
                if (existingKeys.length !== combo.length) return false;
                return existingKeys.every((key) => v.attributes[key] === attributes[key]);
            });

            if (existing) {
                return existing;
            }

            return {
                name_en: `${baseProductNameEn || "Product"} - ${variantSuffixEn}`,
                name_bn: `${baseProductNameBn || "Product"} - ${variantSuffixBn}`,
                sku: "",
                price: basePrice || 0,
                cost_price: 0,
                stock: 0,
                attributes,
                is_active: true,
            };
        });

        setVariants(generatedVariants);
    };

    const updateVariant = (index: number, field: keyof VariantFormData, value: any) => {
        const newVariants = [...variants];
        newVariants[index] = { ...newVariants[index], [field]: value };
        setVariants(newVariants);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardContent className="pt-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-semibold text-lg">Product Options</h3>
                        <p className="text-sm text-muted-foreground">Add options like Size, Color, Material</p>
                    </div>

                    <div className="space-y-4">
                        {options.map((opt, optIndex) => (
                            <div key={optIndex} className="p-4 border rounded-md space-y-3 bg-muted/30">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">{opt.name}</span>
                                    <Button variant="ghost" size="sm" onClick={() => handleRemoveOption(optIndex)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {opt.values.map((val, valIndex) => (
                                        <div key={valIndex} className="flex items-center bg-background border px-2 py-1 rounded-md text-sm">
                                            {val}
                                            <button
                                                onClick={() => handleRemoveValue(optIndex, valIndex)}
                                                className="ml-2 text-muted-foreground hover:text-foreground"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Add value (e.g. XL, Red)"
                                        value={newValueMap[optIndex] || ""}
                                        onChange={(e) => setNewValueMap({ ...newValueMap, [optIndex]: e.target.value })}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleAddValue(optIndex);
                                            }
                                        }}
                                        className="max-w-[200px] h-8"
                                    />
                                    <Button size="sm" variant="secondary" onClick={() => handleAddValue(optIndex)}>
                                        Add Value
                                    </Button>
                                </div>
                            </div>
                        ))}

                        <div className="flex gap-2 pt-2">
                            <Input
                                placeholder="Option name (e.g. Size)"
                                value={newOptionName}
                                onChange={(e) => setNewOptionName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleAddOption();
                                    }
                                }}
                                className="max-w-[200px]"
                            />
                            <Button onClick={handleAddOption} variant="outline">
                                <Plus className="h-4 w-4 mr-2" /> Add Option
                            </Button>
                        </div>

                        {options.length > 0 && (
                            <div className="pt-4 border-t mt-4">
                                <Button onClick={generateVariants} className="w-full sm:w-auto">
                                    Generate Combinations
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {variants.length > 0 && (
                <Card>
                    <CardContent className="pt-6">
                        <h3 className="font-semibold text-lg mb-4">Variant Combinations</h3>
                        <div className="border rounded-md overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted">
                                    <TableRow>
                                        <TableHead>Variant</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Cost Price</TableHead>
                                        <TableHead>Stock</TableHead>
                                        <TableHead>SKU</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {variants.map((variant, idx) => (
                                        <TableRow key={idx} className={!variant.is_active ? "opacity-50" : ""}>
                                            <TableCell className="font-medium">
                                                {Object.values(variant.attributes).join(" / ")}
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    value={variant.price || ""}
                                                    onChange={(e) => updateVariant(idx, "price", Number(e.target.value))}
                                                    className="w-20 h-8 text-xs"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    value={variant.cost_price || ""}
                                                    onChange={(e) => updateVariant(idx, "cost_price", Number(e.target.value))}
                                                    className="w-20 h-8 text-xs"
                                                    placeholder="0"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    value={variant.stock || 0}
                                                    onChange={(e) => updateVariant(idx, "stock", Number(e.target.value))}
                                                    className="w-16 h-8 text-xs"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={variant.sku || ""}
                                                    onChange={(e) => updateVariant(idx, "sku", e.target.value)}
                                                    placeholder="Optional"
                                                    className="w-32 h-8 font-mono text-sm"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => updateVariant(idx, "is_active", !variant.is_active)}
                                                    title={variant.is_active ? "Disable Variant" : "Enable Variant"}
                                                >
                                                    {variant.is_active ? (
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    ) : (
                                                        <Plus className="h-4 w-4 text-green-600" />
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
