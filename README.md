# Pexels Image Search

A dependency-free image search site for GitHub and Vercel. The browser calls `/api/search`; the serverless function securely calls Pexels with `PEXELS_API_KEY`.

## Local development

1. Install the Vercel CLI: `npm install -g vercel`
2. Copy `.env.example` to `.env.local` and add your key.
3. Run `vercel dev`.
4. Open the local URL shown in the terminal.

Do not commit `.env.local` or your API key.
