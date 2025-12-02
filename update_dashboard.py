import os

file_path = r'c:\Users\User\Documents\maruterDev\proj-a\dashboard.html'

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
# Add renderHeader
if "renderHeader('header_title');" not in content:
    content = content.replace("renderSidebar('dashboard');", "renderHeader('header_title');\n            renderSidebar('dashboard');")

# Comment out init calls
content = content.replace("initTheme();", "// initTheme();")
content = content.replace("initLanguage();", "// initLanguage();")

# 4. Remove inline functions
# They are in a script block.
# We can look for "function initTheme() {" and remove the block or just the functions.
# In dashboard.html, initTheme is likely defined.
# Let's try to remove the specific functions to be safe.

functions_to_remove = [
    "function initTheme()",
    "function toggleTheme()",
    "function updateThemeToggleUI()",
    "function initLanguage()",
    "function switchLanguage(lang)",
    "function updateLanguageButtons(lang)",
    "function updateUIText()"
]

# This is tricky because we need to find the matching closing brace.
# Simpler approach: find the script tag containing these and replace it?
# But that script tag might contain other things like `initChart`.
# In dashboard.html (viewed earlier), `initChart` is there.
# And `updateChartLocale`.

# Let's just comment out the function definitions if we can find them?
# Or use regex to remove them?
# Or just leave them? If they are defined in global scope, they might conflict or overwrite common.js.
# Since common.js is loaded BEFORE the inline script (if I put it there), the inline script will overwrite common.js functions.
# This is BAD.
# So I MUST remove them.

# I'll use a simple brace counter to remove functions.
def remove_function(text, func_name):
    start = text.find(func_name)
    if start == -1:
        return text
    
    # Find opening brace
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
        # Remove from start to i
        return text[:start] + text[i:]
    return text

for func in functions_to_remove:
    content = remove_function(content, func)

# Also remove "let currentLang = ..." if it exists
if "let currentLang =" in content:
    content = content.replace("let currentLang = localStorage.getItem('language') || 'th';", "// let currentLang = ... handled by common.js")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated dashboard.html.")
