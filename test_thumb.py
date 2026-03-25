import requests, base64, json

# Test save with a real image
with open(r'C:\Users\Admin\.openclaw\workspace\00_start.png', 'rb') as f:
    img_data = f.read()

b64 = base64.b64encode(img_data).decode()

payload = {
    'id': 'test-456',
    'plainText': 'test prompt text',
    'jsonText': '{"text":"test"}',
    'imageThumbnail': 'data:image/png;base64,' + b64,
    'language': 'eng',
    'confidence': 0.95,
    'createdAt': '2026-03-24T12:00:00'
}

r = requests.post('http://127.0.0.1:3457/save', json=payload)
print('Save status:', r.status_code, r.text)

# Check library
r2 = requests.get('http://127.0.0.1:3457/library')
items = r2.json()
if items:
    for item in items[:2]:
        thumb = item.get('imageThumbnail', '')
        print(f'ID={item["id"][:8]}, Thumbnail length: {len(thumb)}, starts with: {thumb[:50]}')
else:
    print('Empty library')
