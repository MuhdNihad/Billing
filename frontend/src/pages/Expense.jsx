import { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Wallet } from "lucide-react";
import { API, axios, toast } from "../App";

const Expense = () => {
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [expenseDialog, setExpenseDialog] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newExpense, setNewExpense] = useState({
    category_id: "",
    amount: 0,
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [catRes, expRes] = await Promise.all([
        axios.get(`${API}/expense-categories`),
        axios.get(`${API}/expenses`),
      ]);
      setCategories(catRes.data);
      setExpenses(expRes.data);
    } catch (error) {
      toast.error("Failed to load data");
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) {
      toast.error("Category name is required");
      return;
    }
    try {
      await axios.post(`${API}/expense-categories`, { name: newCategory });
      toast.success("Category created");
      setNewCategory("");
      setCategoryDialog(false);
      loadData();
    } catch (error) {
      toast.error("Failed to create category");
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await axios.delete(`${API}/expense-categories/${id}`);
      toast.success("Category deleted");
      loadData();
    } catch (error) {
      toast.error("Failed to delete category");
    }
  };

  const handleCreateExpense = async () => {
    if (!newExpense.category_id || !newExpense.amount) {
      toast.error("Category and amount are required");
      return;
    }
    try {
      await axios.post(`${API}/expenses`, newExpense);
      toast.success("Expense recorded");
      setNewExpense({
        category_id: "",
        amount: 0,
        description: "",
        date: new Date().toISOString().split("T")[0],
      });
      setExpenseDialog(false);
      loadData();
    } catch (error) {
      toast.error("Failed to record expense");
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await axios.delete(`${API}/expenses/${id}`);
      toast.success("Expense deleted");
      loadData();
    } catch (error) {
      toast.error("Failed to delete expense");
    }
  };

  const getTotalExpenses = () => {
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  };

  const getExpensesByCategory = () => {
    const grouped = {};
    expenses.forEach((exp) => {
      if (!grouped[exp.category_name]) {
        grouped[exp.category_name] = 0;
      }
      grouped[exp.category_name] += exp.amount;
    });
    return grouped;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Expense Management
          </h1>
          <p className="text-gray-600 mt-2">Track and manage business expenses</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600" data-testid="total-expenses">
                ₹{getTotalExpenses().toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(getExpensesByCategory()).map(([cat, amount]) => (
                  <div key={cat} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{cat}</span>
                    <span className="text-red-600">₹{amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="expenses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="expenses" data-testid="tab-expenses">Expenses</TabsTrigger>
            <TabsTrigger value="categories" data-testid="tab-categories">Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="expenses">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>All Expenses</CardTitle>
                    <CardDescription>Record and track business expenses</CardDescription>
                  </div>
                  <Dialog open={expenseDialog} onOpenChange={setExpenseDialog}>
                    <DialogTrigger asChild>
                      <Button data-testid="add-expense-btn">
                        <Plus className="w-4 h-4 mr-2" /> Add Expense
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Record New Expense</DialogTitle>
                        <DialogDescription>Enter expense details</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Category</Label>
                          <Select
                            value={newExpense.category_id}
                            onValueChange={(value) => setNewExpense({ ...newExpense, category_id: value })}
                          >
                            <SelectTrigger data-testid="expense-category-select">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Amount (₹)</Label>
                          <Input
                            data-testid="expense-amount-input"
                            type="number"
                            min="0"
                            value={newExpense.amount}
                            onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Input
                            data-testid="expense-description-input"
                            value={newExpense.description}
                            onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                            placeholder="Optional description"
                          />
                        </div>
                        <div>
                          <Label>Date</Label>
                          <Input
                            data-testid="expense-date-input"
                            type="date"
                            value={newExpense.date}
                            onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                          />
                        </div>
                        <Button data-testid="create-expense-btn" onClick={handleCreateExpense} className="w-full">
                          Record Expense
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((exp) => (
                      <TableRow key={exp.id}>
                        <TableCell>{new Date(exp.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{exp.category_name}</TableCell>
                        <TableCell>{exp.description || "-"}</TableCell>
                        <TableCell className="text-red-600">₹{exp.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            data-testid={`delete-expense-${exp.id}`}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteExpense(exp.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Expense Categories</CardTitle>
                    <CardDescription>Organize expenses by categories</CardDescription>
                  </div>
                  <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}>
                    <DialogTrigger asChild>
                      <Button data-testid="add-expense-category-btn">
                        <Plus className="w-4 h-4 mr-2" /> Add Category
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Expense Category</DialogTitle>
                        <DialogDescription>Enter category name</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Category Name</Label>
                          <Input
                            data-testid="expense-category-name-input"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="e.g., Staff Salaries, Electricity"
                          />
                        </div>
                        <Button data-testid="create-expense-category-btn" onClick={handleCreateCategory} className="w-full">
                          Create Category
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((cat) => (
                      <TableRow key={cat.id}>
                        <TableCell className="font-medium">{cat.name}</TableCell>
                        <TableCell>{new Date(cat.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            data-testid={`delete-expense-category-${cat.id}`}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCategory(cat.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Expense;
