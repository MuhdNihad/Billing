import requests
import sys
from datetime import datetime

class DepositFeaturesTester:
    def __init__(self, base_url="https://money-transfer-app-26.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0

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

    def test_all_8_transfer_types(self):
        """Test all 8 transfer types including new deposits"""
        print("\n" + "="*60)
        print("TESTING ALL 8 MONEY TRANSFER TYPES")
        print("="*60)
        
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
        print(f"📊 Initial Balance - Cash: {initial_cash}, GPay: {initial_gpay}")
        
        # Define all 8 transfer types with their expected balance changes
        transfer_types = [
            # Old types
            {"type": "cash_to_gpay", "amount": 100, "cash_change": -100, "gpay_change": 100, "description": "Own money: Cash → GPay"},
            {"type": "gpay_to_cash", "amount": 50, "cash_change": 50, "gpay_change": -50, "description": "Own money: GPay → Cash"},
            
            # Customer exchange types
            {"type": "customer_cash_to_gpay", "amount": 200, "cash_change": 200, "gpay_change": -200, "description": "Customer gives cash, we GPay them"},
            {"type": "customer_gpay_to_cash", "amount": 150, "cash_change": -150, "gpay_change": 150, "description": "Customer GPays us, we give cash"},
            
            # Withdrawal types
            {"type": "cash_withdrawal", "amount": 75, "cash_change": -75, "gpay_change": 0, "description": "Withdraw cash from business"},
            {"type": "gpay_withdrawal", "amount": 60, "cash_change": 0, "gpay_change": -60, "description": "Withdraw GPay from business"},
            
            # NEW Deposit types
            {"type": "cash_deposit", "amount": 500, "cash_change": 500, "gpay_change": 0, "description": "Deposit cash to business"},
            {"type": "gpay_deposit", "amount": 300, "cash_change": 0, "gpay_change": 300, "description": "Deposit GPay to business"},
        ]
        
        created_transfers = []
        current_cash = initial_cash
        current_gpay = initial_gpay
        
        # Test creating each transfer type
        for i, transfer in enumerate(transfer_types, 1):
            print(f"\n🔄 Test {i}/8: {transfer['type']}")
            print(f"   Description: {transfer['description']}")
            
            transfer_data = {
                "transfer_type": transfer['type'],
                "amount": transfer['amount'],
                "description": f"Test {transfer['type']} - {transfer['description']}"
            }
            
            success, response = self.run_test(
                f"Create {transfer['type']} Transfer",
                "POST",
                "money-transfers",
                200,
                data=transfer_data
            )
            if not success:
                print(f"❌ Failed to create {transfer['type']} transfer")
                return False
            
            created_transfers.append({
                'id': response.get('id'),
                'type': transfer['type'],
                'amount': transfer['amount'],
                'cash_change': transfer['cash_change'],
                'gpay_change': transfer['gpay_change']
            })
            
            # Update expected balances
            current_cash += transfer['cash_change']
            current_gpay += transfer['gpay_change']
            
            # Verify balance after this transfer
            success, balance = self.run_test(
                f"Get Balance After {transfer['type']}",
                "GET",
                "balance",
                200
            )
            if not success:
                return False
            
            actual_cash = balance.get('cash', 0)
            actual_gpay = balance.get('gpay', 0)
            
            if (abs(actual_cash - current_cash) > 0.01 or abs(actual_gpay - current_gpay) > 0.01):
                print(f"❌ Balance incorrect after {transfer['type']}")
                print(f"   Expected Cash: {current_cash}, Got: {actual_cash}")
                print(f"   Expected GPay: {current_gpay}, Got: {actual_gpay}")
                return False
            
            print(f"   ✅ Balance correct - Cash: {actual_cash}, GPay: {actual_gpay}")
        
        print(f"\n🎉 All 8 transfer types created successfully!")
        print(f"📊 Final Balance - Cash: {current_cash}, GPay: {current_gpay}")
        
        # Test GET /api/money-transfers returns all 8 types
        success, all_transfers = self.run_test(
            "Get All Money Transfers",
            "GET",
            "money-transfers",
            200
        )
        if not success:
            return False
        
        # Check if all 8 transfer types are present
        all_transfer_types = {t['type'] for t in transfer_types}
        found_types = set()
        
        for transfer in all_transfers:
            if transfer.get('transfer_type') in all_transfer_types:
                found_types.add(transfer.get('transfer_type'))
        
        print(f"\n📋 Transfer Types Found: {len(found_types)}/8")
        for transfer_type in sorted(all_transfer_types):
            status = "✅" if transfer_type in found_types else "❌"
            print(f"   {status} {transfer_type}")
        
        if len(found_types) != 8:
            print(f"❌ Not all 8 transfer types found. Missing: {all_transfer_types - found_types}")
            return False
        
        print(f"✅ All 8 transfer types found in API response!")
        
        # Test deleting transfers and verify balance restoration
        print(f"\n🗑️  Testing Transfer Deletion and Balance Restoration")
        
        # Delete transfers in reverse order
        for transfer in reversed(created_transfers):
            print(f"\n   Deleting {transfer['type']} (Amount: {transfer['amount']})")
            
            success, _ = self.run_test(
                f"Delete {transfer['type']} Transfer",
                "DELETE",
                f"money-transfers/{transfer['id']}",
                200
            )
            if not success:
                print(f"❌ Failed to delete {transfer['type']} transfer")
                return False
            
            # Update expected balances (reverse the changes)
            current_cash -= transfer['cash_change']
            current_gpay -= transfer['gpay_change']
            
            # Verify balance after deletion
            success, balance = self.run_test(
                f"Get Balance After Deleting {transfer['type']}",
                "GET",
                "balance",
                200
            )
            if not success:
                return False
            
            actual_cash = balance.get('cash', 0)
            actual_gpay = balance.get('gpay', 0)
            
            if (abs(actual_cash - current_cash) > 0.01 or abs(actual_gpay - current_gpay) > 0.01):
                print(f"❌ Balance not restored correctly after deleting {transfer['type']}")
                print(f"   Expected Cash: {current_cash}, Got: {actual_cash}")
                print(f"   Expected GPay: {current_gpay}, Got: {actual_gpay}")
                return False
            
            print(f"   ✅ Balance restored - Cash: {actual_cash}, GPay: {actual_gpay}")
        
        print(f"\n🎉 All transfer deletions successful!")
        print(f"📊 Final Balance - Cash: {current_cash}, GPay: {current_gpay}")
        
        # Verify we're back to initial balance (accounting for any rounding)
        if (abs(current_cash - initial_cash) < 0.01 and abs(current_gpay - initial_gpay) < 0.01):
            print(f"✅ Successfully returned to initial balance!")
        else:
            print(f"⚠️  Small difference from initial balance (likely from other tests)")
        
        return True

def main():
    print("🚀 Testing NEW Money Deposit Features")
    print("="*60)
    
    tester = DepositFeaturesTester()
    
    success = tester.test_all_8_transfer_types()
    
    # Print results
    print(f"\n" + "="*60)
    print(f"📊 FINAL RESULTS")
    print(f"="*60)
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%" if tester.tests_run > 0 else "No tests run")
    
    if success and tester.tests_passed == tester.tests_run:
        print("🎉 All deposit features working correctly!")
        print("✅ Cash Drawer now supports all 8 transfer types:")
        print("   • Old: cash_to_gpay, gpay_to_cash")
        print("   • Customer: customer_cash_to_gpay, customer_gpay_to_cash") 
        print("   • Withdraw: cash_withdrawal, gpay_withdrawal")
        print("   • 🆕 Deposit: cash_deposit, gpay_deposit")
        return 0
    else:
        print("❌ Some deposit features failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())