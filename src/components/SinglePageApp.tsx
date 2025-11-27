import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Auth } from "@/pages/Auth";
import { Dashboard } from "@/components/Dashboard";
import { Transactions } from "@/pages/Transactions";
import { AddTransaction } from "@/pages/AddTransaction";
import { Profile } from "@/pages/Profile";
import { Settings } from "@/pages/Settings";
import { CarbonFootprint } from "@/pages/CarbonFootprint";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, LayoutDashboard, Receipt, PlusCircle, User, Settings as SettingsIcon, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { Moon, Sun } from "lucide-react";

export const SinglePageApp = () => {
  const { user, loading, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("dashboard");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">₹ Finance Manager</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">Transactions</span>
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Add</span>
            </TabsTrigger>
            <TabsTrigger value="carbon" className="flex items-center gap-2">
              <Leaf className="h-4 w-4" />
              <span className="hidden sm:inline">Carbon</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-0">
            <Dashboard onNavigate={setActiveTab} />
          </TabsContent>

          <TabsContent value="transactions" className="mt-0">
            <Transactions />
          </TabsContent>

          <TabsContent value="add" className="mt-0">
            <AddTransaction />
          </TabsContent>

          <TabsContent value="carbon" className="mt-0">
            <CarbonFootprint />
          </TabsContent>

          <TabsContent value="profile" className="mt-0">
            <Profile onNavigate={setActiveTab} />
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <Settings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};
