import { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Edit } from "lucide-react";
import { API, axios, toast } from "../App";

const Inventory = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [sets, setSets] = useState([]);
  const [searchCategory, setSearchCategory] = useState("");
  const [searchProduct, setSearchProduct] = useState("");
  const [searchSet, setSearchSet] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [inventoryValue, setInventoryValue] = useState(null);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [editCategoryDialog, setEditCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [productDialog, setProductDialog] = useState(false);
  const [editProductDialog, setEditProductDialog] = useState(false);
  const [restockDialog, setRestockDialog] = useState(false);
  const [setDialog, setSetDialog] = useState(false);
  const [editSetDialog, setEditSetDialog] = useState(false);
  const [editingSet, setEditingSet] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [restockData, setRestockData] = useState({
    quantity: 0,
    cost_price: null,
    supplier_name: "",
    paid_amount: 0,
    payment_source: "cash"
  });
  const [newCategory, setNewCategory] = useState("");
  const [newProduct, setNewProduct] = useState({
    name: "",
    category_id: "",
    quantity: 0,
    unit: "pieces",
    cost_price: 0,
    retail_price: 0,
    wholesale_price: 0,
    supplier_name: "",
    supplier_balance: 0
  });
  const [newSet, setNewSet] = useState({
    name: "",
    items: [],
  });
  const [selectedProducts, setSelectedProducts] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [catRes, prodRes, setRes, invValue] = await Promise.all([
        axios.get(`${API}/categories`),
        axios.get(`${API}/products`),
        axios.get(`${API}/sets`),
        axios.get(`${API}/inventory/total-value`),
      ]);
      setCategories(catRes.data);
      setProducts(prodRes.data);
      setSets(setRes.data);
      setInventoryValue(invValue.data);
    } catch (error) {
      toast.error("Failed to load data");
    }
  };

  const getFilteredCategories = () => {
    if (!searchCategory.trim()) return categories;
    return categories.filter(cat =>
      cat.name.toLowerCase().includes(searchCategory.toLowerCase())
    );
  };

  const getFilteredProducts = () => {
    let filtered = products;
    
    if (selectedCategoryId) {
      filtered = filtered.filter(p => p.category_id === selectedCategoryId);
    }
    
    if (searchProduct.trim()) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchProduct.toLowerCase())
      );
    }
    
    return filtered;
  };

  const getFilteredSets = () => {
    if (!searchSet.trim()) return sets;
    return sets.filter(s =>
      s.name.toLowerCase().includes(searchSet.toLowerCase())
    );
  };

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) {
      toast.error("Category name is required");
      return;
    }
    try {
      await axios.post(`${API}/categories`, { name: newCategory });
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
      await axios.delete(`${API}/categories/${id}`);
      toast.success("Category deleted");
      loadData();
    } catch (error) {
      toast.error("Failed to delete category");
    }
  };

  const handleCreateProduct = async () => {
    if (!newProduct.name || !newProduct.category_id) {
      toast.error("Name and category are required");
      return;
    }
    try {
      await axios.post(`${API}/products`, newProduct);
      toast.success("Product created");
      setNewProduct({
        name: "",
        category_id: "",
        quantity: 0,
        unit: "pieces",
        cost_price: 0,
        retail_price: 0,
        wholesale_price: 0,
      });
      setProductDialog(false);
      loadData();
    } catch (error) {
      toast.error("Failed to create product");
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await axios.delete(`${API}/products/${id}`);
      toast.success("Product deleted");
      loadData();
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    try {
      await axios.put(`${API}/products/${editingProduct.id}`, {
        name: editingProduct.name,
        category_id: editingProduct.category_id,
        quantity: editingProduct.quantity,
        unit: editingProduct.unit,
        cost_price: editingProduct.cost_price,
        retail_price: editingProduct.retail_price,
        wholesale_price: editingProduct.wholesale_price,
        supplier_name: editingProduct.supplier_name,
        supplier_balance: editingProduct.supplier_balance
      });
      toast.success("Product updated");
      setEditingProduct(null);
      setEditProductDialog(false);
      loadData();
    } catch (error) {
      toast.error("Failed to update product");
    }
  };

  const handleRestockProduct = async () => {
    if (!editingProduct || !restockData.quantity) {
      toast.error("Quantity is required");
      return;
    }
    try {
      await axios.post(`${API}/products/${editingProduct.id}/restock`, restockData);
      toast.success("Product restocked");
      setRestockData({
        quantity: 0,
        cost_price: null,
        supplier_name: "",
        paid_amount: 0,
        payment_source: "cash"
      });
      setEditingProduct(null);
      setRestockDialog(false);
      loadData();
    } catch (error) {
      toast.error("Failed to restock product");
    }
  };


  const handleCreateSet = async () => {
    if (!newSet.name || selectedProducts.length === 0) {
      toast.error("Set name and at least one product are required");
      return;
    }

    const items = selectedProducts.map((sp) => ({
      product_id: sp.id,
      product_name: sp.name,
      quantity: sp.setQuantity || 1,
    }));

    try {
      await axios.post(`${API}/sets`, { name: newSet.name, items });
      toast.success("Set created");
      setNewSet({ name: "", items: [] });
      setSelectedProducts([]);
      setSetDialog(false);
      loadData();
    } catch (error) {
      toast.error("Failed to create set");
    }
  };

  const handleDeleteSet = async (id) => {
    try {
      await axios.delete(`${API}/sets/${id}`);
      toast.success("Set deleted");
      loadData();
    } catch (error) {
      toast.error("Failed to delete set");
    }
  };

  const addProductToSet = (product) => {
    if (!selectedProducts.find((p) => p.id === product.id)) {
      setSelectedProducts([...selectedProducts, { ...product, setQuantity: 1 }]);
    }
  };

  const removeProductFromSet = (productId) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== productId));
  };

  const updateSetQuantity = (productId, quantity) => {
    setSelectedProducts(
      selectedProducts.map((p) => (p.id === productId ? { ...p, setQuantity: quantity } : p))
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Inventory Management
          </h1>
          <p className="text-gray-600 mt-2">Manage your categories, products, and sets</p>
        </div>

        {inventoryValue && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Total Cost Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  ₹{inventoryValue.total_cost_value.toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Total Retail Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ₹{inventoryValue.total_retail_value.toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Total Wholesale Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  ₹{inventoryValue.total_wholesale_value.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="categories" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="categories" data-testid="tab-categories">Categories</TabsTrigger>
            <TabsTrigger value="products" data-testid="tab-products">Products</TabsTrigger>
            <TabsTrigger value="sets" data-testid="tab-sets">Sets</TabsTrigger>
          </TabsList>

          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <CardTitle>Product Categories</CardTitle>
                    <CardDescription>Organize your products by categories</CardDescription>
                  </div>
                  <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}>
                    <DialogTrigger asChild>
                      <Button data-testid="add-category-btn">
                        <Plus className="w-4 h-4 mr-2" /> Add Category
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Category</DialogTitle>
                        <DialogDescription>Enter the category name</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Category Name</Label>
                          <Input
                            data-testid="category-name-input"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="e.g., Perfume, Books"
                          />
                        </div>
                        <Button data-testid="create-category-btn" onClick={handleCreateCategory} className="w-full">
                          Create Category
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Input
                    placeholder="Search categories..."
                    value={searchCategory}
                    onChange={(e) => setSearchCategory(e.target.value)}
                  />
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredCategories().map((cat) => (
                      <TableRow key={cat.id} className="cursor-pointer hover:bg-gray-50">
                        <TableCell 
                          className="font-medium text-blue-600 hover:underline cursor-pointer" 
                          onClick={() => {
                            setSelectedCategoryId(cat.id);
                            setSearchProduct(""); // Clear search when filtering by category
                            const productsTab = document.querySelector('[data-testid="tab-products"]');
                            if (productsTab) productsTab.click();
                          }}
                          title="Click to view products in this category"
                        >
                          {cat.name}
                        </TableCell>
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
                            <Edit className="w-4 h-4 text-blue-500" />
                          </Button>
                          <Button
                            data-testid={`delete-category-${cat.id}`}
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

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Products</CardTitle>
                    <CardDescription>Manage your product inventory</CardDescription>
                  </div>
                  <Dialog open={productDialog} onOpenChange={setProductDialog}>
                    <DialogTrigger asChild>
                      <Button data-testid="add-product-btn">
                        <Plus className="w-4 h-4 mr-2" /> Add Product
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create New Product</DialogTitle>
                        <DialogDescription>Enter product details</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Product Name</Label>
                            <Input
                              data-testid="product-name-input"
                              value={newProduct.name}
                              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                              placeholder="e.g., Oud Perfume"
                            />
                          </div>
                          <div>
                            <Label>Category</Label>
                            <Select
                              value={newProduct.category_id}
                              onValueChange={(value) => setNewProduct({ ...newProduct, category_id: value })}
                            >
                              <SelectTrigger data-testid="product-category-select">
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
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Quantity</Label>
                            <Input
                              data-testid="product-quantity-input"
                              type="number"
                              value={newProduct.quantity}
                              onChange={(e) => setNewProduct({ ...newProduct, quantity: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                          <div>
                            <Label>Unit</Label>
                            <Select
                              value={newProduct.unit}
                              onValueChange={(value) => setNewProduct({ ...newProduct, unit: value })}
                            >
                              <SelectTrigger data-testid="product-unit-select">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pieces">Pieces</SelectItem>
                                <SelectItem value="ml">ML</SelectItem>
                                <SelectItem value="meter">Meter</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label>Cost Price (₹)</Label>
                            <Input
                              data-testid="product-cost-price-input"
                              type="number"
                              value={newProduct.cost_price}
                              onChange={(e) => setNewProduct({ ...newProduct, cost_price: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                          <div>
                            <Label>Retail Price (₹)</Label>
                            <Input
                              data-testid="product-retail-price-input"
                              type="number"
                              value={newProduct.retail_price}
                              onChange={(e) => setNewProduct({ ...newProduct, retail_price: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                          <div>
                            <Label>Wholesale Price (₹)</Label>
                            <Input
                              data-testid="product-wholesale-price-input"
                              type="number"
                              value={newProduct.wholesale_price}
                              onChange={(e) => setNewProduct({ ...newProduct, wholesale_price: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                        </div>
                        <Button data-testid="create-product-btn" onClick={handleCreateProduct} className="w-full">
                          Create Product
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 space-y-2">
                  <Input
                    placeholder="Search products..."
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                  />
                  {selectedCategoryId && (
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600">Filtered by category</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCategoryId("")}
                        className="ml-2"
                      >
                        Clear Filter
                      </Button>
                    </div>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead>Retail</TableHead>
                        <TableHead>Wholesale</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredProducts().map((prod) => (
                        <TableRow key={prod.id}>
                          <TableCell className="font-medium">{prod.name}</TableCell>
                          <TableCell>{prod.category_name}</TableCell>
                          <TableCell>{prod.quantity}</TableCell>
                          <TableCell className="capitalize">{prod.unit}</TableCell>
                          <TableCell>₹{prod.cost_price}</TableCell>
                          <TableCell>₹{prod.retail_price}</TableCell>
                          <TableCell>₹{prod.wholesale_price}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingProduct(prod);
                                setEditProductDialog(true);
                              }}
                            >
                              <Edit className="w-4 h-4 text-blue-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingProduct(prod);
                                setRestockDialog(true);
                              }}
                            >
                              <Plus className="w-4 h-4 text-green-500" />
                            </Button>
                            <Button
                              data-testid={`delete-product-${prod.id}`}
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteProduct(prod.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sets">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Product Sets</CardTitle>
                    <CardDescription>Create bundles of products</CardDescription>
                  </div>
                  <Dialog open={setDialog} onOpenChange={setSetDialog}>
                    <DialogTrigger asChild>
                      <Button data-testid="add-set-btn">
                        <Plus className="w-4 h-4 mr-2" /> Add Set
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Create New Set</DialogTitle>
                        <DialogDescription>Create a bundle of products</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Set Name</Label>
                          <Input
                            data-testid="set-name-input"
                            value={newSet.name}
                            onChange={(e) => setNewSet({ ...newSet, name: e.target.value })}
                            placeholder="e.g., Class 1 Books"
                          />
                        </div>
                        <div>
                          <Label>Select Products</Label>
                          <div className="border rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto">
                            {products.map((prod) => (
                              <div key={prod.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                <span>{prod.name}</span>
                                <Button
                                  data-testid={`add-to-set-${prod.id}`}
                                  size="sm"
                                  onClick={() => addProductToSet(prod)}
                                  disabled={selectedProducts.find((p) => p.id === prod.id)}
                                >
                                  Add
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                        {selectedProducts.length > 0 && (
                          <div>
                            <Label>Selected Products</Label>
                            <div className="border rounded-lg p-4 space-y-2">
                              {selectedProducts.map((prod) => (
                                <div key={prod.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <span>{prod.name}</span>
                                  <div className="flex items-center space-x-2">
                                    <Input
                                      data-testid={`set-quantity-${prod.id}`}
                                      type="number"
                                      className="w-20"
                                      value={prod.setQuantity}
                                      onChange={(e) => updateSetQuantity(prod.id, parseFloat(e.target.value) || 1)}
                                      min="1"
                                    />
                                    <Button
                                      data-testid={`remove-from-set-${prod.id}`}
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => removeProductFromSet(prod.id)}
                                    >
                                      <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <Button data-testid="create-set-btn" onClick={handleCreateSet} className="w-full">
                          Create Set
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Input
                    placeholder="Search sets..."
                    value={searchSet}
                    onChange={(e) => setSearchSet(e.target.value)}
                  />
                </div>
                <div className="space-y-4">
                  {getFilteredSets().map((set) => (
                    <Card key={set.id}>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">{set.name}</CardTitle>
                          <Button
                            data-testid={`delete-set-${set.id}`}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSet(set.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {set.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span>{item.product_name}</span>
                              <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Product Dialog */}
      <Dialog open={editProductDialog} onOpenChange={setEditProductDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update product details</DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Product Name</Label>
                  <Input
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select
                    value={editingProduct.category_id}
                    onValueChange={(value) => setEditingProduct({ ...editingProduct, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={editingProduct.quantity}
                    onChange={(e) => setEditingProduct({ ...editingProduct, quantity: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Unit</Label>
                  <Select
                    value={editingProduct.unit}
                    onValueChange={(value) => setEditingProduct({ ...editingProduct, unit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pieces">Pieces</SelectItem>
                      <SelectItem value="ml">Milliliters (ml)</SelectItem>
                      <SelectItem value="meter">Meters</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cost Price (₹)</Label>
                  <Input
                    type="number"
                    value={editingProduct.cost_price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, cost_price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Retail Price (₹)</Label>
                  <Input
                    type="number"
                    value={editingProduct.retail_price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, retail_price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Wholesale Price (₹)</Label>
                  <Input
                    type="number"
                    value={editingProduct.wholesale_price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, wholesale_price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <Button onClick={handleUpdateProduct} className="w-full">
                Update Product
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Restock Product Dialog */}
      <Dialog open={restockDialog} onOpenChange={setRestockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restock Product</DialogTitle>
            <DialogDescription>
              {editingProduct && `Add stock for ${editingProduct.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Quantity to Add</Label>
              <Input
                type="number"
                min="0"
                value={restockData.quantity}
                onChange={(e) => setRestockData({ ...restockData, quantity: parseFloat(e.target.value) || 0 })}
                placeholder="Enter quantity"
              />
            </div>
            <div>
              <Label>Cost Price (Optional)</Label>
              <Input
                type="number"
                min="0"
                value={restockData.cost_price || ""}
                onChange={(e) => setRestockData({ ...restockData, cost_price: e.target.value ? parseFloat(e.target.value) : null })}
                placeholder="Leave empty to use existing price"
              />
            </div>
            <div>
              <Label>Supplier Name (Optional)</Label>
              <Input
                value={restockData.supplier_name}
                onChange={(e) => setRestockData({ ...restockData, supplier_name: e.target.value })}
                placeholder="Enter supplier name"
              />
            </div>
            {restockData.supplier_name && (
              <>
                <div>
                  <Label>Amount Paid (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={restockData.paid_amount}
                    onChange={(e) => setRestockData({ ...restockData, paid_amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Payment Source</Label>
                  <Select
                    value={restockData.payment_source}
                    onValueChange={(value) => setRestockData({ ...restockData, payment_source: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="gpay">GPay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <Button onClick={handleRestockProduct} className="w-full">
              Restock Product
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Inventory;
