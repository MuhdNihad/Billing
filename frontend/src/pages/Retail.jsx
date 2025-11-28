import { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, ShoppingCart, Printer } from "lucide-react";
import { API, axios, toast } from "../App";
import PrintBill from "../components/PrintBill";

const Retail = () => {
  const [products, setProducts] = useState([]);
  const [sets, setSets] = useState([]);
  const [cart, setCart] = useState([]);
  const [itemType, setItemType] = useState("product");
  const [selectedItem, setSelectedItem] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentType, setPaymentType] = useState("full");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cashReceived, setCashReceived] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [gpayReturn, setGpayReturn] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [printType, setPrintType] = useState("a4");
  const [completedSale, setCompletedSale] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prodRes, setRes] = await Promise.all([
        axios.get(`${API}/products`),
        axios.get(`${API}/sets`),
      ]);
      setProducts(prodRes.data);
      setSets(setRes.data);
    } catch (error) {
      toast.error("Failed to load data");
    }
  };

  const addToCart = () => {
    if (!selectedItem) {
      toast.error("Please select an item");
      return;
    }

    if (itemType === "product") {
      const product = products.find((p) => p.id === selectedItem);
      if (!product) return;

      if (product.quantity < quantity) {
        toast.error("Insufficient stock");
        return;
      }

      const existing = cart.find((item) => item.product_id === product.id);
      if (existing) {
        setCart(
          cart.map((item) =>
            item.product_id === product.id
              ? { ...item, quantity: item.quantity + quantity, total: (item.quantity + quantity) * product.retail_price }
              : item
          )
        );
      } else {
        setCart([
          ...cart,
          {
            product_id: product.id,
            name: product.name,
            quantity: quantity,
            unit_price: product.retail_price,
            total: quantity * product.retail_price,
          },
        ]);
      }
    } else {
      const set = sets.find((s) => s.id === selectedItem);
      if (!set) return;

      // Check if all products in set are available
      let canSell = true;
      let setPrice = 0;
      for (const item of set.items) {
        const product = products.find((p) => p.id === item.product_id);
        if (!product || product.quantity < item.quantity * quantity) {
          canSell = false;
          break;
        }
        setPrice += product.retail_price * item.quantity;
      }

      if (!canSell) {
        toast.error("Insufficient stock for set items");
        return;
      }

      const existing = cart.find((item) => item.set_id === set.id);
      if (existing) {
        setCart(
          cart.map((item) =>
            item.set_id === set.id
              ? { ...item, quantity: item.quantity + quantity, total: (item.quantity + quantity) * setPrice }
              : item
          )
        );
      } else {
        setCart([
          ...cart,
          {
            set_id: set.id,
            name: set.name,
            quantity: quantity,
            unit_price: setPrice,
            total: quantity * setPrice,
          },
        ]);
      }
    }

    setSelectedItem("");
    setQuantity(1);
    toast.success("Added to cart");
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
    toast.success("Removed from cart");
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    if (discountType === "percentage") {
      return subtotal * (discountValue / 100);
    }
    return discountValue;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  const calculateChange = () => {
    if (paymentMethod === "cash") {
      return Math.max(0, cashReceived - calculateTotal());
    }
    return 0;
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (paymentMethod === "cash" && gpayReturn === 0 && cashReceived < calculateTotal()) {
      toast.error("Insufficient cash received");
      return;
    }
    
    if (paymentMethod === "cash" && gpayReturn > 0 && (cashReceived + gpayReturn) < calculateTotal()) {
      toast.error("Insufficient payment (cash + gpay return)");
      return;
    }

    const saleData = {
      sale_type: "retail",
      customer_name: customerName || null,
      customer_phone: customerPhone || null,
      items: cart,
      discount_type: discountType,
      discount_value: discountValue,
      payment_method: paymentMethod,
      cash_received: paymentMethod === "cash" ? cashReceived : null,
      gpay_return: gpayReturn > 0 ? gpayReturn : null,
    };

    try {
      const response = await axios.post(`${API}/sales`, saleData);
      toast.success("Sale completed successfully");
      
      // Set completed sale for printing
      setCompletedSale(response.data);
      
      // Reset form
      setCart([]);
      setDiscountValue(0);
      setCashReceived(0);
      setGpayReturn(0);
      setCustomerName("");
      setCustomerPhone("");
      loadData();
    } catch (error) {
      toast.error("Failed to complete sale");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Retail Sales
          </h1>
          <p className="text-gray-600 mt-2">Process retail transactions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Items</CardTitle>
              <CardDescription>Select products or sets to add to cart</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Item Type</Label>
                <RadioGroup value={itemType} onValueChange={setItemType}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="product" id="product" data-testid="item-type-product" />
                    <Label htmlFor="product">Product</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="set" id="set" data-testid="item-type-set" />
                    <Label htmlFor="set">Set</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label>Select {itemType === "product" ? "Product" : "Set"}</Label>
                <Select value={selectedItem} onValueChange={setSelectedItem}>
                  <SelectTrigger data-testid="item-select">
                    <SelectValue placeholder={`Choose ${itemType}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {itemType === "product"
                      ? products.map((prod) => (
                          <SelectItem key={prod.id} value={prod.id}>
                            {prod.name} - ₹{prod.retail_price} (Stock: {prod.quantity})
                          </SelectItem>
                        ))
                      : sets.map((set) => (
                          <SelectItem key={set.id} value={set.id}>
                            {set.name}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Quantity</Label>
                <Input
                  data-testid="quantity-input"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                />
              </div>

              <Button data-testid="add-to-cart-btn" onClick={addToCart} className="w-full">
                <Plus className="w-4 h-4 mr-2" /> Add to Cart
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2" /> Cart
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Cart is empty</div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>₹{item.unit_price}</TableCell>
                          <TableCell>₹{item.total}</TableCell>
                          <TableCell>
                            <Button
                              data-testid={`remove-cart-item-${index}`}
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(index)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span data-testid="subtotal">₹{calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Discount:</span>
                      <span data-testid="discount">- ₹{calculateDiscount().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span data-testid="total">₹{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {cart.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Customer Name (Optional)</Label>
                  <Input
                    data-testid="customer-name-input"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <Label>Phone Number (Optional)</Label>
                  <Input
                    data-testid="customer-phone-input"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Discount Type</Label>
                  <RadioGroup value={discountType} onValueChange={setDiscountType}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="percentage" id="percentage" data-testid="discount-type-percentage" />
                      <Label htmlFor="percentage">Percentage (%)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="amount" id="amount" data-testid="discount-type-amount" />
                      <Label htmlFor="amount">Fixed Amount (₹)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label>Discount Value</Label>
                  <Input
                    data-testid="discount-value-input"
                    type="number"
                    min="0"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Payment Method</Label>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cash" id="cash" data-testid="payment-method-cash" />
                      <Label htmlFor="cash">Cash</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="gpay" id="gpay" data-testid="payment-method-gpay" />
                      <Label htmlFor="gpay">GPay</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label>Print Type</Label>
                  <RadioGroup value={printType} onValueChange={setPrintType}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="thermal" id="thermal" data-testid="print-type-thermal" />
                      <Label htmlFor="thermal">Thermal (80mm)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="a4" id="a4" data-testid="print-type-a4" />
                      <Label htmlFor="a4">A4 Paper</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <Button data-testid="checkout-btn" onClick={handleCheckout} className="w-full" size="lg">
                <Printer className="w-4 h-4 mr-2" />
                Complete Sale & Print - ₹{calculateTotal().toFixed(2)}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Hidden print component */}
      {completedSale && (
        <PrintBill 
          sale={completedSale} 
          printType={printType}
          onPrintComplete={() => setCompletedSale(null)}
        />
      )}
    </div>
  );
};

export default Retail;
