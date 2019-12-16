import requests
import io
import datetime

url = 'http://localhost:8000/api/upload/'

print("santander: attribute")
requests.post(url, data={'data_name': 'santander', 'data_type': 'attribute', 'data_id': 0}, files={'upload_file': open('./api/db/santander/attribute.csv', 'r')})
print("santander: location")
requests.post(url, data={'data_name': 'santander', 'data_type': 'location', 'data_id': 0}, files={'upload_file': open('./api/db/santander/location.csv', 'r')})
print("santander: data")

counter = 0
with open('./api/db/santander/data.csv', 'r') as f:
#with open('./mini_data.csv', 'r') as f:
    data_id = 0
    lines =  f.readlines()
    n = 100000
    line_chunks = [lines[i:i + n] for i in range(0, len(lines), n)]
    for l_chunk in line_chunks:
        chunk = ''.join(l_chunk)
        file_name = '/tmp/' + str(datetime.datetime.now().timestamp())
        with open(file_name, 'w+') as tmp_f:
            tmp_f.write(chunk)
        requests.post(url, data={'data_name': 'santander', 'data_type': 'data', 'data_id': data_id}, files={'upload_file': open(file_name, 'r')})
        data_id += 1

#requests.post(url, data={'data_name': 'china6', 'data_type': 'data'}, files={'upload_file': open('./api/db/china6/data.csv', 'rb')})
#requests.post(url, data={'data_name': 'china6', 'data_type': 'attribute'}, files={'upload_file': open('./api/db/china6/attribute.csv', 'rb')})
#requests.post(url, data={'data_name': 'china6', 'data_type': 'location'}, files={'upload_file': open('./api/db/china6/location.csv', 'rb')})
#
#requests.post(url, data={'data_name': 'china13', 'data_type': 'data'}, files={'upload_file': open('./api/db/china13/data.csv', 'rb')})
#requests.post(url, data={'data_name': 'china13', 'data_type': 'attribute'}, files={'upload_file': open('./api/db/china13/attribute.csv', 'rb')})
#requests.post(url, data={'data_name': 'china13', 'data_type': 'location'}, files={'upload_file': open('./api/db/china13/location.csv', 'rb')})
