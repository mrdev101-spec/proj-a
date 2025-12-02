import os

file_path = r'c:\Users\User\Documents\maruterDev\proj-a\index.html'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '<header'
end_marker = '</header>'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    end_idx += len(end_marker)
    # Find the start of the line for the header to preserve indentation or just replace cleanly
    # We'll just replace from the start marker tag.
    
    new_content = content[:start_idx] + '<!-- Header -->\n            <div id="header-container"></div>' + content[end_idx:]
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully replaced header.")
else:
    print("Header not found.")
