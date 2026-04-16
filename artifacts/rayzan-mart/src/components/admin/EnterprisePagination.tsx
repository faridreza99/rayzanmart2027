 import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
 import { useLanguage } from "@/contexts/LanguageContext";
 import { Button } from "@/components/ui/button";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 
 interface EnterprisePaginationProps {
   currentPage: number;
   totalPages: number;
   totalItems: number;
   pageSize: number;
   onPageChange: (page: number) => void;
   onPageSizeChange: (size: number) => void;
   pageSizeOptions?: number[];
 }
 
 export const EnterprisePagination = ({
   currentPage,
   totalPages,
   totalItems,
   pageSize,
   onPageChange,
   onPageSizeChange,
   pageSizeOptions = [10, 25, 50, 100],
 }: EnterprisePaginationProps) => {
   const { language } = useLanguage();
 
   const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
   const endItem = Math.min(currentPage * pageSize, totalItems);
 
   return (
     <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
       <div className="flex items-center gap-4">
         <div className="flex items-center gap-2">
           <span className="text-sm text-muted-foreground">
             {language === "bn" ? "প্রতি পৃষ্ঠায়" : "Per page"}:
           </span>
           <Select value={pageSize.toString()} onValueChange={(v) => onPageSizeChange(parseInt(v))}>
             <SelectTrigger className="w-[70px] h-8">
               <SelectValue />
             </SelectTrigger>
             <SelectContent>
               {pageSizeOptions.map((size) => (
                 <SelectItem key={size} value={size.toString()}>
                   {size}
                 </SelectItem>
               ))}
             </SelectContent>
           </Select>
         </div>
         <p className="text-sm text-muted-foreground">
           {language === "bn"
             ? `${startItem}-${endItem} এর মধ্যে ${totalItems} টি`
             : `${startItem}-${endItem} of ${totalItems}`}
         </p>
       </div>
 
       <div className="flex items-center gap-1">
         <Button
           variant="outline"
           size="icon"
           className="h-8 w-8"
           disabled={currentPage === 1}
           onClick={() => onPageChange(1)}
         >
           <ChevronsLeft className="h-4 w-4" />
         </Button>
         <Button
           variant="outline"
           size="icon"
           className="h-8 w-8"
           disabled={currentPage === 1}
           onClick={() => onPageChange(currentPage - 1)}
         >
           <ChevronLeft className="h-4 w-4" />
         </Button>
 
         <div className="flex items-center gap-1 px-2">
           {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
             let pageNum: number;
             if (totalPages <= 5) {
               pageNum = i + 1;
             } else if (currentPage <= 3) {
               pageNum = i + 1;
             } else if (currentPage >= totalPages - 2) {
               pageNum = totalPages - 4 + i;
             } else {
               pageNum = currentPage - 2 + i;
             }
 
             return (
               <Button
                 key={pageNum}
                 variant={currentPage === pageNum ? "default" : "outline"}
                 size="sm"
                 className="h-8 w-8 p-0"
                 onClick={() => onPageChange(pageNum)}
               >
                 {pageNum}
               </Button>
             );
           })}
         </div>
 
         <Button
           variant="outline"
           size="icon"
           className="h-8 w-8"
           disabled={currentPage === totalPages || totalPages === 0}
           onClick={() => onPageChange(currentPage + 1)}
         >
           <ChevronRight className="h-4 w-4" />
         </Button>
         <Button
           variant="outline"
           size="icon"
           className="h-8 w-8"
           disabled={currentPage === totalPages || totalPages === 0}
           onClick={() => onPageChange(totalPages)}
         >
           <ChevronsRight className="h-4 w-4" />
         </Button>
       </div>
     </div>
   );
 };