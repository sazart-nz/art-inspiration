const form = document.querySelector('#search-form');
const input = document.querySelector('#search-input');
const button = form.querySelector('button');
const results = document.querySelector('#results');
const status = document.querySelector('#status');
const template = document.querySelector('#photo-template');
const sourceSelect = document.querySelector('#source-select');
const dialog = document.querySelector('#saved-dialog');
const savedKey = 'art-inspiration-saved-v1';
let saved = [];
try { const value = JSON.parse(localStorage.getItem(savedKey) || '[]'); if (Array.isArray(value)) saved = value.filter(x => x && x.url && x.src?.medium).slice(0, 200); } catch {}
function persist() {
  try { localStorage.setItem(savedKey, JSON.stringify(saved)); }
  catch { status.textContent = 'Browser storage is unavailable. Your saved items may not be kept.'; }
  document.querySelector('#saved-count').textContent = saved.length;
}
function safeUrl(value) { try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; } catch { return ''; } }
function itemId(photo) { return `${photo.source || 'Pexels'}:${photo.id}`; }
function rights(photo) {
  const source = photo.source || 'Pexels';
  const museum = source === 'Art Institute of Chicago' || source === 'Cleveland Museum of Art';
  return {
    source,
    license: photo.license || (museum ? 'CC0' : 'Pexels License'),
    licenseUrl: safeUrl(photo.licenseUrl) || (museum ? 'https://creativecommons.org/publicdomain/zero/1.0/' : 'https://www.pexels.com/license/'),
    credit: photo.creditRequirement || (museum ? 'Credit not required; artist and museum credit appreciated.' : 'Credit not required; photographer credit appreciated. See licence for restrictions.')
  };
}
function setLoading(isLoading) {
  button.disabled = isLoading;
  button.textContent = isLoading ? 'Searching…' : 'Find inspiration ↗';
  status.className = 'status';
  status.innerHTML = isLoading ? '<span class="loader" aria-hidden="true"></span>Loading images…' : '';
}
function showError(message) { status.className = 'status error'; status.textContent = message; }
function updateSaveButton(button, photo) {
  const active = saved.some(x => itemId(x) === itemId(photo));
  button.textContent = active ? '♥ Saved' : '♡ Save';
  button.setAttribute('aria-pressed', String(active));
}
function renderSaved() {
  const box = document.querySelector('#saved-items'); box.replaceChildren();
  if (!saved.length) { const p = document.createElement('p'); p.textContent = 'Nothing saved yet. Search for inspiration and select Save on an image.'; box.append(p); return; }
  saved.forEach(photo => {
    const row = document.createElement('div'); row.className = 'saved-row';
    const image = document.createElement('img'); image.src = safeUrl(photo.src.medium); image.alt = photo.alt || '';
    const link = document.createElement('a'); link.href = safeUrl(photo.url) || '#'; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = `${photo.alt || 'View image'} — ${photo.photographer || 'Unknown artist'}`;
    const terms = rights(photo);
    const licence = document.createElement('a'); licence.href = terms.licenseUrl; licence.target = '_blank'; licence.rel = 'noopener noreferrer'; licence.textContent = `${terms.license} · View terms ↗`;
    const credit = document.createElement('small'); credit.textContent = terms.credit;
    const info = document.createElement('div'); info.className = 'saved-info'; info.append(link, licence, credit);
    const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Remove'; remove.addEventListener('click', () => { saved = saved.filter(x => itemId(x) !== itemId(photo)); persist(); renderSaved(); document.querySelectorAll('.save-photo').forEach(btn => { if (btn.dataset.itemId === itemId(photo)) updateSaveButton(btn, photo); }); });
    row.append(image, info, remove); box.append(row);
  });
}
document.querySelector('#saved-toggle').addEventListener('click', () => { renderSaved(); dialog.showModal(); });
document.querySelector('#saved-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
function renderPhotos(photos, query) {
  results.replaceChildren();
  if (!photos.length) { status.textContent = `No images found for “${query}”. Try another search.`; return; }
  const fragment = document.createDocumentFragment();
  photos.forEach(photo => {
    const card = template.content.cloneNode(true);
    const link = card.querySelector('.photo-link'); const image = card.querySelector('.photo');
    link.href = safeUrl(photo.url) || '#'; image.src = safeUrl(photo.src.medium); image.srcset = `${safeUrl(photo.src.medium)} 350w, ${safeUrl(photo.src.large)} 940w`;
    image.sizes = '(max-width: 560px) 50vw, (max-width: 900px) 33vw, 25vw';
    image.alt = photo.alt || `Image by ${photo.photographer}`;
    card.querySelector('.photographer').textContent = photo.photographer || 'Creator not listed';
    card.querySelector('.view-label').textContent = 'Original source →';
    const terms = rights(photo);
    card.querySelector('.source-name').textContent = `${terms.source} · ${terms.license}`;
    card.querySelector('.credit-note').textContent = terms.credit;
    card.querySelector('.licence-link').href = terms.licenseUrl;
    const saveButton = card.querySelector('.save-photo'); saveButton.dataset.itemId = itemId(photo); updateSaveButton(saveButton, photo);
    saveButton.addEventListener('click', () => { if (saved.some(x => itemId(x) === itemId(photo))) saved = saved.filter(x => itemId(x) !== itemId(photo)); else saved.unshift(photo); persist(); updateSaveButton(saveButton, photo); });
    fragment.append(card);
  });
  results.append(fragment);
  status.textContent = `${photos.length} images for “${query}”`;
}
let controller;
form.addEventListener('submit', async event => {
  event.preventDefault(); const query = input.value.trim();
  if (!query) { showError('Enter a search term.'); input.focus(); return; }
  controller?.abort(); controller = new AbortController(); const active = controller;
  setLoading(true); results.replaceChildren();
  try {
    const path = { art: '/api/art', cleveland: '/api/cleveland', openverse: '/api/openverse', photos: '/api/search' }[sourceSelect.value] || '/api/search';
    const response = await fetch(`${path}?q=${encodeURIComponent(query)}`, { signal: active.signal });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'The image search failed.');
    if (controller === active) renderPhotos(data.photos || [], query);
  } catch (error) {
    if (error.name !== 'AbortError' && controller === active) showError(error.message || 'Unable to load images. Please try again.');
  } finally { if (controller === active) { button.disabled = false; button.textContent = 'Find inspiration ↗'; } }
});
sourceSelect.addEventListener('change', () => { if (input.value.trim()) form.requestSubmit(); });
const dailyIdeas = ['wildflowers', 'dramatic skies', 'colourful birds', 'sunlit forest', 'ocean textures', 'bright gardens', 'mountain light', 'whimsical animals', 'old doorways', 'autumn leaves', 'water reflections', 'desert colours'];
function searchDailyIdea() {
  const today = new Date(); const date = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  let hash = 0; for (const character of date) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  input.value = dailyIdeas[hash % dailyIdeas.length]; form.requestSubmit();
}
document.querySelector('#daily-button').addEventListener('click', searchDailyIdea);
persist();
searchDailyIdea();
