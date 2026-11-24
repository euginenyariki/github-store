/* RepoVault — search public GitHub repos and keep a local shortlist. No token, no backend. */
const KEY = 'repovault:v1';
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const toast = m => { const t = document.getElementById('toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2400); };
const starter = [
  { id: 493774510, name: 'next.js', full_name: 'vercel/next.js', html_url: 'https://github.com/vercel/next.js', description: 'The React framework for the web.', stargazers_count: 132000, forks_count: 29000, language: 'JavaScript', topics: ['react', 'nextjs', 'framework'] },
  { id: 29082301, name: 'prisma', full_name: 'prisma/prisma', html_url: 'https://github.com/prisma/prisma', description: 'Next-generation ORM for Node.js and TypeScript.', stargazers_count: 42000, forks_count: 2100, language: 'TypeScript', topics: ['orm', 'database', 'typescript'] },
  { id: 180124462, name: 'tauri', full_name: 'tauri-apps/tauri', html_url: 'https://github.com/tauri-apps/tauri', description: 'Build smaller, faster, and more secure desktop applications with a web frontend.', stargazers_count: 106000, forks_count: 4800, language: 'Rust', topics: ['desktop', 'rust', 'webview'] },
  { id: 488474285, name: 'awesome-typescript', full_name: 'dzharii/awesome-typescript', html_url: 'https://github.com/dzharii/awesome-typescript', description: 'A curated list of awesome TypeScript resources.', stargazers_count: 26000, forks_count: 1500, language: 'TypeScript', topics: ['typescript', 'awesome'] },
];
let state = load();
let results = starter;
function load() { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.saved)) return s; } catch (_) {} return { saved: [] }; }
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {} }
function compact(n) { return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k' : String(n); }
function repoCard(r) {
  const isSaved = state.saved.some(x => x.id === r.id);
  const note = state.saved.find(x => x.id === r.id)?.note;
  return `<article class="repo" data-id="${r.id}">
    <h3><a href="${esc(r.html_url)}" target="_blank" rel="noopener noreferrer">${esc(r.full_name)}</a></h3>
    <p class="desc">${esc(r.description || 'No description')}</p>
    <div class="stats-row"><span>★ ${compact(r.stargazers_count || 0)}</span><span>⑂ ${compact(r.forks_count || 0)}</span>${r.language ? `<span class="lang"><i></i>${esc(r.language)}</span>` : ''}</div>
    ${(r.topics || []).length ? `<div class="topics">${r.topics.slice(0, 4).map(t => `<span>${esc(t)}</span>`).join('')}</div>` : ''}
    ${note ? `<div class="note">${esc(note)}</div>` : ''}
    <div class="repo-actions"><a href="${esc(r.html_url)}" target="_blank" rel="noopener noreferrer">Open on GitHub ↗</a><button class="${isSaved ? 'saved' : ''}" data-save="${r.id}">${isSaved ? '★ Saved' : '☆ Save'}</button>${isSaved ? '<button data-note>Note</button><button data-remove>Remove</button>' : ''}</div>
  </article>`;
}
function render() {
  document.getElementById('savedCount').textContent = state.saved.length;
  document.getElementById('results').innerHTML = results.length ? results.map(repoCard).join('') : '<div class="empty">No repositories found. Try a different search.</div>';
  const q = (document.getElementById('savedSearch').value || '').toLowerCase().trim();
  const list = state.saved.filter(r => !q || `${r.full_name} ${r.description || ''} ${r.note || ''}`.toLowerCase().includes(q));
  document.getElementById('savedGrid').innerHTML = list.length ? list.map(repoCard).join('') : '<div class="empty">Your collection is empty. Save a repository from Discover.</div>';
  save();
}

document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('repovault:dark') === 'true') document.body.classList.add('dark');
  render();
  document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === t));
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + t.dataset.tab));
  }));

  document.getElementById('searchForm').addEventListener('submit', async e => {
    e.preventDefault();
    const q = document.getElementById('query').value.trim();
    if (!q) return;
    const lang = document.getElementById('language').value;
    const sort = document.getElementById('sort').value;
    const full = lang ? `${q} language:${lang}` : q;
    const status = document.getElementById('status');
    status.textContent = 'Searching GitHub…';
    try {
      const res = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(full)}&sort=${sort}&order=desc&per_page=12`, { headers: { Accept: 'application/vnd.github+json' } });
      if (!res.ok) throw new Error(res.status === 403 ? 'GitHub rate limit reached — wait a moment and try again.' : `GitHub returned ${res.status}`);
      const data = await res.json();
      results = data.items || [];
      status.textContent = `${data.total_count || 0} repositories match “${q}”${lang ? ` in ${lang}` : ''} · showing ${results.length}`;
    } catch (err) {
      status.textContent = `${err.message} Showing the starter set for now.`;
      results = starter;
    }
    render();
  });

  document.addEventListener('click', e => {
    const saveBtn = e.target.closest('[data-save]');
    if (saveBtn) {
      const id = Number(saveBtn.dataset.save);
      const repo = results.concat(state.saved).find(r => r.id === id);
      if (!repo) return;
      if (state.saved.some(x => x.id === id)) { toast('Already in your collection'); return; }
      state.saved.unshift({ id: repo.id, full_name: repo.full_name, html_url: repo.html_url, description: repo.description, language: repo.language, stargazers_count: repo.stargazers_count, topics: repo.topics, note: '' });
      render(); toast('Saved to your collection'); return;
    }
    const noteBtn = e.target.closest('[data-note]');
    if (noteBtn) {
      const id = Number(noteBtn.closest('[data-id]').dataset.id);
      const item = state.saved.find(x => x.id === id); if (!item) return;
      const note = prompt(`Note for ${item.full_name}`, item.note || '');
      if (note !== null) { item.note = note.trim(); render(); toast('Note saved'); }
      return;
    }
    const rm = e.target.closest('[data-remove]');
    if (rm) {
      const id = Number(rm.closest('[data-id]').dataset.id);
      state.saved = state.saved.filter(x => x.id !== id); render(); toast('Removed from collection');
    }
  });
  document.getElementById('savedSearch').addEventListener('input', render);
  document.getElementById('exportBtn').addEventListener('click', () => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })); a.download = 'repovault.json'; a.click(); URL.revokeObjectURL(a.href); toast('Collection exported');
  });
  document.getElementById('themeBtn').addEventListener('click', () => { document.body.classList.toggle('dark'); localStorage.setItem('repovault:dark', document.body.classList.contains('dark')); });
});
