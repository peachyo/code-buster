(function () {
  const { slides, TOOLS, SHEETS } = window.Slides;
  const stage = document.getElementById('stage');
  const counter = document.getElementById('counter');
  const section = document.getElementById('section');
  const bar = document.getElementById('bar');
  const toc = document.getElementById('toc');
  const tocList = document.getElementById('toc-list');
  // Wide screens dock the menu on the left and shift the slide over; narrow screens overlay it.
  const wide = () => window.matchMedia('(min-width: 1000px)').matches;
  function setToc(open, remember = true) {
    toc.hidden = !open;
    document.body.classList.toggle('toc-open', open);
    if (remember && wide()) {
      try {
        localStorage.setItem('toc-open', open ? '1' : '0');
      } catch (e) {
        /* storage unavailable: the menu just will not remember its state */
      }
    }
  }
  let index = 0;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  function buildTool(el) {
    const def = TOOLS[el.dataset.tool];
    const form = document.createElement('form');
    form.className = 'tool-form';
    form.addEventListener('submit', (e) => e.preventDefault());
    const title = document.createElement('h4');
    title.textContent = def.title;
    form.appendChild(title);
    const row = document.createElement('div');
    row.className = 'tool-fields';
    const inputs = {};
    def.fields.forEach((f) => {
      const label = document.createElement('label');
      if (f.wide) label.className = 'wide';
      const span = document.createElement('span');
      span.textContent = f.label;
      label.appendChild(span);
      let input;
      if (f.type === 'select') {
        input = document.createElement('select');
        f.options.forEach((o) => {
          const opt = document.createElement('option');
          opt.textContent = o;
          input.appendChild(opt);
        });
      } else {
        input = document.createElement('input');
        input.type = f.type === 'number' ? 'number' : 'text';
        input.autocomplete = 'off';
        input.spellcheck = false;
      }
      input.value = f.value;
      inputs[f.name] = input;
      label.appendChild(input);
      row.appendChild(label);
    });
    form.appendChild(row);
    const out = document.createElement('div');
    out.className = 'tool-out';
    out.setAttribute('aria-live', 'polite');
    form.appendChild(out);
    const run = () => {
      const values = Object.fromEntries(Object.entries(inputs).map(([k, i]) => [k, i.value]));
      try {
        out.innerHTML = def.run(values);
      } catch (err) {
        out.innerHTML = `<p class="muted">Cannot compute: ${esc(err.message)}</p>`;
      }
    };
    form.addEventListener('input', run);
    form.addEventListener('change', run);
    el.replaceWith(form);
    run();
  }

  function render() {
    const s = slides[index];
    stage.className = 'slide ' + (s.cls || '');
    stage.innerHTML = (s.title ? `<h2>${esc(s.title)}</h2>` : '') + `<div class="slide-body">${s.html}</div>`;
    stage.scrollTop = 0;
    stage.querySelectorAll('.tool').forEach(buildTool);
    stage.querySelectorAll('.sheet-slot').forEach((el) => window.Sheet.mount(el, SHEETS[el.dataset.sheet]));
    counter.textContent = `${index + 1} / ${slides.length}`;
    section.textContent = s.section;
    bar.style.width = `${((index + 1) / slides.length) * 100}%`;
    document.title = (s.title || 'Codebusters') + ' · Codebusters Division B';
    document.getElementById('prev').disabled = index === 0;
    document.getElementById('next').disabled = index === slides.length - 1;
    history.replaceState(null, '', '#' + (index + 1));
    tocList.querySelectorAll('li[data-i]').forEach((li) => {
      const current = Number(li.dataset.i) === index;
      li.classList.toggle('current', current);
      if (current) li.scrollIntoView({ block: 'nearest' });
    });
  }

  function go(i) {
    index = Math.max(0, Math.min(slides.length - 1, i));
    render();
  }

  let lastSection = null;
  slides.forEach((s, i) => {
    if (s.section !== lastSection) {
      lastSection = s.section;
      const h = document.createElement('li');
      h.className = 'toc-section';
      h.textContent = s.section;
      tocList.appendChild(h);
    }
    const li = document.createElement('li');
    li.dataset.i = i;
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = `${i + 1}. ${s.title || 'Title'}`;
    b.addEventListener('click', () => {
      if (!wide()) setToc(false);
      go(i);
    });
    li.appendChild(b);
    tocList.appendChild(li);
  });

  document.getElementById('prev').addEventListener('click', () => go(index - 1));
  document.getElementById('next').addEventListener('click', () => go(index + 1));
  document.getElementById('toc-btn').addEventListener('click', () => setToc(toc.hidden));
  document.getElementById('toc-close').addEventListener('click', () => setToc(false));
  document.addEventListener('click', (e) => {
    if (!wide() && !toc.hidden && !toc.contains(e.target) && !e.target.closest('#toc-btn')) setToc(false);
  });
  document.getElementById('full-btn').addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  });

  document.addEventListener('keydown', (e) => {
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (['ArrowRight', 'PageDown', ' '].includes(e.key)) {
      e.preventDefault();
      go(index + 1);
    } else if (['ArrowLeft', 'PageUp'].includes(e.key)) {
      e.preventDefault();
      go(index - 1);
    } else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(slides.length - 1);
    else if (e.key === 'Escape') setToc(false);
    else if (e.key === 'f') document.getElementById('full-btn').click();
    else if (e.key === 'm') setToc(toc.hidden);
  });

  let touchX = null;
  stage.addEventListener('touchstart', (e) => (touchX = e.touches[0].clientX), { passive: true });
  stage.addEventListener('touchend', (e) => {
    if (touchX === null || /^(INPUT|SELECT)$/.test(e.target.tagName)) return;
    const dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 60) go(index + (dx < 0 ? 1 : -1));
  });

  window.addEventListener('hashchange', () => {
    const n = parseInt(location.hash.slice(1), 10);
    if (n >= 1 && n <= slides.length && n - 1 !== index) go(n - 1);
  });

  const start = parseInt(location.hash.slice(1), 10);
  go(start >= 1 && start <= slides.length ? start - 1 : 0);

  let saved = null;
  try {
    saved = localStorage.getItem('toc-open');
  } catch (e) {
    /* ignore */
  }
  setToc(wide() && saved !== '0', false);
  if (!toc.hidden) tocList.querySelector('li.current')?.scrollIntoView({ block: 'center' });
})();
