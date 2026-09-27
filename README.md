# Art Inspiration

The working site for artists who want a starting point when facing a blank canvas.

Live site: https://art-inspiration-six.vercel.app/  
Repository: https://github.com/sazart-nz/art-inspiration

## What is here

- `index.html`, `styles.css`, `script.js`, `favicon.svg`: the frontend.
- `api/search.js`: Pexels photography search. Requires `PEXELS_API_KEY` in Vercel environment settings.
- `api/cleveland.js`: Cleveland Museum of Art search for CC0 works with images.
- `api/art.js` and `api/openverse.js`: older functions retained for history; the current frontend does not call them.
- `vercel.json`: deployment configuration.

The page offers suggested searches, colour starters, a surprise search, the daily idea, and short creative prompts. Openverse opens its own site in a new tab. Saved images and notes live only in the current browser's local storage; they do not sync between devices. Always check the original image licence before reuse.

## Updating the site

Upload the contents of this folder to the repository root, retaining the `api` subfolder. Commit the changed files in GitHub; Vercel deploys the repository. Do not upload the ZIP itself to GitHub expecting it to expand. Never put the Pexels key into a file or commit it.

To test API searches locally, use the Vercel CLI with a local `PEXELS_API_KEY` environment variable and run `vercel dev`. Opening `index.html` directly will show the layout but cannot call the serverless API routes.

## Art Idea Studio

`create.html`, `create.css`, and `create.js` provide a free, editable prompt composer. A “Build idea” button on a search result carries its description and source link to the studio. The original image is shown for reference. The prompt is built entirely in the visitor's browser and can be copied for use in an external tool. This site does not call an image-generation API, require an API key, or incur image-generation charges. External services have their own terms and limits.
