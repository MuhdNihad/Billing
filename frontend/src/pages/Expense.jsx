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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2, Wallet, ArrowLeftRight, Edit2, Calendar } from "lucide-react";
import { API, axios, toast } from "../App";

const Expense = () => {
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [balance, setBalance] = useState({ cash: 0, gpay: 0 });
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [editCategoryDialog, setEditCategoryDialog] = useState(false);
  const [expenseDialog, setExpenseDialog] = useState(false);
  const [transferDialog, setTransferDialog] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [newExpense, setNewExpense] = useState({
    category_id: "",
    amount: 0,
    description: "",
    payment_source: "cash",
    date: new Date().toISOString().split("T")[0],
  });
  const [newTransfer, setNewTransfer] = useState({
    transfer_type: "cash_to_gpay",
    amount: 0,
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [catRes, expRes, balRes, transRes] = await Promise.all([
        axios.get(`${API}/expense-categories`),
        axios.get(`${API}/expenses`),
        axios.get(`${API}/balance`),
        axios.get(`${API}/money-transfers`),
      ]);
      setCategories(catRes.data);
      setExpenses(expRes.data);
      setBalance(balRes.data);
      setTransfers(transRes.data);
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

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    try {
      await axios.put(`${API}/expense-categories/${editingCategory.id}`, { 
        name: editingCategory.name 
      });
      toast.success("Category updated");
      setEditingCategory(null);
      setEditCategoryDialog(false);
      loadData();
    } catch (error) {
      toast.error("Failed to update category");
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
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
        payment_source: "cash",
        date: new Date().toISOString().split("T")[0],
      });
      setExpenseDialog(false);
      loadData();
    } catch (error) {
      toast.error("Failed to record expense");
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      await axios.delete(`${API}/expenses/${id}`);
      toast.success("Expense deleted");
      loadData();
    } catch (error) {
      toast.error("Failed to delete expense");
    }
  };

  const handleCreateTransfer = async () => {
    if (!newTransfer.amount || newTransfer.amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }
    try {
      await axios.post(`${API}/money-transfers`, newTransfer);
      toast.success("Money transferred");
      setNewTransfer({
        transfer_type: "cash_to_gpay",
        amount: 0,
        description: "",
        date: new Date().toISOString().split("T")[0],
      });
      setTransferDialog(false);
      loadData();
    } catch (error) {
      toast.error("Failed to transfer money");
    }
  };

  const handleDeleteTransfer = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transfer?")) return;
    try {
      await axios.delete(`${API}/money-transfers/${id}`);
      toast.success("Transfer deleted");
      loadData();
    } catch (error) {
      toast.error("Failed to delete transfer");
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

  const getFilteredExpenses = () => {
    if (!selectedDate) return expenses;
    
    const targetDate = new Date(selectedDate);
    return expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate.toDateString() === targetDate.toDateString();
    });
  };

  const getDailyTotal = () => {
    return getFilteredExpenses().reduce((sum, exp) => sum + exp.amount, 0);
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Cash Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ₹{balance.cash.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">GPay Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ₹{balance.gpay.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600" data-testid="total-expenses">
                ₹{getTotalExpenses().toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Daily Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                ₹{getDailyTotal().toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="expenses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="expenses" data-testid="tab-expenses">Expenses</TabsTrigger>
            <TabsTrigger value="categories" data-testid="tab-categories">Categories</TabsTrigger>
            <TabsTrigger value="transfers" data-testid="tab-transfers">Money Transfer</TabsTrigger>
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
                          <Label>Payment Source</Label>
                          <RadioGroup 
                            value={newExpense.payment_source} 
                            onValueChange={(value) => setNewExpense({ ...newExpense, payment_source: value })}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="cash" id="pay-cash" />
                              <Label htmlFor="pay-cash">Cash</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="gpay" id="pay-gpay" />
                              <Label htmlFor="pay-gpay">GPay</Label>
                            </div>
                          </RadioGroup>
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
                <div className="mb-4">
                  <Label className="flex items-center mb-2">
                    <Calendar className="w-4 h-4 mr-2" />
                    Filter by Date
                  </Label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    placeholder="Select date"
                    className="max-w-xs"
                  />
                  {selectedDate && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedDate("")}
                      className="ml-2"
                    >
                      Clear Filter
                    </Button>
                  )}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredExpenses().map((exp) => (
                      <TableRow key={exp.id}>
                        <TableCell>{new Date(exp.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{exp.category_name}</TableCell>
                        <TableCell>{exp.description || "-"}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            exp.payment_source === 'cash' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {exp.payment_source === 'cash' ? 'Cash' : 'GPay'}
                          </span>
                        </TableCell>
                        <TableCell className="text-red-600 font-semibold">₹{exp.amount.toFixed(2)}</TableCell>
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
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingCategory(cat);
                              setEditCategoryDialog(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4 text-blue-500" />
                          </Button>
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

          <TabsContent value="transfers">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center">
                      <ArrowLeftRight className="w-5 h-5 mr-2" />
                      Money Transfers
                    </CardTitle>
                    <CardDescription>Transfer money between Cash and GPay</CardDescription>
                  </div>
                  <Dialog open={transferDialog} onOpenChange={setTransferDialog}>
                    <DialogTrigger asChild>
                      <Button data-testid="add-transfer-btn">
                        <Plus className="w-4 h-4 mr-2" /> New Transfer
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Transfer Money</DialogTitle>
                        <DialogDescription>Move money between Cash and GPay</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Transfer Type</Label>
                          <RadioGroup 
                            value={newTransfer.transfer_type} 
                            onValueChange={(value) => setNewTransfer({ ...newTransfer, transfer_type: value })}
                          >
                            <div className="space-y-3">
                              <div className="font-semibold text-sm text-gray-700">Own Money Transfers:</div>
                              <div className="flex items-center space-x-2 ml-4">
                                <RadioGroupItem value="cash_to_gpay" id="cash-to-gpay" />
                                <Label htmlFor="cash-to-gpay">Cash → GPay (My money)</Label>
                              </div>
                              <div className="flex items-center space-x-2 ml-4">
                                <RadioGroupItem value="gpay_to_cash" id="gpay-to-cash" />
                                <Label htmlFor="gpay-to-cash">GPay → Cash (My money)</Label>
                              </div>
                              
                              <div className="font-semibold text-sm text-gray-700 mt-4">Customer Exchanges:</div>
                              <div className="flex items-center space-x-2 ml-4">
                                <RadioGroupItem value="customer_cash_to_gpay" id="customer-cash-to-gpay" />
                                <Label htmlFor="customer-cash-to-gpay">Customer gives Cash, wants GPay</Label>
                              </div>
                              <div className="flex items-center space-x-2 ml-4">
                                <RadioGroupItem value="customer_gpay_to_cash" id="customer-gpay-to-cash" />
                                <Label htmlFor="customer-gpay-to-cash">Customer wants Cash, will GPay</Label>
                              </div>
                            </div>
                          </RadioGroup>
                        </div>
                        <div>
                          <Label>Amount (₹)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={newTransfer.amount}
                            onChange={(e) => setNewTransfer({ ...newTransfer, amount: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Input
                            value={newTransfer.description}
                            onChange={(e) => setNewTransfer({ ...newTransfer, description: e.target.value })}
                            placeholder="Optional description"
                          />
                        </div>
                        <div>
                          <Label>Date</Label>
                          <Input
                            type="date"
                            value={newTransfer.date}
                            onChange={(e) => setNewTransfer({ ...newTransfer, date: e.target.value })}
                          />
                        </div>
                        <Button onClick={handleCreateTransfer} className="w-full">
                          Transfer Money
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
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transfers.filter(t => !['cash_withdrawal', 'gpay_withdrawal'].includes(t.transfer_type)).map((transfer) => {
                      let typeLabel = '';
                      let typeColor = 'bg-purple-100 text-purple-800';
                      
                      if (transfer.transfer_type === 'cash_to_gpay') {
                        typeLabel = 'Cash → GPay (Own)';
                      } else if (transfer.transfer_type === 'gpay_to_cash') {
                        typeLabel = 'GPay → Cash (Own)';
                      } else if (transfer.transfer_type === 'customer_cash_to_gpay') {
                        typeLabel = 'Customer Cash → GPay';
                        typeColor = 'bg-green-100 text-green-800';
                      } else if (transfer.transfer_type === 'customer_gpay_to_cash') {
                        typeLabel = 'Customer GPay → Cash';
                        typeColor = 'bg-blue-100 text-blue-800';
                      }
                      
                      return (
                        <TableRow key={transfer.id}>
                          <TableCell>{new Date(transfer.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${typeColor}`}>
                              {typeLabel}
                            </span>
                          </TableCell>
                          <TableCell>{transfer.description || "-"}</TableCell>
                          <TableCell className="font-semibold">₹{transfer.amount.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTransfer(transfer.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Category Dialog */}
      <Dialog open={editCategoryDialog} onOpenChange={setEditCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update category name</DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <div className="space-y-4">
              <div>
                <Label>Category Name</Label>
                <Input
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                />
              </div>
              <Button onClick={handleUpdateCategory} className="w-full">
                Update Category
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Expense;
