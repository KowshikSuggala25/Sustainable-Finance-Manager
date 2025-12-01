# Personal Finance Manager

A modern **Personal Finance Manager** built with **Vite, React & TypeScript**, styled using **Tailwind CSS** and **shadcn-ui**.  
It helps users track **income, expenses, budgets**, and promotes sustainability with a built-in **Carbon Footprint Tracker**.
You can check the live access of the link <a href = "https://personal-finance-manager-g18h.onrender.com" >Click here</a>
## Features

- Authentication (Signup, Login, Profile management)
- Track income & expenses with categories
- Budget management with alerts
- Hide the transactions
- Interactive visual insights (charts & reports)
- Carbon Footprint Tracker for sustainable living
- Export transaction history (CSV / PDF)
- Responsive UI for web & mobile

## Tech Stack

- **Framework:** Vite + React + TypeScript
- **Styling:** Tailwind CSS + shadcn-ui
- **State Management:** Zustand / React Context
- **Charts:** Chart.js / Recharts
- **API Layer:** Axios / Fetch (to connect backend service)

## Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/<your-username>/sustainable-finance-manager.git
cd sustainable-finance-manager
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Copy `.env.example` → `.env` and set values:

```env
VITE_API_URL=http://localhost:5000
VITE_APP_ENV=development
```

### 4. Start development server

```bash
npm run dev
```

-> App will be available at: **http://localhost:5173**

## Deployment (Render — Static Site)

1. Go to [Render](https://render.com) → **Create Static Site**
2. Connect GitHub repo & branch
3. Configure:
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`
4. Add environment variables under **Settings → Environment**
5. Deploy succesfully

## Project Structure

````
src/
 ├── app/            # App entry, providers
 ├── components/     # Reusable UI components
 ├── features/       # Core features (transactions, budgets, carbon footprint)
 ├── pages/          # Dashboard, Login, Reports, Settings
 ├── hooks/          # Custom React hooks
 ├── lib/            # API clients & utilities
 ├── types/          # TypeScript types & interfaces
 └── main.tsx


**Architecture Overview**
Frontend-centric architecture with feature separation and typed API layer.

```mermaid
flowchart LR
  UI[Pages & Components] --> State[State (Zustand/Context)]
  State --> Features[Features (Transactions, Budgets, Carbon)]
  Features --> API[API Layer]
  API --> Server[(Backend Service - Node/TS)]
````

## Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview --port 5173",
    "lint": "eslint 'src/**/*.{ts,tsx}' --fix",
    "format": "prettier --write 'src/**/*.{ts,tsx,css,md}'",
    "type-check": "tsc --noEmit"
  }
}
```

## Contact

**Sai Kowshik Suggala**  
 saikowshiksuggala9390@gmail.com  
 [GitHub: KowshikSuggala25](https://github.com/KowshikSuggala25)
