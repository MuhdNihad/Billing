import Navigation from "../components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, Banknote, Wallet, FileText, TrendingUp, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: "Inventory Management",
      description: "Manage categories, products, and sets with multiple unit types",
      icon: Package,
      path: "/inventory",
      color: "bg-blue-500",
    },
    {
      title: "Retail Sales",
      description: "Process retail transactions with discounts and payment tracking",
      icon: ShoppingCart,
      path: "/retail",
      color: "bg-green-500",
    },
    {
      title: "Wholesale Sales",
      description: "Handle bulk orders with wholesale pricing",
      icon: Banknote,
      path: "/wholesale",
      color: "bg-purple-500",
    },
    {
      title: "Expense Management",
      description: "Track expenses across multiple categories",
      icon: Wallet,
      path: "/expense",
      color: "bg-orange-500",
    },
    {
      title: "Cash Drawer",
      description: "Withdraw money from the business at end of day",
      icon: DollarSign,
      path: "/cash-drawer",
      color: "bg-pink-500",
    },
    {
      title: "Reports & Analytics",
      description: "View daily and monthly sales, expenses, and profit reports",
      icon: FileText,
      path: "/report",
      color: "bg-red-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Billing Application
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Complete solution for managing inventory, sales, expenses, and generating comprehensive reports
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.path}
                data-testid={`feature-card-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
                className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 border-transparent hover:border-indigo-200"
                onClick={() => navigate(feature.path)}
              >
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-3`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-sm">{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-indigo-600 font-medium text-sm">
                    <span>Explore</span>
                    <TrendingUp className="w-4 h-4 ml-2" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Home;
