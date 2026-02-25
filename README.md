# State District Dashboard (React + Vite)

A frontend-only, production-ready dashboard for uploading `.xlsx` / `.csv` files, validating strict columns, searching by state/district, and visualizing results in table, chart, and map.

## Required columns

- State
- District
- Population
- Cases
- Vaccinated
- Latitude
- Longitude

## Install and run

```bash
npm install
npm run dev
```

## Build for production

```bash
npm run build
npm run preview
```

## Deploy on Vercel (Free)

1. Push this folder to GitHub.
2. Import repo in Vercel.
3. Vercel auto-detects Vite and builds with `npm run build`.
4. Output directory: `dist`.

`vercel.json` includes SPA rewrite support.
