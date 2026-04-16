export interface Product {
  id: string;
  name: {
    bn: string;
    en: string;
  };
  description: {
    bn: string;
    en: string;
  };
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  category: string;
  subcategory?: string;
  brand?: string;
  sku?: string;
  stock: number;
  rating: number;
  reviews: number;
  featured?: boolean;
  discount?: number;
  hasVariants?: boolean;
  variantOptions?: VariantOption[];
  variants?: ProductVariant[];
  affiliate_commission_type?: string;
  affiliate_commission_value?: number;
  cost_price?: number | null;
  is_affiliate?: boolean | null;
}

export interface VariantOption {
  name: string;
  values: string[];
}

export interface ProductVariant {
  id: string;
  name: {
    bn: string;
    en: string;
  };
  sku?: string;
  price?: number;
  stock: number;
  attributes: Record<string, string>;
  image?: string;
  cost_price?: number;
}

export interface Category {
  id: string;
  name: {
    bn: string;
    en: string;
  };
  icon: string;
  subcategories?: {
    id: string;
    name: {
      bn: string;
      en: string;
    };
  }[];
}