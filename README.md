# LegalCase — Advocate Office Management (UI)

## Run
```bash
npm install
npm run dev
```
Demo login: **admin / admin123**

## Flow
`/login` → `/dashboard` → har button `/module/:slug` (placeholder page) par jaata hai.

## Structure
- `src/pages/Login.jsx` — login page
- `src/pages/Dashboard.jsx` — main dashboard (stats, Master Entry, Data Entry, Reports)
- `src/pages/ModulePage.jsx` — har module ka placeholder (next step me yahan form/report banega)
- `src/data/menu.js` — saare buttons, stats, office info yahin se aate hain
- `src/context/AuthContext.jsx` — demo auth (localStorage)
