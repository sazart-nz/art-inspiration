export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed.' });
  }
  const query = String(request.query.q || '').trim();
  if (!query || query.length > 100) return response.status(400).json({ error: 'Enter a search term of up to 100 characters.' });
  const url = new URL('https://api.artic.edu/api/v1/artworks/search');
  url.searchParams.set('params', JSON.stringify({
    q: query, limit: 24, fields: ['id', 'title', 'artist_title', 'image_id', 'is_public_domain'],
    query: { bool: { filter: [{ term: { is_public_domain: true } }, { exists: { field: 'image_id' } }] } }
  }));
  try {
    const upstream = await fetch(url, { headers: { 'User-Agent': 'ArtInspiration/1.0 (artwork discovery)' }, signal: AbortSignal.timeout(8000) });
    if (!upstream.ok) throw new Error(`Collection response ${upstream.status}`);
    const data = await upstream.json();
    const base = data.config?.iiif_url || 'https://www.artic.edu/iiif/2';
    const photos = (data.data || []).filter(x => x.is_public_domain && x.image_id).map(x => ({
      id: `aic-${x.id}`, url: `https://www.artic.edu/artworks/${x.id}`,
      alt: x.title || 'Artwork', photographer: x.artist_title || 'Artist unknown',
      source: 'Art Institute of Chicago',
      license: 'CC0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
      creditRequirement: 'Credit not required; artist and museum credit appreciated.',
      src: { medium: `${base}/${x.image_id}/full/400,/0/default.jpg`, large: `${base}/${x.image_id}/full/843,/0/default.jpg` }
    }));
    response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return response.status(200).json({ photos });
  } catch (error) {
    console.error('Art search failed:', error);
    return response.status(502).json({ error: 'The art collection is unavailable. Please try again.' });
  }
}
