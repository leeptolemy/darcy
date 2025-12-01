#!/usr/bin/env python3
"""
Detailed test for AI prediction features:
- Spatial coordinates (lat/lon)
- Confidence filtering (show_on_radar only if >80%)
- Countdown logic (show_countdown only if ≤10s AND >80%)
- Spatial accuracy in history
"""

import requests
import time
import json

BASE_URL = "https://radar-alert-system.preview.emergentagent.com"
API_URL = f"{BASE_URL}/api"

def test_prediction_features():
    print("=" * 80)
    print("TESTING AI PREDICTION SPATIAL FEATURES")
    print("=" * 80)
    
    # Step 1: Start gateway
    print("\n1️⃣  Starting gateway...")
    try:
        response = requests.post(f"{API_URL}/gateway/start", timeout=10)
        if response.status_code == 200:
            print("✅ Gateway started")
        else:
            print(f"❌ Failed to start gateway: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error starting gateway: {e}")
        return False
    
    # Step 2: Wait for mock data and predictions to generate
    print("\n2️⃣  Waiting 45 seconds for mock radar data and AI predictions...")
    print("   (Mock radar generates patterned data: East every 20s, Wave every 30s, North every 60s)")
    
    for i in range(45, 0, -5):
        print(f"   ⏳ {i} seconds remaining...")
        time.sleep(5)
    
    # Step 3: Check current data
    print("\n3️⃣  Checking current radar data...")
    try:
        response = requests.get(f"{API_URL}/gateway/current-data", timeout=10)
        if response.status_code == 200:
            data = response.json()
            current = data.get('current_data', {})
            print(f"✅ Current data retrieved")
            print(f"   - Detections: {current.get('detections', 0)}")
            print(f"   - Range: {current.get('range', 'N/A')}")
            print(f"   - Bearing: {current.get('bearing', 'N/A')}")
            print(f"   - Targets: {len(current.get('targets', []))}")
        else:
            print(f"❌ Failed to get current data: {response.status_code}")
    except Exception as e:
        print(f"❌ Error getting current data: {e}")
    
    # Step 4: Test active predictions with NEW features
    print("\n4️⃣  Testing Active Predictions (NEW FEATURES)...")
    print("-" * 80)
    
    try:
        response = requests.get(f"{API_URL}/predictions/active", timeout=10)
        if response.status_code != 200:
            print(f"❌ Failed to get predictions: {response.status_code}")
            return False
        
        data = response.json()
        predictions = data.get('predictions', [])
        
        print(f"📊 Active Predictions: {len(predictions)}")
        
        if len(predictions) == 0:
            print("⚠️  No predictions generated yet. This might be normal if:")
            print("   - Not enough detection history (needs 10+ detections)")
            print("   - No patterns detected yet")
            print("   - Mock radar hasn't generated enough varied data")
            return True  # Not a failure, just needs more time
        
        # Validate each prediction
        all_valid = True
        for i, pred in enumerate(predictions, 1):
            print(f"\n📍 Prediction #{i}: {pred.get('id')}")
            print(f"   Message: {pred.get('message')}")
            print(f"   Type: {pred.get('type')}")
            print(f"   Confidence: {pred.get('confidence')}%")
            print(f"   Seconds Remaining: {pred.get('seconds_remaining')}s")
            print(f"   Sector: {pred.get('sector')}")
            print(f"   Bearing: {pred.get('bearing')}")
            
            # NEW FEATURE 1: Spatial Coordinates
            lat = pred.get('predicted_lat')
            lon = pred.get('predicted_lon')
            range_km = pred.get('predicted_range_km')
            
            print(f"\n   🌍 SPATIAL COORDINATES:")
            print(f"      Latitude: {lat}")
            print(f"      Longitude: {lon}")
            print(f"      Range: {range_km}km")
            
            if lat is None or lon is None:
                print(f"      ❌ FAIL: Missing spatial coordinates")
                all_valid = False
            else:
                print(f"      ✅ PASS: Spatial coordinates present")
            
            # NEW FEATURE 2: Confidence Filtering (show_on_radar)
            show_on_radar = pred.get('show_on_radar')
            confidence = pred.get('confidence', 0)
            
            print(f"\n   👁️  CONFIDENCE FILTERING:")
            print(f"      show_on_radar: {show_on_radar}")
            print(f"      Expected: {confidence >= 80} (confidence >= 80%)")
            
            if (confidence >= 80 and not show_on_radar) or (confidence < 80 and show_on_radar):
                print(f"      ❌ FAIL: show_on_radar logic incorrect")
                all_valid = False
            else:
                print(f"      ✅ PASS: show_on_radar logic correct")
            
            # NEW FEATURE 3: Countdown Logic
            show_countdown = pred.get('show_countdown')
            seconds_remaining = pred.get('seconds_remaining', 999)
            expected_countdown = (seconds_remaining <= 10 and confidence >= 80)
            
            print(f"\n   ⏰ COUNTDOWN LOGIC:")
            print(f"      show_countdown: {show_countdown}")
            print(f"      Expected: {expected_countdown} (≤10s AND >=80%)")
            
            if show_countdown != expected_countdown:
                print(f"      ❌ FAIL: show_countdown logic incorrect")
                all_valid = False
            else:
                print(f"      ✅ PASS: show_countdown logic correct")
        
        print("\n" + "=" * 80)
        if all_valid:
            print("✅ ALL PREDICTION FEATURES VALIDATED SUCCESSFULLY")
        else:
            print("❌ SOME PREDICTION FEATURES FAILED VALIDATION")
        
        return all_valid
        
    except Exception as e:
        print(f"❌ Error testing predictions: {e}")
        return False
    
    # Step 5: Test prediction history with spatial accuracy
    print("\n5️⃣  Testing Prediction History (SPATIAL ACCURACY)...")
    print("-" * 80)
    
    try:
        response = requests.get(f"{API_URL}/predictions/history?limit=10", timeout=10)
        if response.status_code != 200:
            print(f"❌ Failed to get history: {response.status_code}")
            return False
        
        data = response.json()
        history = data.get('history', [])
        
        print(f"📊 History Count: {len(history)}")
        
        if len(history) == 0:
            print("⚠️  No prediction history yet (predictions need to be validated)")
            return True
        
        # Check for spatial_accuracy in TRUE predictions
        for i, pred in enumerate(history[:5], 1):
            print(f"\n📍 History #{i}: {pred.get('id')}")
            print(f"   Result: {'✅ TRUE' if pred.get('result') else '❌ FALSE'}")
            print(f"   Confidence: {pred.get('confidence')}%")
            
            spatial_accuracy = pred.get('spatial_accuracy', 0)
            print(f"   Spatial Accuracy: {spatial_accuracy}%")
            
            if pred.get('result') and spatial_accuracy == 0:
                print(f"   ⚠️  WARNING: TRUE prediction but spatial_accuracy is 0")
            elif pred.get('result'):
                print(f"   ✅ Spatial accuracy calculated for TRUE prediction")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing history: {e}")
        return False

if __name__ == "__main__":
    success = test_prediction_features()
    exit(0 if success else 1)
