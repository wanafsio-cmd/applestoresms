import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { Dashboard } from "@/components/Dashboard";
import { Products } from "@/components/Products";
import { POS } from "@/components/POS";
import { Customers } from "@/components/Customers";
import { Suppliers } from "@/components/Suppliers";
import { Reports } from "@/components/Reports";
import { Settings } from "@/components/Settings";
import { Categories } from "@/components/Categories";
import { Sales } from "@/components/Sales";
import { Returns } from "@/components/Returns";
import { Investments } from "@/components/Investments";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useShopSettings } from "@/hooks/useShopSettings";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { useUserRole } from "@/hooks/useUserRole";
import { ActivityLogger } from "@/hooks/useActivityLog";
import { Skeleton } from "@/components/ui/skeleton";

import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  RefreshCcw, 
  FileText, 
  Settings as SettingsIcon,
  LogOut,
  Wallet
} from "lucide-react";

interface IndexProps {
  user: User | null;
}

export default function Index({ user }: IndexProps) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { role, permissions, loading: roleLoading } = useUserRole();
  const { settings, logoSrc } = useShopSettings();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  useEffect(() => {
    const handleNavigateToCustomers = () => {
      if (!permissions.canManageCustomers) {
        toast.error('আপনার "Customers" পেজে অ্যাক্সেস নেই');
        return;
      }
      setActiveTab("customers");
    };
    const handleNavigateToCategories = () => {
      if (!permissions.canManageCategories) {
        toast.error('আপনার "Categories" পেজে অ্যাক্সেস নেই');
        return;
      }
      setActiveTab("categories");
    };
    
    window.addEventListener('navigate-to-customers', handleNavigateToCustomers);
    window.addEventListener('navigate-to-categories', handleNavigateToCategories);
    
    return () => {
      window.removeEventListener('navigate-to-customers', handleNavigateToCustomers);
      window.removeEventListener('navigate-to-categories', handleNavigateToCategories);
    };
  }, [permissions]);

  if (!user) return null;

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <aside className="hidden lg:block fixed left-0 top-0 h-screen w-72 glass-sidebar p-6">
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-sidebar-border">
            <Skeleton className="w-14 h-14 rounded-2xl bg-sidebar-accent" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-24 bg-sidebar-accent" />
              <Skeleton className="h-3 w-20 bg-sidebar-accent" />
            </div>
          </div>
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl bg-sidebar-accent" />
            ))}
          </div>
        </aside>
        <main className="lg:pl-72 flex-1 p-8">
          <div className="space-y-6">
            <Skeleton className="h-10 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  const allMenuItems = [
    { id: "dashboard", label: "ড্যাশবোর্ড", icon: LayoutDashboard, permission: 'canAccessDashboard' },
    { id: "products", label: "পণ্য", icon: Package, permission: 'canManageProducts' },
    { id: "pos", label: "POS", icon: ShoppingCart, permission: 'canAccessPOS' },
    { id: "sales", label: "বিক্রয়", icon: TrendingUp, permission: 'canAccessSales' },
    { id: "investments", label: "ইনভেস্টমেন্ট", icon: Wallet, permission: 'canAccessReports' },
    { id: "reports", label: "রিপোর্ট", icon: FileText, permission: 'canAccessReports' },
    { id: "settings", label: "সেটিংস", icon: SettingsIcon, permission: 'canAccessSettings' },
  ];

  const menuItems = allMenuItems.filter(item => {
    const permissionKey = item.permission as keyof typeof permissions;
    return permissions[permissionKey];
  });

  const handleTabChange = (tabId: string) => {
    const menuItem = allMenuItems.find(item => item.id === tabId);
    if (menuItem) {
      const permissionKey = menuItem.permission as keyof typeof permissions;
      if (!permissions[permissionKey]) {
        toast.error(`আপনার "${menuItem.label}" পেজে অ্যাক্সেস নেই`);
        return;
      }
    }
    setActiveTab(tabId);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard 
          onNavigateToPOS={() => handleTabChange("pos")}
          onNavigateToProducts={() => handleTabChange("products")}
        />;
      case "products": return <Products />;
      case "categories": return <Categories />;
      case "pos": return <POS />;
      case "sales": return <Sales />;
      case "returns": return <Returns />;
      case "investments": return <Investments />;
      case "customers": return <Customers />;
      case "suppliers": return <Suppliers />;
      case "reports": return <Reports />;
      case "settings": return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar - Apple Velvet Style */}
      <aside className="hidden lg:block fixed left-0 top-0 h-screen w-72 glass-sidebar border-r border-sidebar-border z-40">
        <div className="flex flex-col h-full p-5">
          {/* Logo Section */}
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-sidebar-border">
            <div className="w-14 h-14 rounded-2xl bg-sidebar-accent flex items-center justify-center overflow-hidden shadow-lg">
              <img src={logoSrc} alt={settings.shop_name} className="w-12 h-12 object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-sidebar-foreground leading-tight tracking-tight truncate">
                {settings.shop_name.split(' ').slice(0, 2).join(' ')}
              </h1>
              <p className="text-xs text-sidebar-foreground/50 truncate">{settings.shop_subtitle}</p>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-300 text-[15px] ${
                    isActive
                      ? "sidebar-active text-sidebar-foreground font-semibold"
                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-accent' : ''}`} />
                  <span className="tracking-tight">{item.label}</span>
                </button>
              );
            })}
          </nav>
          
          {/* Logout */}
          <div className="pt-4 border-t border-sidebar-border">
            <button
              onClick={async () => {
                await ActivityLogger.logout();
                await supabase.auth.signOut({ scope: 'local' });
                toast.success("সফলভাবে লগআউট হয়েছে");
                window.location.href = "/auth";
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-destructive/80 hover:text-destructive hover:bg-destructive/5 transition-all duration-300 text-[15px]"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium tracking-tight">লগআউট</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header - Frosted Glass */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
              <img src={logoSrc} alt={settings.shop_name} className="w-8 h-8 object-contain" />
            </div>
            <div>
              <span className="text-sm font-bold text-foreground block leading-tight tracking-tight">
                {settings.shop_name.split(' ').slice(0, 3).join(' ')}
              </span>
              <span className="text-[10px] text-muted-foreground">{settings.shop_subtitle}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-foreground hover:bg-muted rounded-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </Button>
        </div>
      </div>

      {/* Mobile Menu - Glass Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
          <div 
            className="fixed top-16 left-0 right-0 glass-card border-b border-border/50 shadow-xl max-h-[70vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all ${
                      isActive
                        ? "bg-accent/10 text-accent font-semibold"
                        : "text-foreground/70 hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-accent' : ''}`} />
                    <span className="text-[15px] tracking-tight">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="lg:pl-72">
        <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 pt-20 lg:pt-8">
          {renderContent()}
        </div>
      </main>

      {/* Floating Action Button */}
      <FloatingActionButton 
        onNewSale={() => handleTabChange("pos")}
        onAddProduct={() => {
          if (!permissions.canManageProducts) {
            toast.error('আপনার "Products" পেজে অ্যাক্সেস নেই');
            return;
          }
          setActiveTab("products");
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('open-add-product-dialog'));
          }, 100);
        }}
      />

      {/* Mobile Bottom Navigation - Frosted Glass */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 glass-card border-t border-border/50 z-40">
        <div className="flex justify-around items-center h-16 px-1">
          {menuItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 rounded-xl mx-0.5 ${
                  isActive
                    ? "text-accent"
                    : "text-muted-foreground"
                }`}
              >
                <Icon className={`w-5 h-5 mb-1 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
                <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
                {isActive && (
                  <div className="w-1 h-1 rounded-full bg-accent mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
