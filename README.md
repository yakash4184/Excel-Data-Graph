# District Wise Sales Super Visual Dashboard (React + Vite)

Frontend-only dashboard for India state/district sales and client coverage reporting.

## Required columns

- State Name
- District Name
Only these are mandatory:
- State Name
- District Name

Optional columns supported automatically:
- Distributor Count
- Sum of 2024-25
- Sum of 24th feb.26
- Retailer Count
- Any extra numeric/text columns (example: Population)

## Features

- Upload `.xlsx` / `.csv`
- Flexible column validation (requires State Name + District Name, allows extra columns)
- Auto-fill state names when Excel has blank merged rows
- Bright India map with custom pin markers
- State-wise boundary overlays
- District boundary highlight on district selection
- Full-screen map option
- State / district drill-down filtering
- KPI cards (sales, growth, distributor, retailer, and dynamic totals)
- Charts: sales comparison + top growth districts
- Detailed district performance table with all uploaded columns
- `Download Sample Excel` button

## Run

```bash
npm install
npm start
```

## Build

```bash
npm run build
npm run preview
```

## Boundary Data Source

State and district boundary polygons are loaded at runtime from a GeoJSON CDN source.  
If internet access to that source is unavailable, marker plotting still works and boundary overlays are temporarily skipped.
