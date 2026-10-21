# VIZLAB - Interactive 3D Virtual Science Laboratory

VIZLAB is a 3D virtual science laboratory for Physics, Chemistry, and Biology powered by Three.js and Google Gemini.

## Deploying to Vercel

> 📖 **Full End-to-End Guide**: See [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) for detailed step-by-step instructions (Dashboard & CLI methods, verification endpoints, and troubleshooting).

### Option 1: Automatic Deploy with Environment Variables
When importing your repository on Vercel:

1. In the **Environment Variables** section on Vercel, Vercel automatically populates the required variables from `.env.example`:
   - **`GEMINI_API_KEY`**: Your Google Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Or use the **Bulk Paste** feature in Vercel:
   - Copy the contents of `.env.example`:
     ```env
     GEMINI_API_KEY=
     ```
   - Paste it into the first key box in Vercel Environment Variables, and Vercel will automatically split the keys and values!
3. Check all three scopes: **Production**, **Preview**, and **Development**.
4. Click **Deploy**!

### Verifying Live AI on Vercel
After deployment finishes, visit:
`https://<your-vercel-domain>.vercel.app/api/ai/test`

You should receive:
```json
{
  "ok": true,
  "model": "gemini-3.1-flash-lite",
  "latencyMs": 1300,
  "response": "VIZLAB_OK"
}
```

### Supported API Key Formats
VIZLAB supports both:
- **New Google AI Studio Auth Keys**: Keys starting with `AQ.` (e.g., `AQ.Ab8...`)
- **Standard Google Cloud API Keys**: Keys starting with `AIza...`
- All common environment variable aliases: `GEMINI_API_KEY`, `GOOGLE_GENAI_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_KEY`.

### Local Development
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the laboratory.

## Deploying to Render

When deploying as a **Web Service** on [Render](https://render.com):

1. **Connect Repository**: Select your VIZLAB GitHub/Git repository.
2. **Settings**:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build` (or `npm run render-build`)
   - **Start Command**: `npm start` (or `tsx server.ts`)
3. **Environment Variables**:
   - `NODE_ENV`: `production`
   - `GEMINI_API_KEY`: Your Gemini API key from Google AI Studio.
4. **Deploy**: Render will install dependencies, build the frontend (`dist/index.html`) and API, and start the unified server. Render's blueprint `render.yaml` is also included at the project root for 1-click Blueprints!

