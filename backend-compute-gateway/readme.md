This backend proxies requests from the frontend to your Rhino Compute instance so we can keep API keys off the browser.

## Environment setup

Copy `.env.example` to `.env` (or set the same variables in your environment). The backend expects:

- `RHINO_COMPUTE_URL` – the full base URL for the local Rhino Compute server (e.g., `http://localhost:5000`).
- `RHINO_COMPUTE_KEY` – the API key/token used by your compute instance.
- `PORT` – optional override for the gateway port (defaults to `4000`).

Once the variables are set, install dependencies and start the server (default port 4001):

```bash
npm install
npm run dev     # watches files via nodemon
npm start       # production-style run
```

## Route overview

1. **/compute** – a generic proxy that forwards everything to Rhino Compute (adds the auth header and preserves response headers).
2. **/scripts** – serves the local `gh-script.json` manifest so the frontend can discover scripts.
3. **/scripts/compute-gh-to-json** – runs `/utility/parse-gh-to-json` on the compute server.
4. **/scripts/compute-json-to-gh** – runs `/utility/json-to-gh` and streams the resulting `.gh` file back to the client.

The proxy and script routes are all wired to the same Rhino configuration, so only `RHINO_COMPUTE_URL`/`RHINO_COMPUTE_KEY` are required to exercise every capability.
