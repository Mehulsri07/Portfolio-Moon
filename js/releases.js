// js/releases.js
// Fills any element with data-release="owner/repo" with that repo's latest GitHub release,
// e.g. "v1.0.15 · released 8 Oct 2026". The element's own text stays as the fallback if the
// request fails or GitHub's rate limit (60 requests an hour per visitor) is hit.
(function () {
  const els = document.querySelectorAll('[data-release]');
  if (!els.length) return;

  const fmt = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  async function latest(repo) {
    const key = 'release:' + repo;
    try {
      const cached = JSON.parse(sessionStorage.getItem(key) || 'null');
      if (cached) return cached;
    } catch (e) { /* storage blocked: just fetch */ }

    const res = await fetch('https://api.github.com/repos/' + repo + '/releases/latest', {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) throw new Error('GitHub API ' + res.status);
    const data = await res.json();
    const info = { tag: data.tag_name, date: data.published_at };
    try { sessionStorage.setItem(key, JSON.stringify(info)); } catch (e) { /* ignore */ }
    return info;
  }

  els.forEach((el) => {
    latest(el.dataset.release)
      .then(({ tag, date }) => {
        if (tag && date) el.textContent = tag + ' · released ' + fmt(date);
      })
      .catch(() => { /* keep the static text */ });
  });
})();
