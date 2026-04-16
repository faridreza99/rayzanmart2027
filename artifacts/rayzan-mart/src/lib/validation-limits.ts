// Enterprise validation limits and constants
// Central configuration for system guardrails

export const SYSTEM_LIMITS = {
  // Discount limits
  MAX_DISCOUNT_PERCENTAGE: 80,
  WARN_DISCOUNT_PERCENTAGE: 50,
  
  // Commission limits  
  MAX_COMMISSION_PERCENTAGE: 50,
  WARN_COMMISSION_PERCENTAGE: 30,
  
  // Stock limits
  MIN_STOCK: 0,
  WARN_LOW_STOCK: 5,
  
  // Price limits
  MIN_PRICE: 1,
  
  // Coupon limits
  MAX_COUPON_DISCOUNT_PERCENTAGE: 70,
  WARN_COUPON_DISCOUNT_PERCENTAGE: 40,
} as const;

export interface ValidationResult {
  isValid: boolean;
  hasWarning: boolean;
  message?: {
    bn: string;
    en: string;
  };
  severity: "error" | "warning" | "info";
}

// Validation functions with bilingual messages
export const validateDiscountPercentage = (value: number): ValidationResult => {
  if (value > SYSTEM_LIMITS.MAX_DISCOUNT_PERCENTAGE) {
    return {
      isValid: false,
      hasWarning: false,
      severity: "error",
      message: {
        bn: `ডিসকাউন্ট ${SYSTEM_LIMITS.MAX_DISCOUNT_PERCENTAGE}% এর বেশি হতে পারবে না`,
        en: `Discount cannot exceed ${SYSTEM_LIMITS.MAX_DISCOUNT_PERCENTAGE}%`,
      },
    };
  }
  
  if (value > SYSTEM_LIMITS.WARN_DISCOUNT_PERCENTAGE) {
    return {
      isValid: true,
      hasWarning: true,
      severity: "warning",
      message: {
        bn: `উচ্চ ডিসকাউন্ট (${value}%) প্রফিট মার্জিন কমিয়ে দিতে পারে`,
        en: `High discount (${value}%) may reduce profit margin`,
      },
    };
  }
  
  return { isValid: true, hasWarning: false, severity: "info" };
};

export const validateCommissionPercentage = (value: number): ValidationResult => {
  if (value > SYSTEM_LIMITS.MAX_COMMISSION_PERCENTAGE) {
    return {
      isValid: false,
      hasWarning: false,
      severity: "error",
      message: {
        bn: `কমিশন ${SYSTEM_LIMITS.MAX_COMMISSION_PERCENTAGE}% এর বেশি হতে পারবে না`,
        en: `Commission cannot exceed ${SYSTEM_LIMITS.MAX_COMMISSION_PERCENTAGE}%`,
      },
    };
  }
  
  if (value > SYSTEM_LIMITS.WARN_COMMISSION_PERCENTAGE) {
    return {
      isValid: true,
      hasWarning: true,
      severity: "warning",
      message: {
        bn: `উচ্চ কমিশন (${value}%) অপারেশনাল খরচ বাড়াতে পারে`,
        en: `High commission (${value}%) may increase operational costs`,
      },
    };
  }
  
  return { isValid: true, hasWarning: false, severity: "info" };
};

export const validateStock = (value: number, allowNegative = false): ValidationResult => {
  if (!allowNegative && value < SYSTEM_LIMITS.MIN_STOCK) {
    return {
      isValid: false,
      hasWarning: false,
      severity: "error",
      message: {
        bn: "স্টক শূন্যের নিচে যেতে পারবে না",
        en: "Stock cannot go below zero",
      },
    };
  }
  
  if (value <= SYSTEM_LIMITS.WARN_LOW_STOCK && value >= 0) {
    return {
      isValid: true,
      hasWarning: true,
      severity: "warning",
      message: {
        bn: `কম স্টক সতর্কতা: মাত্র ${value} টি বাকি`,
        en: `Low stock warning: Only ${value} remaining`,
      },
    };
  }
  
  return { isValid: true, hasWarning: false, severity: "info" };
};

export const validatePrice = (value: number): ValidationResult => {
  if (value < SYSTEM_LIMITS.MIN_PRICE) {
    return {
      isValid: false,
      hasWarning: false,
      severity: "error",
      message: {
        bn: `মূল্য কমপক্ষে ${SYSTEM_LIMITS.MIN_PRICE} টাকা হতে হবে`,
        en: `Price must be at least ${SYSTEM_LIMITS.MIN_PRICE} Taka`,
      },
    };
  }
  
  return { isValid: true, hasWarning: false, severity: "info" };
};
