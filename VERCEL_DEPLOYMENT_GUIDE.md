# End-to-End Vercel Deployment Guide for VIZLAB

This step-by-step guide walks you through deploying the **VIZLAB 3D Virtual Science Laboratory** (React 19 + TypeScript + Vite + Three.js + Google Gemini Serverless API) to **[Vercel](https://vercel.com)** from start to finish.

---

## 1. Architecture Overview on Vercel

VIZLAB is designed as a hybrid full-stack application that deploys natively to Vercel without requiring a long-running Node.js process:

| Component | Technology | Where It Runs on Vercel |
| :--- | :--- | :--- |
| **Frontend Client** | React 19, TypeScript, Vite, Tailwind CSS, Three.js, Lucide | Deployed to **Vercel Edge Network / CDN** from the `dist/` folder. Serves the 3D lab interfaces, PWA service worker (`dist/sw.js`), and static 3D GLB assets. |
| **Backend Serverless API** | Node.js ESM bundles created with `esbuild` from `api_src/` | Deployed automatically as **Vercel Serverless Functions** (`/api/*`). Handles Gemini 2.5/3.0 AI model generation, diagram scanning, and chatbot queries. |
| **Routing & Rewrites** | Single-Page Application (SPA) Router | Handled by `vercel.json`, rewriting non-API client routes to `/index.html`. |

---

## 2. Prerequisites

Before starting, make sure you have:

1. **A Git repository** containing your VIZLAB project (GitHub, GitLab, or Bitbucket).
2. **A Vercel Account**: Sign up for free at [vercel.com](https://vercel.com) (login with GitHub is recommended).
3. **A Google Gemini API Key**:
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey).
   - Click **Create API Key**.
   - Copy the key (both standard `AIza...` keys and new `AQ...` keys are fully supported).

---

## 3. Step-by-Step Deployment Methods

### Method A: Deploy via Vercel Web Dashboard (Recommended)

#### Step 1: Push Your Code to Git
Make sure all your local changes are committed and pushed to your remote repository (e.g. GitHub):

```bash
git add .
git commit -m "Prepare VIZLAB for Vercel deployment"
git push origin main
```

#### Step 2: Import the Project in Vercel
1. Log in to [vercel.com](https://vercel.com) and go to your **Dashboard**.
2. Click **Add New…** → **Project**.
3. Under **Import Git Repository**, find your VIZLAB repository and click **Import**.

#### Step 3: Configure Project Settings
Vercel will detect Vite, but verify the following settings:

- **Project Name**: `vizlab` (or your preferred name)
- **Framework Preset**: `Vite`
- **Root Directory**: `./` (leave as default)
- **Build and Output Settings**:
  - **Build Command**: `npm run build` *(Overrides are unnecessary if `vercel.json` is present)*
  - **Output Directory**: `dist`
  - **Install Command**: `npm install`

#### Step 4: Add Environment Variables
In the **Environment Variables** section on the import screen:

1. Add the required Gemini API Key:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: `<paste your Gemini API Key here>`
2. *(Optional)* Add your production URL:
   - **Key**: `APP_URL`
   - **Value**: `https://your-project-name.vercel.app`
3. Ensure the checkmarks for **Production**, **Preview**, and **Development** are all selected.

> **Tip:** You can also click **Bulk Paste** and paste the following snippet:
> ```env
> GEMINI_API_KEY=your_actual_gemini_api_key_here
> ```

#### Step 5: Click Deploy
1. Click the **Deploy** button.
2. Vercel will:
   - Run `npm install`
   - Execute `vite build` (compiling the React/Three.js frontend into `dist/`)
   - Execute `npm run build:api` (bundling the serverless handlers into `api/`)
   - Generate PWA service worker manifests
   - Deploy serverless functions and edge assets
3. Within 1–2 minutes, you will see the **Congratulations!** screen with your live production URL (e.g., `https://vizlab-alpha.vercel.app`).

---

### Method B: Deploy via Vercel CLI

If you prefer deploying directly from your terminal:

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Log In to Vercel
```bash
vercel login
```

#### Step 3: Link and Configure the Project
Run the setup command from the root directory of your project:

```bash
vercel
```
Follow the interactive prompts:
- *Set up and deploy?* → `y`
- *Which scope?* → Select your personal account or team
- *Link to existing project?* → `n`
- *What's your project's name?* → `vizlab`
- *In which directory is your code located?* → `./`
- *Want to modify settings?* → `n`

#### Step 4: Add Environment Variables via CLI
```bash
vercel env add GEMINI_API_KEY
```
When prompted, select all environments (**Production**, **Preview**, **Development**) and paste your Gemini API Key.

#### Step 5: Deploy to Production
```bash
vercel --prod
```
The CLI will print your live deployment URL when finished!

---

## 4. End-to-End Verification & Health Checks

Once deployed, verify that both the static 3D frontend and the serverless AI backend are operating properly.

### 1. Test Serverless AI Backend
In your browser or terminal, visit:
```text
https://<your-vercel-domain>.vercel.app/api/ai/test
```
You should see a successful JSON response:
```json
{
  "ok": true,
  "model": "gemini-2.5-flash",
  "latencyMs": 1150,
  "response": "VIZLAB_OK"
}
```

You can also inspect the full diagnostics endpoint:
```text
https://<your-vercel-domain>.vercel.app/api/ai/health
```

### 2. Verify 3D WebGL Rendering
1. Open `https://<your-vercel-domain>.vercel.app` in your browser.
2. Navigate to **Physics Lab** or **Ai Model Generator**.
3. Select any model (e.g. *Model 62: Maxwell's Equations*, *Model 63: AC RLC Resonance*, or *Model 64: Thin Lens Optics*).
4. Verify that:
   - The 3D canvas loads smoothly with shadows and lighting.
   - You can orbit, pan, and zoom using your mouse or touch gestures.
   - Real-time parameter sliders update the 3D geometry instantly.

### 3. Verify Live AI Model Generation
1. Go to the **AI Model Generator** tab (`/generate`).
2. Type a custom prompt such as:
   `"Create a 3D model of an electromagnetic railgun with Lorentz force rails"`
3. Click **Generate 3D Model**.
4. Confirm that the AI model stream returns a structured 3D assembly and renders it in the viewport.

### 4. Verify PWA Offline Mode
1. Open Chrome DevTools (`F12`) → **Application** tab → **Service Workers**.
2. Verify that `sw.js` is active and running.
3. Check the **Offline** checkbox in DevTools and refresh the page: VIZLAB will load offline with full access to all pre-cached curated 3D science models!

---

## 5. Configuration Reference

### `vercel.json` Explained
The project root already includes a configured `vercel.json`:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "functions": {
    "api/**/*.*": {
      "maxDuration": 60
    }
  },
  "rewrites": [
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ]
}
```

- **`buildCommand`**: Runs `vite build && npm run build:api`, which generates both the client bundle and the serverless endpoints.
- **`outputDirectory`**: Points to `dist`, where Vite outputs compiled assets.
- **`maxDuration: 60`**: Sets the execution timeout for Gemini AI generation functions to 60 seconds (preventing premature timeouts on complex prompts).
- **`rewrites`**: Ensures that client-side React routes (`/physics`, `/chemistry`, `/biology`, `/diagram-scan`) load `/index.html` instead of throwing a 404.

### Supported Environment Variable Aliases
The backend serverless handler checks for any of the following variable names:
- `GEMINI_API_KEY` *(Primary)*
- `GOOGLE_GENAI_API_KEY`
- `GOOGLE_API_KEY`
- `GEMINI_KEY`

---

## 6. Troubleshooting & FAQs

### Q: Why do I get `AUTH_MISSING` or "Gemini API key is not configured"?
**Fix**:
1. Go to your project on **Vercel Dashboard** → **Settings** → **Environment Variables**.
2. Confirm `GEMINI_API_KEY` is present and active for **Production**.
3. After changing or adding an environment variable, you must trigger a redeploy:
   - Go to **Deployments** tab.
   - Click the three dots (`...`) next to your latest deployment → **Redeploy**.

### Q: Why did I see `Error: Dynamic require of "child_process" is not supported` in Vercel logs?
**Cause & Fix**:
- Because `package.json` uses `"type": "module"`, Vercel executes `/api/**/*.js` as ES Modules where global `require()` is not defined by default. When CommonJS sub-dependencies inside `@google/genai` (such as `google-auth-library`) call `require("child_process")`, `esbuild`'s ESM wrapper throws `Dynamic require of "child_process" is not supported` unless `createRequire` is injected.
- **Already Fixed in `package.json` & `/api`**: The `build:api` script now injects `--banner:js="import { createRequire as __vizlabCreateRequire } from 'node:module'; const require = __vizlabCreateRequire(import.meta.url);"` at the top of every compiled serverless handler in `/api`. Commit and push the updated `package.json` and `/api` files (or redeploy on Vercel) to resolve the error immediately.

### Q: Why do routes like `/physics` show 404 when refreshed directly?
**Fix**: Ensure `vercel.json` exists in your repository root with the `rewrites` configuration shown above. This directs all non-API paths to `index.html`.

### Q: Are large GLB 3D files supported on Vercel?
**Yes**: All binary `.glb` models are located in `/public/models/`. During the Vite build, they are copied directly into the root of `dist/models/` and served with efficient cache headers over Vercel's global CDN.

### Q: How do I add a Custom Domain?
1. In Vercel, go to **Settings** → **Domains**.
2. Enter your custom domain (e.g. `vizlab.yourdomain.com`).
3. Add the displayed `CNAME` or `A` record in your DNS provider (e.g. Cloudflare, Namecheap, GoDaddy).
4. Vercel will automatically provision a free SSL/TLS certificate.

---

## 7. Summary Checklist

- [ ] Code committed and pushed to GitHub
- [ ] Vercel project imported with framework preset **Vite**
- [ ] `GEMINI_API_KEY` configured in Vercel Environment Variables
- [ ] Project built successfully (`npm run build`)
- [ ] Backend test endpoint verified (`/api/ai/test`)
- [ ] 3D interactive physics and chemistry simulations verified in browser
- [ ] Offline service worker verified in DevTools
