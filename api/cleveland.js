export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed.' });
  }
  const query = String(request.query.q || '').trim();
  if (!query || query.length > 100) return response.status(400).json({ error: 'Enter a search term of up to 100 characters.' });
  const url = new URL('https://openaccess-api.clevelandart.org/api/artworks/');
  url.searchParams.set('q', query);
  url.searchParams.set('cc0', '');
  url.searchParams.set('has_image', '1');
  url.searchParams.set('limit', '24');
  url.searchParams.set('fields', 'id,title,creators,share_license_status,url,images');
  try {
    const upstream = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!upstream.ok) throw new Error(`Cleveland response ${upstream.status}`);
    const data = await upstream.json();
    const photos = (data.data || [])
      .filter(x => x.share_license_status === 'CC0' && x.images?.web?.url?.startsWith('https://'))
      .map(x => ({
        id: `cma-${x.id}`, url: x.url, alt: x.title || 'Artwork',
        photographer: x.creators?.[0]?.description || 'Artist unknown',
        source: 'Cleveland Museum of Art', license: 'CC0',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        creditRequirement: 'Credit not required; artist and museum credit appreciated.',
        src: { medium: x.images.web.url, large: x.images.web.url }
      }));
    response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return response.status(200).json({ photos });
  } catch (error) {
    console.error('Cleveland search failed:', error);
    return response.status(502).json({ error: 'The Cleveland collection is unavailable. Please try again.' });
  }
}
