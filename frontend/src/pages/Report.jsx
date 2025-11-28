import { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, TrendingUp, TrendingDown } from "lucide-react";
import { API, axios, toast } from "../App";

const Report = () => {
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split("T")[0]);
  const [monthlyYear, setMonthlyYear] = useState(new Date().getFullYear());
  const [monthlyMonth, setMonthlyMonth] = useState(new Date().getMonth() + 1);
  const [dailyReport, setDailyReport] = useState(null);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [allSales, setAllSales] = useState([]);
  const [creditSales, setCreditSales] = useState([]);
  const [returns, setReturns] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [returnDialog, setReturnDialog] = useState(false);
  const [returnItems, setReturnItems] = useState([]);
  const [refundMethod, setRefundMethod] = useState("cash");
  const [returnReason, setReturnReason] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDailyReport();
    loadAllSales();
    loadCreditSales();
    loadReturns();
  }, []);

  const loadDailyReport = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/reports/daily?date=${dailyDate}`);
      setDailyReport(response.data);
    } catch (error) {
      toast.error("Failed to load daily report");
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyReport = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/reports/monthly?year=${monthlyYear}&month=${monthlyMonth}`);
      setMonthlyReport(response.data);
    } catch (error) {
      toast.error("Failed to load monthly report");
    } finally {
      setLoading(false);
    }
  };

  const loadAllSales = async () => {
    try {
      const response = await axios.get(`${API}/sales`);
      setAllSales(response.data);
    } catch (error) {
      toast.error("Failed to load sales");
    }
  };

  const loadCreditSales = async () => {
    try {
      const response = await axios.get(`${API}/sales/credit`);
      setCreditSales(response.data);
    } catch (error) {
      toast.error("Failed to load credit sales");
    }
  };

  const loadReturns = async () => {
    try {
      const response = await axios.get(`${API}/returns`);
      setReturns(response.data);
    } catch (error) {
      toast.error("Failed to load returns");
    }
  };

  const getFilteredSales = () => {
    if (!invoiceDate) return allSales;
    
    const targetDate = new Date(invoiceDate);
    return allSales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate.toDateString() === targetDate.toDateString();
    });
  };

  const getFilteredReturns = () => {
    if (!invoiceDate) return returns;
    
    const targetDate = new Date(invoiceDate);
    return returns.filter(ret => {
      const retDate = new Date(ret.date);


  const handleProcessReturn = async () => {
    if (!selectedSale || returnItems.length === 0) {
      toast.error("Please select items to return");
      return;
    }

    const returnData = {
      sale_id: selectedSale.id,
      items: returnItems,
      refund_method: refundMethod,
      reason: returnReason || null,
    };

    try {
      await axios.post(`${API}/returns`, returnData);
      toast.success("Return processed successfully");
      setReturnDialog(false);
      setReturnItems([]);
      setReturnReason("");
      setSelectedSale(null);
      loadAllSales();
      loadReturns();
    } catch (error) {
      toast.error("Failed to process return");
    }
  };

  const handleToggleReturnItem = (item) => {
    const existingIndex = returnItems.findIndex(ri => ri.name === item.name);
    
    if (existingIndex >= 0) {
      // Remove item
      setReturnItems(returnItems.filter((_, idx) => idx !== existingIndex));
    } else {
      // Add item
      setReturnItems([...returnItems, {
        product_id: item.product_id || null,
        set_id: item.set_id || null,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total
      }]);
    }
  };

      return retDate.toDateString() === targetDate.toDateString();
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Reports & Analytics
          </h1>
          <p className="text-gray-600 mt-2">View sales, expenses, and profit reports</p>
        </div>

        <Tabs defaultValue="daily" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="daily" data-testid="tab-daily">Daily Report</TabsTrigger>
            <TabsTrigger value="monthly" data-testid="tab-monthly">Monthly Report</TabsTrigger>
            <TabsTrigger value="invoices" data-testid="tab-invoices">Invoices/Returns</TabsTrigger>
            <TabsTrigger value="credit" data-testid="tab-credit">Credit Sales</TabsTrigger>
          </TabsList>

          <TabsContent value="daily">
            <Card>
              <CardHeader>
                <CardTitle>Daily Report</CardTitle>
                <CardDescription>Sales, expenses, and profit for a specific day</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-end space-x-4">
                  <div className="flex-1">
                    <Label>Select Date</Label>
                    <Input
                      data-testid="daily-date-input"
                      type="date"
                      value={dailyDate}
                      onChange={(e) => setDailyDate(e.target.value)}
                    />
                  </div>
                  <Button data-testid="load-daily-report-btn" onClick={loadDailyReport} disabled={loading}>
                    Load Report
                  </Button>
                </div>

                {dailyReport && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-gray-600">Total Sales</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-green-600" data-testid="daily-total-sales">
                            ₹{dailyReport.sales.total.toFixed(2)}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{dailyReport.sales.count} transactions</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-gray-600">Retail Sales</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold" data-testid="daily-retail-sales">
                            ₹{dailyReport.sales.retail.toFixed(2)}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-gray-600">Wholesale Sales</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold" data-testid="daily-wholesale-sales">
                            ₹{dailyReport.sales.wholesale.toFixed(2)}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-red-600" data-testid="daily-total-expenses">
                            ₹{dailyReport.expenses.total.toFixed(2)}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className={dailyReport.profit >= 0 ? "border-green-300" : "border-red-300"}>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          {dailyReport.profit >= 0 ? (
                            <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                          ) : (
                            <TrendingDown className="w-5 h-5 mr-2 text-red-600" />
                          )}
                          {dailyReport.profit >= 0 ? "Profit" : "Loss"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Total Revenue:</span>
                            <span className="font-medium">₹{dailyReport.sales.total.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cost of Goods:</span>
                            <span className="font-medium text-red-600">- ₹{dailyReport.cost.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Expenses:</span>
                            <span className="font-medium text-red-600">- ₹{dailyReport.expenses.total.toFixed(2)}</span>
                          </div>
                          <div className="border-t pt-2 flex justify-between text-lg font-bold">
                            <span>{dailyReport.profit >= 0 ? "Net Profit:" : "Net Loss:"}</span>
                            <span
                              className={dailyReport.profit >= 0 ? "text-green-600" : "text-red-600"}
                              data-testid="daily-profit"
                            >
                              ₹{Math.abs(dailyReport.profit).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {Object.keys(dailyReport.expenses.by_category).length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Expenses by Category</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {Object.entries(dailyReport.expenses.by_category).map(([cat, amount]) => (
                              <div key={cat} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span>{cat}</span>
                                <span className="font-medium text-red-600">₹{amount.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {dailyReport.sales_list && dailyReport.sales_list.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Sales Transactions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>Payment</TableHead>
                                <TableHead>Discount</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {dailyReport.sales_list.map((sale, idx) => (
                                <TableRow 
                                  key={idx} 
                                  className="cursor-pointer hover:bg-gray-50"
                                  onClick={() => setSelectedSale(sale)}
                                >
                                  <TableCell className="capitalize">{sale.sale_type}</TableCell>
                                  <TableCell className="text-blue-600 hover:underline">{sale.items.length} items</TableCell>
                                  <TableCell className="capitalize">{sale.payment_method}</TableCell>
                                  <TableCell>₹{sale.discount_amount.toFixed(2)}</TableCell>
                                  <TableCell className="text-right font-medium">₹{sale.total.toFixed(2)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monthly">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Report</CardTitle>
                <CardDescription>Sales, expenses, and profit for a specific month</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-end space-x-4">
                  <div className="flex-1">
                    <Label>Year</Label>
                    <Input
                      data-testid="monthly-year-input"
                      type="number"
                      value={monthlyYear}
                      onChange={(e) => setMonthlyYear(parseInt(e.target.value))}
                    />
                  </div>
                  <div className="flex-1">
                    <Label>Month</Label>
                    <Input
                      data-testid="monthly-month-input"
                      type="number"
                      min="1"
                      max="12"
                      value={monthlyMonth}
                      onChange={(e) => setMonthlyMonth(parseInt(e.target.value))}
                    />
                  </div>
                  <Button data-testid="load-monthly-report-btn" onClick={loadMonthlyReport} disabled={loading}>
                    Load Report
                  </Button>
                </div>

                {monthlyReport && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-gray-600">Total Sales</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-green-600" data-testid="monthly-total-sales">
                            ₹{monthlyReport.sales.total.toFixed(2)}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{monthlyReport.sales.count} transactions</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-gray-600">Retail Sales</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold" data-testid="monthly-retail-sales">
                            ₹{monthlyReport.sales.retail.toFixed(2)}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-gray-600">Wholesale Sales</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold" data-testid="monthly-wholesale-sales">
                            ₹{monthlyReport.sales.wholesale.toFixed(2)}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-red-600" data-testid="monthly-total-expenses">
                            ₹{monthlyReport.expenses.total.toFixed(2)}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className={monthlyReport.profit >= 0 ? "border-green-300" : "border-red-300"}>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          {monthlyReport.profit >= 0 ? (
                            <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                          ) : (
                            <TrendingDown className="w-5 h-5 mr-2 text-red-600" />
                          )}
                          {monthlyReport.profit >= 0 ? "Profit" : "Loss"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Total Revenue:</span>
                            <span className="font-medium">₹{monthlyReport.sales.total.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cost of Goods:</span>
                            <span className="font-medium text-red-600">- ₹{monthlyReport.cost.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Expenses:</span>
                            <span className="font-medium text-red-600">- ₹{monthlyReport.expenses.total.toFixed(2)}</span>
                          </div>
                          <div className="border-t pt-2 flex justify-between text-lg font-bold">
                            <span>{monthlyReport.profit >= 0 ? "Net Profit:" : "Net Loss:"}</span>
                            <span
                              className={monthlyReport.profit >= 0 ? "text-green-600" : "text-red-600"}
                              data-testid="monthly-profit"
                            >
                              ₹{Math.abs(monthlyReport.profit).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {Object.keys(monthlyReport.expenses.by_category).length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Expenses by Category</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {Object.entries(monthlyReport.expenses.by_category).map(([cat, amount]) => (
                              <div key={cat} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span>{cat}</span>
                                <span className="font-medium text-red-600">₹{amount.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <CardTitle>Sales Invoices & Returns</CardTitle>
                <CardDescription>View all sales invoices and process returns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-end space-x-4">
                  <div className="flex-1">
                    <Label>Filter by Date (Optional)</Label>
                    <Input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                    />
                  </div>
                  {invoiceDate && (
                    <Button 
                      variant="ghost" 
                      onClick={() => setInvoiceDate("")}
                    >
                      Clear Filter
                    </Button>
                  )}
                </div>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">All Sales</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredSales().map((sale) => (
                        <TableRow key={sale.id} className="cursor-pointer hover:bg-gray-50">
                          <TableCell 
                            className="font-medium text-blue-600"
                            onClick={() => setSelectedSale(sale)}
                          >
                            {sale.id.substring(0, 8).toUpperCase()}
                          </TableCell>
                          <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                          <TableCell>{sale.customer_name || "-"}</TableCell>
                          <TableCell className="capitalize">{sale.sale_type}</TableCell>
                          <TableCell>₹{sale.total.toFixed(2)}</TableCell>
                          <TableCell className="capitalize">{sale.payment_method}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedSale(sale)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {returns.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Returns</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Return ID</TableHead>
                          <TableHead>Sale ID</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Refund Amount</TableHead>
                          <TableHead>Method</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getFilteredReturns().map((ret) => (
                          <TableRow key={ret.id}>
                            <TableCell>{ret.id.substring(0, 8).toUpperCase()}</TableCell>
                            <TableCell>{ret.sale_id.substring(0, 8).toUpperCase()}</TableCell>
                            <TableCell>{new Date(ret.date).toLocaleDateString()}</TableCell>
                            <TableCell className="text-red-600">₹{ret.refund_amount.toFixed(2)}</TableCell>
                            <TableCell className="capitalize">{ret.refund_method}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="credit">
            <Card>
              <CardHeader>
                <CardTitle>Credit Sales</CardTitle>
                <CardDescription>Track credit sales and outstanding balances</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {creditSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell 
                          className="font-medium text-blue-600 cursor-pointer"
                          onClick={() => setSelectedSale(sale)}
                        >
                          {sale.id.substring(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                        <TableCell>{sale.customer_name}</TableCell>
                        <TableCell>{sale.customer_phone}</TableCell>
                        <TableCell>₹{sale.total.toFixed(2)}</TableCell>
                        <TableCell className="text-green-600">₹{sale.amount_paid?.toFixed(2) || "0.00"}</TableCell>
                        <TableCell className="text-red-600 font-semibold">₹{sale.balance_amount?.toFixed(2) || "0.00"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Sale Details Dialog */}
        {selectedSale && (
          <Dialog open={!!selectedSale} onOpenChange={() => setSelectedSale(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Invoice #{selectedSale.id.substring(0, 8).toUpperCase()}</DialogTitle>
                <DialogDescription>
                  {new Date(selectedSale.date).toLocaleString()} - {selectedSale.sale_type} Sale
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {selectedSale.customer_name && (
                  <div>
                    <h3 className="font-semibold mb-2">Customer Details</h3>
                    <p>Name: {selectedSale.customer_name}</p>
                    {selectedSale.customer_phone && <p>Phone: {selectedSale.customer_phone}</p>}
                  </div>
                )}
                
                <div>
                  <h3 className="font-semibold mb-2">Items Sold</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedSale.items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>₹{item.unit_price.toFixed(2)}</TableCell>
                          <TableCell>₹{item.total.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{selectedSale.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedSale.discount_amount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Discount:</span>
                      <span>- ₹{selectedSale.discount_amount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>₹{selectedSale.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span className="capitalize">{selectedSale.payment_method}</span>
                  </div>
                  {selectedSale.payment_type === "credit" && (
                    <>
                      <div className="flex justify-between text-green-600">
                        <span>Amount Paid:</span>
                        <span>₹{selectedSale.amount_paid?.toFixed(2) || "0.00"}</span>
                      </div>
                      <div className="flex justify-between text-red-600 font-semibold">
                        <span>Balance:</span>
                        <span>₹{selectedSale.balance_amount?.toFixed(2) || "0.00"}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default Report;
