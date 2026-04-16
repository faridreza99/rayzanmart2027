import { Link, useLocation } from "wouter";
import { ShoppingCart, User, Heart, Menu, X, Search, LogOut, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();
  const { user, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) setLocation(`/products?search=${encodeURIComponent(search.trim())}`);
  }

  return (
    <header className="sticky top-0 z-50 bg-secondary shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link href="/" className="flex-shrink-0">
          <span className="text-2xl font-bold text-white tracking-tight">
            Rayzan<span className="text-primary">Mart</span>
          </span>
        </Link>

        <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:flex">
          <div className="flex w-full">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="flex-1 px-4 py-2 rounded-l-lg border-0 focus:outline-none text-foreground bg-white text-sm"
            />
            <button type="submit" className="bg-primary text-white px-4 py-2 rounded-r-lg hover:bg-red-700 transition">
              <Search className="w-4 h-4" />
            </button>
          </div>
        </form>

        <nav className="hidden md:flex items-center gap-2 ml-auto">
          <Link href="/products">
            <Button variant="ghost" className="text-white hover:bg-white/10 text-sm">Products</Button>
          </Link>
          <Link href="/affiliate">
            <Button variant="ghost" className="text-white hover:bg-white/10 text-sm">Earn</Button>
          </Link>

          <Link href="/cart">
            <Button variant="ghost" className="text-white hover:bg-white/10 relative">
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>

          {user ? (
            <>
              <Link href="/wishlist">
                <Button variant="ghost" className="text-white hover:bg-white/10"><Heart className="w-5 h-5" /></Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-white hover:bg-white/10 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    <span className="text-sm hidden lg:inline">{user.profile?.name ?? user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild><Link href="/profile">Profile</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/orders">My Orders</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/loyalty">Loyalty Points</Link></DropdownMenuItem>
                  {(user.roles?.includes("affiliate")) && (
                    <DropdownMenuItem asChild><Link href="/affiliate/dashboard">Affiliate Dashboard</Link></DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center gap-2">
                          <LayoutDashboard className="w-4 h-4" />Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive flex items-center gap-2">
                    <LogOut className="w-4 h-4" />Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link href="/login">
              <Button className="bg-primary hover:bg-red-700 text-white text-sm">Login</Button>
            </Link>
          )}
        </nav>

        <Button variant="ghost" className="md:hidden text-white ml-auto" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-secondary border-t border-white/10 px-4 py-4 space-y-3">
          <form onSubmit={handleSearch} className="flex">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="flex-1 px-3 py-2 rounded-l-lg text-foreground bg-white text-sm focus:outline-none"
            />
            <button type="submit" className="bg-primary text-white px-3 rounded-r-lg">
              <Search className="w-4 h-4" />
            </button>
          </form>
          <Link href="/products" onClick={() => setOpen(false)}>
            <Button variant="ghost" className="w-full text-left text-white">Products</Button>
          </Link>
          <Link href="/affiliate" onClick={() => setOpen(false)}>
            <Button variant="ghost" className="w-full text-left text-white">Earn with Us</Button>
          </Link>
          <Link href="/cart" onClick={() => setOpen(false)}>
            <Button variant="ghost" className="w-full text-left text-white">Cart ({itemCount})</Button>
          </Link>
          {user ? (
            <>
              <Link href="/profile" onClick={() => setOpen(false)}>
                <Button variant="ghost" className="w-full text-left text-white">Profile</Button>
              </Link>
              <Link href="/orders" onClick={() => setOpen(false)}>
                <Button variant="ghost" className="w-full text-left text-white">My Orders</Button>
              </Link>
              {isAdmin && (
                <Link href="/admin" onClick={() => setOpen(false)}>
                  <Button variant="ghost" className="w-full text-left text-white">Admin Panel</Button>
                </Link>
              )}
              <Button variant="ghost" className="w-full text-left text-destructive" onClick={() => { logout(); setOpen(false); }}>
                Logout
              </Button>
            </>
          ) : (
            <Link href="/login" onClick={() => setOpen(false)}>
              <Button className="w-full bg-primary text-white">Login</Button>
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
