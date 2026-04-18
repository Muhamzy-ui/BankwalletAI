import os
import json

base_dir = "C:\\Users\\HP\\Desktop\\AI\\telebot-pro"

# Backend extra files
backend_files = {
    "backend/bot/views.py": "from rest_framework import viewsets\nfrom rest_framework.response import Response\n\nclass BotViewSet(viewsets.ViewSet):\n    def list(self, request):\n        return Response({'status': 'Bot app is running'})\n",
    "backend/bot/serializers.py": "from rest_framework import serializers\n\n# Add your serializers here\n",
    "backend/bot/tasks.py": "from celery import shared_task\n\n@shared_task\ndef sample_bot_task():\n    print('Executing bot task')\n    return True\n",
    "backend/bot/admin.py": "from django.contrib import admin\n\n# Register your models here.\n",
    "backend/analytics/views.py": "from rest_framework import viewsets\nfrom rest_framework.response import Response\n\nclass AnalyticsViewSet(viewsets.ViewSet):\n    def list(self, request):\n        return Response({'status': 'Analytics app is running'})\n",
    "backend/analytics/serializers.py": "from rest_framework import serializers\n\n# Add your serializers here\n",
    "backend/analytics/admin.py": "from django.contrib import admin\n\n# Register your models here.\n",
}

# Frontend React files (using Vite for speed and simplicity)
frontend_files = {
    "frontend/package.json": json.dumps({
        "name": "telebot-frontend",
        "private": True,
        "version": "0.0.0",
        "type": "module",
        "scripts": {
            "dev": "vite",
            "build": "vite build",
            "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
            "preview": "vite preview"
        },
        "dependencies": {
            "react": "^18.2.0",
            "react-dom": "^18.2.0",
            "axios": "^1.6.0"
        },
        "devDependencies": {
            "@vitejs/plugin-react": "^4.2.1",
            "vite": "^5.2.0"
        }
    }, indent=4),
    "frontend/vite.config.js": "import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\n\nexport default defineConfig({\n  plugins: [react()],\n})\n",
    "frontend/index.html": "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>Telebot Pro</title>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n    <script type=\"module\" src=\"/src/main.jsx\"></script>\n  </body>\n</html>\n",
    "frontend/src/main.jsx": "import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport App from './App.jsx'\n\nReactDOM.createRoot(document.getElementById('root')).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>,\n)\n",
    "frontend/src/App.jsx": "import React from 'react'\nfunction App() {\n  return (\n    <div style={{ textAlign: 'center', padding: '50px' }}>\n      <h1>Telebot Pro Dashboard</h1>\n      <p>React Frontend Scaffolded Successfully!</p>\n    </div>\n  )\n}\nexport default App;\n",
    "frontend/src/api/index.js": "import axios from 'axios';\n\nconst API = axios.create({ baseURL: 'http://localhost:8000' });\nexport default API;\n",
    "frontend/src/components/Layout.jsx": "import React from 'react';\n\nconst Layout = ({ children }) => {\n  return <div>{children}</div>;\n};\nexport default Layout;\n",
    "frontend/src/context/AppContext.jsx": "import React, { createContext, useState } from 'react';\n\nexport const AppContext = createContext();\n\nexport const AppProvider = ({ children }) => {\n  const [state, setState] = useState({});\n  return (\n    <AppContext.Provider value={{ state, setState }}>\n      {children}\n    </AppContext.Provider>\n  );\n};\n",
    "frontend/src/pages/Home.jsx": "import React from 'react';\n\nconst Home = () => {\n  return <div>Home Page</div>;\n};\nexport default Home;\n"
}

all_files = {**backend_files, **frontend_files}

for filepath, content in all_files.items():
    full_path = os.path.join(base_dir, filepath)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Second phase scaffolding complete.")
