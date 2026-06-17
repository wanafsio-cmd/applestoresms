import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useShopSettings } from "@/hooks/useShopSettings";
import { Palette, Upload, Image, Type, MapPin, Phone } from "lucide-react";

export function BrandingSettings() {
  const { settings, logoSrc, refetch } = useShopSettings();
  const [shopName, setShopName] = useState("");
  const [shopSubtitle, setShopSubtitle] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [accentColor, setAccentColor] = useState("#22e6ff");
  const [accentColor2, setAccentColor2] = useState("#ff3df0");
  const [themeMode, setThemeMode] = useState<"dark" | "light">("dark");
  const [contrastLevel, setContrastLevel] = useState<number>(100);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  // Initialize form values and ensure a settings row exists
  useEffect(() => {
    const initSettings = async () => {
      if (settings && settings.id) {
        setSettingsId(settings.id);
        setShopName(settings.shop_name || "");
        setShopSubtitle(settings.shop_subtitle || "");
        setShopAddress(settings.shop_address || "");
        setShopPhone(settings.shop_phone || "");
        setAccentColor(settings.accent_color || "#22e6ff");
        setAccentColor2(settings.accent_color_2 || "#ff3df0");
        setThemeMode(settings.theme_mode || "dark");
        setContrastLevel(settings.contrast_level ?? 100);
      } else {
        // No row exists - create one
        const { data, error } = await supabase
          .from("shop_settings")
          .insert({
            shop_name: "MOBILE GALARY",
            shop_subtitle: "Mobile Sales & Stock Management",
          })
          .select()
          .single();

        if (!error && data) {
          setSettingsId(data.id);
          setShopName(data.shop_name || "");
          setShopSubtitle(data.shop_subtitle || "");
          setShopAddress(data.shop_address || "");
          setShopPhone(data.shop_phone || "");
          refetch();
        } else if (error) {
          console.error("Failed to create shop settings:", error);
        }
      }
    };
    initSettings();
  }, [settings?.id]);

  const handleSave = async () => {
    if (!settingsId) {
      toast.error("সেটিংস লোড হয়নি, অনুগ্রহ করে পেজ রিফ্রেশ করুন।");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("shop_settings")
        .update({
          shop_name: shopName,
          shop_subtitle: shopSubtitle,
          shop_address: shopAddress,
          shop_phone: shopPhone,
          accent_color: accentColor,
          accent_color_2: accentColor2,
          theme_mode: themeMode,
          contrast_level: contrastLevel,
        })
        .eq("id", settingsId);

      if (error) throw error;
      toast.success("ব্র্যান্ডিং সেটিংস সংরক্ষিত হয়েছে!");
      refetch();
    } catch (error: any) {
      toast.error("সংরক্ষণ ব্যর্থ: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settingsId) {
      if (!settingsId) toast.error("সেটিংস লোড হয়নি।");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `logos/shop-logo-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("branding")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("branding")
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("shop_settings")
        .update({ logo_url: urlData.publicUrl })
        .eq("id", settingsId);

      if (updateError) throw updateError;

      toast.success("লোগো আপলোড সম্পন্ন!");
      refetch();
    } catch (error: any) {
      toast.error("লোগো আপলোড ব্যর্থ: " + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settingsId) {
      if (!settingsId) toast.error("সেটিংস লোড হয়নি।");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `logos/favicon-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("branding")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("branding")
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("shop_settings")
        .update({ favicon_url: urlData.publicUrl })
        .eq("id", settingsId);

      if (updateError) throw updateError;

      const link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (link) link.href = urlData.publicUrl;

      toast.success("ফেভিকন আপলোড সম্পন্ন!");
      refetch();
    } catch (error: any) {
      toast.error("ফেভিকন আপলোড ব্যর্থ: " + error.message);
    } finally {
      setUploading(false);
      if (faviconInputRef.current) faviconInputRef.current.value = "";
    }
  };

  return (
    <Card className="p-6 border border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <Palette className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">ব্র্যান্ডিং সেটিংস</h2>
          <p className="text-sm text-muted-foreground">
            দোকানের নাম, লোগো, ফেভিকন এবং ঠিকানা পরিবর্তন করুন।
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Logo Preview & Upload */}
        <div className="flex items-center gap-6 p-4 rounded-xl bg-muted/50">
          <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-accent/30 flex items-center justify-center overflow-hidden bg-card shadow-sm">
            <img src={logoSrc} alt="Shop Logo" className="w-20 h-20 object-cover" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Image className="w-4 h-4 text-accent" /> দোকানের লোগো
            </p>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="border-accent/30 hover:bg-accent/10">
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? "আপলোড হচ্ছে..." : "লোগো আপলোড"}
            </Button>
          </div>
        </div>

        {/* Favicon Upload */}
        <div className="flex items-center gap-6 p-4 rounded-xl bg-muted/50">
          <div className="w-16 h-16 rounded-xl border-2 border-dashed border-accent/30 flex items-center justify-center overflow-hidden bg-card shadow-sm">
            {settings.favicon_url ? (
              <img src={settings.favicon_url} alt="Favicon" className="w-12 h-12 object-cover" />
            ) : (
              <span className="text-2xl">🌐</span>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Image className="w-4 h-4 text-accent" /> ফেভিকন আইকন
            </p>
            <input ref={faviconInputRef} type="file" accept="image/*" onChange={handleFaviconUpload} className="hidden" />
            <Button size="sm" variant="outline" onClick={() => faviconInputRef.current?.click()} disabled={uploading}
              className="border-accent/30 hover:bg-accent/10">
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? "আপলোড হচ্ছে..." : "ফেভিকন আপলোড"}
            </Button>
          </div>
        </div>

        {/* Text Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
              <Type className="w-4 h-4 text-accent" /> দোকানের নাম
            </label>
            <Input value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="MOBILE GALARY" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
              <Type className="w-4 h-4 text-accent" /> সাবটাইটেল
            </label>
            <Input value={shopSubtitle} onChange={(e) => setShopSubtitle(e.target.value)} placeholder="Sales & Stock Management System" className="mt-1" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent" /> ঠিকানা
            </label>
            <Input value={shopAddress} onChange={(e) => setShopAddress(e.target.value)} placeholder="আপনার দোকানের ঠিকানা" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
              <Phone className="w-4 h-4 text-accent" /> ফোন নম্বর
            </label>
            <Input value={shopPhone} onChange={(e) => setShopPhone(e.target.value)} placeholder="01XXXXXXXXX" className="mt-1" />
          </div>
        </div>

        {/* Neon Theme Customization */}
        <div className="p-4 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground tracking-wide">নিয়ন থিম কাস্টমাইজেশন</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">প্রাইমারি নিয়ন রঙ</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-10 w-14 rounded-md border border-border bg-transparent cursor-pointer"
                />
                <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} placeholder="#22e6ff" className="font-mono" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">সেকেন্ডারি নিয়ন রঙ</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accentColor2}
                  onChange={(e) => setAccentColor2(e.target.value)}
                  className="h-10 w-14 rounded-md border border-border bg-transparent cursor-pointer"
                />
                <Input value={accentColor2} onChange={(e) => setAccentColor2(e.target.value)} placeholder="#ff3df0" className="font-mono" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">থিম মোড</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={themeMode === "dark" ? "default" : "outline"}
                  onClick={() => setThemeMode("dark")}
                  className="flex-1"
                >
                  🌙 ডার্ক
                </Button>
                <Button
                  type="button"
                  variant={themeMode === "light" ? "default" : "outline"}
                  onClick={() => setThemeMode("light")}
                  className="flex-1"
                >
                  ☀️ লাইট
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                কনট্রাস্ট লেভেল: <span className="font-mono text-primary">{contrastLevel}%</span>
              </label>
              <input
                type="range"
                min={70}
                max={140}
                step={5}
                value={contrastLevel}
                onChange={(e) => setContrastLevel(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
                <span>সফট</span>
                <span>নরমাল</span>
                <span>হাই</span>
              </div>
            </div>
          </div>

          {/* Live preview swatch */}
          <div className="flex items-center gap-3 p-3 rounded-lg neon-border">
            <div className="w-10 h-10 rounded-md" style={{ background: accentColor, boxShadow: `0 0 16px ${accentColor}` }} />
            <div className="w-10 h-10 rounded-md" style={{ background: accentColor2, boxShadow: `0 0 16px ${accentColor2}` }} />
            <div className="flex-1">
              <p className="text-sm font-display font-bold neon-text">{shopName || "MOBILE GALARY"}</p>
              <p className="text-[10px] text-muted-foreground font-mono">// live preview — সেভ করলে সব পেজে অ্যাপ্লাই হবে</p>
            </div>
          </div>
        </div>


        <Button onClick={handleSave} disabled={saving || !settingsId} className="w-full md:w-auto bg-accent hover:bg-accent/90 text-white">
          {saving ? "⏳ সংরক্ষণ হচ্ছে..." : "💾 সংরক্ষণ করুন"}
        </Button>
      </div>
    </Card>
  );
}
