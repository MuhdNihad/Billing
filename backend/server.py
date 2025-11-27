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

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[Literal["pieces", "ml", "meter"]] = None
    cost_price: Optional[float] = None
    retail_price: Optional[float] = None
    wholesale_price: Optional[float] = None

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

# Expense Models
class Expense(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category_id: str
    category_name: str
    amount: float
    description: Optional[str] = None
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ExpenseCreate(BaseModel):
    category_id: str
    amount: float
    description: Optional[str] = None
    date: Optional[datetime] = None

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
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SaleCreate(BaseModel):
    sale_type: Literal["retail", "wholesale"]
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    items: List[SaleItem]
    discount_type: Literal["percentage", "amount"]
    discount_value: float
    payment_method: Literal["cash", "gpay"]
    cash_received: Optional[float] = None
    gpay_return: Optional[float] = None
    date: Optional[datetime] = None


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

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted"}


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

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}


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
    
    expense_dict = input.model_dump()
    expense_dict['category_name'] = category['name']
    
    if expense_dict['date'] is None:
        expense_dict['date'] = datetime.now(timezone.utc)
    
    expense = Expense(**expense_dict)
    
    doc = expense.model_dump()
    doc['date'] = doc['date'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.expenses.insert_one(doc)
    return expense

@api_router.get("/expenses", response_model=List[Expense])
async def get_expenses():
    expenses = await db.expenses.find({}, {"_id": 0}).to_list(1000)
    for exp in expenses:
        if isinstance(exp['date'], str):
            exp['date'] = datetime.fromisoformat(exp['date'])
        if isinstance(exp['created_at'], str):
            exp['created_at'] = datetime.fromisoformat(exp['created_at'])
    return expenses

@api_router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str):
    result = await db.expenses.delete_one({"id": expense_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "Expense deleted"}


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
            date=sale.date
        )
        exp_doc = expense.model_dump()
        exp_doc['date'] = exp_doc['date'].isoformat()
        exp_doc['created_at'] = exp_doc['created_at'].isoformat()
        await db.expenses.insert_one(exp_doc)
    
    doc = sale.model_dump()
    doc['date'] = doc['date'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.sales.insert_one(doc)
    return sale

@api_router.get("/sales", response_model=List[Sale])
async def get_sales():
    sales = await db.sales.find({}, {"_id": 0}).to_list(1000)
    for sale in sales:
        if isinstance(sale['date'], str):
            sale['date'] = datetime.fromisoformat(sale['date'])
        if isinstance(sale['created_at'], str):
            sale['created_at'] = datetime.fromisoformat(sale['created_at'])
    return sales


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
