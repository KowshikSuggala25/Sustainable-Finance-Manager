import { Button } from "@/components/ui/button";
import {
  Home,
  TrendingUp,
  PlusCircle,
  Settings,
  User,
  Menu,
  X,
  LogOut,
  Sprout,
} from "lucide-react";
import { useState } from "react";
import { href, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { signOut } = useAuth();

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/transactions", label: "Transactions", icon: TrendingUp },
    { href: "/add", label: "Add Transaction", icon: PlusCircle },
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/carbon", label: "Carbon Footprint", icon: Sprout },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="glass-card border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center glow-primary">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground font-heading">
              FinanceTracker
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? "gradient-primary text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </div>

          {/* User Profile */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/profile">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 hover-scale transition-transform"
              >
                <User className="w-4 h-4" />
                Profile
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 hover-scale transition-transform"
              onClick={signOut}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10 mt-2">
            <div className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? "gradient-primary text-white"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-white/10 pt-2 mt-2 space-y-2">
                <Link to="/profile" className="w-full">
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <User className="w-4 h-4" />
                    Profile
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={signOut}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
