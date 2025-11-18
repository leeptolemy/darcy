import requests
import sys
import time
import json
from datetime import datetime

class DARCYAPITester:
    def __init__(self, base_url="https://radar-alert-system.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, check_response=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            
            # Additional response validation
            if success and check_response:
                try:
                    response_data = response.json()
                    success = check_response(response_data)
                except Exception as e:
                    print(f"❌ Response validation failed: {e}")
                    success = False

            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                self.test_results.append({"test": name, "status": "PASSED", "code": response.status_code})
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"   Response: {response.text[:200]}")
                except:
                    pass
                self.test_results.append({"test": name, "status": "FAILED", "code": response.status_code, "expected": expected_status})

            return success, response.json() if response.status_code < 400 else {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout")
            self.test_results.append({"test": name, "status": "FAILED", "error": "Timeout"})
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({"test": name, "status": "FAILED", "error": str(e)})
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200,
            check_response=lambda r: 'message' in r
        )
        return success

    def test_gateway_status(self):
        """Test gateway status endpoint"""
        success, response = self.run_test(
            "Gateway Status",
            "GET",
            "gateway/status",
            200,
            check_response=lambda r: 'is_running' in r and 'radar_status' in r
        )
        if success:
            print(f"   Gateway Running: {response.get('is_running')}")
            print(f"   Radar Status: {response.get('radar_status')}")
        return success, response

    def test_gateway_config(self):
        """Test get gateway configuration"""
        success, response = self.run_test(
            "Get Gateway Config",
            "GET",
            "gateway/config",
            200,
            check_response=lambda r: 'radar' in r or 'darcy' in r
        )
        return success, response

    def test_start_gateway(self):
        """Test starting the gateway"""
        success, response = self.run_test(
            "Start Gateway",
            "POST",
            "gateway/start",
            200,
            check_response=lambda r: 'success' in r
        )
        if success:
            print(f"   Message: {response.get('message')}")
        return success

    def test_stop_gateway(self):
        """Test stopping the gateway"""
        success, response = self.run_test(
            "Stop Gateway",
            "POST",
            "gateway/stop",
            200,
            check_response=lambda r: 'success' in r
        )
        if success:
            print(f"   Message: {response.get('message')}")
        return success

    def test_current_data(self):
        """Test getting current radar data"""
        success, response = self.run_test(
            "Get Current Radar Data",
            "GET",
            "gateway/current-data",
            200,
            check_response=lambda r: 'is_running' in r
        )
        if success and response.get('current_data'):
            data = response['current_data']
            print(f"   Detections: {data.get('detections', 0)}")
            print(f"   Range: {data.get('range', 'N/A')}")
            print(f"   Bearing: {data.get('bearing', 'N/A')}")
            print(f"   Signal Strength: {data.get('signalStrength', 'N/A')}")
        return success, response

    def test_logs(self):
        """Test getting activity logs"""
        success, response = self.run_test(
            "Get Activity Logs",
            "GET",
            "gateway/logs?limit=10",
            200,
            check_response=lambda r: 'logs' in r
        )
        if success:
            print(f"   Log Count: {response.get('count', 0)}")
        return success

    def test_health_check(self):
        """Test health check endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "gateway/health",
            200,
            check_response=lambda r: 'status' in r
        )
        return success

    def test_mock_data_generation(self):
        """Test that mock radar generates changing data"""
        print(f"\n🔍 Testing Mock Data Generation (checking for changing values)...")
        
        try:
            # Get initial data
            url = f"{self.api_url}/gateway/current-data"
            response1 = requests.get(url, timeout=10)
            if response1.status_code != 200:
                print(f"❌ Failed - Could not get initial data")
                self.test_results.append({"test": "Mock Data Generation", "status": "FAILED", "error": "Could not get initial data"})
                self.tests_run += 1
                return False
            
            data1 = response1.json().get('current_data', {})
            
            # Wait for new data (mock generates every 1-3 seconds)
            print("   Waiting 4 seconds for new data...")
            time.sleep(4)
            
            # Get second data
            response2 = requests.get(url, timeout=10)
            if response2.status_code != 200:
                print(f"❌ Failed - Could not get second data")
                self.test_results.append({"test": "Mock Data Generation", "status": "FAILED", "error": "Could not get second data"})
                self.tests_run += 1
                return False
            
            data2 = response2.json().get('current_data', {})
            
            # Check if data changed
            if not data1 or not data2:
                print(f"❌ Failed - No data available")
                self.test_results.append({"test": "Mock Data Generation", "status": "FAILED", "error": "No data available"})
                self.tests_run += 1
                return False
            
            # Compare timestamps or values
            changed = (data1.get('timestamp') != data2.get('timestamp') or 
                      data1.get('signalStrength') != data2.get('signalStrength') or
                      data1.get('detections') != data2.get('detections'))
            
            self.tests_run += 1
            if changed:
                self.tests_passed += 1
                print(f"✅ Passed - Data is changing")
                print(f"   Data1: {data1.get('detections')} detections, {data1.get('signalStrength')}% signal")
                print(f"   Data2: {data2.get('detections')} detections, {data2.get('signalStrength')}% signal")
                self.test_results.append({"test": "Mock Data Generation", "status": "PASSED"})
                return True
            else:
                print(f"❌ Failed - Data not changing")
                self.test_results.append({"test": "Mock Data Generation", "status": "FAILED", "error": "Data not changing"})
                return False
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({"test": "Mock Data Generation", "status": "FAILED", "error": str(e)})
            self.tests_run += 1
            return False

    def test_ai_predictions_active(self):
        """Test getting active AI predictions"""
        success, response = self.run_test(
            "Get Active AI Predictions",
            "GET",
            "predictions/active",
            200,
            check_response=lambda r: 'predictions' in r
        )
        if success:
            print(f"   Active Predictions: {len(response.get('predictions', []))}")
        return success, response

    def test_ai_predictions_history(self):
        """Test getting AI prediction history"""
        success, response = self.run_test(
            "Get AI Prediction History",
            "GET",
            "predictions/history?limit=5",
            200,
            check_response=lambda r: 'history' in r
        )
        if success:
            print(f"   History Count: {len(response.get('history', []))}")
        return success

    def test_ai_predictions_stats(self):
        """Test getting AI prediction statistics"""
        success, response = self.run_test(
            "Get AI Prediction Stats",
            "GET",
            "predictions/stats",
            200,
            check_response=lambda r: 'accuracy' in r and 'total_predictions' in r
        )
        if success:
            print(f"   Accuracy: {response.get('accuracy', 0):.1f}%")
            print(f"   Total Predictions: {response.get('total_predictions', 0)}")
            print(f"   Timeline: {response.get('timeline_seconds', 0)}s")
        return success, response

    def test_set_prediction_timeline(self):
        """Test setting prediction timeline"""
        success, response = self.run_test(
            "Set Prediction Timeline",
            "POST",
            "predictions/set-timeline?seconds=60",
            200,
            check_response=lambda r: 'success' in r and 'timeline' in r
        )
        if success:
            print(f"   Timeline set to: {response.get('timeline')}s")
        return success

    def test_danger_zones_calculate(self):
        """Test danger zone calculation"""
        success, response = self.run_test(
            "Calculate Danger Zones",
            "GET",
            "danger-zones/calculate?timeline_minutes=5",
            200,
            check_response=lambda r: 'zones' in r and 'base_location' in r
        )
        if success:
            print(f"   Danger Zones: {response.get('count', 0)}")
            base = response.get('base_location', {})
            print(f"   Base Location: {base.get('lat', 0):.4f}°N, {base.get('lon', 0):.4f}°E")
            zones = response.get('zones', [])
            for zone in zones[:3]:  # Show first 3 zones
                print(f"   - {zone.get('id')}: {zone.get('type')} at {zone.get('distance_from_base_km', 0):.1f}km")
        return success, response

    def test_locrypt_groups(self):
        """Test getting LoCrypt groups"""
        success, response = self.run_test(
            "Get LoCrypt Groups",
            "GET",
            "locrypt/groups",
            200,
            check_response=lambda r: 'groups' in r
        )
        if success:
            print(f"   Available Groups: {len(response.get('groups', []))}")
            for group in response.get('groups', [])[:3]:
                print(f"   - {group.get('name')}: {group.get('members')} members")
        return success, response

    def test_locrypt_share(self):
        """Test sharing danger zones to LoCrypt"""
        success, response = self.run_test(
            "Share Danger Zones to LoCrypt",
            "POST",
            "locrypt/share-danger-zones",
            200,
            data={
                "group_id": "grp_001",
                "group_name": "Emergency Response Team",
                "sos": False,
                "radius_km": 5.0
            },
            check_response=lambda r: 'success' in r and 'zones_shared' in r
        )
        if success:
            print(f"   Zones Shared: {response.get('zones_shared', 0)}")
            print(f"   SOS Mode: {response.get('sos', False)}")
        return success

def main():
    print("=" * 60)
    print("DARCY DRONE DETECTION RADAR - BACKEND API TESTS")
    print("=" * 60)
    
    tester = DARCYAPITester()
    
    # Test basic endpoints
    print("\n📡 TESTING BASIC ENDPOINTS")
    print("-" * 60)
    tester.test_root_endpoint()
    tester.test_health_check()
    
    # Test gateway status
    print("\n📡 TESTING GATEWAY STATUS")
    print("-" * 60)
    status_success, status_data = tester.test_gateway_status()
    
    # Test configuration
    print("\n⚙️  TESTING CONFIGURATION")
    print("-" * 60)
    tester.test_gateway_config()
    
    # Test gateway control
    print("\n🎮 TESTING GATEWAY CONTROL")
    print("-" * 60)
    
    # Start gateway if not running
    if not status_data.get('is_running'):
        tester.test_start_gateway()
        time.sleep(2)  # Wait for startup
    
    # Test current data
    print("\n📊 TESTING DATA ENDPOINTS")
    print("-" * 60)
    tester.test_current_data()
    tester.test_logs()
    
    # Test mock data generation
    print("\n🔄 TESTING MOCK DATA GENERATION")
    print("-" * 60)
    tester.test_mock_data_generation()
    
    # Stop gateway
    print("\n🛑 TESTING GATEWAY STOP")
    print("-" * 60)
    tester.test_stop_gateway()
    
    # Print summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"✅ Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    # Print failed tests
    failed_tests = [t for t in tester.test_results if t['status'] == 'FAILED']
    if failed_tests:
        print(f"\n❌ Failed Tests ({len(failed_tests)}):")
        for test in failed_tests:
            print(f"   - {test['test']}: {test.get('error', test.get('code', 'Unknown error'))}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
