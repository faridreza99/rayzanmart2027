 import { useState } from "react";
 import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle, X } from "lucide-react";
 import { useLanguage } from "@/contexts/LanguageContext";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { toast } from "sonner";
 
 interface ColumnSpec {
   name: string;
   required: boolean;
   example: string;
 }
 
 interface EnterpriseImportExportProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   entityType: "products" | "categories" | "brands";
   onExport: () => void;
   totalItems: number;
 }
 
 export const EnterpriseImportExport = ({
   open,
   onOpenChange,
   entityType,
   onExport,
   totalItems,
 }: EnterpriseImportExportProps) => {
   const { language } = useLanguage();
   const [activeTab, setActiveTab] = useState<"export" | "import">("export");
 
   const columnSpecs: Record<string, ColumnSpec[]> = {
     products: [
       { name: "sku", required: true, example: "SKU-001" },
       { name: "name_bn", required: true, example: "পণ্যের নাম" },
       { name: "name_en", required: true, example: "Product Name" },
       { name: "category_id", required: true, example: "uuid" },
       { name: "brand_id", required: false, example: "uuid" },
       { name: "price", required: true, example: "1000" },
       { name: "original_price", required: false, example: "1200" },
       { name: "stock", required: true, example: "50" },
       { name: "product_status", required: false, example: "active/inactive/draft" },
       { name: "description_bn", required: false, example: "বিবরণ" },
       { name: "description_en", required: false, example: "Description" },
       { name: "image_url", required: false, example: "https://..." },
     ],
     categories: [
       { name: "name_bn", required: true, example: "ক্যাটাগরি নাম" },
       { name: "name_en", required: true, example: "Category Name" },
       { name: "slug", required: false, example: "category-slug" },
       { name: "parent_id", required: false, example: "uuid (for subcategory)" },
       { name: "icon", required: false, example: "📦" },
       { name: "sort_order", required: false, example: "1" },
       { name: "is_active", required: false, example: "true/false" },
     ],
     brands: [
       { name: "name_bn", required: true, example: "ব্র্যান্ড নাম" },
       { name: "name_en", required: true, example: "Brand Name" },
       { name: "slug", required: false, example: "brand-slug" },
       { name: "logo_url", required: false, example: "https://..." },
       { name: "is_active", required: false, example: "true/false" },
     ],
   };
 
   const specs = columnSpecs[entityType] || [];
 
   const handleExport = () => {
     onExport();
     toast.success(
       language === "bn"
         ? "এক্সপোর্ট শুরু হয়েছে। ডাউনলোড শীঘ্রই শুরু হবে।"
         : "Export started. Download will begin shortly."
     );
   };
 
   const handleImportClick = () => {
     toast.info(
       language === "bn"
         ? "ইমপোর্ট ফিচার শীঘ্রই আসছে। বর্তমানে এক্সপোর্ট ব্যবহার করুন।"
         : "Import feature coming soon. Please use export for now."
     );
   };
 
   const entityLabels = {
     products: { bn: "পণ্য", en: "Products" },
     categories: { bn: "ক্যাটাগরি", en: "Categories" },
     brands: { bn: "ব্র্যান্ড", en: "Brands" },
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <FileSpreadsheet className="h-5 w-5" />
             {language === "bn" ? "ইমপোর্ট / এক্সপোর্ট" : "Import / Export"} - {language === "bn" ? entityLabels[entityType].bn : entityLabels[entityType].en}
           </DialogTitle>
         </DialogHeader>
 
         <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "export" | "import")}>
           <TabsList className="grid w-full grid-cols-2">
             <TabsTrigger value="export" className="flex items-center gap-2">
               <Download className="h-4 w-4" />
               {language === "bn" ? "এক্সপোর্ট" : "Export"}
             </TabsTrigger>
             <TabsTrigger value="import" className="flex items-center gap-2">
               <Upload className="h-4 w-4" />
               {language === "bn" ? "ইমপোর্ট" : "Import"}
             </TabsTrigger>
           </TabsList>
 
           <TabsContent value="export" className="space-y-4 mt-4">
             <div className="p-4 bg-muted/50 rounded-lg">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="font-medium">
                     {language === "bn" ? "এক্সপোর্ট করুন" : "Export Data"}
                   </p>
                   <p className="text-sm text-muted-foreground">
                     {language === "bn"
                       ? `মোট ${totalItems} টি রেকর্ড এক্সপোর্ট হবে`
                       : `Total ${totalItems} records will be exported`}
                   </p>
                 </div>
                 <Badge variant="outline">CSV</Badge>
               </div>
             </div>
 
             <div className="flex gap-2">
               <Button onClick={handleExport} className="flex-1">
                 <Download className="h-4 w-4 mr-2" />
                 {language === "bn" ? "CSV ডাউনলোড করুন" : "Download CSV"}
               </Button>
             </div>
 
             <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
               {language === "bn"
                 ? "এক্সপোর্ট ফাইলে সকল ফিল্ড অন্তর্ভুক্ত থাকবে।"
                 : "Export file will include all fields."}
             </div>
           </TabsContent>
 
           <TabsContent value="import" className="space-y-4 mt-4">
             <div className="p-4 border-2 border-dashed rounded-lg text-center">
               <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
               <p className="font-medium">
                 {language === "bn" ? "CSV ফাইল আপলোড করুন" : "Upload CSV File"}
               </p>
               <p className="text-sm text-muted-foreground mb-3">
                 {language === "bn"
                   ? "ফাইল এখানে টেনে আনুন বা ক্লিক করুন"
                   : "Drag and drop here or click to browse"}
               </p>
               <Button variant="outline" onClick={handleImportClick}>
                 <Upload className="h-4 w-4 mr-2" />
                 {language === "bn" ? "ফাইল নির্বাচন করুন" : "Select File"}
               </Button>
             </div>
 
             <div>
               <h4 className="font-medium mb-2 flex items-center gap-2">
                 <AlertCircle className="h-4 w-4 text-amber-500" />
                 {language === "bn" ? "প্রয়োজনীয় কলাম" : "Required Columns"}
               </h4>
               <div className="border rounded-lg overflow-hidden">
                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>{language === "bn" ? "কলাম" : "Column"}</TableHead>
                       <TableHead className="text-center">{language === "bn" ? "আবশ্যক" : "Required"}</TableHead>
                       <TableHead>{language === "bn" ? "উদাহরণ" : "Example"}</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {specs.map((spec) => (
                       <TableRow key={spec.name}>
                         <TableCell className="font-mono text-sm">{spec.name}</TableCell>
                         <TableCell className="text-center">
                           {spec.required ? (
                             <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                           ) : (
                             <X className="h-4 w-4 text-muted-foreground mx-auto" />
                           )}
                         </TableCell>
                         <TableCell className="text-sm text-muted-foreground">{spec.example}</TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </div>
             </div>
           </TabsContent>
         </Tabs>
       </DialogContent>
     </Dialog>
   );
 };