/**
 * Centralized React-Query keys to prevent invalidation typos.
 */
export const qk = {
  products: ["products"] as const,
  productsAll: ["products-all"] as const,
  product: (id: string) => ["products", id] as const,
  categories: ["categories"] as const,
  customers: ["customers"] as const,
  suppliers: ["suppliers"] as const,
  supplierReturns: ["supplier_returns"] as const,
  sales: ["sales"] as const,
  saleItems: (saleId: string) => ["sale_items", saleId] as const,
  duePayments: (saleId: string) => ["due-payments", saleId] as const,
  returns: ["returns"] as const,
  investmentSectors: ["investment-sectors"] as const,
  investmentEntries: ["investment-entries"] as const,
  investmentIncomes: ["investment-incomes"] as const,
  shopSettings: ["shop_settings"] as const,
  activityLogs: ["activity_logs"] as const,
  userRoles: ["user_roles"] as const,
  profiles: ["profiles"] as const,
};
