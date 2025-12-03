import { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Wallet, DollarSign, Calendar } from "lucide-react";
import { API, axios, toast } from "../App";

const CashDrawer = () => {
  const [balance, setBalance] = useState({ cash: 0, gpay: 0 });
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawDialog, setWithdrawDialog] = useState(false);
  const [addMoneyDialog, setAddMoneyDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [newWithdrawal, setNewWithdrawal] = useState({
    cash_amount: 0,
    gpay_amount: 0,
    description: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [newDeposit, setNewDeposit] = useState({
    cash_amount: 0,
    gpay_amount: 0,
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [balRes, transRes] = await Promise.all([
        axios.get(`${API}/balance`),
        axios.get(`${API}/money-transfers`),
      ]);
      setBalance(balRes.data);
      // Filter for withdrawal transactions only
      const withdrawalTransfers = transRes.data.filter(
        (t) => t.transfer_type === "cash_withdrawal" || t.transfer_type === "gpay_withdrawal"
      );
      setWithdrawals(withdrawalTransfers);
    } catch (error) {
      toast.error("Failed to load data");
    }
  };

  const handleWithdrawAll = async () => {
    if (balance.cash === 0 && balance.gpay === 0) {
      toast.error("No balance to withdraw");
      return;
    }

    if (!window.confirm(`Withdraw all? Cash: ₹${balance.cash.toFixed(2)}, GPay: ₹${balance.gpay.toFixed(2)}`)) {
      return;
    }

    try {
      const promises = [];
      
      if (balance.cash > 0) {
        promises.push(
          axios.post(`${API}/money-transfers`, {
            transfer_type: "cash_withdrawal",
            amount: balance.cash,
            description: "Full cash withdrawal",
            date: new Date().toISOString().split("T")[0],
          })
        );
      }

      if (balance.gpay > 0) {
        promises.push(
          axios.post(`${API}/money-transfers`, {
            transfer_type: "gpay_withdrawal",
            amount: balance.gpay,
            description: "Full GPay withdrawal",
            date: new Date().toISOString().split("T")[0],
          })
        );
      }

      await Promise.all(promises);
      toast.success("All money withdrawn successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to withdraw money");
    }
  };

  const handleCustomWithdraw = async () => {
    const cashAmount = parseFloat(newWithdrawal.cash_amount) || 0;
    const gpayAmount = parseFloat(newWithdrawal.gpay_amount) || 0;

    if (cashAmount <= 0 && gpayAmount <= 0) {
      toast.error("Please enter an amount to withdraw");
      return;
    }

    if (cashAmount > balance.cash) {
      toast.error("Insufficient cash balance");
      return;
    }

    if (gpayAmount > balance.gpay) {
      toast.error("Insufficient GPay balance");
      return;
    }

    try {
      const promises = [];

      if (cashAmount > 0) {
        promises.push(
          axios.post(`${API}/money-transfers`, {
            transfer_type: "cash_withdrawal",
            amount: cashAmount,
            description: newWithdrawal.description || "Cash withdrawal",
            date: newWithdrawal.date,
          })
        );
      }

      if (gpayAmount > 0) {
        promises.push(
          axios.post(`${API}/money-transfers`, {
            transfer_type: "gpay_withdrawal",
            amount: gpayAmount,
            description: newWithdrawal.description || "GPay withdrawal",
            date: newWithdrawal.date,
          })
        );
      }

      await Promise.all(promises);
      toast.success("Money withdrawn successfully");
      setNewWithdrawal({
        cash_amount: 0,
        gpay_amount: 0,
        description: "",
        date: new Date().toISOString().split("T")[0],
      });
      setWithdrawDialog(false);
      loadData();
    } catch (error) {
      toast.error("Failed to withdraw money");
    }
  };

  const getTotalWithdrawals = () => {
    return withdrawals.reduce((sum, w) => sum + w.amount, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Cash Drawer
          </h1>
          <p className="text-gray-600 mt-2">Withdraw money from the business at the end of the day</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Available Cash</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ₹{balance.cash.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Available GPay</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ₹{balance.gpay.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Withdrawn</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                ₹{getTotalWithdrawals().toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center text-red-700">
                <DollarSign className="w-5 h-5 mr-2" />
                Withdraw All Money
              </CardTitle>
              <CardDescription className="text-red-600">
                Take out all cash and GPay balance at once
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleWithdrawAll}
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={balance.cash === 0 && balance.gpay === 0}
              >
                Withdraw All (₹{(balance.cash + balance.gpay).toFixed(2)})
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-700">
                <Wallet className="w-5 h-5 mr-2" />
                Custom Withdrawal
              </CardTitle>
              <CardDescription className="text-blue-600">
                Withdraw specific amounts of cash or GPay
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={withdrawDialog} onOpenChange={setWithdrawDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="w-4 h-4 mr-2" /> Custom Withdraw
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Custom Withdrawal</DialogTitle>
                    <DialogDescription>Specify amounts to withdraw</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Cash Amount (₹)</Label>
                      <Input
                        type="number"
                        min="0"
                        max={balance.cash}
                        value={newWithdrawal.cash_amount}
                        onChange={(e) => setNewWithdrawal({ ...newWithdrawal, cash_amount: parseFloat(e.target.value) || 0 })}
                        placeholder={`Available: ₹${balance.cash.toFixed(2)}`}
                      />
                    </div>
                    <div>
                      <Label>GPay Amount (₹)</Label>
                      <Input
                        type="number"
                        min="0"
                        max={balance.gpay}
                        value={newWithdrawal.gpay_amount}
                        onChange={(e) => setNewWithdrawal({ ...newWithdrawal, gpay_amount: parseFloat(e.target.value) || 0 })}
                        placeholder={`Available: ₹${balance.gpay.toFixed(2)}`}
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input
                        value={newWithdrawal.description}
                        onChange={(e) => setNewWithdrawal({ ...newWithdrawal, description: e.target.value })}
                        placeholder="Optional description"
                      />
                    </div>
                    <div>
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={newWithdrawal.date}
                        onChange={(e) => setNewWithdrawal({ ...newWithdrawal, date: e.target.value })}
                      />
                    </div>
                    <Button onClick={handleCustomWithdraw} className="w-full">
                      Withdraw ₹{((parseFloat(newWithdrawal.cash_amount) || 0) + (parseFloat(newWithdrawal.gpay_amount) || 0)).toFixed(2)}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Withdrawal History</CardTitle>
            <CardDescription>All cash drawer withdrawals</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500">
                      No withdrawals yet
                    </TableCell>
                  </TableRow>
                ) : (
                  withdrawals.map((withdrawal) => (
                    <TableRow key={withdrawal.id}>
                      <TableCell>{new Date(withdrawal.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          withdrawal.transfer_type === 'cash_withdrawal' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {withdrawal.transfer_type === 'cash_withdrawal' ? 'Cash' : 'GPay'}
                        </span>
                      </TableCell>
                      <TableCell>{withdrawal.description || "-"}</TableCell>
                      <TableCell className="font-semibold text-red-600">-₹{withdrawal.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CashDrawer;
