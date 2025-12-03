import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Package, ShoppingCart, Banknote, Wallet, FileText, DollarSign } from "lucide-react";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/inventory", label: "Inventory", icon: Package },
    { path: "/retail", label: "Retail", icon: ShoppingCart },
    { path: "/wholesale", label: "Wholesale", icon: Banknote },
    { path: "/expense", label: "Expense", icon: Wallet },
    { path: "/cash-drawer", label: "Cash Drawer", icon: DollarSign },
    { path: "/report", label: "Report", icon: FileText },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center space-x-2 transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
