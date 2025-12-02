import os

file_path = r'c:\Users\User\Documents\maruterDev\proj-a\dashboard.html'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

if 'checkAccess();' in content:
    content = content.replace('checkAccess();', 'checkAdminAccess();')
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced checkAccess with checkAdminAccess.")
else:
    print("checkAccess not found.")
