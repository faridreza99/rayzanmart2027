import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-secondary text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <span className="text-2xl font-bold">Rayzan<span className="text-primary">Mart</span></span>
            <p className="mt-3 text-sm text-white/70">
              Bangladesh's trusted online marketplace. Quality products, fast delivery, earn with affiliates.
            </p>
            <p className="mt-2 text-xs text-white/50">রাইজান মার্ট — আপনার বিশ্বস্ত অনলাইন শপ</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide">Shop</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/products" className="hover:text-white">All Products</Link></li>
              <li><Link href="/products?featured=true" className="hover:text-white">Featured</Link></li>
              <li><Link href="/orders" className="hover:text-white">My Orders</Link></li>
              <li><Link href="/wishlist" className="hover:text-white">Wishlist</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide">Earn</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/affiliate" className="hover:text-white">Affiliate Program</Link></li>
              <li><Link href="/affiliate/dashboard" className="hover:text-white">Dashboard</Link></li>
              <li><Link href="/loyalty" className="hover:text-white">Loyalty Points</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide">Account</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/login" className="hover:text-white">Login</Link></li>
              <li><Link href="/register" className="hover:text-white">Register</Link></li>
              <li><Link href="/profile" className="hover:text-white">Profile</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 mt-8 pt-6 text-center text-sm text-white/50">
          <p>2024 RayzanMart. All rights reserved. Made with love in Bangladesh.</p>
        </div>
      </div>
    </footer>
  );
}
