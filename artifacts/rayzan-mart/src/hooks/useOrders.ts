import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "returned" | "cancelled";

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  shipping_address: string;
  city: string;
  district: string;
  subtotal: number;
  delivery_charge: number;
  discount_amount: number;
  total: number;
  status: OrderStatus;
  payment_method: "cod" | "online";
  delivery_type: "inside_city" | "outside_city";
  actual_delivery_cost?: number;
  tracking_number: string | null;
  courier: string | null;
  affiliate_id: string | null;
  affiliate_referral_code?: string | null;
  affiliates?: { referral_code: string } | null;
  coupon_code: string | null;
  notes: string | null;
  delivery_fee_transaction_id?: string | null;
  points_earned?: number;
  points_redeemed?: number;
  points_discount_amount?: number;
  created_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id?: string | null;
  variant_attributes?: any | null;
  product_name_bn: string;
  product_name_en: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export const useMyOrders = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["orders", "my", user?.id],
    queryFn: async () => {
      const { data, error } = await apiClient
        .from("orders")
        .select("*, order_items(*)")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return ((data as any[]) || []).map((order: any) => ({
        ...order,
        affiliates: order.affiliate_referral_code ? { referral_code: order.affiliate_referral_code } : null,
      })) as Order[];
    },
    enabled: !!user,
  });
};

export const useAllOrders = () => {
  return useQuery({
    queryKey: ["orders", "all"],
    queryFn: async () => {
      const { data, error } = await apiClient
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return ((data as any[]) || []).map((order: any) => ({
        ...order,
        affiliates: order.affiliate_referral_code ? { referral_code: order.affiliate_referral_code } : null,
      })) as Order[];
    },
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      order,
      items,
    }: {
      order: {
        customer_name: string;
        customer_phone: string;
        customer_email?: string | null;
        shipping_address: string;
        city: string;
        district: string;
        subtotal: number;
        delivery_charge?: number;
        discount_amount?: number;
        total: number;
        status?: OrderStatus;
        payment_method?: "cod" | "online";
        delivery_type?: "inside_city" | "outside_city";
        tracking_number?: string | null;
        courier?: string | null;
        affiliate_id?: string | null;
        affiliate_referral_code?: string | null;
        coupon_code?: string | null;
        notes?: string | null;
        delivery_fee_transaction_id?: string | null;
        points_redeemed?: number;
        points_discount_amount?: number;
        user_id?: string | null;
      };
      items: Omit<OrderItem, "id" | "order_id">[];
    }) => {
      const { data: orderData, error: orderError } = await apiClient
        .from("orders")
        .insert({
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          customer_email: order.customer_email || null,
          shipping_address: order.shipping_address,
          city: order.city,
          district: order.district,
          subtotal: order.subtotal,
          delivery_charge: order.delivery_charge || 0,
          discount_amount: order.discount_amount || 0,
          total: order.total,
          status: order.status || "pending",
          payment_method: order.payment_method || "cod",
          delivery_type: order.delivery_type || "inside_city",
          tracking_number: order.tracking_number || null,
          courier: order.courier || null,
          affiliate_id: order.affiliate_id || null,
          affiliate_referral_code: order.affiliate_referral_code || null,
          coupon_code: order.coupon_code || null,
          notes: order.notes || null,
          delivery_fee_transaction_id: order.delivery_fee_transaction_id || null,
          user_id: order.user_id || user?.id || null,
          order_number: "",
          points_redeemed: order.points_redeemed || 0,
          points_discount_amount: order.points_discount_amount || 0,
        })
        .select("*")
        .maybeSingle();

      if (orderError) throw orderError;
      if (!orderData) throw new Error("Failed to retrieve order data after insert.");

      const orderItems = items.map((item) => ({
        ...item,
        order_id: (orderData as any).id,
      }));

      const { error: itemsError } = await apiClient
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return orderData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      // Invalidate affiliate commission and wallet queries so the dashboard
      // reflects the newly created commission immediately after order placement.
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
      queryClient.invalidateQueries({ queryKey: ["wallet_balance"] });
      queryClient.invalidateQueries({ queryKey: ["affiliate"] });
    },
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      status,
      trackingNumber,
      courier,
    }: {
      orderId: string;
      status: OrderStatus;
      trackingNumber?: string;
      courier?: string;
    }) => {
      if (status === "delivered") {
        const token = localStorage.getItem("rm_auth_token");
        const res = await fetch("/api/auth/order-delivered", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ order_id: orderId, tracking_number: trackingNumber, courier }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to update order status");
        }
        return;
      }

      const updates: Record<string, any> = { status };
      if (trackingNumber) updates.tracking_number = trackingNumber;
      if (courier) updates.courier = courier;

      const { error } = await apiClient
        .from("orders")
        .update(updates)
        .eq("id", orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

export const useUpdateOrderDeliveryCost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      actual_delivery_cost,
    }: {
      orderId: string;
      actual_delivery_cost: number;
    }) => {
      const { error } = await apiClient
        .from("orders")
        .update({ actual_delivery_cost })
        .eq("id", orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

export const useDeleteOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await apiClient
        .from("orders")
        .delete()
        .eq("id", orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};
