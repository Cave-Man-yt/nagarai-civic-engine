# NagarAI — Vercel Production Deployment Guide

This project is fully configured and ready for 1-click deployment on **Vercel** for public use.

---

### 🚀 Option 1: Deploy via Vercel CLI (Recommended)

1. Open your terminal in the project directory:
   ```bash
   cd "/Users/vivekjampani/.gemini/antigravity/scratch/nagarai-civic-engine/nagarai-—-civic-complaint-intelligence-engine (1)"
   ```

2. Install Vercel CLI (if not installed):
   ```bash
   npm i -g vercel
   ```

3. Run 1-click deployment:
   ```bash
   vercel --prod
   ```

---

### 🌐 Option 2: Deploy via GitHub + Vercel Dashboard

1. Push your project to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Production Vercel Deployment Release for NagarAI"
   git branch -M main
   git remote add origin https://github.com/your-username/nagarai-civic-engine.git
   git push -u origin main
   ```

2. Open **[vercel.com/new](https://vercel.com/new)**.
3. Import your GitHub repository.
4. Set the **Framework Preset** to **Vite**.
5. Add Environment Variables (Optional):
   - `GEMINI_API_KEY`: Your Gemini API Key for speech-to-text / image analysis.
   - `VITE_API_URL`: URL of your deployed Python backend (e.g. Render / Railway).
6. Click **Deploy**!

---

### ✨ Public Release Improvements Made
- **Demo Data Removed**: All hardcoded pre-filled demo names (`Anand Kumar`, `S. Ramanathan`), phone numbers, pre-selected audio samples, pre-filled Tamil/English text, and pre-loaded images have been removed.
- **Clean Input State**: The Citizen Portal and Zonal Officer portal start completely clean for real public usage.
- **Production Build Verified**: Production bundle compiled successfully with `vite build` & `esbuild`.
- **Vercel Routing**: Added `vercel.json` rewrite configuration for SPA client-side routing.
