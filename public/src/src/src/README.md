# Live Site Builder

## Setup (local)
1. `npm install`
2. `npm run dev`  → open http://localhost:5173

## Build
`npm run build` → dist/

## Deploy to GitHub Pages (one-time setup)
Option A (gh-pages package):
1. create repo on GitHub and add it as remote.
2. `npm run deploy`  (will build and push `dist` to `gh-pages` branch)

Option B (recommended: GitHub Actions):
- Add workflow `.github/workflows/deploy-gh-pages.yml` (provided).
- Push to `main` (or the branch in workflow). Action will build and publish to `gh-pages`.

## Notes
- Iframe sandbox is `allow-scripts allow-forms allow-same-origin` so JS runs. If you host pages on same domain you can relax sandbox as needed.
