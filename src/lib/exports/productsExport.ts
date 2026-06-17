import * as XLSX from "xlsx";
import { toast } from "sonner";
import { toUserMessage } from "@/lib/errors";

type ProductRow = Record<string, any>;

export function exportProductsToExcel(products: ProductRow[] | undefined | null) {
  try {
    if (!products || products.length === 0) {
      toast.error("কোনো প্রোডাক্ট নেই ডাউনলোড করার জন্য");
      return;
    }

    const excelData = products.map((product, index) => ({
      "ক্রমিক": index + 1,
      "প্রোডাক্ট নাম": product.name,
      "ব্র্যান্ড": product.brand || "",
      "মডেল": product.model || "",
      IMEI: product.imei || "",
      SKU: product.sku || "",
      "বারকোড": product.barcode || "",
      "অবস্থা": product.condition === "new" ? "নতুন" : "ব্যবহৃত",
      "ক্যাটাগরি": product.categories?.name || "",
      "ক্রয় মূল্য (৳)": product.cost || 0,
      "বিক্রয় মূল্য (৳)": product.price || 0,
      "স্টক": product.stock_quantity || 0,
      RAM: product.ram || "",
      Storage: product.storage || "",
      Battery: product.battery || "",
      "সাপ্লায়ার নাম": product.supplier_name || "",
      "সাপ্লায়ার মোবাইল": product.supplier_mobile || "",
      "সাপ্লায়ার NID": product.supplier_nid || "",
      "ওয়ারেন্টি স্ট্যাটাস":
        product.warranty_status === "active"
          ? "সক্রিয়"
          : product.warranty_status === "expired"
          ? "মেয়াদোত্তীর্ণ"
          : "নেই",
      "ওয়ারেন্টি মেয়াদ": product.warranty_expiry_date || "",
      "যুক্ত হয়েছে": product.created_at
        ? new Date(product.created_at).toLocaleDateString("bn-BD")
        : "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

    const colWidths = Object.keys(excelData[0] || {}).map((key) => ({
      wch: Math.max(key.length + 2, 15),
    }));
    worksheet["!cols"] = colWidths;

    const fileName = `Apple_Store_Products_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    toast.success(`${products.length}টি প্রোডাক্ট Excel এ ডাউনলোড হয়েছে`);
  } catch (err) {
    toast.error(toUserMessage(err, "Excel ডাউনলোড ব্যর্থ"));
  }
}

export function exportProductsToPDF(products: ProductRow[] | undefined | null) {
  try {
    if (!products || products.length === 0) {
      toast.error("কোনো প্রোডাক্ট নেই ডাউনলোড করার জন্য");
      return;
    }

    const totalValue = products.reduce(
      (sum, p) => sum + (Number(p.price) || 0) * (Number(p.stock_quantity) || 0),
      0
    );
    const totalCost = products.reduce(
      (sum, p) => sum + (Number(p.cost) || 0) * (Number(p.stock_quantity) || 0),
      0
    );
    const inStock = products.filter((p) => (Number(p.stock_quantity) || 0) > 0).length;
    const outOfStock = products.filter((p) => (Number(p.stock_quantity) || 0) <= 0).length;

    const printContent = `<!DOCTYPE html><html><head>
<title>MOBILE GALARY - প্রোডাক্ট তালিকা</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; font-size: 11px; }
.header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px; }
.header h1 { font-size: 24px; color: #1a1a1a; }
.header p { color: #666; margin-top: 5px; }
.summary { display: flex; justify-content: space-around; margin-bottom: 20px; background: #f5f5f5; padding: 15px; border-radius: 8px; }
.summary-item { text-align: center; }
.summary-item .value { font-size: 18px; font-weight: bold; color: #0066cc; }
.summary-item .label { font-size: 10px; color: #666; }
table { width: 100%; border-collapse: collapse; margin-top: 10px; }
th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
th { background: #0066cc; color: white; font-weight: 600; }
tr:nth-child(even) { background: #f9f9f9; }
.text-right { text-align: right; }
.text-center { text-align: center; }
.stock-out { background: #ffe6e6 !important; color: #cc0000; }
.footer { margin-top: 20px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
@media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
</style></head><body>
<div class="header">
  <h1>👑 MOBILE GALARY</h1>
  <p>প্রোডাক্ট ইনভেন্টরি তালিকা</p>
  <p style="font-size: 10px; margin-top: 5px;">তারিখ: ${new Date().toLocaleDateString("bn-BD")}</p>
</div>
<div class="summary">
  <div class="summary-item"><div class="value">${products.length}</div><div class="label">মোট প্রোডাক্ট</div></div>
  <div class="summary-item"><div class="value">${inStock}</div><div class="label">স্টকে আছে</div></div>
  <div class="summary-item"><div class="value">${outOfStock}</div><div class="label">আউট অফ স্টক</div></div>
  <div class="summary-item"><div class="value">৳${totalCost.toLocaleString("bn-BD")}</div><div class="label">মোট বিনিয়োগ</div></div>
  <div class="summary-item"><div class="value">৳${totalValue.toLocaleString("bn-BD")}</div><div class="label">মোট মূল্য</div></div>
</div>
<table><thead><tr>
  <th class="text-center">ক্রমিক</th><th>প্রোডাক্ট নাম</th><th>IMEI</th><th>অবস্থা</th>
  <th class="text-right">ক্রয় (৳)</th><th class="text-right">বিক্রয় (৳)</th>
  <th class="text-center">স্টক</th><th>সাপ্লায়ার</th>
</tr></thead><tbody>
${products
  .map(
    (product, index) => `<tr class="${(product.stock_quantity || 0) <= 0 ? "stock-out" : ""}">
  <td class="text-center">${index + 1}</td>
  <td><strong>${product.name}</strong><br/><small>${product.brand || ""} ${product.model || ""}</small></td>
  <td style="font-family: monospace; font-size: 10px;">${product.imei || "-"}</td>
  <td>${product.condition === "new" ? "নতুন" : "ব্যবহৃত"}</td>
  <td class="text-right">${(product.cost || 0).toLocaleString("bn-BD")}</td>
  <td class="text-right">${(product.price || 0).toLocaleString("bn-BD")}</td>
  <td class="text-center">${product.stock_quantity || 0}</td>
  <td>${product.supplier_name || "-"}<br/><small>${product.supplier_mobile || ""}</small></td>
</tr>`
  )
  .join("")}
</tbody></table>
<div class="footer">
  <p>MOBILE GALARY - Sales & Stock Management System</p>
  <p>Generated on ${new Date().toLocaleString("bn-BD")}</p>
</div>
</body></html>`;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("পপআপ ব্লক করা আছে। অনুগ্রহ করে পপআপ অনুমতি দিন।");
      return;
    }
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      try {
        printWindow.print();
        printWindow.close();
      } catch {
        /* ignore */
      }
    }, 250);
    toast.success(`${products.length}টি প্রোডাক্ট PDF এ ডাউনলোড হচ্ছে`);
  } catch (err) {
    toast.error(toUserMessage(err, "PDF ডাউনলোড ব্যর্থ"));
  }
}
