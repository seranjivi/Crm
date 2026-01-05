import requests
import json

def test_api():
    # Login first
    login_data = {'email': 'test@example.com', 'password': 'password123'}
    # response = requests.post('http://localhost:8000/api/auth/login', json=login_data)
    response = requests.post('https://sales-9se8.onrender.com/api/auth/login', json=login_data)
    token = response.json()['access_token']
    
    # Get clients
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get('http://localhost:8000/api/clients', headers=headers)
    clients = response.json()
    print(f'API returned {len(clients)} clients')
    for client in clients:
        print(f'- {client.get("client_name", "No name")}')

if __name__ == "__main__":
    test_api()
