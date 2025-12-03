from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ============= MODELS =============

# Category Models
class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CategoryCreate(BaseModel):
    name: str

class CategoryUpdate(BaseModel):
    name: str

# Product Models  
class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category_id: str
    category_name: str
    quantity: float
    unit: Literal["pieces", "ml", "meter"]
    cost_price: float
    retail_price: float
    wholesale_price: float
    supplier_name: Optional[str] = None
    supplier_balance: Optional[float] = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name: str
    category_id: str
    quantity: float
    unit: Literal["pieces", "ml", "meter"]
    cost_price: float
    retail_price: float
    wholesale_price: float
    supplier_name: Optional[str] = None
    supplier_balance: Optional[float] = 0.0

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[Literal["pieces", "ml", "meter"]] = None
    cost_price: Optional[float] = None
    retail_price: Optional[float] = None
    wholesale_price: Optional[float] = None
    supplier_name: Optional[str] = None
    supplier_balance: Optional[float] = None

class RestockProduct(BaseModel):
    quantity: float
    cost_price: Optional[float] = None
    supplier_name: Optional[str] = None
    paid_amount: Optional[float] = 0.0
    payment_source: Optional[Literal["cash", "gpay"]] = "cash"

# Set Models
class SetItem(BaseModel):
    product_id: str
    product_name: str
    quantity: float

class ProductSet(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    items: List[SetItem]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductSetCreate(BaseModel):
    name: str
    items: List[SetItem]

# Expense Category Models
class ExpenseCategory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ExpenseCategoryCreate(BaseModel):
    name: str

class ExpenseCategoryUpdate(BaseModel):
    name: str

# Expense Models
class Expense(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category_id: str
    category_name: str
    amount: float
    description: Optional[str] = None
    payment_source: Literal["cash", "gpay"] = "cash"
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ExpenseCreate(BaseModel):
    category_id: str
    amount: float
    description: Optional[str] = None
    payment_source: Literal["cash", "gpay"] = "cash"
    date: Optional[datetime] = None

# Money Transfer Models
class MoneyTransfer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    transfer_type: Literal["cash_to_gpay", "gpay_to_cash", "customer_cash_to_gpay", "customer_gpay_to_cash", "cash_withdrawal", "gpay_withdrawal", "cash_deposit", "gpay_deposit"]
    amount: float
    description: Optional[str] = None
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MoneyTransferCreate(BaseModel):
    transfer_type: Literal["cash_to_gpay", "gpay_to_cash", "customer_cash_to_gpay", "customer_gpay_to_cash", "cash_withdrawal", "gpay_withdrawal", "cash_deposit", "gpay_deposit"]
    amount: float
    description: Optional[str] = None
    date: Optional[datetime] = None

# Cash/GPay Balance Model
class Balance(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "main_balance"
    cash: float = 0.0
    gpay: float = 0.0
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Sale Models
class SaleItem(BaseModel):
    product_id: Optional[str] = None
    set_id: Optional[str] = None
    name: str
    quantity: float
    unit_price: float
    total: float

class Sale(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sale_type: Literal["retail", "wholesale"]
    payment_type: Literal["full", "credit"] = "full"
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    items: List[SaleItem]
    subtotal: float
    discount_type: Literal["percentage", "amount"]
    discount_value: float
    discount_amount: float
    total: float
    payment_method: Literal["cash", "gpay"]
    cash_received: Optional[float] = None
    gpay_return: Optional[float] = None
    amount_paid: Optional[float] = None
    balance_amount: Optional[float] = 0.0
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SaleCreate(BaseModel):
    sale_type: Literal["retail", "wholesale"]
    payment_type: Literal["full", "credit"] = "full"
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    items: List[SaleItem]
    discount_type: Literal["percentage", "amount"]
    discount_value: float
    payment_method: Literal["cash", "gpay"]
    cash_received: Optional[float] = None
    gpay_return: Optional[float] = None
    amount_paid: Optional[float] = None
    date: Optional[datetime] = None

# Return/Refund Models
class ReturnItem(BaseModel):
    product_id: Optional[str] = None
    set_id: Optional[str] = None
    name: str
    quantity: float
    unit_price: float
    total: float

class Return(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sale_id: str
    items: List[ReturnItem]
    refund_amount: float
    refund_method: Literal["cash", "gpay"]
    reason: Optional[str] = None
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReturnCreate(BaseModel):
    sale_id: str
    items: List[ReturnItem]
    refund_method: Literal["cash", "gpay"]
    reason: Optional[str] = None
    date: Optional[datetime] = None


# ============= HELPER FUNCTIONS =============

async def get_or_create_balance():
    """Get or create the cash/gpay balance record"""
    balance = await db.balances.find_one({"id": "main_balance"}, {"_id": 0})
    if not balance:
        balance_obj = Balance()
        doc = balance_obj.model_dump()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.balances.insert_one(doc)
        return balance_obj.model_dump()
    if isinstance(balance.get('updated_at'), str):
        balance['updated_at'] = datetime.fromisoformat(balance['updated_at'])
    return balance

async def update_balance(cash_change: float = 0, gpay_change: float = 0):
    """Update cash and gpay balances"""
    balance = await get_or_create_balance()
    new_cash = balance['cash'] + cash_change
    new_gpay = balance['gpay'] + gpay_change
    await db.balances.update_one(
        {"id": "main_balance"},
        {"$set": {
            "cash": new_cash,
            "gpay": new_gpay,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )


# ============= CATEGORY ROUTES =============

@api_router.post("/categories", response_model=Category)
async def create_category(input: CategoryCreate):
    category = Category(**input.model_dump())
    doc = category.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.categories.insert_one(doc)
    return category

@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).to_list(1000)
    for cat in categories:
        if isinstance(cat['created_at'], str):
            cat['created_at'] = datetime.fromisoformat(cat['created_at'])
    return categories

@api_router.put("/categories/{category_id}", response_model=Category)
async def update_category(category_id: str, input: CategoryUpdate):
    existing = await db.categories.find_one({"id": category_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")
    
    await db.categories.update_one({"id": category_id}, {"$set": {"name": input.name}})
    updated = await db.categories.find_one({"id": category_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted"}

@api_router.get("/categories/{category_id}/products", response_model=List[Product])
async def get_products_by_category(category_id: str):
    """Get all products in a specific category"""
    products = await db.products.find({"category_id": category_id}, {"_id": 0}).to_list(1000)
    for prod in products:
        if isinstance(prod['created_at'], str):
            prod['created_at'] = datetime.fromisoformat(prod['created_at'])
        if isinstance(prod['updated_at'], str):
            prod['updated_at'] = datetime.fromisoformat(prod['updated_at'])
    return products


# ============= PRODUCT ROUTES =============

@api_router.post("/products", response_model=Product)
async def create_product(input: ProductCreate):
    # Get category name
    category = await db.categories.find_one({"id": input.category_id}, {"_id": 0})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    product_dict = input.model_dump()
    product_dict['category_name'] = category['name']
    product = Product(**product_dict)
    
    doc = product.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.products.insert_one(doc)
    
    # If supplier balance exists, record it
    if input.supplier_name and input.supplier_balance and input.supplier_balance > 0:
        supplier_record = {
            "id": str(uuid.uuid4()),
            "product_id": product.id,
            "product_name": product.name,
            "supplier_name": input.supplier_name,
            "balance": input.supplier_balance,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.supplier_balances.insert_one(supplier_record)
    
    return product

@api_router.get("/products", response_model=List[Product])
async def get_products():
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    for prod in products:
        if isinstance(prod['created_at'], str):
            prod['created_at'] = datetime.fromisoformat(prod['created_at'])
        if isinstance(prod['updated_at'], str):
            prod['updated_at'] = datetime.fromisoformat(prod['updated_at'])
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if isinstance(product['created_at'], str):
        product['created_at'] = datetime.fromisoformat(product['created_at'])
    if isinstance(product['updated_at'], str):
        product['updated_at'] = datetime.fromisoformat(product['updated_at'])
    return product

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, input: ProductUpdate):
    existing = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = input.model_dump(exclude_unset=True)
    
    # Update category name if category_id changed
    if 'category_id' in update_data:
        category = await db.categories.find_one({"id": update_data['category_id']}, {"_id": 0})
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        update_data['category_name'] = category['name']
    
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.products.update_one({"id": product_id}, {"$set": update_data})
    
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated['updated_at'], str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    return updated

@api_router.post("/products/{product_id}/restock")
async def restock_product(product_id: str, input: RestockProduct):
    """Restock a product with supplier information"""
    existing = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    new_quantity = existing['quantity'] + input.quantity
    update_data = {
        "quantity": new_quantity,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if input.cost_price is not None:
        update_data['cost_price'] = input.cost_price
    
    if input.supplier_name:
        update_data['supplier_name'] = input.supplier_name
        total_cost = (input.cost_price or existing['cost_price']) * input.quantity
        balance = total_cost - input.paid_amount
        if balance > 0:
            update_data['supplier_balance'] = existing.get('supplier_balance', 0) + balance
    
    await db.products.update_one({"id": product_id}, {"$set": update_data})
    
    # Record stock transaction
    stock_transaction = {
        "id": str(uuid.uuid4()),
        "product_id": product_id,
        "product_name": existing['name'],
        "quantity": input.quantity,
        "cost_price": input.cost_price or existing['cost_price'],
        "supplier_name": input.supplier_name,
        "paid_amount": input.paid_amount,
        "balance": (input.cost_price or existing['cost_price']) * input.quantity - input.paid_amount if input.supplier_name else 0,
        "payment_source": input.payment_source,
        "date": datetime.now(timezone.utc).isoformat()
    }
    await db.stock_transactions.insert_one(stock_transaction)
    
    # Update cash/gpay balance
    if input.paid_amount > 0:
        if input.payment_source == "cash":
            await update_balance(cash_change=-input.paid_amount)
        else:
            await update_balance(gpay_change=-input.paid_amount)
    
    return {"message": "Product restocked successfully", "new_quantity": new_quantity}

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

@api_router.get("/inventory/total-value")
async def get_inventory_total_value():
    """Calculate total value of all inventory"""
    products = await db.products.find({}, {"_id": 0}).to_list(10000)
    total_cost = sum(p['cost_price'] * p['quantity'] for p in products)
    total_retail = sum(p['retail_price'] * p['quantity'] for p in products)
    total_wholesale = sum(p['wholesale_price'] * p['quantity'] for p in products)
    
    return {
        "total_cost_value": total_cost,
        "total_retail_value": total_retail,
        "total_wholesale_value": total_wholesale,
        "total_items": len(products)
    }


# ============= PRODUCT SET ROUTES =============

@api_router.post("/sets", response_model=ProductSet)
async def create_set(input: ProductSetCreate):
    # Verify all products exist
    for item in input.items:
        product = await db.products.find_one({"id": item.product_id}, {"_id": 0})
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
    
    product_set = ProductSet(**input.model_dump())
    doc = product_set.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.product_sets.insert_one(doc)
    return product_set

@api_router.get("/sets", response_model=List[ProductSet])
async def get_sets():
    sets = await db.product_sets.find({}, {"_id": 0}).to_list(1000)
    for s in sets:
        if isinstance(s['created_at'], str):
            s['created_at'] = datetime.fromisoformat(s['created_at'])
    return sets

@api_router.get("/sets/{set_id}", response_model=ProductSet)
async def get_set(set_id: str):
    product_set = await db.product_sets.find_one({"id": set_id}, {"_id": 0})
    if not product_set:
        raise HTTPException(status_code=404, detail="Set not found")
    if isinstance(product_set['created_at'], str):
        product_set['created_at'] = datetime.fromisoformat(product_set['created_at'])
    return product_set

@api_router.delete("/sets/{set_id}")
async def delete_set(set_id: str):
    result = await db.product_sets.delete_one({"id": set_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Set not found")
    return {"message": "Set deleted"}


# ============= EXPENSE CATEGORY ROUTES =============

@api_router.post("/expense-categories", response_model=ExpenseCategory)
async def create_expense_category(input: ExpenseCategoryCreate):
    category = ExpenseCategory(**input.model_dump())
    doc = category.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.expense_categories.insert_one(doc)
    return category

@api_router.get("/expense-categories", response_model=List[ExpenseCategory])
async def get_expense_categories():
    categories = await db.expense_categories.find({}, {"_id": 0}).to_list(1000)
    for cat in categories:
        if isinstance(cat['created_at'], str):
            cat['created_at'] = datetime.fromisoformat(cat['created_at'])
    return categories

@api_router.put("/expense-categories/{category_id}", response_model=ExpenseCategory)
async def update_expense_category(category_id: str, input: ExpenseCategoryUpdate):
    existing = await db.expense_categories.find_one({"id": category_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Expense category not found")
    
    await db.expense_categories.update_one({"id": category_id}, {"$set": {"name": input.name}})
    updated = await db.expense_categories.find_one({"id": category_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.delete("/expense-categories/{category_id}")
async def delete_expense_category(category_id: str):
    result = await db.expense_categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense category not found")
    return {"message": "Expense category deleted"}


# ============= EXPENSE ROUTES =============

@api_router.post("/expenses", response_model=Expense)
async def create_expense(input: ExpenseCreate):
    # Get category name
    category = await db.expense_categories.find_one({"id": input.category_id}, {"_id": 0})
    if not category:
        raise HTTPException(status_code=404, detail="Expense category not found")
    
    # Check if there's sufficient balance
    balance = await get_or_create_balance()
    if input.payment_source == "cash":
        if balance['cash'] < input.amount:
            raise HTTPException(status_code=400, detail=f"Insufficient cash balance. Available: ₹{balance['cash']:.2f}, Required: ₹{input.amount:.2f}")
    else:  # gpay
        if balance['gpay'] < input.amount:
            raise HTTPException(status_code=400, detail=f"Insufficient GPay balance. Available: ₹{balance['gpay']:.2f}, Required: ₹{input.amount:.2f}")
    
    expense_dict = input.model_dump()
    expense_dict['category_name'] = category['name']
    
    if expense_dict['date'] is None:
        expense_dict['date'] = datetime.now(timezone.utc)
    
    expense = Expense(**expense_dict)
    
    doc = expense.model_dump()
    doc['date'] = doc['date'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.expenses.insert_one(doc)
    
    # Update balance based on payment source
    if input.payment_source == "cash":
        await update_balance(cash_change=-input.amount)
    else:
        await update_balance(gpay_change=-input.amount)
    
    return expense

@api_router.get("/expenses", response_model=List[Expense])
async def get_expenses():
    expenses = await db.expenses.find({}, {"_id": 0}).to_list(10000)
    for exp in expenses:
        if isinstance(exp['date'], str):
            exp['date'] = datetime.fromisoformat(exp['date'])
        if isinstance(exp['created_at'], str):
            exp['created_at'] = datetime.fromisoformat(exp['created_at'])
    return expenses

@api_router.get("/expenses/daily/{date}")
async def get_daily_expenses(date: str):
    """Get expenses for a specific date"""
    try:
        target_date = datetime.fromisoformat(date)
        if target_date.tzinfo is None:
            target_date = target_date.replace(tzinfo=timezone.utc)
        start = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end = target_date.replace(hour=23, minute=59, second=59, microsecond=999999)
    except:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    expenses = await db.expenses.find({}, {"_id": 0}).to_list(10000)
    filtered_expenses = []
    for exp in expenses:
        if isinstance(exp['date'], str):
            exp_date = datetime.fromisoformat(exp['date'])
        else:
            exp_date = exp['date']
        if exp_date.tzinfo is None:
            exp_date = exp_date.replace(tzinfo=timezone.utc)
        if start <= exp_date <= end:
            filtered_expenses.append(exp)
    
    return filtered_expenses

@api_router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str):
    expense = await db.expenses.find_one({"id": expense_id}, {"_id": 0})
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # Restore balance
    if expense.get('payment_source') == "cash":
        await update_balance(cash_change=expense['amount'])
    else:
        await update_balance(gpay_change=expense['amount'])
    
    result = await db.expenses.delete_one({"id": expense_id})
    return {"message": "Expense deleted"}


# ============= MONEY TRANSFER ROUTES =============

@api_router.post("/money-transfers", response_model=MoneyTransfer)
async def create_money_transfer(input: MoneyTransferCreate):
    transfer_dict = input.model_dump()
    
    if transfer_dict['date'] is None:
        transfer_dict['date'] = datetime.now(timezone.utc)
    
    transfer = MoneyTransfer(**transfer_dict)
    
    doc = transfer.model_dump()
    doc['date'] = doc['date'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.money_transfers.insert_one(doc)
    
    # Update balances based on transfer type
    if input.transfer_type == "cash_to_gpay":
        # Own money: Cash → GPay
        await update_balance(cash_change=-input.amount, gpay_change=input.amount)
    elif input.transfer_type == "gpay_to_cash":
        # Own money: GPay → Cash
        await update_balance(cash_change=input.amount, gpay_change=-input.amount)
    elif input.transfer_type == "customer_cash_to_gpay":
        # Customer gives cash, wants GPay from us (we receive cash, we send GPay)
        await update_balance(cash_change=input.amount, gpay_change=-input.amount)
    elif input.transfer_type == "customer_gpay_to_cash":
        # Customer wants cash, will GPay us (we receive GPay, we give cash)
        await update_balance(cash_change=-input.amount, gpay_change=input.amount)
    elif input.transfer_type == "cash_withdrawal":
        # Withdraw cash from business
        await update_balance(cash_change=-input.amount)
    elif input.transfer_type == "gpay_withdrawal":
        # Withdraw GPay from business
        await update_balance(gpay_change=-input.amount)
    elif input.transfer_type == "cash_deposit":
        # Deposit cash to business
        await update_balance(cash_change=input.amount)
    elif input.transfer_type == "gpay_deposit":
        # Deposit GPay to business
        await update_balance(gpay_change=input.amount)
    
    return transfer

@api_router.get("/money-transfers", response_model=List[MoneyTransfer])
async def get_money_transfers():
    transfers = await db.money_transfers.find({}, {"_id": 0}).to_list(10000)
    for transfer in transfers:
        if isinstance(transfer['date'], str):
            transfer['date'] = datetime.fromisoformat(transfer['date'])
        if isinstance(transfer['created_at'], str):
            transfer['created_at'] = datetime.fromisoformat(transfer['created_at'])
    return transfers

@api_router.delete("/money-transfers/{transfer_id}")
async def delete_money_transfer(transfer_id: str):
    transfer = await db.money_transfers.find_one({"id": transfer_id}, {"_id": 0})
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer not found")
    
    # Reverse the transfer based on type
    if transfer['transfer_type'] == "cash_to_gpay":
        await update_balance(cash_change=transfer['amount'], gpay_change=-transfer['amount'])
    elif transfer['transfer_type'] == "gpay_to_cash":
        await update_balance(cash_change=-transfer['amount'], gpay_change=transfer['amount'])
    elif transfer['transfer_type'] == "customer_cash_to_gpay":
        # Reverse: we gave GPay, we received cash
        await update_balance(cash_change=-transfer['amount'], gpay_change=transfer['amount'])
    elif transfer['transfer_type'] == "customer_gpay_to_cash":
        # Reverse: we gave cash, we received GPay
        await update_balance(cash_change=transfer['amount'], gpay_change=-transfer['amount'])
    elif transfer['transfer_type'] == "cash_withdrawal":
        # Restore cash
        await update_balance(cash_change=transfer['amount'])
    elif transfer['transfer_type'] == "gpay_withdrawal":
        # Restore GPay
        await update_balance(gpay_change=transfer['amount'])
    elif transfer['transfer_type'] == "cash_deposit":
        # Reverse deposit (remove cash)
        await update_balance(cash_change=-transfer['amount'])
    elif transfer['transfer_type'] == "gpay_deposit":
        # Reverse deposit (remove GPay)
        await update_balance(gpay_change=-transfer['amount'])
    
    result = await db.money_transfers.delete_one({"id": transfer_id})
    return {"message": "Transfer deleted"}


# ============= BALANCE ROUTES =============

@api_router.get("/balance", response_model=Balance)
async def get_balance():
    balance = await get_or_create_balance()
    return balance


# ============= SALE ROUTES =============

@api_router.post("/sales", response_model=Sale)
async def create_sale(input: SaleCreate):
    # Calculate totals
    subtotal = sum(item.total for item in input.items)
    
    if input.discount_type == "percentage":
        discount_amount = subtotal * (input.discount_value / 100)
    else:
        discount_amount = input.discount_value
    
    total = subtotal - discount_amount
    
    sale_dict = input.model_dump()
    sale_dict['subtotal'] = subtotal
    sale_dict['discount_amount'] = discount_amount
    sale_dict['total'] = total
    
    # Handle credit sales
    if input.payment_type == "credit":
        sale_dict['amount_paid'] = input.amount_paid or 0
        sale_dict['balance_amount'] = total - (input.amount_paid or 0)
    else:
        sale_dict['amount_paid'] = total
        sale_dict['balance_amount'] = 0
    
    if sale_dict['date'] is None:
        sale_dict['date'] = datetime.now(timezone.utc)
    
    sale = Sale(**sale_dict)
    
    # Update product quantities
    for item in input.items:
        if item.product_id:
            product = await db.products.find_one({"id": item.product_id}, {"_id": 0})
            if product:
                new_quantity = product['quantity'] - item.quantity
                await db.products.update_one(
                    {"id": item.product_id},
                    {"$set": {"quantity": new_quantity, "updated_at": datetime.now(timezone.utc).isoformat()}}
                )
        elif item.set_id:
            # Get set items and reduce stock
            product_set = await db.product_sets.find_one({"id": item.set_id}, {"_id": 0})
            if product_set:
                for set_item in product_set['items']:
                    product = await db.products.find_one({"id": set_item['product_id']}, {"_id": 0})
                    if product:
                        new_quantity = product['quantity'] - (set_item['quantity'] * item.quantity)
                        await db.products.update_one(
                            {"id": set_item['product_id']},
                            {"$set": {"quantity": new_quantity, "updated_at": datetime.now(timezone.utc).isoformat()}}
                        )
    
    # Handle GPay return as expense
    if input.gpay_return and input.gpay_return > 0:
        expense_category = await db.expense_categories.find_one({"name": "GPay Returns"}, {"_id": 0})
        if not expense_category:
            # Create GPay Returns category
            gpay_cat = ExpenseCategory(name="GPay Returns")
            doc = gpay_cat.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            await db.expense_categories.insert_one(doc)
            expense_category = gpay_cat.model_dump()
        
        # Create expense entry
        expense = Expense(
            category_id=expense_category['id'],
            category_name="GPay Returns",
            amount=input.gpay_return,
            description=f"GPay return for sale {sale.id}",
            payment_source="cash",
            date=sale.date
        )
        exp_doc = expense.model_dump()
        exp_doc['date'] = exp_doc['date'].isoformat()
        exp_doc['created_at'] = exp_doc['created_at'].isoformat()
        await db.expenses.insert_one(exp_doc)
        
        # Update balances
        await update_balance(cash_change=-input.gpay_return)
    
    # Update cash/gpay balance based on payment
    amount_received = sale_dict['amount_paid']
    if input.payment_method == "cash":
        await update_balance(cash_change=amount_received)
    else:  # gpay
        await update_balance(gpay_change=amount_received)
    
    doc = sale.model_dump()
    doc['date'] = doc['date'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.sales.insert_one(doc)
    return sale

@api_router.get("/sales", response_model=List[Sale])
async def get_sales():
    sales = await db.sales.find({}, {"_id": 0}).to_list(10000)
    for sale in sales:
        if isinstance(sale['date'], str):
            sale['date'] = datetime.fromisoformat(sale['date'])
        if isinstance(sale['created_at'], str):
            sale['created_at'] = datetime.fromisoformat(sale['created_at'])
    return sales

@api_router.get("/sales/credit")
async def get_credit_sales():
    """Get all credit sales with outstanding balance"""
    sales = await db.sales.find({"payment_type": "credit"}, {"_id": 0}).to_list(10000)
    filtered_sales = [s for s in sales if s.get('balance_amount', 0) > 0]
    for sale in filtered_sales:
        if isinstance(sale['date'], str):
            sale['date'] = datetime.fromisoformat(sale['date'])
        if isinstance(sale['created_at'], str):
            sale['created_at'] = datetime.fromisoformat(sale['created_at'])
    return filtered_sales

@api_router.get("/sales/{sale_id}", response_model=Sale)
async def get_sale(sale_id: str):
    sale = await db.sales.find_one({"id": sale_id}, {"_id": 0})
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    if isinstance(sale['date'], str):
        sale['date'] = datetime.fromisoformat(sale['date'])
    if isinstance(sale['created_at'], str):
        sale['created_at'] = datetime.fromisoformat(sale['created_at'])
    return sale


@api_router.put("/sales/{sale_id}")
async def update_sale_payment(sale_id: str, amount_paid: float, balance_amount: float, payment_method: str):
    """Update credit sale payment"""
    sale = await db.sales.find_one({"id": sale_id}, {"_id": 0})
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    # Calculate payment received
    payment_received = amount_paid - sale.get('amount_paid', 0)
    
    # Update sale record
    await db.sales.update_one(
        {"id": sale_id},
        {"$set": {
            "amount_paid": amount_paid,
            "balance_amount": balance_amount
        }}
    )
    
    # Update cash/gpay balance
    if payment_received > 0:
        if payment_method == "cash":
            await update_balance(cash_change=payment_received)
        else:
            await update_balance(gpay_change=payment_received)
    
    updated_sale = await db.sales.find_one({"id": sale_id}, {"_id": 0})
    if isinstance(updated_sale['date'], str):
        updated_sale['date'] = datetime.fromisoformat(updated_sale['date'])
    if isinstance(updated_sale['created_at'], str):
        updated_sale['created_at'] = datetime.fromisoformat(updated_sale['created_at'])
    
    return updated_sale



# ============= RETURN/REFUND ROUTES =============

@api_router.post("/returns", response_model=Return)
async def create_return(input: ReturnCreate):
    # Get original sale
    sale = await db.sales.find_one({"id": input.sale_id}, {"_id": 0})
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    # Calculate refund amount
    total_return_amount = sum(item.total for item in input.items)
    refund_amount = total_return_amount
    
    # For credit sales, only refund proportionally to what was paid
    if sale.get('payment_type') == 'credit' and sale.get('amount_paid', 0) > 0:
        paid_percentage = sale['amount_paid'] / sale['total']
        refund_amount = total_return_amount * paid_percentage
    
    return_dict = input.model_dump()
    return_dict['refund_amount'] = refund_amount
    
    if return_dict['date'] is None:
        return_dict['date'] = datetime.now(timezone.utc)
    
    return_obj = Return(**return_dict)
    
    # Return items to stock
    for item in input.items:
        if item.product_id:
            product = await db.products.find_one({"id": item.product_id}, {"_id": 0})
            if product:
                new_quantity = product['quantity'] + item.quantity
                await db.products.update_one(
                    {"id": item.product_id},
                    {"$set": {"quantity": new_quantity, "updated_at": datetime.now(timezone.utc).isoformat()}}
                )
        elif item.set_id:
            product_set = await db.product_sets.find_one({"id": item.set_id}, {"_id": 0})
            if product_set:
                for set_item in product_set['items']:
                    product = await db.products.find_one({"id": set_item['product_id']}, {"_id": 0})
                    if product:
                        new_quantity = product['quantity'] + (set_item['quantity'] * item.quantity)
                        await db.products.update_one(
                            {"id": set_item['product_id']},
                            {"$set": {"quantity": new_quantity, "updated_at": datetime.now(timezone.utc).isoformat()}}
                        )
    
    # Update balance for refund
    if input.refund_method == "cash":
        await update_balance(cash_change=-refund_amount)
    else:
        await update_balance(gpay_change=-refund_amount)
    
    doc = return_obj.model_dump()
    doc['date'] = doc['date'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.returns.insert_one(doc)
    return return_obj

@api_router.get("/returns", response_model=List[Return])
async def get_returns():
    returns = await db.returns.find({}, {"_id": 0}).to_list(10000)
    for ret in returns:
        if isinstance(ret['date'], str):
            ret['date'] = datetime.fromisoformat(ret['date'])
        if isinstance(ret['created_at'], str):
            ret['created_at'] = datetime.fromisoformat(ret['created_at'])
    return returns


# ============= REPORT ROUTES =============

@api_router.get("/reports/daily")
async def get_daily_report(date: str):
    """Get report for specific date (YYYY-MM-DD)"""
    try:
        target_date = datetime.fromisoformat(date)
        # Make timezone-aware if needed
        if target_date.tzinfo is None:
            target_date = target_date.replace(tzinfo=timezone.utc)
        start = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end = target_date.replace(hour=23, minute=59, second=59, microsecond=999999)
    except:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Get sales
    sales = await db.sales.find({}, {"_id": 0}).to_list(10000)
    filtered_sales = []
    for sale in sales:
        if isinstance(sale['date'], str):
            sale_date = datetime.fromisoformat(sale['date'])
        else:
            sale_date = sale['date']
        # Ensure timezone consistency
        if sale_date.tzinfo is None:
            sale_date = sale_date.replace(tzinfo=timezone.utc)
        if start <= sale_date <= end:
            filtered_sales.append(sale)
    
    # Calculate sales metrics
    total_sales = sum(s['total'] for s in filtered_sales)
    retail_sales = sum(s['total'] for s in filtered_sales if s['sale_type'] == 'retail')
    wholesale_sales = sum(s['total'] for s in filtered_sales if s['sale_type'] == 'wholesale')
    
    # Calculate cost and profit
    total_cost = 0
    for sale in filtered_sales:
        for item in sale['items']:
            if item.get('product_id'):
                product = await db.products.find_one({"id": item['product_id']}, {"_id": 0})
                if product:
                    total_cost += product['cost_price'] * item['quantity']
    
    # Get expenses
    expenses = await db.expenses.find({}, {"_id": 0}).to_list(10000)
    filtered_expenses = []
    for exp in expenses:
        if isinstance(exp['date'], str):
            exp_date = datetime.fromisoformat(exp['date'])
        else:
            exp_date = exp['date']
        # Ensure timezone consistency
        if exp_date.tzinfo is None:
            exp_date = exp_date.replace(tzinfo=timezone.utc)
        if start <= exp_date <= end:
            filtered_expenses.append(exp)
    
    total_expenses = sum(e['amount'] for e in filtered_expenses)
    
    # Group expenses by category
    expense_by_category = {}
    for exp in filtered_expenses:
        cat_name = exp['category_name']
        if cat_name not in expense_by_category:
            expense_by_category[cat_name] = 0
        expense_by_category[cat_name] += exp['amount']
    
    profit = total_sales - total_cost - total_expenses
    
    return {
        "date": date,
        "sales": {
            "total": total_sales,
            "retail": retail_sales,
            "wholesale": wholesale_sales,
            "count": len(filtered_sales)
        },
        "expenses": {
            "total": total_expenses,
            "by_category": expense_by_category
        },
        "cost": total_cost,
        "profit": profit,
        "sales_list": filtered_sales,
        "expenses_list": filtered_expenses
    }

@api_router.get("/reports/monthly")
async def get_monthly_report(year: int, month: int):
    """Get report for specific month"""
    try:
        start = datetime(year, month, 1, 0, 0, 0, tzinfo=timezone.utc)
        if month == 12:
            end = datetime(year + 1, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
        else:
            end = datetime(year, month + 1, 1, 0, 0, 0, tzinfo=timezone.utc)
    except:
        raise HTTPException(status_code=400, detail="Invalid year or month")
    
    # Get sales
    sales = await db.sales.find({}, {"_id": 0}).to_list(10000)
    filtered_sales = []
    for sale in sales:
        if isinstance(sale['date'], str):
            sale_date = datetime.fromisoformat(sale['date'])
        else:
            sale_date = sale['date']
        # Ensure timezone consistency
        if sale_date.tzinfo is None:
            sale_date = sale_date.replace(tzinfo=timezone.utc)
        if start <= sale_date < end:
            filtered_sales.append(sale)
    
    # Calculate sales metrics
    total_sales = sum(s['total'] for s in filtered_sales)
    retail_sales = sum(s['total'] for s in filtered_sales if s['sale_type'] == 'retail')
    wholesale_sales = sum(s['total'] for s in filtered_sales if s['sale_type'] == 'wholesale')
    
    # Calculate cost
    total_cost = 0
    for sale in filtered_sales:
        for item in sale['items']:
            if item.get('product_id'):
                product = await db.products.find_one({"id": item['product_id']}, {"_id": 0})
                if product:
                    total_cost += product['cost_price'] * item['quantity']
    
    # Get expenses
    expenses = await db.expenses.find({}, {"_id": 0}).to_list(10000)
    filtered_expenses = []
    for exp in expenses:
        if isinstance(exp['date'], str):
            exp_date = datetime.fromisoformat(exp['date'])
        else:
            exp_date = exp['date']
        # Ensure timezone consistency
        if exp_date.tzinfo is None:
            exp_date = exp_date.replace(tzinfo=timezone.utc)
        if start <= exp_date < end:
            filtered_expenses.append(exp)
    
    total_expenses = sum(e['amount'] for e in filtered_expenses)
    
    # Group expenses by category
    expense_by_category = {}
    for exp in filtered_expenses:
        cat_name = exp['category_name']
        if cat_name not in expense_by_category:
            expense_by_category[cat_name] = 0
        expense_by_category[cat_name] += exp['amount']
    
    profit = total_sales - total_cost - total_expenses
    
    return {
        "year": year,
        "month": month,
        "sales": {
            "total": total_sales,
            "retail": retail_sales,
            "wholesale": wholesale_sales,
            "count": len(filtered_sales)
        },
        "expenses": {
            "total": total_expenses,
            "by_category": expense_by_category
        },
        "cost": total_cost,
        "profit": profit
    }

@api_router.get("/reports/suppliers")
async def get_supplier_report():
    """Get all supplier balances"""
    transactions = await db.stock_transactions.find({}, {"_id": 0}).to_list(10000)
    
    # Group by supplier
    suppliers = {}
    for trans in transactions:
        if trans.get('supplier_name'):
            supplier = trans['supplier_name']
            if supplier not in suppliers:
                suppliers[supplier] = {
                    "supplier_name": supplier,
                    "total_purchases": 0,
                    "total_paid": 0,
                    "balance": 0,
                    "transactions": []
                }
            suppliers[supplier]['total_purchases'] += trans.get('cost_price', 0) * trans.get('quantity', 0)
            suppliers[supplier]['total_paid'] += trans.get('paid_amount', 0)
            suppliers[supplier]['balance'] += trans.get('balance', 0)
            suppliers[supplier]['transactions'].append(trans)
    
    return list(suppliers.values())


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
