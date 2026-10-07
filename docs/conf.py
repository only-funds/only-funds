import json
from pathlib import Path
project = 'OnlyFunds'
author = 'OnlyFunds contributors'
copyright = '2026, OnlyFunds'
release = json.loads((Path(__file__).parent.parent / 'package.json').read_text())['version']
extensions = ['myst_parser', 'sphinx_design']
myst_enable_extensions = ['colon_fence', 'deflist']
language = 'zh_CN'
html_theme = 'furo'
html_title = 'OnlyFunds · 使用手册'
html_short_title = 'OnlyFunds'
html_static_path = ['_static']
html_css_files = ['onlyfunds.css']
html_logo = '../client/public/brand/onlyfunds-logo.webp'
html_favicon = '../client/public/brand/favicon.png'
html_theme_options = {
    'light_css_variables': {'color-brand-primary': '#009fe3', 'color-brand-content': '#0087be', 'color-sidebar-background': '#f6fbfe'},
    'dark_css_variables': {'color-brand-primary': '#62d4ff', 'color-brand-content': '#62d4ff'},
    'sidebar_hide_name': False,
}
exclude_patterns = ['_build', 'requirements.txt', 'requirements-lock.txt']
html_show_sphinx = False
html_show_copyright = True
nitpicky = True
