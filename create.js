const $ = selector => document.querySelector(selector);
let selected = null;
let localImageUrl = null;
try { const item = JSON.parse(sessionStorage.getItem('art-inspiration-selected-v1') || 'null'); if (item && typeof item.description === 'string') selected = item; } catch {}
function safeUrl(value) { try { const u = new URL(value); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; } }
function renderSelection() {
  const box = $('#selected-image'); box.replaceChildren(); $('#clear-selection').hidden = !selected;
  if (!selected) { const p = document.createElement('p'); p.textContent = 'No image selected yet. You can begin with words or choose an image from search.'; const a = document.createElement('a'); a.href = 'index.html'; a.textContent = 'Explore images ↗'; box.append(p,a); return; }
  if (selected.local) {
    const img = document.createElement('img'); img.src = localImageUrl; img.alt = 'Your selected image'; img.className = 'selection-thumbnail';
    const p = document.createElement('p'); p.textContent = selected.name; box.append(img,p); return;
  }
  if (safeUrl(selected.thumbnail)) { const img = document.createElement('img'); img.src = safeUrl(selected.thumbnail); img.alt = selected.description || 'Selected inspiration'; img.className = 'selection-thumbnail'; box.append(img); }
  const p = document.createElement('p'); p.textContent = selected.description || 'Untitled image'; const small = document.createElement('small'); small.textContent = `${selected.source || 'Original source'} · ${selected.creator || 'Creator not listed'}`;
  const a = document.createElement('a'); a.href = safeUrl(selected.url) || '#'; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = 'View original and licence ↗'; box.append(p,small,a);
}
function buildPrompt() {
  const subject = $('#subject').value.trim() || 'an unexpected, colourful subject'; const palette = $('#palette').value.trim() || 'a vivid, harmonious palette'; const detail = $('#details').value.trim();
  const reference = selected?.local ? 'Use my attached image as a visual reference, interpreting it creatively rather than copying it exactly. ' : '';
  $('#prompt').value = `${reference}Create an original ${$('#medium').value.toLowerCase()} of ${subject}. Make it ${$('#mood').value.toLowerCase()}, with ${palette}. Emphasise expressive composition, compelling light, rich visual texture, and a clear focal point.${detail ? ` Include this personal twist: ${detail}.` : ''} Avoid text, logos, frames and watermarks.`;
}
renderSelection(); if (selected?.description) $('#subject').value = selected.description.slice(0,220); buildPrompt();
for (const id of ['subject','medium','mood','palette','details']) $(`#${id}`).addEventListener('change',buildPrompt);
$('#refresh-prompt').addEventListener('click',buildPrompt);
$('#clear-selection').addEventListener('click',()=>{selected=null;if(localImageUrl){URL.revokeObjectURL(localImageUrl);localImageUrl=null}$('#image-upload').value='';$('#use-image-colours').hidden=true;$('#upload-status').textContent='';try{sessionStorage.removeItem('art-inspiration-selected-v1')}catch{}renderSelection();buildPrompt()});
$('#image-upload').addEventListener('change', async event => {
  const file = event.target.files?.[0]; if (!file) return;
  const status = $('#upload-status');
  if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 15 * 1024 * 1024) { status.textContent = 'Choose a JPG, PNG or WebP no larger than 15 MB.'; event.target.value = ''; return; }
  const nextUrl = URL.createObjectURL(file);
  try {
    const image = new Image(); image.src = nextUrl; await image.decode();
    if (localImageUrl) URL.revokeObjectURL(localImageUrl);
    localImageUrl = nextUrl; selected = { local: true, name: file.name };
    try { sessionStorage.removeItem('art-inspiration-selected-v1'); } catch {}
    renderSelection(); $('#use-image-colours').hidden = false; status.textContent = 'Image ready. Describe the subject below, or use its colours as a starting palette.'; buildPrompt();
  } catch { URL.revokeObjectURL(nextUrl); status.textContent = 'This image could not be opened. Try a different JPG, PNG or WebP.'; event.target.value = ''; }
});
$('#use-image-colours').addEventListener('click', async () => {
  if (!localImageUrl) return;
  try {
    const image = new Image(); image.src = localImageUrl; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = 64; canvas.height = 64;
    const context = canvas.getContext('2d', { willReadFrequently: true }); context.drawImage(image,0,0,64,64);
    const pixels = context.getImageData(0,0,64,64).data, counts = new Map();
    for(let i=0;i<pixels.length;i+=16){if(pixels[i+3]<128)continue;const channels=[pixels[i],pixels[i+1],pixels[i+2]].map(v=>Math.min(255,Math.round(v/32)*32));const high=Math.max(...channels),low=Math.min(...channels);if(high>240&&low>225||high<45)continue;const key=channels.join(',');counts.set(key,(counts.get(key)||0)+1+(high-low)/100)}
    const chosen=[];for(const [key] of [...counts].sort((a,b)=>b[1]-a[1])){const rgb=key.split(',').map(Number);if(chosen.every(other=>rgb.reduce((sum,v,n)=>sum+Math.abs(v-other[n]),0)>105))chosen.push(rgb);if(chosen.length===4)break}
    if(!chosen.length)throw new Error('No distinct colours found');
    $('#palette').value=chosen.map(rgb=>'#'+rgb.map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase()).join(', ');
    $('#upload-status').textContent='Four colours sampled from your image. You can edit them below.';buildPrompt();
  } catch { $('#upload-status').textContent='Could not sample colours from this image. You can type your own palette.'; }
});
$('#copy-prompt').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('#prompt').value); $('#copy-status').textContent = 'Prompt copied. Paste it into the image tool you choose.'; }
  catch { $('#prompt').focus(); $('#prompt').select(); $('#copy-status').textContent = 'Prompt selected. Press Ctrl+C to copy it.'; }
});
