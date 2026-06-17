import { z } from "zod";

// Currency: non-negative, up to 2 decimals
const currency = z
  .number({ invalid_type_error: "একটি বৈধ সংখ্যা দিন" })
  .nonnegative("মান ০ বা তার বেশি হতে হবে")
  .finite();

const phone = z
  .string()
  .trim()
  .regex(/^[0-9+\-\s]{6,20}$/, "বৈধ ফোন নম্বর দিন")
  .or(z.literal(""));

export const imeiSchema = z
  .string()
  .trim()
  .regex(/^\d{15}$/, "IMEI অবশ্যই ১৫ ডিজিটের হতে হবে");

export const productSchema = z.object({
  name: z.string().trim().min(1, "পণ্যের নাম দিন").max(200),
  sku: z.string().trim().max(100).optional().or(z.literal("")),
  brand: z.string().trim().max(100).optional().or(z.literal("")),
  model: z.string().trim().max(100).optional().or(z.literal("")),
  imei: imeiSchema.optional().or(z.literal("")),
  barcode: z.string().trim().max(100).optional().or(z.literal("")),
  price: currency,
  cost: currency,
  stock_quantity: z.number().int().nonnegative("স্টক ০ বা তার বেশি হতে হবে"),
  category_id: z.string().uuid().optional().nullable(),
  supplier_id: z.string().uuid().optional().nullable(),
  condition: z.string().max(50).optional().nullable(),
});
export type ProductInput = z.infer<typeof productSchema>;

export const customerSchema = z.object({
  name: z.string().trim().min(1, "নাম দিন").max(150),
  phone: phone,
  email: z.string().trim().email("বৈধ ইমেইল দিন").max(255).or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
});

export const supplierSchema = z.object({
  name: z.string().trim().min(1, "সাপ্লায়্যারের নাম দিন").max(150),
  phone: phone,
  email: z.string().trim().email("বৈধ ইমেইল দিন").max(255).or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
});

export const investmentEntrySchema = z.object({
  sector_id: z.string().uuid("খাত নির্বাচন করুন"),
  type: z.enum(["deposit", "withdrawal"], { required_error: "ধরন নির্বাচন করুন" }),
  amount: currency.refine((n) => n > 0, "পরিমাণ ০ এর বেশি হতে হবে"),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  entry_date: z.string().optional(),
});

export const duePaymentSchema = (maxDue: number) =>
  z.object({
    amount: currency
      .refine((n) => n > 0, "পরিমাণ ০ এর বেশি হতে হবে")
      .refine((n) => n <= maxDue, `বাকির চেয়ে বেশি (৳${maxDue}) আদায় করা যাবে না`),
    payment_method: z.enum(["cash", "card", "mobile"]),
    notes: z.string().trim().max(500).optional().or(z.literal("")),
  });

export const cartItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().positive("পরিমাণ ০ এর বেশি হতে হবে"),
  unit_price: currency,
  total_price: currency,
});

export const saleSchema = z.object({
  customer_id: z.string().uuid().nullable(),
  total_amount: currency.refine((n) => n > 0, "মোট মূল্য ০ এর বেশি হতে হবে"),
  payment_method: z.string().min(1),
  paid_amount: currency,
  due_amount: currency,
  items: z.array(cartItemSchema).min(1, "কার্টে অন্তত একটি পণ্য থাকতে হবে"),
});
