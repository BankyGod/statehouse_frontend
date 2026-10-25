# The State House — Frontend

Torn-style life sim client for **United Amir**. Talks only to the FastAPI backend.

- API docs: `http://127.0.0.1:8000/docs`
- Dev FE: `http://localhost:5173` (CORS already allowed)

## Setup

```bash
npm install
cp .env.example .env   # VITE_API_URL=http://127.0.0.1:8000
npm run dev
```

### Neon

Project link: `neon.ts` + `.neon`. Run `npx neon@latest login` then `npx neon@latest deploy` to refresh Postgres/Auth env vars in `.env`. Gameplay auth stays FastAPI JWT.

## Stack

React + Vite + TypeScript, React Router, TanStack Query, Axios (Bearer JWT).

## Routes

| Path | Screen |
|---|---|
| `/login` `/register` | Auth (login is form-urlencoded) |
| `/create-character` | State picker + display name |
| `/` | Dashboard + HUD |
| `/jobs` `/education` `/gym` `/inventory` `/business` `/bank` `/stocks` `/travel` `/housing` `/medical` | Life systems |
| `/politics` `/parties` `/legislation` `/cabinet` `/government` `/news` | Civic systems |
| `/permits` `/crime` `/jail` | Risk / custody |
| `/social` `/activity` `/chat` | Social + alerts |
| `/states` `/states/:slug` | State directory (full-bleed art) |
| `/profile` | Documents + citizen record |

## Happy-path check

1. Register → login → token in `localStorage` (`statehouse_token`)
2. Create character from 20 states
3. Hire job → Work → cash/energy update in HUD
4. Crime commit once → heat/jail toast
5. Education enroll → countdown timer
