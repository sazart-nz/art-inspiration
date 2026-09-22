const PEXELS_ENDPOINT = 'https://api.pexels.com/v1/search';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  const query = String(request.query.q || '').trim();
  const page = Math.max(1, Number.parseInt(request.query.page, 10) || 1);

  if (!query) {
    return response.status(400).json({ error: 'A search term is required.' });
  }

  if (query.length > 100) {
    return response.status(400).json({ error: 'Search term is too long.' });
  }

  if (!process.env.PEXELS_API_KEY) {
    console.error('PEXELS_API_KEY is not configured.');
    return response.status(500).json({ error: 'Image search is not configured.' });
  }

  const url = new URL(PEXELS_ENDPOINT);
  url.searchParams.set('query', query);
  url.searchParams.set('page', String(page));
  url.searchParams.set('per_page', '24');

  try {
    const pexelsResponse = await fetch(url, {
      headers: { Authorization: process.env.PEXELS_API_KEY }
    });

    if (!pexelsResponse.ok) {
      const details = await pexelsResponse.text();
      console.error(`Pexels API error ${pexelsResponse.status}: ${details}`);
      return response.status(pexelsResponse.status).json({
        error: pexelsResponse.status === 429
          ? 'Search limit reached. Please try again later.'
          : 'Pexels could not complete the search.'
      });
    }

    const data = await pexelsResponse.json();
    const photos = (data.photos || []).map((photo) => ({
      id: photo.id,
      url: photo.url,
      alt: photo.alt,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      src: {
        medium: photo.src.medium,
        large: photo.src.large
      }
    }));

    response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return response.status(200).json({
      page: data.page,
      perPage: data.per_page,
      totalResults: data.total_results,
      photos
    });
  } catch (error) {
    console.error('Search request failed:', error);
    return response.status(500).json({ error: 'Unable to retrieve images.' });
  }
}
