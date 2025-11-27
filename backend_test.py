import requests
import sys
from datetime import datetime, date
import json

class BillingAPITester:
    def __init__(self, base_url="https://stock-manager-401.preview.emergentagent.com/api"):
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
        print(f"\n🔍 Testing {name}...")
        
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
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.text else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if response.text:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
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
            print("❌ No products available for set testing")
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
            print("❌ No expense categories available for expense testing")
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
            print("❌ No products available for sales testing")
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

        # Test wholesale sale
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
            "Create Wholesale Sale",
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

    def cleanup(self):
        """Clean up created test data"""
        print("\n" + "="*50)
        print("CLEANING UP TEST DATA")
        print("="*50)
        
        # Delete in reverse order of dependencies
        for sale_id in self.created_ids['sales']:
            self.run_test("Delete Sale", "DELETE", f"sales/{sale_id}", 200)
            
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
    print("🚀 Starting Billing Application API Tests")
    print("="*60)
    
    tester = BillingAPITester()
    
    # Run all tests
    tests = [
        tester.test_categories,
        tester.test_products,
        tester.test_sets,
        tester.test_expense_categories,
        tester.test_expenses,
        tester.test_sales,
        tester.test_reports
    ]
    
    all_passed = True
    for test in tests:
        if not test():
            all_passed = False
            print(f"\n❌ Test suite failed, stopping execution")
            break
    
    # Cleanup
    tester.cleanup()
    
    # Print results
    print(f"\n" + "="*60)
    print(f"📊 FINAL RESULTS")
    print(f"="*60)
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%" if tester.tests_run > 0 else "No tests run")
    
    if all_passed and tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("❌ Some tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())