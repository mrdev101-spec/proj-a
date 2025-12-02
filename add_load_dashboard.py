import os

file_path = r'c:\Users\User\Documents\maruterDev\proj-a\dashboard.html'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = """        function updateChartLocale(lang) {
            // In a real app, you'd update categories based on language here
        }"""

replacement = """        function updateChartLocale(lang) {
            // In a real app, you'd update categories based on language here
        }

        function loadDashboardData() {
            initChart();
            animateCounters();
        }"""

if target in content:
    content = content.replace(target, replacement)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Added loadDashboardData.")
else:
    print("Target not found.")
    # Try looser match
    target_loose = "function updateChartLocale(lang) {"
    if target_loose in content:
        # Find the closing brace
        idx = content.find(target_loose)
        brace_idx = content.find("}", idx)
        if brace_idx != -1:
            # Insert after
            content = content[:brace_idx+1] + "\n\n        function loadDashboardData() {\n            initChart();\n            animateCounters();\n        }" + content[brace_idx+1:]
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print("Added loadDashboardData (loose match).")
