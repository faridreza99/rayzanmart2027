import { Product } from "@/data/products";
import { CommissionRule } from "@/hooks/useAdminSettings";

export interface ResolvedCommission {
    rate: number;
    type: "percentage" | "fixed";
    amount: number;
    ruleType: string;
}

/**
 * Resolves the effective commission for a product based on active rules.
 * Priority:
 * 1. Product Rule (commission_rules table)
 * 2. Category Rule (commission_rules table)
 * 3. Direct Product Commission (product.affiliate_commission_value)
 * 4. Global Rule (commission_rules table)
 * 5. Affiliate Base Rate (fallback)
 */
export const resolveCommission = (
    product: Product,
    rules: CommissionRule[],
    affiliateRate: number = 5
): ResolvedCommission => {
    const activeRules = rules.filter((r) => r.is_active);
    const productId = product.id.toLowerCase().trim();
    const categoryId = product.category?.toLowerCase().trim();

    // 1. Check for Product Specific Rule
    const productRule = activeRules.find(
        (r) =>
            r.rule_type === "product" &&
            r.product_id?.toLowerCase().trim() === productId
    );
    if (productRule) {
        return {
            rate: productRule.commission_value,
            type: productRule.commission_type,
            amount: calculateAmount(product.price, productRule.commission_value, productRule.commission_type),
            ruleType: "product-rule",
        };
    }

    // 2. Check for Category Rule
    if (categoryId) {
        const categoryRule = activeRules.find(
            (r) =>
                r.rule_type === "category" &&
                r.category_id?.toLowerCase().trim() === categoryId
        );
        if (categoryRule) {
            return {
                rate: categoryRule.commission_value,
                type: categoryRule.commission_type,
                amount: calculateAmount(product.price, categoryRule.commission_value, categoryRule.commission_type),
                ruleType: "category-rule",
            };
        }
    }

    // 3. Direct Product Commission (Legacy/Fallback preserved in product metadata)
    if (product.affiliate_commission_value && product.affiliate_commission_value > 0) {
        return {
            rate: product.affiliate_commission_value,
            type: (product.affiliate_commission_type as any) || "percentage",
            amount: calculateAmount(
                product.price,
                product.affiliate_commission_value,
                (product.affiliate_commission_type as any) || "percentage"
            ),
            ruleType: "direct-product",
        };
    }

    // 4. Check for Global Rule
    const globalRule = activeRules.find((r) => r.rule_type === "global");
    if (globalRule) {
        return {
            rate: globalRule.commission_value,
            type: globalRule.commission_type,
            amount: calculateAmount(product.price, globalRule.commission_value, globalRule.commission_type),
            ruleType: "global-rule",
        };
    }

    // 5. Final Fallback to Affiliate Rate
    return {
        rate: affiliateRate,
        type: "percentage",
        amount: (product.price * affiliateRate) / 100,
        ruleType: "affiliate-rate",
    };
};

const calculateAmount = (price: number, rate: number, type: "percentage" | "fixed"): number => {
    return type === "fixed" ? rate : (price * rate) / 100;
};
