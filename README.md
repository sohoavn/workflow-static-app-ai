# Workflow-as-Application Platform

> **Static Web Application** for creating executable workflows with AI assistance

🚀 **Live Demo:** https://sohoavn.github.io/workflow-static-app-ai/

[![Status](https://img.shields.io/badge/Status-Wave%201%20Complete-success)](https://github.com/sohoavn/workflow-static-app-ai)
[![Tech](https://img.shields.io/badge/Tech-Vanilla%20JS-yellow)](https://github.com/sohoavn/workflow-static-app-ai)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

---

## 📋 Overview

This platform enables users to:
1. **Design workflows** using AI (Gemini) with domain-specific experts
2. **Generate applications** from workflow definitions (Coming in Wave 3)
3. **Execute workflows** in browser with state management

### 🎯 Key Features

- ✅ **Multi-AI Key Rotation**: Automatic API key rotation when quota exceeded
- ✅ **Hybrid UI**: AI Chat + Visual Preview
- ✅ **6 Domain Experts**: Education, HR, Sales, Finance, Operations, Custom
- ✅ **Client-Side Storage**: localStorage + IndexedDB
- ✅ **Export/Import**: JSON, Markdown, ZIP formats
- 🚧 **Code Generation**: Auto-generate execution apps (Wave 3)
- 🚧 **State Machine**: Level 3 parallel workflow execution (Wave 5)

---

## 🏗️ Architecture

```
Static Web App (GitHub Pages)
├── index.html          - Entry point with SPA router
├── /pages/
│   ├── designer.html   - AI-powered workflow designer
│   ├── settings.html   - API key management
│   ├── generator.html  - Code generator (Wave 3)
│   └── library.html    - Workflow library (Wave 4)
├── /assets/
│   ├── /css/           - Styles with design tokens
│   └── /js/
│       ├── /core/      - Core modules (API, Storage, Gemini)
│       ├── /modules/   - Feature modules
│       └── /utils/     - Utilities (File, Notification)
```

**Tech Stack:**
- Pure HTML5 + Vanilla JavaScript (ES6+)
- TailwindCSS (CDN)
- Gemini API (AI)
- No build tools, No npm

---

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/sohoavn/workflow-static-app-ai.git
cd workflow-static-app-ai
```

### 2. Run Local Server

```bash
# Python 3
python3 -m http.server 8000

# OR Node.js
npx serve

# OR PHP
php -S localhost:8000
```

### 3. Open Browser

Navigate to: `http://localhost:8000`

### 4. Add API Key

1. Go to **Settings** page
2. Get Gemini API key: https://makersuite.google.com/app/apikey
3. Add your API key
4. Start creating workflows!

---

## 📖 Usage Guide

### Creating a Workflow

1. **Navigate to Designer** page
2. **Select Domain Expert** (e.g., HR, Education)
3. **Describe workflow** in natural language:
   ```
   Example: "Create an employee onboarding workflow with 
   document collection, IT setup, and training"
   ```
4. **AI generates** complete workflow JSON
5. **Preview & Edit** workflow steps
6. **Export** as JSON or Save to library

### Managing API Keys

- **Add multiple keys** for automatic rotation
- **Track usage** per key
- **Reset quotas** when needed
- **Export/Import** keys for backup

### Storage Management

- **localStorage**: Small data (< 5MB)
- **IndexedDB**: Large workflows and state
- **Export all data** for backup
- **Import data** to restore

---

## 📦 Development Roadmap

### ✅ Wave 1: Core Infrastructure (Week 1-2) - **COMPLETE**
- [x] Entry point with SPA router
- [x] Multi-API key rotation system
- [x] Gemini client with streaming
- [x] Storage manager (localStorage + IndexedDB)
- [x] Notification system
- [x] Settings page
- [x] Designer page (AI chat + preview)

### ⏳ Wave 2: Designer Module (Week 3-5) - **IN PROGRESS**
- [ ] Step editor modal
- [ ] Form builder
- [ ] Visual canvas (Mermaid diagrams)
- [ ] Workflow validation
- [ ] Expert agent prompts (6 domains)

### 🚧 Wave 3: Generator Module (Week 6-8)
- [ ] Upload workflow JSON
- [ ] HTML generator
- [ ] JavaScript generator (execution engine)
- [ ] CSS generator
- [ ] ZIP packager
- [ ] Preview generated app

### 🚧 Wave 4: Library Module (Week 9-10)
- [ ] Workflow CRUD operations
- [ ] Pre-built templates (5 industries)
- [ ] Search & filter
- [ ] Import/Export workflows

### 🚧 Wave 5: State Machine (Week 11-12)
- [ ] Linear workflow execution
- [ ] Conditional branching
- [ ] Parallel execution (Level 3)
- [ ] State persistence

### 🚧 Wave 6: Polish (Week 13-16)
- [ ] Dark mode
- [ ] Responsive design refinement
- [ ] Documentation
- [ ] Error handling
- [ ] Performance optimization

---

## 🔧 Configuration

### API Keys

API keys are stored in **localStorage**:
```javascript
// Structure
{
  "gemini_api_keys": [
    {
      "id": "...",
      "key": "AIza...",
      "nickname": "Key 1",
      "requestCount": 42,
      "quotaExceeded": false
    }
  ]
}
```

### Storage Limits

- **localStorage**: ~5MB (for settings, small workflows)
- **IndexedDB**: ~50MB+ (for large workflows, generated apps)

---

## 🤝 Contributing

Contributions welcome! This project is built incrementally in waves.

### Current Focus: Wave 2

Help needed with:
- Step editor UI
- Form builder component
- Workflow validation logic

### Development Setup

1. Fork repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes
4. Commit: `git commit -m 'feat: add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Create Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

## 👤 Author

**sohoavn**
- GitHub: [@sohoavn](https://github.com/sohoavn)
- Repository: [workflow-static-app-ai](https://github.com/sohoavn/workflow-static-app-ai)

---

## 🙏 Acknowledgments

- **Gemini API** by Google
- **TailwindCSS** for styling
- **Lucide Icons** for UI icons
- **JSZip** for file compression
- **Mermaid.js** for diagrams

---

## 📊 Project Stats

- **Lines of Code**: ~5,000+
- **Files**: 12 core files
- **Dependencies**: 6 CDN libraries (no npm)
- **Deployment**: GitHub Pages (static)

---

**Built with ❤️ using pure JavaScript**
