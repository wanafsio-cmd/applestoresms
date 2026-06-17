import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ProductHistory } from "./ProductHistory";
import { ProductDetailModal } from "./ProductDetailModal";
import { BarcodeScanner } from "./BarcodeScanner";
import { ProductQuickView } from "./ProductQuickView";
import { Eye, ScanBarcode, Download, FileSpreadsheet, FileText } from "lucide-react";
import { ActivityLogger } from "@/hooks/useActivityLog";
import { useSafeMutation } from "@/hooks/useSafeMutation";
import { productSchema } from "@/lib/validation";
import { validateOrToast } from "@/lib/validateForm";
import { exportProductsToExcel, exportProductsToPDF } from "@/lib/exports/productsExport";
import { qk } from "@/lib/queryKeys";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { CollapseGroupControls } from "@/components/ui/CollapseGroupControls";
export function Products() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [historyProduct, setHistoryProduct] = useState<{ imei: string; name: string } | null>(null);
  const [detailProduct, setDetailProduct] = useState<any>(null);
  const [quickViewIndex, setQuickViewIndex] = useState<number>(-1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCondition, setFilterCondition] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showScanner, setShowScanner] = useState(false);
  const [showOutOfStock, setShowOutOfStock] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category_id: "",
    sku: "",
    barcode: "",
    imei: "",
    brand: "",
    model: "",
    condition: "new",
    price: "",
    cost: "",
    unit: "pcs",
    ram: "",
    storage: "",
    battery: "",
    supplier_id: "",
    supplier_name: "",
    supplier_mobile: "",
    supplier_nid: "",
    warranty_expiry_date: "",
    warranty_status: "no_warranty",
  });
  const [supplierMode, setSupplierMode] = useState<"existing" | "custom">("existing");
  const [showInstantSupplier, setShowInstantSupplier] = useState(false);
  const [instantSupplierName, setInstantSupplierName] = useState("");
  const [instantSupplierPhone, setInstantSupplierPhone] = useState("");

  const queryClient = useQueryClient();

  const { data: suppliersList } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useSafeMutation({
    mutationFn: async (data: any) => {
      const { data: inserted, error } = await supabase.from("products").insert([data]).select().single();
      if (error) throw error;
      return { ...inserted, name: data.name };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: qk.products });
      ActivityLogger.productAdded(result.name, result.id);
      setIsAddDialogOpen(false);
      resetForm();
    },
    successMessage: "প্রোডাক্ট যোগ করা হয়েছে!",
    errorPrefix: "প্রোডাক্ট যোগ ব্যর্থ",
  });

  const updateMutation = useSafeMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from("products").update(data).eq("id", id);
      if (error) throw error;
      return { id, name: data.name };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: qk.products });
      ActivityLogger.productUpdated(result.name, result.id);
      setEditingProduct(null);
      resetForm();
    },
    successMessage: "প্রোডাক্ট আপডেট হয়েছে!",
    errorPrefix: "আপডেট ব্যর্থ",
  });

  const deleteMutation = useSafeMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      return name;
    },
    onSuccess: (name) => {
      queryClient.invalidateQueries({ queryKey: qk.products });
      ActivityLogger.productDeleted(name);
    },
    successMessage: "প্রোডাক্ট মুছে ফেলা হয়েছে",
    errorPrefix: "ডিলিট ব্যর্থ",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      category_id: "",
      sku: "",
      barcode: "",
      imei: "",
      brand: "",
      model: "",
      condition: "new",
      price: "",
      cost: "",
      unit: "pcs",
      ram: "",
      storage: "",
      battery: "",
      supplier_id: "",
      supplier_name: "",
      supplier_mobile: "",
      supplier_nid: "",
      warranty_expiry_date: "",
      warranty_status: "no_warranty",
    });
    setSupplierMode("existing");
  };

  const generateSKU = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `SKU-${timestamp}-${random}`.toUpperCase();
  };

  const generateBarcode = () => {
    return Math.floor(100000000000 + Math.random() * 900000000000).toString();
  };

  const extractBrand = (productName: string) => {
    return productName.split(' ')[0];
  };

  const extractModel = (productName: string) => {
    const parts = productName.split(' ');
    return parts.slice(1).join(' ');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const price = parseFloat(formData.price) || 0;
    const cost = parseFloat(formData.cost) || 0;

    // Zod validation for typed/required fields
    const parsed = validateOrToast(productSchema, {
      name: formData.name,
      sku: formData.sku,
      brand: formData.brand,
      model: formData.model,
      imei: formData.imei,
      barcode: formData.barcode,
      price,
      cost,
      stock_quantity: editingProduct ? Number(editingProduct.stock_quantity ?? 1) : 1,
      category_id: formData.category_id || null,
      supplier_id: formData.supplier_id || null,
      condition: formData.condition || null,
    });
    if (!parsed) return;

    // Duplicate IMEI guard (kept on client for friendly message; DB also enforces)
    if (formData.imei) {
      let query = supabase
        .from("products")
        .select("id, name, stock_quantity")
        .eq("imei", formData.imei)
        .gt("stock_quantity", 0);

      if (editingProduct) {
        query = query.neq("id", editingProduct.id);
      }

      const { data: existingProducts, error } = await query;

      if (error) {
        toast.error("IMEI চেক করতে ব্যর্থ");
        return;
      }

      if (existingProducts && existingProducts.length > 0) {
        toast.error(
          `এই IMEI (${formData.imei}) দিয়ে "${existingProducts[0].name}" ইতিমধ্যে স্টকে আছে। আগে বিক্রি করুন, তারপর আবার এন্ট্রি করতে পারবেন।`
        );
        return;
      }
    }

    if (cost > 0 && price > cost * 3) {
      toast.warning(
        `⚠️ সতর্কতা: বিক্রয় মূল্য (${price}) ক্রয় মূল্যের (${cost}) ৩ গুণের বেশি। দয়া করে যাচাই করুন।`,
        { duration: 5000 }
      );
    }

    const submitData = {
      ...formData,
      sku: editingProduct ? formData.sku : generateSKU(),
      barcode: editingProduct ? formData.barcode : generateBarcode(),
      brand: formData.brand || extractBrand(formData.name),
      model: formData.model || extractModel(formData.name),
      price,
      cost,
      stock_quantity: editingProduct ? editingProduct.stock_quantity : 1,
      low_stock_threshold: 0,
      category_id: formData.category_id || null,
      supplier_id: formData.supplier_id || null,
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: submitData });
    } else {
      addMutation.mutate(submitData);
    }
  };

  const startEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || "",
      category_id: product.category_id || "",
      sku: product.sku || "",
      barcode: product.barcode || "",
      imei: product.imei || "",
      brand: product.brand || "",
      model: product.model || "",
      condition: product.condition || "new",
      price: product.price?.toString() || "",
      cost: product.cost?.toString() || "",
      unit: product.unit || "pcs",
      ram: product.ram || "",
      storage: product.storage || "",
      battery: product.battery || "",
      supplier_id: product.supplier_id || "",
      supplier_name: product.supplier_name || "",
      supplier_mobile: product.supplier_mobile || "",
      supplier_nid: product.supplier_nid || "",
      warranty_expiry_date: product.warranty_expiry_date || "",
      warranty_status: product.warranty_status || "no_warranty",
    });
    setSupplierMode(product.supplier_id ? "existing" : (product.supplier_name ? "custom" : "existing"));
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    return products.filter((product) => {
      const matchesSearch = 
        searchTerm === "" ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.imei?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCondition = 
        filterCondition === "all" || 
        product.condition === filterCondition;

      const matchesCategory = 
        filterCategory === "all" || 
        product.category_id === filterCategory;

      const hasStock = showOutOfStock || product.stock_quantity > 0;

      return matchesSearch && matchesCondition && matchesCategory && hasStock;
    });
  }, [products, searchTerm, filterCondition, filterCategory, showOutOfStock]);

  const handleBarcodeScanned = (barcode: string) => {
    // Search for product by barcode or IMEI
    const product = products?.find(p => 
      p.barcode === barcode || p.imei === barcode
    );

    if (product) {
      setDetailProduct(product);
    } else {
      toast.error("Product not found with this barcode");
    }
  };

  const downloadExcel = () => exportProductsToExcel(products);
  const downloadPDF = () => exportProductsToPDF(products);

  return (
    <div className="flex flex-col h-screen animate-fade-in">
      {/* Fixed Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 border-b border-border pb-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Products</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">Manage your inventory</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CollapseGroupControls group="products" />
            {/* Download Buttons */}
            <Button
              onClick={downloadExcel}
              variant="outline"
              className="border-green-500 text-green-600 hover:bg-green-50 text-sm md:text-base"
              title="Excel ডাউনলোড"
            >
              <FileSpreadsheet className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Excel</span>
            </Button>
            <Button
              onClick={downloadPDF}
              variant="outline"
              className="border-red-500 text-red-600 hover:bg-red-50 text-sm md:text-base"
              title="PDF ডাউনলোড"
            >
              <FileText className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            <Button
              onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-customers'))}
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10 text-sm md:text-base"
            >
              <span className="hidden sm:inline">👥 Customers</span>
              <span className="sm:hidden">👥</span>
            </Button>
            <Button
              onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-categories'))}
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10 text-sm md:text-base"
            >
              <span className="hidden sm:inline">📁 Categories</span>
              <span className="sm:hidden">📁</span>
            </Button>
            <Dialog open={isAddDialogOpen || !!editingProduct} onOpenChange={(open) => {
              if (!open) {
                setIsAddDialogOpen(false);
                setEditingProduct(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => setIsAddDialogOpen(true)}
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-sm md:text-base"
                >
                  <span className="hidden sm:inline">➕ Add Product</span>
                  <span className="sm:hidden">➕</span>
                </Button>
              </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl">{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
              <DialogDescription className="text-sm">
                {editingProduct ? "Update product details" : "Enter product information to add to inventory"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-2">Product Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setFormData({ 
                        ...formData, 
                        name: newName,
                        brand: extractBrand(newName),
                        model: extractModel(newName)
                      });
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">IMEI * (15 digits)</label>
                  <Input
                    value={formData.imei}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 15);
                      setFormData({ ...formData, imei: value });
                    }}
                    placeholder="Enter 15-digit IMEI"
                    required
                    pattern="[0-9]{15}"
                    minLength={15}
                    maxLength={15}
                    title="IMEI must be exactly 15 digits"
                  />
                  {formData.imei && formData.imei.length !== 15 && (
                    <p className="text-xs text-red-500 mt-1">IMEI must be exactly 15 digits</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Brand</label>
                  <Input
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Auto-filled from product name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Model</label>
                  <Input
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="Auto-filled from product name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Condition</label>
                  <Select value={formData.condition} onValueChange={(value) => setFormData({ ...formData, condition: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="used">Used</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Unit</label>
                  <Input
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Price</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Cost</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  />
                </div>
              </div>

              {/* Quick Specifications (Optional) */}
              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-semibold mb-3 text-foreground">Quick Specifications (Optional)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">RAM</label>
                    <Input
                      value={formData.ram}
                      onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                      placeholder="e.g., 8GB"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Storage</label>
                    <Input
                      value={formData.storage}
                      onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                      placeholder="e.g., 256GB"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Battery</label>
                    <Input
                      value={formData.battery}
                      onChange={(e) => setFormData({ ...formData, battery: e.target.value })}
                      placeholder="e.g., 5000mAh"
                    />
                  </div>
                </div>
              </div>

              {/* Supplier Information (Optional) */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">Supplier Information (Optional)</h3>
                  <div className="flex gap-1 text-xs">
                    <button type="button" onClick={() => setSupplierMode("existing")}
                      className={`px-2 py-1 rounded ${supplierMode === "existing" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      নিবন্ধিত
                    </button>
                    <button type="button" onClick={() => setSupplierMode("custom")}
                      className={`px-2 py-1 rounded ${supplierMode === "custom" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      ইন্সট্যান্ট
                    </button>
                  </div>
                </div>

                {supplierMode === "existing" ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-2">Select Supplier</label>
                      <div className="flex gap-2">
                        <Select
                          value={formData.supplier_id}
                          onValueChange={(v) => {
                            const sup = suppliersList?.find((s: any) => s.id === v);
                            setFormData({
                              ...formData,
                              supplier_id: v,
                              supplier_name: sup?.name || "",
                              supplier_mobile: sup?.phone || "",
                            });
                          }}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="সাপ্লায়ার নির্বাচন করুন" />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliersList?.map((s: any) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name} {s.phone ? `(${s.phone})` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" size="sm" onClick={() => setShowInstantSupplier(true)}>
                          + নতুন
                        </Button>
                      </div>
                    </div>
                    {formData.supplier_id && (
                      <div>
                        <label className="block text-sm font-medium mb-2">সাপ্লায়ার NID</label>
                        <Input value={formData.supplier_nid} onChange={(e) => setFormData({ ...formData, supplier_nid: e.target.value })} placeholder="NID number" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Supplier Name</label>
                      <Input value={formData.supplier_name} onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value, supplier_id: "" })} placeholder="ইন্সট্যান্ট সাপ্লায়ার নাম" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Supplier Mobile</label>
                      <Input value={formData.supplier_mobile} onChange={(e) => setFormData({ ...formData, supplier_mobile: e.target.value })} placeholder="মোবাইল নম্বর" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium mb-2">Supplier NID</label>
                      <Input value={formData.supplier_nid} onChange={(e) => setFormData({ ...formData, supplier_nid: e.target.value })} placeholder="NID number" />
                    </div>
                  </div>
                )}
              </div>

              {/* Quick add supplier dialog */}
              {showInstantSupplier && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowInstantSupplier(false)}>
                  <div className="bg-background rounded-lg p-5 w-full max-w-md space-y-3" onClick={(e) => e.stopPropagation()}>
                    <h3 className="font-semibold">দ্রুত নতুন সাপ্লায়ার যোগ</h3>
                    <Input placeholder="নাম *" value={instantSupplierName} onChange={(e) => setInstantSupplierName(e.target.value)} />
                    <Input placeholder="ফোন" value={instantSupplierPhone} onChange={(e) => setInstantSupplierPhone(e.target.value)} />
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setShowInstantSupplier(false)}>বাতিল</Button>
                      <Button type="button" onClick={async () => {
                        if (!instantSupplierName.trim()) { toast.error("নাম দিন"); return; }
                        const { data, error } = await supabase.from("suppliers").insert([{ name: instantSupplierName, phone: instantSupplierPhone }]).select().single();
                        if (error) { toast.error(error.message); return; }
                        queryClient.invalidateQueries({ queryKey: ["suppliers"] });
                        setFormData({ ...formData, supplier_id: data.id, supplier_name: data.name, supplier_mobile: data.phone || "" });
                        setInstantSupplierName(""); setInstantSupplierPhone("");
                        setShowInstantSupplier(false);
                        toast.success("সাপ্লায়ার যোগ হয়েছে");
                      }}>যোগ করুন</Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Warranty Information (Optional) */}
              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-semibold mb-3 text-foreground">Warranty Information (Optional)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Warranty Status</label>
                    <Select value={formData.warranty_status} onValueChange={(value) => setFormData({ ...formData, warranty_status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no_warranty">No Warranty</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="void">Void</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Warranty Expiry Date</label>
                    <Input
                      type="date"
                      value={formData.warranty_expiry_date}
                      onChange={(e) => setFormData({ ...formData, warranty_expiry_date: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingProduct(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-primary to-accent">
                  {editingProduct ? "Update" : "Add"} Product
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
          </div>
        </div>

      {/* Search and Filters */}
      <CollapsibleSection group="products" title="🔍 সার্চ ও ফিল্টার" defaultOpen={true}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 flex gap-2">
            <Input
              placeholder="Search by name, IMEI, brand, or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => setShowScanner(true)}
              className="shrink-0"
            >
              <ScanBarcode className="w-4 h-4" />
            </Button>
          </div>
          <Select value={filterCondition} onValueChange={setFilterCondition}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Conditions</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="used">Used</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="mt-4 flex items-center space-x-2">
          <Checkbox
            id="showOutOfStock"
            checked={showOutOfStock}
            onCheckedChange={(checked) => setShowOutOfStock(checked as boolean)}
          />
          <label
            htmlFor="showOutOfStock"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Show out of stock products (0 stock)
          </label>
        </div>
        {(searchTerm || filterCondition !== "all" || filterCategory !== "all") && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Found {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setFilterCondition("all");
                setFilterCategory("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </CollapsibleSection>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
        {filteredProducts?.map((product) => (
          <Card key={product.id} className="p-6 card-hover">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
              <div className="flex-1">
                  <h3 className="font-semibold text-lg text-foreground">{product.name}</h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {product.brand && (
                      <span className="inline-block text-xs bg-accent/10 text-accent px-2 py-1 rounded-full">
                        {product.brand}
                      </span>
                    )}
                    {product.condition && (
                      <span className={`inline-block text-xs px-2 py-1 rounded-full ${
                        product.condition === 'new' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {product.condition === 'new' ? '✨ New' : '♻️ Used'}
                      </span>
                    )}
                    {product.categories && (
                      <span className="inline-block text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        {product.categories.name}
                      </span>
                    )}
                  </div>
                </div>
                {product.stock_quantity <= product.low_stock_threshold && (
                  <span className="text-xl" title="Low Stock">⚠️</span>
                )}
              </div>
              {product.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
              )}
              <div className="space-y-2 text-sm">
                {(product.ram || product.storage || product.battery) && (
                  <div className="flex flex-wrap gap-2 pb-2 border-b border-border">
                    {product.ram && (
                      <span className="text-xs bg-muted px-2 py-1 rounded">🧠 {product.ram}</span>
                    )}
                    {product.storage && (
                      <span className="text-xs bg-muted px-2 py-1 rounded">💾 {product.storage}</span>
                    )}
                    {product.battery && (
                      <span className="text-xs bg-muted px-2 py-1 rounded">🔋 {product.battery}</span>
                    )}
                  </div>
                )}
                {(product.supplier_name || product.supplier_mobile) && (
                  <div className="pb-2 border-b border-border">
                    <p className="text-xs text-muted-foreground mb-1">Supplier Info:</p>
                    {product.supplier_name && (
                      <p className="text-xs">📦 {product.supplier_name}</p>
                    )}
                    {product.supplier_mobile && (
                      <p className="text-xs">📱 {product.supplier_mobile}</p>
                    )}
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-semibold text-foreground">${Number(product.price).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stock:</span>
                  <span className={`font-semibold ${product.stock_quantity <= product.low_stock_threshold ? 'text-amber-600' : 'text-foreground'}`}>
                    {product.stock_quantity} {product.unit}
                  </span>
                </div>
                {product.sku && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SKU:</span>
                    <span className="font-mono text-xs text-foreground">{product.sku}</span>
                  </div>
                )}
                {product.imei && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IMEI:</span>
                    <span className="font-mono text-xs text-foreground">{product.imei}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const index = filteredProducts.findIndex(p => p.id === product.id);
                    if (window.innerWidth < 1024) {
                      setQuickViewIndex(index);
                    } else {
                      setDetailProduct(product);
                    }
                  }}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startEdit(product)}
                  className="flex-1"
                >
                  ✏️
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHistoryProduct({ imei: product.imei || "", name: product.name })}
                  className="flex-1"
                  disabled={!product.imei}
                >
                  📜
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this product?")) {
                      deleteMutation.mutate({ id: product.id, name: product.name });
                    }
                  }}
                  className="flex-1"
                >
                  🗑️
                </Button>
              </div>
            </div>
          </Card>
        ))}
        </div>

        {(!filteredProducts || filteredProducts.length === 0) && (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">
              {products && products.length > 0 ? "No matching products" : "No products yet"}
            </h3>
            <p className="text-muted-foreground">
              {products && products.length > 0 
                ? "Try adjusting your search or filters" 
                : "Add your first product to get started!"}
            </p>
          </Card>
        )}
      </div>

      {historyProduct && (
        <ProductHistory
          imei={historyProduct.imei}
          productName={historyProduct.name}
          isOpen={!!historyProduct}
          onClose={() => setHistoryProduct(null)}
        />
      )}

      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          isOpen={!!detailProduct}
          onClose={() => setDetailProduct(null)}
        />
      )}

      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleBarcodeScanned}
      />

      <ProductQuickView
        products={filteredProducts || []}
        initialIndex={quickViewIndex}
        isOpen={quickViewIndex >= 0}
        onClose={() => setQuickViewIndex(-1)}
      />
    </div>
  );
}
