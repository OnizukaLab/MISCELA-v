import requests

url = 'http://localhost:8000/api/upload/'
file = {'data_name': 'santander', 'data_type': 'data','upload_file': open('data.csv', 'rb')}

print(file)
res = requests.post(url, files=file)
