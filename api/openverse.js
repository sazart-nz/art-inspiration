const supportedLicenses = new Set(['cc0', 'pdm', 'by', 'by-sa', 'by-nd', 'by-nc', 'by-nc-sa', 'by-nc-nd']);
function creditRequirement(license) {
  if (license === 'cc0' || license === 'pdm') return 'Credit not required; credit to the creator appreciated.';
  const notes = ['Credit the creator and source; link the licence; say if you changed the work.'];
  if (license.includes('nc')) notes.push('Noncommercial use only.');
  if (license.includes('nd')) notes.push('No adapted work may be shared.');
  if (license.includes('sa')) notes.push('Share adaptations under the same licence.');
  return notes.join(' ');
}
export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed.' });
  }
  const query = String(request.query.q || '').trim();
  if (!query || query.length > 100) return response.status(400).json({ error: 'Enter a search term of up to 100 characters.' });
  const url = new URL('https://api.openverse.org/v1/images/');
  url.searchParams.set('q', query);
  url.searchParams.set('page_size', '24');
  try {
    const upstream = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!upstream.ok) throw new Error(`Openverse response ${upstream.status}`);
    const data = await upstream.json();
    const photos = (data.results || [])
      .filter(x => supportedLicenses.has(x.license?.toLowerCase()) && x.thumbnail?.startsWith('https://') && (x.foreign_landing_url || x.url)?.startsWith('https://') && x.license_url?.startsWith('https://'))
      .map(x => ({
        id: `ov-${x.id}`, url: x.foreign_landing_url || x.url,
        alt: x.title || 'Openly licensed image', photographer: x.creator || 'Creator not listed',
        source: 'Openverse', license: `CC ${x.license.toUpperCase()}${x.license_version ? ` ${x.license_version}` : ''}`.replace('CC CC0', 'CC0').replace('CC PDM', 'Public Domain Mark'),
        licenseUrl: x.license_url, creditRequirement: creditRequirement(x.license.toLowerCase()),
        src: { medium: x.thumbnail, large: x.url?.startsWith('https://') ? x.url : x.thumbnail }
      }));
    response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return response.status(200).json({ photos });
  } catch (error) {
    console.error('Openverse search failed:', error);
    return response.status(502).json({ error: 'Openverse is unavailable. Please try again.' });
  }
}
