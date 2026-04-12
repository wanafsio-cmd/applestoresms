import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScanBarcode } from "lucide-react";
import { useShopSettings } from "@/hooks/useShopSettings";

interface POSHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  imeiSearch: string;
  onImeiSearchChange: (value: string) => void;
  showOutOfStock: boolean;
  onShowOutOfStockChange: (checked: boolean) => void;
  onOpenScanner: () => void;
}

export function POSHeader({
  searchTerm,
  onSearchChange,
  imeiSearch,
  onImeiSearchChange,
  showOutOfStock,
  onShowOutOfStockChange,
  onOpenScanner,
}: POSHeaderProps) {
  const { settings, logoSrc } = useShopSettings();

  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 border-b border-border p-4 lg:pb-4 space-y-3 lg:space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">পয়েন্ট অব সেল</h1>
          <p className="text-muted-foreground mt-1 text-sm lg:text-base">
            বিক্রয় প্রক্রিয়া ও লেনদেন ব্যবস্থাপনা
          </p>
        </div>
        <img src={logoSrc} alt={settings.shop_name} className="w-16 h-16 lg:w-20 lg:h-20" />
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="🔍 নাম, ব্র্যান্ড বা SKU দিয়ে খুঁজুন..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1"
        />
        <Input
          placeholder="📱 IMEI..."
          value={imeiSearch}
          onChange={(e) => onImeiSearchChange(e.target.value)}
          className="w-32 lg:w-40"
        />
        <Button variant="outline" onClick={onOpenScanner} className="shrink-0">
          <ScanBarcode className="w-4 h-4 lg:mr-2" />
          <span className="hidden lg:inline">স্ক্যান</span>
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="showOutOfStockPOS"
          checked={showOutOfStock}
          onCheckedChange={(checked) => onShowOutOfStockChange(checked as boolean)}
        />
        <label
          htmlFor="showOutOfStockPOS"
          className="text-xs lg:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
          স্টক শেষ পণ্যগুলি দেখান (০ স্টক)
        </label>
      </div>
    </div>
  );
}
