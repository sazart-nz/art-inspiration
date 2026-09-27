const $ = selector => document.querySelector(selector);
let selected = null;
try { const item = JSON.parse(sessionStorage.getItem('art-inspiration-selected-v1') || 'null'); if (item && typeof item.description === 'string') selected = item; } catch {}
function safeUrl(value) { try { const u = new URL(value); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; } }
function renderSelection() {
  const box = $('#selected-image'); box.replaceChildren(); $('#clear-selection').hidden = !selected;
  if (!selected) { const p = document.createElement('p'); p.textContent = 'No image selected yet. You can begin with words or choose an image from search.'; const a = document.createElement('a'); a.href = 'index.html'; a.textContent = 'Explore images ↗'; box.append(p,a); return; }
  if (safeUrl(selected.thumbnail)) { const img = document.createElement('img'); img.src = safeUrl(selected.thumbnail); img.alt = selected.description || 'Selected inspiration'; img.className = 'selection-thumbnail'; box.append(img); }
  const p = document.createElement('p'); p.textContent = selected.description || 'Untitled image'; const small = document.createElement('small'); small.textContent = `${selected.source || 'Original source'} · ${selected.creator || 'Creator not listed'}`;
  const a = document.createElement('a'); a.href = safeUrl(selected.url) || '#'; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = 'View original and licence ↗'; box.append(p,small,a);
}
function buildPrompt() {
  const subject = $('#subject').value.trim() || 'an unexpected, colourful subject'; const palette = $('#palette').value.trim() || 'a vivid, harmonious palette'; const detail = $('#details').value.trim();
  $('#prompt').value = `Create an original ${$('#medium').value.toLowerCase()} of ${subject}. Make it ${$('#mood').value.toLowerCase()}, with ${palette}. Emphasise expressive composition, compelling light, rich visual texture, and a clear focal point.${detail ? ` Include this personal twist: ${detail}.` : ''} Avoid text, logos, frames and watermarks.`;
}
renderSelection(); if (selected?.description) $('#subject').value = selected.description.slice(0,220); buildPrompt();
for (const id of ['subject','medium','mood','palette','details']) $(`#${id}`).addEventListener('change',buildPrompt);
$('#refresh-prompt').addEventListener('click',buildPrompt);
$('#clear-selection').addEventListener('click',()=>{selected=null;try{sessionStorage.removeItem('art-inspiration-selected-v1')}catch{}renderSelection()});
$('#copy-prompt').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('#prompt').value); $('#copy-status').textContent = 'Prompt copied. Paste it into the image tool you choose.'; }
  catch { $('#prompt').focus(); $('#prompt').select(); $('#copy-status').textContent = 'Prompt selected. Press Ctrl+C to copy it.'; }
});
