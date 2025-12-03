import requests
import sys
from datetime import datetime, date
import json

class BillingAPITester:
    def __init__(self, base_url="https://money-transfer-app-26.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_ids = {
            'categories': [],
            'products': [],
            'sets': [],
            'expense_categories': [],
            'expenses': [],
            'sales': []
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\nTesting {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.text else {}
                except:
                    return True, {}
            else:
                print(f"Failed - Expected {expected_status}, got {response.status_code}")
                if response.text:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"Failed - Error: {str(e)}")
            return False, {}

    def test_categories(self):
        """Test category CRUD operations"""
        print("\n" + "="*50)
        print("TESTING CATEGORIES")
        print("="*50)
        
        # Create category
        success, response = self.run_test(
            "Create Category",
            "POST",
            "categories",
            200,
            data={"name": "Test Books"}
        )
        if success and 'id' in response:
            self.created_ids['categories'].append(response['id'])
            category_id = response['id']
        else:
            return False

        # Get all categories
        success, response = self.run_test(
            "Get All Categories",
            "GET",
            "categories",
            200
        )
        if not success:
            return False

        # Delete category
        success, _ = self.run_test(
            "Delete Category",
            "DELETE",
            f"categories/{category_id}",
            200
        )
        if success:
            self.created_ids['categories'].remove(category_id)
        
        return success

    def test_products(self):
        """Test product CRUD operations"""
        print("\n" + "="*50)
        print("TESTING PRODUCTS")
        print("="*50)
        
        # First create a category for products
        success, cat_response = self.run_test(
            "Create Category for Products",
            "POST",
            "categories",
            200,
            data={"name": "Electronics"}
        )
        if not success:
            return False
        
        category_id = cat_response['id']
        self.created_ids['categories'].append(category_id)

        # Create product
        product_data = {
            "name": "Test Laptop",
            "category_id": category_id,
            "quantity": 10.0,
            "unit": "pieces",
            "cost_price": 50000.0,
            "retail_price": 60000.0,
            "wholesale_price": 55000.0
        }
        
        success, response = self.run_test(
            "Create Product",
            "POST",
            "products",
            200,
            data=product_data
        )
        if success and 'id' in response:
            self.created_ids['products'].append(response['id'])
            product_id = response['id']
        else:
            return False

        # Get all products
        success, response = self.run_test(
            "Get All Products",
            "GET",
            "products",
            200
        )
        if not success:
            return False

        # Get single product
        success, response = self.run_test(
            "Get Single Product",
            "GET",
            f"products/{product_id}",
            200
        )
        if not success:
            return False

        # Update product
        update_data = {
            "quantity": 15.0,
            "retail_price": 65000.0
        }
        success, response = self.run_test(
            "Update Product",
            "PUT",
            f"products/{product_id}",
            200,
            data=update_data
        )
        if not success:
            return False

        return True

    def test_sets(self):
        """Test product set operations"""
        print("\n" + "="*50)
        print("TESTING PRODUCT SETS")
        print("="*50)
        
        # Need products first
        if not self.created_ids['products']:
            print("No products available for set testing")
            return False

        product_id = self.created_ids['products'][0]
        
        # Create set
        set_data = {
            "name": "Office Bundle",
            "items": [
                {
                    "product_id": product_id,
                    "product_name": "Test Laptop",
                    "quantity": 1.0
                }
            ]
        }
        
        success, response = self.run_test(
            "Create Product Set",
            "POST",
            "sets",
            200,
            data=set_data
        )
        if success and 'id' in response:
            self.created_ids['sets'].append(response['id'])
            set_id = response['id']
        else:
            return False

        # Get all sets
        success, response = self.run_test(
            "Get All Sets",
            "GET",
            "sets",
            200
        )
        if not success:
            return False

        # Get single set
        success, response = self.run_test(
            "Get Single Set",
            "GET",
            f"sets/{set_id}",
            200
        )
        
        return success

    def test_expense_categories(self):
        """Test expense category operations"""
        print("\n" + "="*50)
        print("TESTING EXPENSE CATEGORIES")
        print("="*50)
        
        # Create expense category
        success, response = self.run_test(
            "Create Expense Category",
            "POST",
            "expense-categories",
            200,
            data={"name": "Office Supplies"}
        )
        if success and 'id' in response:
            self.created_ids['expense_categories'].append(response['id'])
            exp_cat_id = response['id']
        else:
            return False

        # Get all expense categories
        success, response = self.run_test(
            "Get All Expense Categories",
            "GET",
            "expense-categories",
            200
        )
        
        return success

    def test_expenses(self):
        """Test expense operations"""
        print("\n" + "="*50)
        print("TESTING EXPENSES")
        print("="*50)
        
        # Need expense category first
        if not self.created_ids['expense_categories']:
            print("No expense categories available for expense testing")
            return False

        exp_cat_id = self.created_ids['expense_categories'][0]
        
        # Create expense
        expense_data = {
            "category_id": exp_cat_id,
            "amount": 500.0,
            "description": "Test office supplies purchase",
            "date": datetime.now().isoformat()
        }
        
        success, response = self.run_test(
            "Create Expense",
            "POST",
            "expenses",
            200,
            data=expense_data
        )
        if success and 'id' in response:
            self.created_ids['expenses'].append(response['id'])
        else:
            return False

        # Get all expenses
        success, response = self.run_test(
            "Get All Expenses",
            "GET",
            "expenses",
            200
        )
        
        return success

    def test_sales(self):
        """Test sales operations"""
        print("\n" + "="*50)
        print("TESTING SALES")
        print("="*50)
        
        # Need products first
        if not self.created_ids['products']:
            print("No products available for sales testing")
            return False

        product_id = self.created_ids['products'][0]
        
        # Test retail sale with customer details
        retail_sale_data = {
            "sale_type": "retail",
            "customer_name": "John Doe",
            "customer_phone": "9876543210",
            "items": [
                {
                    "product_id": product_id,
                    "name": "Test Laptop",
                    "quantity": 1.0,
                    "unit_price": 60000.0,
                    "total": 60000.0
                }
            ],
            "discount_type": "percentage",
            "discount_value": 5.0,
            "payment_method": "cash",
            "cash_received": 60000.0,
            "date": datetime.now().isoformat()
        }
        
        success, response = self.run_test(
            "Create Retail Sale with Customer Details",
            "POST",
            "sales",
            200,
            data=retail_sale_data
        )
        if success and 'id' in response:
            self.created_ids['sales'].append(response['id'])
        else:
            return False

        # Test wholesale sale without customer details (optional fields)
        wholesale_sale_data = {
            "sale_type": "wholesale",
            "items": [
                {
                    "product_id": product_id,
                    "name": "Test Laptop",
                    "quantity": 1.0,
                    "unit_price": 55000.0,
                    "total": 55000.0
                }
            ],
            "discount_type": "amount",
            "discount_value": 1000.0,
            "payment_method": "gpay",
            "date": datetime.now().isoformat()
        }
        
        success, response = self.run_test(
            "Create Wholesale Sale without Customer Details",
            "POST",
            "sales",
            200,
            data=wholesale_sale_data
        )
        if success and 'id' in response:
            self.created_ids['sales'].append(response['id'])
        else:
            return False

        # Test GPay return functionality
        gpay_return_sale_data = {
            "sale_type": "retail",
            "items": [
                {
                    "product_id": product_id,
                    "name": "Test Laptop",
                    "quantity": 1.0,
                    "unit_price": 60000.0,
                    "total": 60000.0
                }
            ],
            "discount_type": "percentage",
            "discount_value": 0.0,
            "payment_method": "cash",
            "cash_received": 65000.0,
            "gpay_return": 5000.0,
            "date": datetime.now().isoformat()
        }
        
        success, response = self.run_test(
            "Create Sale with GPay Return",
            "POST",
            "sales",
            200,
            data=gpay_return_sale_data
        )
        if success and 'id' in response:
            self.created_ids['sales'].append(response['id'])

        # Get all sales
        success, response = self.run_test(
            "Get All Sales",
            "GET",
            "sales",
            200
        )
        
        return success

    def test_reports(self):
        """Test report generation"""
        print("\n" + "="*50)
        print("TESTING REPORTS")
        print("="*50)
        
        today = date.today().isoformat()
        
        # Test daily report
        success, response = self.run_test(
            "Get Daily Report",
            "GET",
            "reports/daily",
            200,
            params={"date": today}
        )
        if not success:
            return False

        # Test monthly report
        current_year = datetime.now().year
        current_month = datetime.now().month
        
        success, response = self.run_test(
            "Get Monthly Report",
            "GET",
            "reports/monthly",
            200,
            params={"year": current_year, "month": current_month}
        )
        
        return success

    def test_balance_system(self):
        """Test Cash/GPay Balance System"""
        print("\n" + "="*50)
        print("TESTING CASH/GPAY BALANCE SYSTEM")
        print("="*50)
        
        # Test GET /api/balance - should return cash and gpay balances
        success, response = self.run_test(
            "Get Balance",
            "GET",
            "balance",
            200
        )
        if not success:
            return False
            
        # Check if balance has cash and gpay fields
        if 'cash' not in response or 'gpay' not in response:
            print("Failed - Balance response missing cash or gpay fields")
            return False
            
        print(f"Current Balance - Cash: {response.get('cash', 0)}, GPay: {response.get('gpay', 0)}")
        return True

    def test_expense_with_payment_source(self):
        """Test Expense with Payment Source"""
        print("\n" + "="*50)
        print("TESTING EXPENSE WITH PAYMENT SOURCE")
        print("="*50)
        
        # First create expense category if not exists
        if not self.created_ids['expense_categories']:
            success, response = self.run_test(
                "Create Expense Category for Payment Test",
                "POST",
                "expense-categories",
                200,
                data={"name": "Test Payment Category"}
            )
            if success and 'id' in response:
                self.created_ids['expense_categories'].append(response['id'])
            else:
                return False
        
        exp_cat_id = self.created_ids['expense_categories'][0]
        
        # Get initial balance
        success, initial_balance = self.run_test(
            "Get Initial Balance",
            "GET",
            "balance",
            200
        )
        if not success:
            return False
            
        initial_cash = initial_balance.get('cash', 0)
        initial_gpay = initial_balance.get('gpay', 0)
        
        # Create expense with cash payment
        cash_expense_data = {
            "category_id": exp_cat_id,
            "amount": 100.0,
            "description": "Test cash expense",
            "payment_source": "cash"
        }
        
        success, response = self.run_test(
            "Create Expense with Cash Payment",
            "POST",
            "expenses",
            200,
            data=cash_expense_data
        )
        if success and 'id' in response:
            self.created_ids['expenses'].append(response['id'])
        else:
            return False
            
        # Check if cash balance reduced
        success, new_balance = self.run_test(
            "Get Balance After Cash Expense",
            "GET",
            "balance",
            200
        )
        if not success:
            return False
            
        expected_cash = initial_cash - 100.0
        if abs(new_balance.get('cash', 0) - expected_cash) > 0.01:
            print(f"Failed - Cash balance not reduced correctly. Expected: {expected_cash}, Got: {new_balance.get('cash', 0)}")
            return False
            
        # Create expense with gpay payment
        gpay_expense_data = {
            "category_id": exp_cat_id,
            "amount": 50.0,
            "description": "Test gpay expense",
            "payment_source": "gpay"
        }
        
        success, response = self.run_test(
            "Create Expense with GPay Payment",
            "POST",
            "expenses",
            200,
            data=gpay_expense_data
        )
        if success and 'id' in response:
            self.created_ids['expenses'].append(response['id'])
        else:
            return False
            
        # Check if gpay balance reduced
        success, final_balance = self.run_test(
            "Get Balance After GPay Expense",
            "GET",
            "balance",
            200
        )
        if not success:
            return False
            
        expected_gpay = initial_gpay - 50.0
        if abs(final_balance.get('gpay', 0) - expected_gpay) > 0.01:
            print(f"Failed - GPay balance not reduced correctly. Expected: {expected_gpay}, Got: {final_balance.get('gpay', 0)}")
            return False
            
        print("✓ Cash and GPay payment sources working correctly")
        return True

    def test_money_transfers(self):
        """Test Money Transfers"""
        print("\n" + "="*50)
        print("TESTING MONEY TRANSFERS")
        print("="*50)
        
        # Get initial balance
        success, initial_balance = self.run_test(
            "Get Initial Balance for Transfer Test",
            "GET",
            "balance",
            200
        )
        if not success:
            return False
            
        initial_cash = initial_balance.get('cash', 0)
        initial_gpay = initial_balance.get('gpay', 0)
        
        # Test cash to gpay transfer
        transfer_amount = 200.0
        cash_to_gpay_data = {
            "transfer_type": "cash_to_gpay",
            "amount": transfer_amount,
            "description": "Test cash to gpay transfer"
        }
        
        success, response = self.run_test(
            "Create Cash to GPay Transfer",
            "POST",
            "money-transfers",
            200,
            data=cash_to_gpay_data
        )
        if not success:
            return False
            
        # Check balance after cash to gpay transfer
        success, balance_after_c2g = self.run_test(
            "Get Balance After Cash to GPay Transfer",
            "GET",
            "balance",
            200
        )
        if not success:
            return False
            
        expected_cash_after_c2g = initial_cash - transfer_amount
        expected_gpay_after_c2g = initial_gpay + transfer_amount
        
        if (abs(balance_after_c2g.get('cash', 0) - expected_cash_after_c2g) > 0.01 or 
            abs(balance_after_c2g.get('gpay', 0) - expected_gpay_after_c2g) > 0.01):
            print(f"Failed - Cash to GPay transfer balance incorrect")
            print(f"Expected Cash: {expected_cash_after_c2g}, Got: {balance_after_c2g.get('cash', 0)}")
            print(f"Expected GPay: {expected_gpay_after_c2g}, Got: {balance_after_c2g.get('gpay', 0)}")
            return False
            
        # Test gpay to cash transfer
        gpay_to_cash_data = {
            "transfer_type": "gpay_to_cash",
            "amount": 100.0,
            "description": "Test gpay to cash transfer"
        }
        
        success, response = self.run_test(
            "Create GPay to Cash Transfer",
            "POST",
            "money-transfers",
            200,
            data=gpay_to_cash_data
        )
        if not success:
            return False
            
        # Test GET /api/money-transfers
        success, transfers = self.run_test(
            "Get All Money Transfers",
            "GET",
            "money-transfers",
            200
        )
        if not success:
            return False
            
        if len(transfers) < 2:
            print("Failed - Expected at least 2 transfers in the list")
            return False
            
        print("✓ Money transfers working correctly")
        return True

    def test_new_money_transfer_features(self):
        """Test NEW Money Transfer Features - Cash Drawer and Customer Exchange"""
        print("\n" + "="*50)
        print("TESTING NEW MONEY TRANSFER FEATURES")
        print("="*50)
        
        # Get initial balance
        success, initial_balance = self.run_test(
            "Get Initial Balance for New Transfer Features",
            "GET",
            "balance",
            200
        )
        if not success:
            return False
            
        initial_cash = initial_balance.get('cash', 0)
        initial_gpay = initial_balance.get('gpay', 0)
        print(f"Initial Balance - Cash: {initial_cash}, GPay: {initial_gpay}")
        
        # Test 1: customer_cash_to_gpay (Customer gives cash, we GPay them)
        # Should increase cash, decrease gpay
        transfer_amount_1 = 500.0
        customer_cash_to_gpay_data = {
            "transfer_type": "customer_cash_to_gpay",
            "amount": transfer_amount_1,
            "description": "Customer exchange: cash to gpay"
        }
        
        success, response = self.run_test(
            "Create Customer Cash to GPay Transfer",
            "POST",
            "money-transfers",
            200,
            data=customer_cash_to_gpay_data
        )
        if not success:
            return False
        
        transfer_1_id = response.get('id')
        
        # Check balance after customer_cash_to_gpay
        success, balance_1 = self.run_test(
            "Get Balance After Customer Cash to GPay",
            "GET",
            "balance",
            200
        )
        if not success:
            return False
            
        expected_cash_1 = initial_cash + transfer_amount_1  # We receive cash
        expected_gpay_1 = initial_gpay - transfer_amount_1  # We send GPay
        
        if (abs(balance_1.get('cash', 0) - expected_cash_1) > 0.01 or 
            abs(balance_1.get('gpay', 0) - expected_gpay_1) > 0.01):
            print(f"Failed - customer_cash_to_gpay balance incorrect")
            print(f"Expected Cash: {expected_cash_1}, Got: {balance_1.get('cash', 0)}")
            print(f"Expected GPay: {expected_gpay_1}, Got: {balance_1.get('gpay', 0)}")
            return False
        
        print(f"✓ customer_cash_to_gpay working - Cash: +{transfer_amount_1}, GPay: -{transfer_amount_1}")
        
        # Test 2: customer_gpay_to_cash (Customer GPays us, we give them cash)
        # Should increase gpay, decrease cash
        transfer_amount_2 = 300.0
        customer_gpay_to_cash_data = {
            "transfer_type": "customer_gpay_to_cash",
            "amount": transfer_amount_2,
            "description": "Customer exchange: gpay to cash"
        }
        
        success, response = self.run_test(
            "Create Customer GPay to Cash Transfer",
            "POST",
            "money-transfers",
            200,
            data=customer_gpay_to_cash_data
        )
        if not success:
            return False
        
        transfer_2_id = response.get('id')
        
        # Check balance after customer_gpay_to_cash
        success, balance_2 = self.run_test(
            "Get Balance After Customer GPay to Cash",
            "GET",
            "balance",
            200
        )
        if not success:
            return False
            
        expected_cash_2 = expected_cash_1 - transfer_amount_2  # We give cash
        expected_gpay_2 = expected_gpay_1 + transfer_amount_2  # We receive GPay
        
        if (abs(balance_2.get('cash', 0) - expected_cash_2) > 0.01 or 
            abs(balance_2.get('gpay', 0) - expected_gpay_2) > 0.01):
            print(f"Failed - customer_gpay_to_cash balance incorrect")
            print(f"Expected Cash: {expected_cash_2}, Got: {balance_2.get('cash', 0)}")
            print(f"Expected GPay: {expected_gpay_2}, Got: {balance_2.get('gpay', 0)}")
            return False
        
        print(f"✓ customer_gpay_to_cash working - Cash: -{transfer_amount_2}, GPay: +{transfer_amount_2}")
        
        # Test 3: cash_withdrawal (Withdraw cash from business)
        # Should decrease cash only
        withdrawal_amount_1 = 200.0
        cash_withdrawal_data = {
            "transfer_type": "cash_withdrawal",
            "amount": withdrawal_amount_1,
            "description": "Cash withdrawal from business"
        }
        
        success, response = self.run_test(
            "Create Cash Withdrawal",
            "POST",
            "money-transfers",
            200,
            data=cash_withdrawal_data
        )
        if not success:
            return False
        
        transfer_3_id = response.get('id')
        
        # Check balance after cash_withdrawal
        success, balance_3 = self.run_test(
            "Get Balance After Cash Withdrawal",
            "GET",
            "balance",
            200
        )
        if not success:
            return False
            
        expected_cash_3 = expected_cash_2 - withdrawal_amount_1  # Cash decreases
        expected_gpay_3 = expected_gpay_2  # GPay unchanged
        
        if (abs(balance_3.get('cash', 0) - expected_cash_3) > 0.01 or 
            abs(balance_3.get('gpay', 0) - expected_gpay_3) > 0.01):
            print(f"Failed - cash_withdrawal balance incorrect")
            print(f"Expected Cash: {expected_cash_3}, Got: {balance_3.get('cash', 0)}")
            print(f"Expected GPay: {expected_gpay_3}, Got: {balance_3.get('gpay', 0)}")
            return False
        
        print(f"✓ cash_withdrawal working - Cash: -{withdrawal_amount_1}, GPay: unchanged")
        
        # Test 4: gpay_withdrawal (Withdraw GPay from business)
        # Should decrease gpay only
        withdrawal_amount_2 = 150.0
        gpay_withdrawal_data = {
            "transfer_type": "gpay_withdrawal",
            "amount": withdrawal_amount_2,
            "description": "GPay withdrawal from business"
        }
        
        success, response = self.run_test(
            "Create GPay Withdrawal",
            "POST",
            "money-transfers",
            200,
            data=gpay_withdrawal_data
        )
        if not success:
            return False
        
        transfer_4_id = response.get('id')
        
        # Check balance after gpay_withdrawal
        success, balance_4 = self.run_test(
            "Get Balance After GPay Withdrawal",
            "GET",
            "balance",
            200
        )
        if not success:
            return False
            
        expected_cash_4 = expected_cash_3  # Cash unchanged
        expected_gpay_4 = expected_gpay_3 - withdrawal_amount_2  # GPay decreases
        
        if (abs(balance_4.get('cash', 0) - expected_cash_4) > 0.01 or 
            abs(balance_4.get('gpay', 0) - expected_gpay_4) > 0.01):
            print(f"Failed - gpay_withdrawal balance incorrect")
            print(f"Expected Cash: {expected_cash_4}, Got: {balance_4.get('cash', 0)}")
            print(f"Expected GPay: {expected_gpay_4}, Got: {balance_4.get('gpay', 0)}")
            return False
        
        print(f"✓ gpay_withdrawal working - Cash: unchanged, GPay: -{withdrawal_amount_2}")
        
        # Test 5: Verify GET /api/money-transfers returns all transfers including new types
        success, all_transfers = self.run_test(
            "Get All Money Transfers Including New Types",
            "GET",
            "money-transfers",
            200
        )
        if not success:
            return False
        
        # Check if all new transfer types are present
        new_transfer_types = ["customer_cash_to_gpay", "customer_gpay_to_cash", "cash_withdrawal", "gpay_withdrawal"]
        found_types = set()
        
        for transfer in all_transfers:
            if transfer.get('transfer_type') in new_transfer_types:
                found_types.add(transfer.get('transfer_type'))
        
        if len(found_types) != 4:
            print(f"Failed - Not all new transfer types found in transfers list. Found: {found_types}")
            return False
        
        print(f"✓ All new transfer types found in transfers list: {found_types}")
        
        # Test 6: Test deleting transfers and verify balance restoration
        # Delete transfer 4 (gpay_withdrawal) - should restore GPay
        success, _ = self.run_test(
            "Delete GPay Withdrawal Transfer",
            "DELETE",
            f"money-transfers/{transfer_4_id}",
            200
        )
        if not success:
            return False
        
        # Check balance after deleting gpay_withdrawal
        success, balance_after_delete_4 = self.run_test(
            "Get Balance After Deleting GPay Withdrawal",
            "GET",
            "balance",
            200
        )
        if not success:
            return False
        
        # GPay should be restored
        expected_cash_after_delete_4 = expected_cash_4  # Cash unchanged
        expected_gpay_after_delete_4 = expected_gpay_4 + withdrawal_amount_2  # GPay restored
        
        if (abs(balance_after_delete_4.get('cash', 0) - expected_cash_after_delete_4) > 0.01 or 
            abs(balance_after_delete_4.get('gpay', 0) - expected_gpay_after_delete_4) > 0.01):
            print(f"Failed - Balance not restored correctly after deleting gpay_withdrawal")
            print(f"Expected Cash: {expected_cash_after_delete_4}, Got: {balance_after_delete_4.get('cash', 0)}")
            print(f"Expected GPay: {expected_gpay_after_delete_4}, Got: {balance_after_delete_4.get('gpay', 0)}")
            return False
        
        print(f"✓ GPay withdrawal deletion working - GPay restored: +{withdrawal_amount_2}")
        
        # Delete transfer 3 (cash_withdrawal) - should restore Cash
        success, _ = self.run_test(
            "Delete Cash Withdrawal Transfer",
            "DELETE",
            f"money-transfers/{transfer_3_id}",
            200
        )
        if not success:
            return False
        
        # Check balance after deleting cash_withdrawal
        success, balance_after_delete_3 = self.run_test(
            "Get Balance After Deleting Cash Withdrawal",
            "GET",
            "balance",
            200
        )
        if not success:
            return False
        
        # Cash should be restored
        expected_cash_after_delete_3 = expected_cash_after_delete_4 + withdrawal_amount_1  # Cash restored
        expected_gpay_after_delete_3 = expected_gpay_after_delete_4  # GPay unchanged
        
        if (abs(balance_after_delete_3.get('cash', 0) - expected_cash_after_delete_3) > 0.01 or 
            abs(balance_after_delete_3.get('gpay', 0) - expected_gpay_after_delete_3) > 0.01):
            print(f"Failed - Balance not restored correctly after deleting cash_withdrawal")
            print(f"Expected Cash: {expected_cash_after_delete_3}, Got: {balance_after_delete_3.get('cash', 0)}")
            print(f"Expected GPay: {expected_gpay_after_delete_3}, Got: {balance_after_delete_3.get('gpay', 0)}")
            return False
        
        print(f"✓ Cash withdrawal deletion working - Cash restored: +{withdrawal_amount_1}")
        
        # Delete transfer 2 (customer_gpay_to_cash) - should reverse: restore cash, reduce gpay
        success, _ = self.run_test(
            "Delete Customer GPay to Cash Transfer",
            "DELETE",
            f"money-transfers/{transfer_2_id}",
            200
        )
        if not success:
            return False
        
        # Check balance after deleting customer_gpay_to_cash
        success, balance_after_delete_2 = self.run_test(
            "Get Balance After Deleting Customer GPay to Cash",
            "GET",
            "balance",
            200
        )
        if not success:
            return False
        
        # Reverse: we gave cash, we received GPay -> restore cash, reduce gpay
        expected_cash_after_delete_2 = expected_cash_after_delete_3 + transfer_amount_2  # Cash restored
        expected_gpay_after_delete_2 = expected_gpay_after_delete_3 - transfer_amount_2  # GPay reduced
        
        if (abs(balance_after_delete_2.get('cash', 0) - expected_cash_after_delete_2) > 0.01 or 
            abs(balance_after_delete_2.get('gpay', 0) - expected_gpay_after_delete_2) > 0.01):
            print(f"Failed - Balance not restored correctly after deleting customer_gpay_to_cash")
            print(f"Expected Cash: {expected_cash_after_delete_2}, Got: {balance_after_delete_2.get('cash', 0)}")
            print(f"Expected GPay: {expected_gpay_after_delete_2}, Got: {balance_after_delete_2.get('gpay', 0)}")
            return False
        
        print(f"✓ Customer GPay to Cash deletion working - Cash: +{transfer_amount_2}, GPay: -{transfer_amount_2}")
        
        # Delete transfer 1 (customer_cash_to_gpay) - should reverse: reduce cash, restore gpay
        success, _ = self.run_test(
            "Delete Customer Cash to GPay Transfer",
            "DELETE",
            f"money-transfers/{transfer_1_id}",
            200
        )
        if not success:
            return False
        
        # Check balance after deleting customer_cash_to_gpay
        success, final_balance = self.run_test(
            "Get Final Balance After All Deletions",
            "GET",
            "balance",
            200
        )
        if not success:
            return False
        
        # Reverse: we received cash, we sent GPay -> reduce cash, restore gpay
        expected_final_cash = expected_cash_after_delete_2 - transfer_amount_1  # Cash reduced
        expected_final_gpay = expected_gpay_after_delete_2 + transfer_amount_1  # GPay restored
        
        if (abs(final_balance.get('cash', 0) - expected_final_cash) > 0.01 or 
            abs(final_balance.get('gpay', 0) - expected_final_gpay) > 0.01):
            print(f"Failed - Balance not restored correctly after deleting customer_cash_to_gpay")
            print(f"Expected Cash: {expected_final_cash}, Got: {final_balance.get('cash', 0)}")
            print(f"Expected GPay: {expected_final_gpay}, Got: {final_balance.get('gpay', 0)}")
            return False
        
        print(f"✓ Customer Cash to GPay deletion working - Cash: -{transfer_amount_1}, GPay: +{transfer_amount_1}")
        
        # Verify we're back to initial balance (should be close, accounting for any other tests)
        print(f"Final Balance - Cash: {final_balance.get('cash', 0)}, GPay: {final_balance.get('gpay', 0)}")
        
        print("✓ All NEW money transfer features working correctly!")
        print("✓ Balance updates working correctly for all transfer types!")
        print("✓ Transfer deletion and balance restoration working correctly!")
        return True

    def test_new_deposit_features(self):
        """Test NEW Deposit Features - cash_deposit and gpay_deposit"""
        print("\n" + "="*50)
        print("TESTING NEW DEPOSIT FEATURES")
        print("="*50)
        
        # Get initial balance
        success, initial_balance = self.run_test(
            "Get Initial Balance for Deposit Features",
            "GET",
            "balance",
            200
        )
        if not success:
            return False
            
        initial_cash = initial_balance.get('cash', 0)
        initial_gpay = initial_balance.get('gpay', 0)
        print(f"Initial Balance - Cash: {initial_cash}, GPay: {initial_gpay}")
        
        # Test 1: cash_deposit (Deposit cash to business)
        # Should increase cash only
        deposit_amount_1 = 1000.0
        cash_deposit_data = {
            "transfer_type": "cash_deposit",
            "amount": deposit_amount_1,
            "description": "Cash deposit to business"
        }
        
        success, response = self.run_test(
            "Create Cash Deposit",
            "POST",
            "money-transfers",
            200,
            data=cash_deposit_data
        )
        if not success:
            return False
        
        cash_deposit_id = response.get('id')
        
        # Check balance after cash_deposit
        success, balance_1 = self.run_test(
            "Get Balance After Cash Deposit",
            "GET",
            "balance",
            200
        )
        if not success:
            return False
            
        expected_cash_1 = initial_cash + deposit_amount_1  # Cash increases
        expected_gpay_1 = initial_gpay  # GPay unchanged
        
        if (abs(balance_1.get('cash', 0) - expected_cash_1) > 0.01 or 
            abs(balance_1.get('gpay', 0) - expected_gpay_1) > 0.01):
            print(f"Failed - cash_deposit balance incorrect")
            print(f"Expected Cash: {expected_cash_1}, Got: {balance_1.get('cash', 0)}")
            print(f"Expected GPay: {expected_gpay_1}, Got: {balance_1.get('gpay', 0)}")
            return False
        
        print(f"✓ cash_deposit working - Cash: +{deposit_amount_1}, GPay: unchanged")
        
        # Test 2: gpay_deposit (Deposit GPay to business)
        # Should increase gpay only
        deposit_amount_2 = 750.0
        gpay_deposit_data = {
            "transfer_type": "gpay_deposit",
            "amount": deposit_amount_2,
            "description": "GPay deposit to business"
        }
        
        success, response = self.run_test(
            "Create GPay Deposit",
            "POST",
            "money-transfers",
            200,
            data=gpay_deposit_data
        )
        if not success:
            return False
        
        gpay_deposit_id = response.get('id')
        
        # Check balance after gpay_deposit
        success, balance_2 = self.run_test(
            "Get Balance After GPay Deposit",
            "GET",
            "balance",
            200
        )
        if not success:
            return False
            
        expected_cash_2 = expected_cash_1  # Cash unchanged
        expected_gpay_2 = expected_gpay_1 + deposit_amount_2  # GPay increases
        
        if (abs(balance_2.get('cash', 0) - expected_cash_2) > 0.01 or 
            abs(balance_2.get('gpay', 0) - expected_gpay_2) > 0.01):
            print(f"Failed - gpay_deposit balance incorrect")
            print(f"Expected Cash: {expected_cash_2}, Got: {balance_2.get('cash', 0)}")
            print(f"Expected GPay: {expected_gpay_2}, Got: {balance_2.get('gpay', 0)}")
            return False
        
        print(f"✓ gpay_deposit working - Cash: unchanged, GPay: +{deposit_amount_2}")
        
        # Test 3: Verify GET /api/money-transfers returns deposits correctly
        success, all_transfers = self.run_test(
            "Get All Money Transfers Including Deposits",
            "GET",
            "money-transfers",
            200
        )
        if not success:
            return False
        
        # Check if deposit transfer types are present
        deposit_transfer_types = ["cash_deposit", "gpay_deposit"]
        found_deposit_types = set()
        
        for transfer in all_transfers:
            if transfer.get('transfer_type') in deposit_transfer_types:
                found_deposit_types.add(transfer.get('transfer_type'))
        
        if len(found_deposit_types) != 2:
            print(f"Failed - Not all deposit transfer types found in transfers list. Found: {found_deposit_types}")
            return False
        
        print(f"✓ All deposit transfer types found in transfers list: {found_deposit_types}")
        
        # Test 4: Verify all 8 transfer types are now available
        all_transfer_types = ["cash_to_gpay", "gpay_to_cash", "customer_cash_to_gpay", "customer_gpay_to_cash", 
                             "cash_withdrawal", "gpay_withdrawal", "cash_deposit", "gpay_deposit"]
        found_all_types = set()
        
        for transfer in all_transfers:
            if transfer.get('transfer_type') in all_transfer_types:
                found_all_types.add(transfer.get('transfer_type'))
        
        print(f"✓ Found {len(found_all_types)} out of 8 transfer types: {found_all_types}")
        
        # Test 5: Test deleting deposits and verify balance restoration
        # Delete gpay_deposit - should decrease GPay
        success, _ = self.run_test(
            "Delete GPay Deposit Transfer",
            "DELETE",
            f"money-transfers/{gpay_deposit_id}",
            200
        )
        if not success:
            return False
        
        # Check balance after deleting gpay_deposit
        success, balance_after_delete_gpay = self.run_test(
            "Get Balance After Deleting GPay Deposit",
            "GET",
            "balance",
            200
        )
        if not success:
            return False
        
        # GPay should be reduced (deposit reversed)
        expected_cash_after_delete_gpay = expected_cash_2  # Cash unchanged
        expected_gpay_after_delete_gpay = expected_gpay_2 - deposit_amount_2  # GPay reduced
        
        if (abs(balance_after_delete_gpay.get('cash', 0) - expected_cash_after_delete_gpay) > 0.01 or 
            abs(balance_after_delete_gpay.get('gpay', 0) - expected_gpay_after_delete_gpay) > 0.01):
            print(f"Failed - Balance not restored correctly after deleting gpay_deposit")
            print(f"Expected Cash: {expected_cash_after_delete_gpay}, Got: {balance_after_delete_gpay.get('cash', 0)}")
            print(f"Expected GPay: {expected_gpay_after_delete_gpay}, Got: {balance_after_delete_gpay.get('gpay', 0)}")
            return False
        
        print(f"✓ GPay deposit deletion working - GPay reduced: -{deposit_amount_2}")
        
        # Delete cash_deposit - should decrease Cash
        success, _ = self.run_test(
            "Delete Cash Deposit Transfer",
            "DELETE",
            f"money-transfers/{cash_deposit_id}",
            200
        )
        if not success:
            return False
        
        # Check balance after deleting cash_deposit
        success, balance_after_delete_cash = self.run_test(
            "Get Balance After Deleting Cash Deposit",
            "GET",
            "balance",
            200
        )
        if not success:
            return False
        
        # Cash should be reduced (deposit reversed)
        expected_cash_after_delete_cash = expected_cash_after_delete_gpay - deposit_amount_1  # Cash reduced
        expected_gpay_after_delete_cash = expected_gpay_after_delete_gpay  # GPay unchanged
        
        if (abs(balance_after_delete_cash.get('cash', 0) - expected_cash_after_delete_cash) > 0.01 or 
            abs(balance_after_delete_cash.get('gpay', 0) - expected_gpay_after_delete_cash) > 0.01):
            print(f"Failed - Balance not restored correctly after deleting cash_deposit")
            print(f"Expected Cash: {expected_cash_after_delete_cash}, Got: {balance_after_delete_cash.get('cash', 0)}")
            print(f"Expected GPay: {expected_gpay_after_delete_cash}, Got: {balance_after_delete_cash.get('gpay', 0)}")
            return False
        
        print(f"✓ Cash deposit deletion working - Cash reduced: -{deposit_amount_1}")
        
        # Verify we're back to initial balance (should be close, accounting for any other tests)
        print(f"Final Balance - Cash: {balance_after_delete_cash.get('cash', 0)}, GPay: {balance_after_delete_cash.get('gpay', 0)}")
        
        print("✓ All NEW deposit features working correctly!")
        print("✓ Cash and GPay deposit balance updates working correctly!")
        print("✓ Deposit deletion and balance restoration working correctly!")
        return True

    def test_old_money_transfer_types(self):
        """Test OLD Money Transfer Types - Verify they still work"""
        print("\n" + "="*50)
        print("TESTING OLD MONEY TRANSFER TYPES")
        print("="*50)
        
        # Get initial balance
        success, initial_balance = self.run_test(
            "Get Initial Balance for Old Transfer Types",
            "GET",
            "balance",
            200
        )
        if not success:
            return False
            
        initial_cash = initial_balance.get('cash', 0)
        initial_gpay = initial_balance.get('gpay', 0)
        print(f"Initial Balance - Cash: {initial_cash}, GPay: {initial_gpay}")
        
        # Test OLD transfer type 1: cash_to_gpay (Own money: Cash → GPay)
        transfer_amount_1 = 400.0
        cash_to_gpay_data = {
            "transfer_type": "cash_to_gpay",
            "amount": transfer_amount_1,
            "description": "Old transfer type: cash to gpay"
        }
        
        success, response = self.run_test(
            "Create OLD Cash to GPay Transfer",
            "POST",
            "money-transfers",
            200,
            data=cash_to_gpay_data
        )
        if not success:
            return False
        
        old_transfer_1_id = response.get('id')
        
        # Check balance after cash_to_gpay
        success, balance_1 = self.run_test(
            "Get Balance After OLD Cash to GPay",
            "GET",
            "balance",
            200
        )
        if not success:
            return False
            
        expected_cash_1 = initial_cash - transfer_amount_1  # Cash decreases
        expected_gpay_1 = initial_gpay + transfer_amount_1  # GPay increases
        
        if (abs(balance_1.get('cash', 0) - expected_cash_1) > 0.01 or 
            abs(balance_1.get('gpay', 0) - expected_gpay_1) > 0.01):
            print(f"Failed - OLD cash_to_gpay balance incorrect")
            print(f"Expected Cash: {expected_cash_1}, Got: {balance_1.get('cash', 0)}")
            print(f"Expected GPay: {expected_gpay_1}, Got: {balance_1.get('gpay', 0)}")
            return False
        
        print(f"✓ OLD cash_to_gpay working - Cash: -{transfer_amount_1}, GPay: +{transfer_amount_1}")
        
        # Test OLD transfer type 2: gpay_to_cash (Own money: GPay → Cash)
        transfer_amount_2 = 250.0
        gpay_to_cash_data = {
            "transfer_type": "gpay_to_cash",
            "amount": transfer_amount_2,
            "description": "Old transfer type: gpay to cash"
        }
        
        success, response = self.run_test(
            "Create OLD GPay to Cash Transfer",
            "POST",
            "money-transfers",
            200,
            data=gpay_to_cash_data
        )
        if not success:
            return False
        
        old_transfer_2_id = response.get('id')
        
        # Check balance after gpay_to_cash
        success, balance_2 = self.run_test(
            "Get Balance After OLD GPay to Cash",
            "GET",
            "balance",
            200
        )
        if not success:
            return False
            
        expected_cash_2 = expected_cash_1 + transfer_amount_2  # Cash increases
        expected_gpay_2 = expected_gpay_1 - transfer_amount_2  # GPay decreases
        
        if (abs(balance_2.get('cash', 0) - expected_cash_2) > 0.01 or 
            abs(balance_2.get('gpay', 0) - expected_gpay_2) > 0.01):
            print(f"Failed - OLD gpay_to_cash balance incorrect")
            print(f"Expected Cash: {expected_cash_2}, Got: {balance_2.get('cash', 0)}")
            print(f"Expected GPay: {expected_gpay_2}, Got: {balance_2.get('gpay', 0)}")
            return False
        
        print(f"✓ OLD gpay_to_cash working - Cash: +{transfer_amount_2}, GPay: -{transfer_amount_2}")
        
        # Verify GET /api/money-transfers includes old transfer types
        success, all_transfers = self.run_test(
            "Get All Transfers Including Old Types",
            "GET",
            "money-transfers",
            200
        )
        if not success:
            return False
        
        # Check if old transfer types are present
        old_transfer_types = ["cash_to_gpay", "gpay_to_cash"]
        found_old_types = set()
        
        for transfer in all_transfers:
            if transfer.get('transfer_type') in old_transfer_types:
                found_old_types.add(transfer.get('transfer_type'))
        
        if len(found_old_types) != 2:
            print(f"Failed - Not all old transfer types found. Found: {found_old_types}")
            return False
        
        print(f"✓ All old transfer types found in transfers list: {found_old_types}")
        
        # Test deletion of old transfer types
        # Delete old transfer 2 (gpay_to_cash)
        success, _ = self.run_test(
            "Delete OLD GPay to Cash Transfer",
            "DELETE",
            f"money-transfers/{old_transfer_2_id}",
            200
        )
        if not success:
            return False
        
        # Check balance after deleting old gpay_to_cash
        success, balance_after_delete_2 = self.run_test(
            "Get Balance After Deleting OLD GPay to Cash",
            "GET",
            "balance",
            200
        )
        if not success:
            return False
        
        # Reverse: cash increases, gpay decreases -> cash decreases, gpay increases
        expected_cash_after_delete_2 = expected_cash_2 - transfer_amount_2  # Cash decreases
        expected_gpay_after_delete_2 = expected_gpay_2 + transfer_amount_2  # GPay increases
        
        if (abs(balance_after_delete_2.get('cash', 0) - expected_cash_after_delete_2) > 0.01 or 
            abs(balance_after_delete_2.get('gpay', 0) - expected_gpay_after_delete_2) > 0.01):
            print(f"Failed - Balance not restored correctly after deleting OLD gpay_to_cash")
            print(f"Expected Cash: {expected_cash_after_delete_2}, Got: {balance_after_delete_2.get('cash', 0)}")
            print(f"Expected GPay: {expected_gpay_after_delete_2}, Got: {balance_after_delete_2.get('gpay', 0)}")
            return False
        
        print(f"✓ OLD GPay to Cash deletion working - Cash: -{transfer_amount_2}, GPay: +{transfer_amount_2}")
        
        # Delete old transfer 1 (cash_to_gpay)
        success, _ = self.run_test(
            "Delete OLD Cash to GPay Transfer",
            "DELETE",
            f"money-transfers/{old_transfer_1_id}",
            200
        )
        if not success:
            return False
        
        # Check balance after deleting old cash_to_gpay
        success, final_balance = self.run_test(
            "Get Final Balance After Deleting OLD Transfers",
            "GET",
            "balance",
            200
        )
        if not success:
            return False
        
        # Reverse: cash decreases, gpay increases -> cash increases, gpay decreases
        expected_final_cash = expected_cash_after_delete_2 + transfer_amount_1  # Cash increases
        expected_final_gpay = expected_gpay_after_delete_2 - transfer_amount_1  # GPay decreases
        
        if (abs(final_balance.get('cash', 0) - expected_final_cash) > 0.01 or 
            abs(final_balance.get('gpay', 0) - expected_final_gpay) > 0.01):
            print(f"Failed - Balance not restored correctly after deleting OLD cash_to_gpay")
            print(f"Expected Cash: {expected_final_cash}, Got: {final_balance.get('cash', 0)}")
            print(f"Expected GPay: {expected_final_gpay}, Got: {final_balance.get('gpay', 0)}")
            return False
        
        print(f"✓ OLD Cash to GPay deletion working - Cash: +{transfer_amount_1}, GPay: -{transfer_amount_1}")
        
        print(f"Final Balance - Cash: {final_balance.get('cash', 0)}, GPay: {final_balance.get('gpay', 0)}")
        
        print("✓ All OLD money transfer types still working correctly!")
        print("✓ OLD transfer deletion and balance restoration working correctly!")
        return True

    def test_credit_sales(self):
        """Test Credit Sales"""
        print("\n" + "="*50)
        print("TESTING CREDIT SALES")
        print("="*50)
        
        # Need products first
        if not self.created_ids['products']:
            print("No products available for credit sales testing")
            return False

        product_id = self.created_ids['products'][0]
        
        # Create a credit sale with partial payment
        total_amount = 1000.0
        partial_payment = 600.0
        
        credit_sale_data = {
            "sale_type": "retail",
            "payment_type": "credit",
            "customer_name": "Credit Customer",
            "customer_phone": "9876543210",
            "items": [
                {
                    "product_id": product_id,
                    "name": "Test Product",
                    "quantity": 1.0,
                    "unit_price": total_amount,
                    "total": total_amount
                }
            ],
            "discount_type": "amount",
            "discount_value": 0.0,
            "payment_method": "cash",
            "amount_paid": partial_payment
        }
        
        success, response = self.run_test(
            "Create Credit Sale",
            "POST",
            "sales",
            200,
            data=credit_sale_data
        )
        if not success:
            return False
            
        # Check if balance_amount is calculated correctly
        expected_balance = total_amount - partial_payment
        if abs(response.get('balance_amount', 0) - expected_balance) > 0.01:
            print(f"Failed - Credit sale balance incorrect. Expected: {expected_balance}, Got: {response.get('balance_amount', 0)}")
            return False
            
        self.created_ids['sales'].append(response['id'])
        
        # Test GET /api/sales/credit
        success, credit_sales = self.run_test(
            "Get Credit Sales",
            "GET",
            "sales/credit",
            200
        )
        if not success:
            return False
            
        # Check if our credit sale is in the list
        found_credit_sale = False
        for sale in credit_sales:
            if sale.get('id') == response['id'] and sale.get('balance_amount', 0) > 0:
                found_credit_sale = True
                break
                
        if not found_credit_sale:
            print("Failed - Credit sale not found in credit sales list")
            return False
            
        print("✓ Credit sales working correctly")
        return True

    def test_category_editing(self):
        """Test Category Editing"""
        print("\n" + "="*50)
        print("TESTING CATEGORY EDITING")
        print("="*50)
        
        # Create a category to edit
        success, response = self.run_test(
            "Create Category for Editing",
            "POST",
            "expense-categories",
            200,
            data={"name": "Original Category Name"}
        )
        if not success:
            return False
            
        category_id = response['id']
        self.created_ids['expense_categories'].append(category_id)
        
        # Test PUT /api/expense-categories/{id}
        new_name = "Updated Category Name"
        success, updated_response = self.run_test(
            "Update Expense Category Name",
            "PUT",
            f"expense-categories/{category_id}",
            200,
            data={"name": new_name}
        )
        if not success:
            return False
            
        # Check if name was updated
        if updated_response.get('name') != new_name:
            print(f"Failed - Category name not updated. Expected: {new_name}, Got: {updated_response.get('name')}")
            return False
            
        print("✓ Category editing working correctly")
        return True

    def test_inventory_total_value(self):
        """Test Inventory Total Value"""
        print("\n" + "="*50)
        print("TESTING INVENTORY TOTAL VALUE")
        print("="*50)
        
        # Test GET /api/inventory/total-value
        success, response = self.run_test(
            "Get Inventory Total Value",
            "GET",
            "inventory/total-value",
            200
        )
        if not success:
            return False
            
        # Check if response has required fields
        required_fields = ['total_cost_value', 'total_retail_value', 'total_wholesale_value', 'total_items']
        for field in required_fields:
            if field not in response:
                print(f"Failed - Missing field in inventory total value response: {field}")
                return False
                
        print(f"✓ Inventory Total Value - Cost: {response['total_cost_value']}, Retail: {response['total_retail_value']}, Wholesale: {response['total_wholesale_value']}, Items: {response['total_items']}")
        return True

    def test_returns_refunds(self):
        """Test Returns/Refunds"""
        print("\n" + "="*50)
        print("TESTING RETURNS/REFUNDS")
        print("="*50)
        
        # Need a sale first
        if not self.created_ids['sales']:
            print("No sales available for returns testing")
            return False
            
        # Get product quantity before return
        if not self.created_ids['products']:
            print("No products available for returns testing")
            return False
            
        product_id = self.created_ids['products'][0]
        
        # Get current product quantity
        success, product_before = self.run_test(
            "Get Product Before Return",
            "GET",
            f"products/{product_id}",
            200
        )
        if not success:
            return False
            
        quantity_before = product_before.get('quantity', 0)
        
        # Create a return
        sale_id = self.created_ids['sales'][0]
        return_data = {
            "sale_id": sale_id,
            "items": [
                {
                    "product_id": product_id,
                    "name": "Test Product Return",
                    "quantity": 1.0,
                    "unit_price": 100.0,
                    "total": 100.0
                }
            ],
            "refund_method": "cash",
            "reason": "Test return"
        }
        
        success, response = self.run_test(
            "Create Return",
            "POST",
            "returns",
            200,
            data=return_data
        )
        if not success:
            return False
            
        # Check if stock was restored
        success, product_after = self.run_test(
            "Get Product After Return",
            "GET",
            f"products/{product_id}",
            200
        )
        if not success:
            return False
            
        quantity_after = product_after.get('quantity', 0)
        expected_quantity = quantity_before + 1.0
        
        if abs(quantity_after - expected_quantity) > 0.01:
            print(f"Failed - Stock not restored correctly. Expected: {expected_quantity}, Got: {quantity_after}")
            return False
            
        print("✓ Returns/Refunds working correctly - stock restored")
        return True

    def cleanup(self):
        """Clean up created test data"""
        print("\n" + "="*50)
        print("CLEANING UP TEST DATA")
        print("="*50)
        
        # Delete in reverse order of dependencies
        # Note: Sales don't have delete endpoint (business requirement)
            
        for expense_id in self.created_ids['expenses']:
            self.run_test("Delete Expense", "DELETE", f"expenses/{expense_id}", 200)
            
        for set_id in self.created_ids['sets']:
            self.run_test("Delete Set", "DELETE", f"sets/{set_id}", 200)
            
        for product_id in self.created_ids['products']:
            self.run_test("Delete Product", "DELETE", f"products/{product_id}", 200)
            
        for exp_cat_id in self.created_ids['expense_categories']:
            self.run_test("Delete Expense Category", "DELETE", f"expense-categories/{exp_cat_id}", 200)
            
        for category_id in self.created_ids['categories']:
            self.run_test("Delete Category", "DELETE", f"categories/{category_id}", 200)

def main():
    print("Starting Comprehensive Billing Application API Tests")
    print("="*60)
    
    tester = BillingAPITester()
    
    # Run all tests - including the critical features from review request
    tests = [
        # Basic CRUD tests (setup for other tests)
        tester.test_categories,
        tester.test_products,
        tester.test_expense_categories,
        
        # Critical features from review request
        tester.test_balance_system,
        tester.test_expense_with_payment_source,
        tester.test_money_transfers,
        tester.test_new_money_transfer_features,  # NEW: Test the new money transfer features
        tester.test_old_money_transfer_types,  # Verify OLD transfer types still work
        tester.test_credit_sales,
        tester.test_category_editing,
        tester.test_inventory_total_value,
        tester.test_returns_refunds,
        
        # Additional tests
        tester.test_sets,
        tester.test_expenses,
        tester.test_sales,
        tester.test_reports
    ]
    
    all_passed = True
    for test in tests:
        if not test():
            all_passed = False
            print(f"\nTest suite failed, stopping execution")
            break
    
    # Cleanup
    tester.cleanup()
    
    # Print results
    print(f"\n" + "="*60)
    print(f"FINAL RESULTS")
    print(f"="*60)
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%" if tester.tests_run > 0 else "No tests run")
    
    if all_passed and tester.tests_passed == tester.tests_run:
        print("All tests passed!")
        return 0
    else:
        print("Some tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())