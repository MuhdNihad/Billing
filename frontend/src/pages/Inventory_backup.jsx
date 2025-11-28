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
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [productDialog, setProductDialog] = useState(false);
  const [setDialog, setSetDialog] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newProduct, setNewProduct] = useState({
    name: "",
    category_id: "",
    quantity: 0,
    unit: "pieces",
    cost_price: 0,
    retail_price: 0,
    wholesale_price: 0,
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
      const [catRes, prodRes, setRes] = await Promise.all([
        axios.get(`${API}/categories`),
        axios.get(`${API}/products`),
        axios.get(`${API}/sets`),
      ]);
      setCategories(catRes.data);
      setProducts(prodRes.data);
      setSets(setRes.data);
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

        <Tabs defaultValue="categories" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="categories" data-testid="tab-categories">Categories</TabsTrigger>
            <TabsTrigger value="products" data-testid="tab-products">Products</TabsTrigger>
            <TabsTrigger value="sets" data-testid="tab-sets">Sets</TabsTrigger>
          </TabsList>

          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
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
                      {products.map((prod) => (
                        <TableRow key={prod.id}>
                          <TableCell className="font-medium">{prod.name}</TableCell>
                          <TableCell>{prod.category_name}</TableCell>
                          <TableCell>{prod.quantity}</TableCell>
                          <TableCell className="capitalize">{prod.unit}</TableCell>
                          <TableCell>₹{prod.cost_price}</TableCell>
                          <TableCell>₹{prod.retail_price}</TableCell>
                          <TableCell>₹{prod.wholesale_price}</TableCell>
                          <TableCell className="text-right">
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
                <div className="space-y-4">
                  {sets.map((set) => (
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
    </div>
  );
};

export default Inventory;
