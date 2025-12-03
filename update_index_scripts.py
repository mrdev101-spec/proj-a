import os

file_path = r'c:\Users\User\Documents\maruterDev\proj-a\index.html'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add common.js
if '<script src="common.js"></script>' not in content:
    content = content.replace('<script src="components.js"></script>', '<script src="common.js"></script>\n    <script src="components.js"></script>')

# 2. Update DOMContentLoaded
# Add renderHeader
if "renderHeader('title');" not in content:
    content = content.replace("renderSidebar('health-station');", "renderHeader('title');\n            renderSidebar('health-station');")

# Comment out init calls
content = content.replace("initTheme();", "// initTheme();")
content = content.replace("initLanguage();", "// initLanguage();")

# Remove Logout Logic
# It starts with "// Logout Logic" and we can assume it goes until "// Check Admin Role"
start_logout = content.find("// Logout Logic")
end_logout = content.find("// Check Admin Role")

if start_logout != -1 and end_logout != -1:
    content = content[:start_logout] + content[end_logout:]
else:
    print("Could not find Logout Logic block to remove.")

# 3. Remove inline functions
# We look for "function initTheme() {" and remove until "</script>"
start_funcs = content.find("function initTheme() {")
end_script = content.rfind("</script>")

if start_funcs != -1 and end_script != -1:
    # Keep the </script> tag
    content = content[:start_funcs] + content[end_script:]
else:
    print("Could not find inline functions to remove.")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated index.html scripts.")
