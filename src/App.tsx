import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import defaultLogo from "@/assets/3926e988-d85b-4bf1-8f3e-71bdbe4a2e70.png";
import { queryClient } from "@/lib/queryClient";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Apply dynamic favicon from shop settings
  useEffect(() => {
    supabase
      .from("shop_settings")
      .select("favicon_url")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.favicon_url) {
          const link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
          if (link) link.href = data.favicon_url;
        }
      });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-2xl mb-4 animate-pulse-glow neon-border">
            <img src={defaultLogo} alt="MOBILE GALARY" className="w-28 h-28 animate-scale-in" />
          </div>
          <h2 className="text-3xl font-display font-bold mb-2 neon-text tracking-widest">MOBILE GALARY</h2>
          <p className="text-muted-foreground font-mono text-sm">// initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <OfflineBanner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<Index user={user} />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
