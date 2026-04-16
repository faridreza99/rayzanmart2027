import { useLocation } from "wouter";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetWishlist, useRemoveFromWishlist } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart-context";
import { Link } from "wouter";
import { toast } from "sonner";
import ProductCard from "@/components/ProductCard";

export default function WishlistPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  if (!user) { setLocation("/login"); return null; }

  const { data: items, refetch } = useGetWishlist({ query: {} });
  const removeFromWishlist = useRemoveFromWishlist();

  if (!items || (items as any[]).length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Your wishlist is empty</h2>
        <p className="text-muted-foreground mb-8">পছন্দের পণ্য সংরক্ষণ করুন</p>
        <Link href="/products"><Button className="bg-primary hover:bg-red-700 text-white">Browse Products</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-8">My Wishlist</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(items as any[]).map(item => item.product && (
          <ProductCard key={item.id} product={item.product} />
        ))}
      </div>
    </div>
  );
}
