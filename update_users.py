import os

file_path = r'c:\Users\User\Documents\maruterDev\proj-a\users.html'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace Header
start_marker = '<header'
end_marker = '</header>'
start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    end_idx += len(end_marker)
    content = content[:start_idx] + '<!-- Header -->\n            <div id="header-container"></div>' + content[end_idx:]
else:
    print("Header not found.")

# 2. Add common.js
if '<script src="common.js"></script>' not in content:
    content = content.replace('<script src="components.js"></script>', '<script src="common.js"></script>\n    <script src="components.js"></script>')

# 3. Update DOMContentLoaded
if "renderHeader('header_title');" not in content:
    content = content.replace("renderSidebar('users');", "renderHeader('header_title');\n            renderSidebar('users');")

content = content.replace("checkAccess();", "checkAdminAccess();")
content = content.replace("initTheme();", "// initTheme();")
content = content.replace("initLanguage();", "// initLanguage();")

# 4. Remove Logout from setupEventListeners
# Look for:
#             // Logout
#             const logoutBtn = document.getElementById('logout-btn');
#             if (logoutBtn) {
#                 logoutBtn.addEventListener('click', logout);
#             }

start_logout_listener = content.find("// Logout")
if start_logout_listener != -1:
    # Find the closing brace of the if block?
    # It's inside setupEventListeners.
    # Let's just comment it out or remove lines.
    # We can search for the specific block.
    block = """            // Logout
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', logout);
            }"""
    # Try to match loosely
    # Or just replace the start with comment
    content = content.replace("// Logout", "// Logout (handled by common.js)")
    content = content.replace("const logoutBtn = document.getElementById('logout-btn');", "// const logoutBtn = ...")
    content = content.replace("if (logoutBtn) {", "// if (logoutBtn) {")
    content = content.replace("logoutBtn.addEventListener('click', logout);", "// logoutBtn.addEventListener...")
    # Closing brace might be tricky to comment out without breaking syntax if I don't match exact indentation.
    # But if I comment out the `if`, the closing brace `}` will be dangling?
    # No, `// if ... {` comments out the opening brace. The closing brace `}` will close the previous block? No.
    # If I comment out `if (logoutBtn) {`, the `}` will be a syntax error if it's not commented out.
    
    # Let's try to remove the whole block using string slicing if I can find it.
    end_logout_listener = content.find("logoutBtn.addEventListener('click', logout);")
    if end_logout_listener != -1:
        # Find the next }
        end_block = content.find("}", end_logout_listener)
        if end_block != -1:
            # Check if there is another } for the if?
            # The code is:
            # if (logoutBtn) {
            #     logoutBtn.addEventListener('click', logout);
            # }
            # So end_block is the } for the if.
            # We want to remove from start_logout_listener to end_block + 1
            content = content[:start_logout_listener] + content[end_block+1:]

# 5. Remove functions
functions_to_remove = [
    "function checkAccess()",
    "function logout()",
    "function initTheme()",
    "function initLanguage()",
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

# Remove "let currentLang = ..."
if "let currentLang =" in content:
    content = content.replace("let currentLang = localStorage.getItem('language') || 'th';", "// let currentLang = ...")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated users.html.")
