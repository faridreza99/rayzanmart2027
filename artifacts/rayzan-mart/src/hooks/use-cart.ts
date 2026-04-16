import { useState, useEffect, createContext, useContext } from "react";

export interface CartItem {
  productId: string;
  variantId?: string;
  nameEn: string;
  nameBn: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  variantName?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, variantId: string | undefined, qty: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

import { createContext as reactCreateContext, useContext as reactUseContext, useState as reactUseState, useEffect as reactUseEffect } from "react";

export const CartContext = reactCreateContext<CartContextType | null>(null);

export function useCart(): CartContextType {
  const ctx = reactUseContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

export function createCartStore() {
  const STORAGE_KEY = "rayzan_cart";

  function load(): CartItem[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    } catch {
      return [];
    }
  }

  function save(items: CartItem[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  return { load, save };
}
