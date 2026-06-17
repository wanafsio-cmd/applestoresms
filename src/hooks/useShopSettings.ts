import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import defaultLogo from "@/assets/mobile-galary-logo.png";
import { applyTheme } from "@/lib/theme";

export interface ShopSettings {
  id: string;
  shop_name: string;
  shop_subtitle: string;
  shop_address: string;
  shop_phone: string;
  logo_url: string;
  favicon_url: string;
  accent_color: string;
  accent_color_2: string;
  theme_mode: "dark" | "light";
  contrast_level: number;
}

const DEFAULT_SETTINGS: ShopSettings = {
  id: "",
  shop_name: "MOBILE GALARY",
  shop_subtitle: "Mobile Sales & Stock Management",
  shop_address: "Goli No-6, Shop No-13, New Market, Karanihat, Satkania, Chittagong",
  shop_phone: "",
  logo_url: "",
  favicon_url: "",
  accent_color: "#22e6ff",
  accent_color_2: "#ff3df0",
  theme_mode: "dark",
  contrast_level: 100,
};

export function useShopSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["shop-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) {
        console.error("Error fetching shop settings:", error);
        return DEFAULT_SETTINGS;
      }
      return { ...DEFAULT_SETTINGS, ...((data as Partial<ShopSettings>) || {}) } as ShopSettings;
    },
    staleTime: 1000 * 60 * 5,
  });

  const resolvedSettings = settings || DEFAULT_SETTINGS;
  const logoSrc = resolvedSettings.logo_url || defaultLogo;

  // Apply theme whenever settings change
  useEffect(() => {
    applyTheme({
      accent_color: resolvedSettings.accent_color,
      accent_color_2: resolvedSettings.accent_color_2,
      theme_mode: resolvedSettings.theme_mode,
      contrast_level: resolvedSettings.contrast_level,
    });
  }, [
    resolvedSettings.accent_color,
    resolvedSettings.accent_color_2,
    resolvedSettings.theme_mode,
    resolvedSettings.contrast_level,
  ]);

  const refetch = () => queryClient.invalidateQueries({ queryKey: ["shop-settings"] });

  return { settings: resolvedSettings, logoSrc, isLoading, refetch };
}
