import requests
import json

# Test login to get a token
login_data = {
    "email": "admin@sightspectrum.com",
    "password": "admin123"
}

try:
    # Login
    print("Testing login...")
    # login_response = requests.post("http://localhost:8000/api/auth/login", json=login_data)
    login_response = requests.post("https://sales-9se8.onrender.com/api/auth/login", json=login_data)
    print(f"Login status: {login_response.status_code}")
    
    if login_response.status_code == 200:
        login_result = login_response.json()
        token = login_result.get('access_token')
        user = login_result.get('user')
        print(f"Login successful! Token: {token[:20]}...")
        print(f"User: {user}")
        
        # Test users API with token
        print("\nTesting /api/users endpoint...")
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        users_response = requests.get("http://localhost:8000/api/users", headers=headers)
        print(f"Users API status: {users_response.status_code}")
        
        if users_response.status_code == 200:
            users = users_response.json()
            print(f"Found {len(users)} users")
            for user in users[:3]:  # Show first 3 users
                print(f"  - {user.get('full_name', 'Unknown')} ({user.get('email', 'No email')})")
        else:
            print(f"Users API error: {users_response.text}")
    else:
        print(f"Login failed: {login_response.text}")
        
except Exception as e:
    print(f"Error: {e}")
