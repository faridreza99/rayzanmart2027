export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  items: {
    productId: string;
    productName: { bn: string; en: string };
    quantity: number;
    price: number;
  }[];
  total: number;
  status: OrderStatus;
  paymentMethod: "cod" | "online";
  shippingAddress: {
    address: string;
    city: string;
    district: string;
    phone: string;
  };
  deliveryType: "inside" | "outside";
  deliveryCharge: number;
  createdAt: string;
  updatedAt: string;
  affiliateId?: string;
  affiliateCommission?: number;
  trackingNumber?: string;
  courier?: string;
}

export const demoOrders: Order[] = [
  {
    id: "ORD-001",
    customerId: "1",
    customerName: "রহিম উদ্দিন",
    items: [
      {
        productId: "1",
        productName: { bn: "স্যামসাং গ্যালাক্সি A54", en: "Samsung Galaxy A54" },
        quantity: 1,
        price: 42999,
      },
    ],
    total: 43059,
    status: "delivered",
    paymentMethod: "cod",
    shippingAddress: {
      address: "১২৩ মিরপুর রোড",
      city: "ঢাকা",
      district: "ঢাকা",
      phone: "01712345678",
    },
    deliveryType: "inside",
    deliveryCharge: 60,
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-18T14:00:00Z",
    affiliateId: "2",
    affiliateCommission: 430,
    trackingNumber: "PTH123456",
    courier: "Pathao",
  },
  {
    id: "ORD-002",
    customerId: "1",
    customerName: "রহিম উদ্দিন",
    items: [
      {
        productId: "4",
        productName: { bn: "পুরুষদের পোলো শার্ট", en: "Men's Polo Shirt" },
        quantity: 2,
        price: 899,
      },
      {
        productId: "6",
        productName: { bn: "ওয়্যারলেস ইয়ারবাডস", en: "Wireless Earbuds" },
        quantity: 1,
        price: 2499,
      },
    ],
    total: 4417,
    status: "shipped",
    paymentMethod: "cod",
    shippingAddress: {
      address: "১২৩ মিরপুর রোড",
      city: "ঢাকা",
      district: "ঢাকা",
      phone: "01712345678",
    },
    deliveryType: "inside",
    deliveryCharge: 60,
    createdAt: "2024-01-20T15:45:00Z",
    updatedAt: "2024-01-22T09:30:00Z",
    trackingNumber: "STD789012",
    courier: "Steadfast",
  },
  {
    id: "ORD-003",
    customerId: "4",
    customerName: "আমিনা খাতুন",
    items: [
      {
        productId: "5",
        productName: { bn: "মহিলাদের শাড়ি", en: "Women's Saree" },
        quantity: 1,
        price: 4599,
      },
    ],
    total: 4719,
    status: "processing",
    paymentMethod: "online",
    shippingAddress: {
      address: "৪৫ নিউমার্কেট",
      city: "চট্টগ্রাম",
      district: "চট্টগ্রাম",
      phone: "01898765432",
    },
    deliveryType: "outside",
    deliveryCharge: 120,
    createdAt: "2024-01-25T11:00:00Z",
    updatedAt: "2024-01-25T11:00:00Z",
    affiliateId: "2",
    affiliateCommission: 460,
  },
  {
    id: "ORD-004",
    customerId: "5",
    customerName: "জাহিদ হাসান",
    items: [
      {
        productId: "3",
        productName: { bn: "এইচপি প্যাভিলিয়ন ল্যাপটপ", en: "HP Pavilion Laptop" },
        quantity: 1,
        price: 72999,
      },
    ],
    total: 73059,
    status: "pending",
    paymentMethod: "cod",
    shippingAddress: {
      address: "৭৮ গুলশান এভিনিউ",
      city: "ঢাকা",
      district: "ঢাকা",
      phone: "01567890123",
    },
    deliveryType: "inside",
    deliveryCharge: 60,
    createdAt: "2024-01-26T16:20:00Z",
    updatedAt: "2024-01-26T16:20:00Z",
  },
];

export const getOrdersByCustomer = (customerId: string): Order[] => {
  return demoOrders.filter((o) => o.customerId === customerId);
};

export const getOrdersByAffiliate = (affiliateId: string): Order[] => {
  return demoOrders.filter((o) => o.affiliateId === affiliateId);
};