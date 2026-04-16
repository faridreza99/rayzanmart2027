import { Link } from "react-router-dom";
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";

const CartPage = () => {
  const { language, t } = useLanguage();
  const { items, removeFromCart, updateQuantity, getTotal, clearCart } = useCart();

  const deliveryCharge = 60;
  const total = getTotal() + (items.length > 0 ? deliveryCharge : 0);

  if (items.length === 0) {
    return (
      <MainLayout>
        <div className="container py-12 text-center">
          <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h1 className="mb-2 text-2xl font-bold">{t("cartEmpty")}</h1>
          <p className="mb-6 text-muted-foreground">
            {language === "bn"
              ? "আপনার কার্টে কোনো পণ্য নেই"
              : "You have no items in your cart"}
          </p>
          <Link to="/products">
            <Button>{t("continueShopping")}</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-6">
        <h1 className="mb-6 text-2xl font-bold">{t("cart")}</h1>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="rounded-xl bg-card shadow-sm">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex gap-4 p-4 ${index !== items.length - 1 ? "border-b" : ""
                    }`}
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name[language]}
                    className="h-24 w-24 rounded-lg object-cover"
                  />
                  <div className="flex flex-1 flex-col">
                    <Link
                      to={`/product/${item.product.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {item.product.name[language]}
                    </Link>
                    {item.variant && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {Object.values(item.variant.attributes).join(" / ")}
                      </p>
                    )}
                    <p className="mt-1 text-lg font-bold text-primary">
                      {t("currency")}{(item.variant?.price || item.product.price).toLocaleString()}
                    </p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-between">
              <Link to="/products">
                <Button variant="outline">{t("continueShopping")}</Button>
              </Link>
              <Button variant="destructive" onClick={clearCart}>
                {language === "bn" ? "কার্ট খালি করুন" : "Clear Cart"}
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="rounded-xl bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">
                {language === "bn" ? "অর্ডার সামারি" : "Order Summary"}
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {language === "bn" ? "সাবটোটাল" : "Subtotal"}
                  </span>
                  <span>{t("currency")}{getTotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("deliveryCharge")}</span>
                  <span>{t("currency")}{deliveryCharge}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>{t("cartTotal")}</span>
                    <span className="text-primary">{t("currency")}{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <Link to="/checkout" className="mt-6 block">
                <Button className="w-full btn-bounce" size="lg">
                  {t("checkout")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CartPage;