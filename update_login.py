import os

file_path = r'c:\Users\User\Documents\maruterDev\proj-a\login.html'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add common.js
# Insert before the last <script> tag
last_script_idx = content.rfind('<script>')
if last_script_idx != -1:
    content = content[:last_script_idx] + '<script src="common.js"></script>\n    ' + content[last_script_idx:]

# 2. Remove functions
functions_to_remove = [
    "function switchLanguage(lang)",
    "function updateUIText()",
    "function updateLanguageButtons(lang)"
]

def remove_function(text, func_name):
    start = text.find(func_name)
    if start == -1:
        return text
    
    brace_start = text.find('{', start)
    if brace_start == -1:
        return text
    
    count = 1
    i = brace_start + 1
    while i < len(text) and count > 0:
        if text[i] == '{':
            count += 1
        elif text[i] == '}':
            count -= 1
        i += 1
    
    if count == 0:
        return text[:start] + text[i:]
    return text

for func in functions_to_remove:
    content = remove_function(content, func)

# 3. Remove Theme Logic
# Look for "// --- Dark Mode Logic ---"
start_theme = content.find("// --- Dark Mode Logic ---")
# It ends before "// --- Password Toggle Logic ---"
end_theme = content.find("// --- Password Toggle Logic ---")

if start_theme != -1 and end_theme != -1:
    content = content[:start_theme] + content[end_theme:]

# 4. Remove "let currentLang = ..."
if "let currentLang =" in content:
    content = content.replace("let currentLang = localStorage.getItem('language') || 'th';", "// let currentLang = ...")

# 5. Remove "switchLanguage(currentLang);" at the end
content = content.replace("switchLanguage(currentLang);", "// switchLanguage(currentLang); handled by common.js")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated login.html.")
