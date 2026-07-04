# AI Diagram Studio

An intelligent diagram editor powered by AI. Write architecture diagrams in Mermaid and preview them live, with AI assistance for generation and editing.

![demo](https://img.shields.io/badge/status-beta-blue)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6)
![Vite](https://img.shields.io/badge/Vite-6-646CFF)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4)

## Features

- **Live Mermaid editor** — code on the left, rendered diagram on the right
- **AI diagram generation** — describe your architecture in plain English, get a diagram
- **AI chat assistant** — ask AI to modify or explain your diagrams
- **Multiple diagram types** — flowcharts, sequence diagrams, architecture diagrams, and more
- **Version history** — auto-save with commit history and diff
- **Export** — download diagrams as PNG, SVG, or PDF
- **Responsive layout** — side-by-side on desktop, stacked on mobile
- **Collaborative editing** — real-time sync via WebSocket
- **Zoom & pan** — navigate large diagrams with intuitive controls
- **Undo/redo** — full state history with temporal zustand

## Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4 |
| **State** | Zustand + Zundo (temporal undo) |
| **Editor** | Monaco Editor, Mermaid, React Flow |
| **UI** | Lucide icons, Motion (animations), canvas-confetti |
| **Backend** | Express, ws (WebSocket), Drizzle ORM |
| **Database** | PostgreSQL |
| **AI** | Gemini API |
| **Export** | html-to-image, jsPDF |

## Screenshots

<!-- Add screenshots here -->
```
[Editor view]  [AI chat panel]  [Version history]  [Export dialog]
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (optional, for backend features)

### Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your GEMINI_API_KEY to .env

# Start both frontend and backend
npm run dev
```

Frontend: `http://localhost:3000`
Backend: `http://localhost:3001`

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_GEMINI_API_KEY` | Yes | Gemini API key for AI features |
| `VITE_CLERK_PUBLISHABLE_KEY` | No | Clerk auth (optional) |
| `DATABASE_URL` | For backend | PostgreSQL connection string |
| `BACKEND_PORT` | No | Backend port (default: 3001) |

## Project Structure

```
├── backend/                  # Express API server
│   ├── src/
│   │   ├── server.ts         # API routes, WebSocket on /ws
│   │   ├── db/
│   │   │   ├── schema.ts     # Drizzle ORM tables
│   │   │   └── index.ts      # Postgres connection
│   ├── .env.example
│   └── package.json
├── src/                      # React frontend
│   ├── components/
│   │   ├── Toolbar.tsx       # Top toolbar with export, AI, more
│   │   ├── Sidebar.tsx       # Diagram list & folders
│   │   ├── Editor.tsx        # Monaco-based Mermaid editor
│   │   ├── DiagramPreview.tsx # Rendered diagram viewer
│   │   ├── AIChat.tsx        # AI chat assistant panel
│   │   ├── AICommandBar.tsx  # Inline AI command input
│   │   ├── TemplatesLibrary.tsx
│   │   └── VersionHistory.tsx
│   ├── lib/
│   │   └── export.ts         # PNG/SVG/PDF export logic
│   ├── store/
│   │   └── useStore.ts       # Zustand store (diagrams, versions)
│   ├── hooks/
│   │   └── useCollaboration.ts # WebSocket collab hook
│   ├── App.tsx               # Main layout & panels
│   ├── main.tsx              # Entry point
│   └── index.css             # Tailwind imports
├── vite.config.ts            # Proxies /api, /ws to backend
├── tailwind.config.ts
├── tsconfig.json
└── package.json              # Root scripts & dependencies
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend + backend concurrently |
| `npm run dev:fe` | Start frontend only (port 3000) |
| `npm run dev:be` | Start backend only (port 3001) |
| `npm run build` | Build frontend + backend for production |
| `npm run preview` | Preview production build |
| `npm run lint` | TypeScript type check (`tsc --noEmit`) |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/diagrams` | List diagrams |
| POST | `/api/diagrams` | Create a diagram |
| PUT | `/api/diagrams/:id` | Update a diagram |
| DELETE | `/api/diagrams/:id` | Delete a diagram |
| POST | `/api/chat` | AI chat (Gemini) |
| POST | `/api/generate-diagram` | AI diagram generation |
| WS | `/ws` | Real-time collaboration |

## Troubleshooting

- **Diagrams not rendering** — ensure Mermaid syntax is valid; check browser console for errors
- **AI not responding** — verify `VITE_GEMINI_API_KEY` is set in `.env` and the key has access to the Gemini API
- **Backend won't start** — ensure `DATABASE_URL` is correct; backend falls back to in-memory if DB is unavailable
- **Export fails** — some ad blockers interfere with canvas-to-image export; try disabling them

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for planned features.

## License

MIT
