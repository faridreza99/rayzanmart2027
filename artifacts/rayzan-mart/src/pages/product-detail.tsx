import { useState } from "react";
import { useParams, Link } from "wouter";
import { Star, ShoppingCart, Heart, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetProduct, useAddToWishlist } from "@workspace/api-client-react";
import { useCart } from "@/hooks/use-cart-context";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export default function ProductDetailPage() {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>();
  const [selectedImage, setSelectedImage] = useState(0);
  const { addItem } = useCart();
  const { user } = useAuth();
  const addToWishlist = useAddToWishlist();

  const { data: product, isLoading } = useGetProduct(id!, { query: { enabled: !!id } });

  if (isLoading) return <div className="max-w-7xl mx-auto px-4 py-16 text-center"><div className="animate-spin w-8 h-8 border-4 border-secondary border-t-transparent rounded-full mx-auto"></div></div>;
  if (!product) return <div className="max-w-7xl mx-auto px-4 py-16 text-center"><p className="text-muted-foreground">Product not found</p><Link href="/products"><Button variant="outline" className="mt-4">Back to Products</Button></Link></div>;

  const images = [product.imageUrl, ...(product.galleryImages ?? [])].filter(Boolean) as string[];
  const selectedVariant = product.variants?.find(v => v.id === selectedVariantId);
  const price = selectedVariant?.price ?? product.price;
  const stock = selectedVariant?.stock ?? product.stock;

  function handleAddToCart() {
    addItem({
      productId: product!.id,
      variantId: selectedVariantId,
      nameEn: product!.nameEn,
      nameBn: product!.nameBn,
      price: Number(price),
      quantity,
      imageUrl: product!.imageUrl,
      variantName: selectedVariant?.nameEn,
    });
    toast.success(`${product!.nameEn} added to cart`);
  }

  function handleWishlist() {
    if (!user) { toast.error("Please login to save to wishlist"); return; }
    addToWishlist.mutate({ data: { productId: product!.id } }, {
      onSuccess: () => toast.success("Added to wishlist"),
      onError: () => toast.error("Failed to add to wishlist"),
    });
  }

  const discount = product.originalPrice && Number(product.originalPrice) > Number(product.price)
    ? Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-sm text-muted-foreground mb-4">
        <Link href="/" className="hover:text-foreground">Home</Link> &gt; <Link href="/products" className="hover:text-foreground">Products</Link> &gt; {product.nameEn}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Images */}
        <div>
          <div className="bg-muted rounded-xl overflow-hidden h-96 mb-3">
            {images.length > 0 ? (
              <img src={images[selectedImage]} alt={product.nameEn} className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">No image</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition ${i === selectedImage ? 'border-secondary' : 'border-transparent'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-sm text-muted-foreground mb-1">{product.nameBn}</p>
          <h1 className="text-2xl font-bold text-foreground mb-3">{product.nameEn}</h1>
          
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < Math.round(Number(product.rating)) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">({product.reviewsCount} reviews)</span>
          </div>

          <div className="mb-4">
            <span className="text-3xl font-bold text-primary">৳{Number(price).toLocaleString()}</span>
            {product.originalPrice && Number(product.originalPrice) > Number(price) && (
              <>
                <span className="text-lg text-muted-foreground line-through ml-3">৳{Number(product.originalPrice).toLocaleString()}</span>
                {discount > 0 && <span className="ml-2 bg-primary text-white text-sm px-2 py-0.5 rounded-full">{discount}% OFF</span>}
              </>
            )}
          </div>

          <p className={`text-sm mb-4 font-medium ${(stock ?? 0) > 0 ? 'text-secondary' : 'text-destructive'}`}>
            {(stock ?? 0) > 0 ? `In Stock (${stock} available)` : 'Out of Stock'}
          </p>

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-foreground mb-2">Select Variant:</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map(v => (
                  <button key={v.id} onClick={() => setSelectedVariantId(v.id)}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition ${selectedVariantId === v.id ? 'border-secondary bg-secondary text-white' : 'border-border hover:border-secondary'}`}>
                    {v.nameEn}
                    {v.price && <span className="ml-1 text-xs">৳{Number(v.price).toLocaleString()}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm font-medium">Quantity:</span>
            <div className="flex items-center border border-border rounded-lg">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-2 hover:bg-muted"><Minus className="w-4 h-4" /></button>
              <span className="w-12 text-center text-sm font-medium">{quantity}</span>
              <button onClick={() => setQuantity(q => Math.min(stock ?? 99, q + 1))} className="p-2 hover:bg-muted"><Plus className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button className="flex-1 bg-primary hover:bg-red-700 text-white" onClick={handleAddToCart} disabled={(stock ?? 0) === 0}>
              <ShoppingCart className="w-5 h-5 mr-2" />Add to Cart
            </Button>
            <Button variant="outline" onClick={handleWishlist} className="border-secondary text-secondary hover:bg-secondary hover:text-white">
              <Heart className="w-5 h-5" />
            </Button>
          </div>

          {product.descriptionEn && (
            <div className="mt-6 border-t border-border pt-4">
              <h3 className="font-semibold text-foreground mb-2">Description</h3>
              <p className="text-sm text-muted-foreground">{product.descriptionEn}</p>
              {product.descriptionBn && <p className="text-sm text-muted-foreground mt-2">{product.descriptionBn}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      {product.reviews && product.reviews.length > 0 && (
        <div className="mt-12 border-t border-border pt-8">
          <h2 className="text-xl font-bold mb-6">Customer Reviews ({product.reviews.length})</h2>
          <div className="space-y-4">
            {product.reviews.map(review => (
              <div key={review.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                  ))}
                  <span className="text-sm text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                {review.comment && <p className="text-sm text-foreground">{review.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
