(() => {
  'use strict';
  // Navigation is shared by every page, including pages without search.
  const menu = document.getElementById('navigation-toggle');
  const navigation = document.getElementById('main-navigation');
  if (menu && navigation) {
    const setOpen = (open, restoreFocus = false) => {
      menu.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      menu.textContent = open ? '×' : '☰';
      navigation.classList.toggle('open', open);
      if (restoreFocus) menu.focus();
    };
    menu.addEventListener('click', () => {
      const open = menu.getAttribute('aria-expanded') !== 'true';
      setOpen(open);
      if (open) navigation.querySelector('a').focus();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
        setOpen(false, true);
      }
    });
    document.addEventListener('click', event => {
      if (!navigation.contains(event.target) && !menu.contains(event.target)) setOpen(false);
    });
    navigation.addEventListener('click', event => {
      if (event.target.closest('a')) setOpen(false);
    });
    navigation.addEventListener('focusout', () => {
      requestAnimationFrame(() => {
        if (!navigation.contains(document.activeElement) && document.activeElement !== menu) setOpen(false);
      });
    });
    window.matchMedia('(max-width: 440px)').addEventListener('change', () => setOpen(false));
    // Without JS, the mobile navigation remains a visible, wrapping link row.
    document.documentElement.classList.add('js-enabled');
  }
  const search = document.getElementById('guide-search');
  if (!search) return;
  const tools = document.querySelectorAll('.search-tools');
  tools.forEach(el => { el.hidden = false; });
  const rows = [...document.querySelectorAll('#guide-list .article-row')];
  const filters = [...document.querySelectorAll('.filter')];
  const count = document.getElementById('result-count');
  const empty = document.getElementById('empty-state');
  let category = 'all';
  const normalize = text => text.toLocaleLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  function update() {
    const words = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
    let visible = 0;
    rows.forEach(row => {
      const match = (category === 'all' || row.dataset.category === category) && words.every(word => normalize(row.dataset.search).includes(word));
      row.hidden = !match;
      if (match) visible++;
    });
    count.textContent = `${visible} ${visible === 1 ? 'guide' : 'guides'}${category === 'all' ? '' : ' in ' + category}${search.value.trim() ? ' matching “' + search.value.trim() + '”' : ''}`;
    empty.hidden = visible !== 0;
  }
  search.addEventListener('input', update);
  filters.forEach(button => button.addEventListener('click', () => {
    category = button.dataset.category;
    filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
    update();
  }));
  document.getElementById('reset-search').addEventListener('click', () => {
    search.value = '';
    category = 'all';
    filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter.dataset.category === 'all')));
    update();
    search.focus();
  });
  update();
})();
