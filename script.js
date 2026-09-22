const form = document.querySelector('#search-form');
const input = document.querySelector('#search-input');
const button = form.querySelector('button');
const results = document.querySelector('#results');
const status = document.querySelector('#status');
const template = document.querySelector('#photo-template');

function setLoading(isLoading) {
  button.disabled = isLoading;
  button.textContent = isLoading ? 'Searching…' : 'Find inspiration ↗';
  status.className = 'status';
  status.innerHTML = isLoading
    ? '<span class="loader" aria-hidden="true"></span>Loading images…'
    : '';
}

function showError(message) {
  status.className = 'status error';
  status.textContent = message;
}

function renderPhotos(photos, query) {
  results.replaceChildren();

  if (!photos.length) {
    status.textContent = `No photos found for “${query}”. Try another search.`;
    return;
  }

  const fragment = document.createDocumentFragment();

  photos.forEach((photo) => {
    const card = template.content.cloneNode(true);
    const link = card.querySelector('.photo-link');
    const image = card.querySelector('.photo');

    link.href = photo.url;
    image.src = photo.src.medium;
    image.srcset = `${photo.src.medium} 350w, ${photo.src.large} 940w`;
    image.sizes = '(max-width: 560px) 50vw, (max-width: 900px) 33vw, 25vw';
    image.alt = photo.alt || `Photo by ${photo.photographer}`;
    card.querySelector('.photographer').textContent = photo.photographer;
    fragment.append(card);
  });

  results.append(fragment);
  status.textContent = `${photos.length} results for “${query}”`;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const query = input.value.trim();

  if (!query) {
    showError('Enter a search term.');
    input.focus();
    return;
  }

  setLoading(true);
  results.replaceChildren();

  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || 'The image search failed.');
    }

    renderPhotos(data.photos || [], query);
  } catch (error) {
    showError(error.message || 'Unable to load images. Please try again.');
  } finally {
    button.disabled = false;
    button.textContent = 'Find inspiration ↗';
  }
});
