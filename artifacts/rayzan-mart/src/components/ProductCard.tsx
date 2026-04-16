import { Link } from "wouter";
import { ShoppingCart, Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart-context";
import { toast } from "sonner";

interface Product {
  id: string;
  nameBn: string;
  nameEn: string;
  price: number;
  originalPrice?: number | null;
  imageUrl?: string | null;
  rating: number;
  reviewsCount: number;
  discountPercent?: number;
  stock: number;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : (product.discountPercent ?? 0);

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      nameEn: product.nameEn,
      nameBn: product.nameBn,
      price: product.price,
      quantity: 1,
      imageUrl: product.imageUrl,
    });
    toast.success(`${product.nameEn} added to cart`);
  }

  return (
    <Link href={`/product/${product.id}`}>
      <div className="bg-card rounded-xl overflow-hidden border border-border hover:shadow-lg transition-shadow group cursor-pointer">
        <div className="relative overflow-hidden bg-muted h-48">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.nameEn} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <span className="text-muted-foreground text-sm">No image</span>
            </div>
          )}
          {discount > 0 && (
            <span className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded-full font-semibold">
              -{discount}%
            </span>
          )}
          {product.stock === 0 && (
            <span className="absolute top-2 right-2 bg-gray-500 text-white text-xs px-2 py-1 rounded-full">
              Out of Stock
            </span>
          )}
        </div>
        <div className="p-4">
          <p className="text-xs text-muted-foreground mb-0.5">{product.nameBn}</p>
          <h3 className="font-semibold text-sm text-foreground line-clamp-2 mb-2">{product.nameEn}</h3>
          
          <div className="flex items-center gap-1 mb-3">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-muted-foreground">{product.rating.toFixed(1)} ({product.reviewsCount})</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-primary">৳{product.price.toLocaleString()}</span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-muted-foreground line-through ml-2">৳{product.originalPrice.toLocaleString()}</span>
              )}
            </div>
            <Button
              size="sm"
              className="bg-secondary hover:bg-green-700 text-white"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              <ShoppingCart className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
