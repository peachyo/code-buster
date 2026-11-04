/* Interactive exam sheet: a guess box under every cipher symbol and, for substitution ciphers, an editable frequency table. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root);
  else root.Sheet = factory(root);
})(typeof self !== 'undefined' ? self : this, function (root) {
  'use strict';

  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lettersOf = (s) => String(s).toUpperCase().replace(/[^A-Z]/g, '');

  /* ---------- pure model ---------- */

  // One unit per cipher character; non-letters become gaps. Answer letters are matched in order.
  function fromCipher(ct, answer) {
    const ans = lettersOf(answer);
    if (ans.length !== lettersOf(ct).length) throw new Error('ciphertext and answer have different letter counts');
    let i = 0;
    return [...String(ct)].map((ch) =>
      /[A-Za-z]/.test(ch) ? { top: ch.toUpperCase(), key: ch.toUpperCase(), ans: ans[i++] } : { gap: true, text: ch }
    );
  }

  // One unit per plaintext letter, labelled by an optional token (a number, a letter pair, ...).
  function fromAnswer(answer, tokens, wordGaps) {
    const out = [];
    let i = 0;
    for (const ch of String(answer).toUpperCase()) {
      if (/[A-Z]/.test(ch)) {
        out.push({ top: tokens ? String(tokens[i]) : '', ans: ch });
        i++;
      } else if (wordGaps) out.push({ gap: true, text: ' ' });
    }
    if (tokens && tokens.length !== i) throw new Error('token and answer counts differ');
    return out;
  }

  // The true cipher letter -> plain letter map; throws if the pair is not a one-to-one substitution.
  function truthOf(units) {
    const truth = {};
    const used = {};
    for (const u of units) {
      if (!u.key) continue;
      if (truth[u.key] && truth[u.key] !== u.ans) throw new Error(`cipher ${u.key} maps to two letters`);
      if (used[u.ans] && used[u.ans] !== u.key) throw new Error(`plain ${u.ans} has two cipher letters`);
      truth[u.key] = u.ans;
      used[u.ans] = u.key;
    }
    return truth;
  }

  function frequency(units) {
    const f = Object.fromEntries([...ALPHA].map((l) => [l, 0]));
    for (const u of units) if (u.key) f[u.key]++;
    return f;
  }

  // Cipher A-Z row of a K1 alphabet: cipher letter ALPHA[i] stands for keyed[i].
  function k1Map(keyed) {
    return Object.fromEntries([...ALPHA].map((l, i) => [l, keyed[i]]));
  }

  // Plain letter for each cipher letter after a Caesar shift of n (decoding), and for Atbash.
  const shiftMap = (n) => Object.fromEntries([...ALPHA].map((l, i) => [l, ALPHA[(((i - n) % 26) + 26) % 26]]));
  const atbashMap = () => Object.fromEntries([...ALPHA].map((l, i) => [l, ALPHA[25 - i]]));

  // Plain letters that were given to more than one cipher letter.
  function duplicates(map) {
    const seen = {};
    const dup = new Set();
    for (const [k, v] of Object.entries(map)) {
      if (!v) continue;
      if (seen[v] && seen[v] !== k) dup.add(v);
      seen[v] = k;
    }
    return dup;
  }

  // guess(unit, index) returns the player's letter for that position.
  function grade(units, guess) {
    let total = 0;
    let right = 0;
    let blank = 0;
    const wrong = [];
    units.forEach((u, i) => {
      if (u.gap) return;
      total++;
      const g = guess(u, i);
      if (!g) blank++;
      else if (g === u.ans) right++;
      else wrong.push(i);
    });
    return { total, right, blank, wrong, errors: total - right };
  }

  // The letter just typed into a box that may still hold the previous guess.
  function newLetter(raw, old) {
    const L = lettersOf(raw);
    if (L.length <= 1) return L;
    const at = old ? L.indexOf(old) : -1;
    return (at >= 0 ? L.slice(0, at) + L.slice(at + 1) : L).slice(-1);
  }

  const core = { fromCipher, fromAnswer, truthOf, frequency, k1Map, shiftMap, atbashMap, duplicates, grade, lettersOf, newLetter };

  /* ---------- DOM ---------- */

  function mount(el, def) {
    const doc = el.ownerDocument;
    const mk = (tag, cls, text) => {
      const n = doc.createElement(tag);
      if (cls) n.className = cls;
      if (text !== undefined) n.textContent = text;
      return n;
    };
    const sub = def.mode === 'sub';
    const units = sub ? fromCipher(def.ct, def.answer) : def.ct ? fromCipher(def.ct, def.answer) : fromAnswer(def.answer, def.tokens, def.wordGaps);
    const truth = sub ? truthOf(units) : null;
    const freq = sub ? frequency(units) : null;
    const state = sub ? Object.fromEntries([...ALPHA].map((l) => [l, ''])) : units.map(() => '');
    const getGuess = (u, i) => (sub ? state[u.key] : state[i]);
    const setGuess = (u, i, v) => {
      if (sub) state[u.key] = v;
      else state[i] = v;
    };

    const box = mk('div', 'sheet');
    box.addEventListener('keydown', (e) => e.stopPropagation());
    if (def.title) box.appendChild(mk('h4', '', def.title));
    const msg = mk('div', 'sheet-msg');
    msg.setAttribute('aria-live', 'polite');

    const cellInputs = []; // [{input, unit, index}]
    const tableInputs = {}; // cipher letter -> input

    // Helper that fills the whole replacement row at once: a Caesar shift.
    const helpers = [];
    if (def.shift) {
      helpers.push({
        label: 'Shift:',
        placeholder: '0-25',
        button: 'Apply shift',
        fill(raw) {
          const n = parseInt(raw, 10);
          if (Number.isNaN(n)) return null;
          return [shiftMap(n), `Filled the Replacement row by shifting every cipher letter back ${((n % 26) + 26) % 26}.`];
        },
      });
    }
    helpers.forEach((h) => {
      const row = mk('div', 'sheet-kw');
      const field = mk('input');
      field.type = 'text';
      field.autocomplete = 'off';
      field.spellcheck = false;
      field.placeholder = h.placeholder;
      field.setAttribute('aria-label', h.label);
      const apply = mk('button', '', h.button);
      apply.type = 'button';
      apply.addEventListener('click', () => {
        const out = h.fill(field.value);
        if (!out) {
          msg.textContent = 'Type a value first.';
          return;
        }
        Object.assign(state, out[0]);
        refresh();
        msg.textContent = out[1];
      });
      field.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') apply.click();
      });
      row.append(mk('span', '', h.label));
      if (h.placeholder) row.appendChild(field);
      row.appendChild(apply);
      box.appendChild(row);
    });

    // Problem text with a guess box under every symbol.
    const text = mk('div', 'sheet-text');
    let word = null;
    let wordLen = 0;
    const flush = () => {
      if (word) text.appendChild(word);
      word = null;
      wordLen = 0;
    };
    units.forEach((u, i) => {
      if (u.gap) {
        flush();
        if (u.text.trim()) text.appendChild(mk('span', 'punct', u.text));
        return;
      }
      if (!word || wordLen >= 12) {
        flush();
        word = mk('span', 'w');
      }
      wordLen++;
      const cell = mk('span', 'u');
      cell.appendChild(mk('span', 'top', u.top || '\u00a0'));
      const input = mk('input', 'g');
      input.type = 'text';
      input.maxLength = 2;
      input.autocomplete = 'off';
      input.spellcheck = false;
      input.setAttribute('aria-label', u.key ? `Guess for cipher letter ${u.key}` : `Answer letter ${i + 1}`);
      if (u.key) input.dataset.key = u.key;
      input.addEventListener('input', () => {
        const v = newLetter(input.value, getGuess(u, i));
        setGuess(u, i, v);
        refresh();
        if (v && !sub) moveFocus(input, 1);
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          moveFocus(input, 1);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          moveFocus(input, -1);
        } else if (e.key === 'Backspace' && !input.value) moveFocus(input, -1);
      });
      input.addEventListener('focus', () => highlight(u.key));
      input.addEventListener('blur', () => highlight(null));
      input.addEventListener('focus', () => input.select());
      cell.appendChild(input);
      word.appendChild(cell);
      cellInputs.push({ input, unit: u, index: i });
    });
    flush();
    box.appendChild(text);

    function moveFocus(from, step) {
      const k = cellInputs.findIndex((c) => c.input === from);
      const next = cellInputs[k + step];
      if (next) next.input.focus();
    }

    // Editable frequency table (the reference row is the Replacement row).
    let freqScroll = null;
    if (sub) {
      freqScroll = mk('div', 'tscroll');
      const table = mk('table', 'tbl alpha sheet-freq');
      const head = mk('tr');
      const counts = mk('tr');
      const repl = mk('tr');
      head.appendChild(mk('th', '', 'Cipher'));
      if (!def.hideFreq) counts.appendChild(mk('th', '', 'Frequency'));
      repl.appendChild(mk('th', '', 'Replacement'));
      for (const l of ALPHA) {
        head.appendChild(mk('th', '', l));
        if (!def.hideFreq) counts.appendChild(mk('td', '', freq[l] ? String(freq[l]) : '\u00b7'));
        const td = mk('td');
        const input = mk('input', 'g');
        input.type = 'text';
        input.maxLength = 2;
        input.autocomplete = 'off';
        input.spellcheck = false;
        input.dataset.key = l;
        input.setAttribute('aria-label', `Replacement for cipher letter ${l}`);
        input.addEventListener('input', () => {
          state[l] = newLetter(input.value, state[l]);
          refresh();
        });
        input.addEventListener('focus', () => {
          input.select();
          highlight(l);
        });
        input.addEventListener('blur', () => highlight(null));
        tableInputs[l] = input;
        td.appendChild(input);
        repl.appendChild(td);
      }
      table.append(head, ...(def.hideFreq ? [] : [counts]), repl);
      freqScroll.appendChild(table);
      box.appendChild(freqScroll);
      if (def.ref) box.appendChild(mk('div', 'sheet-ref', def.ref));
    }

    // Buttons.
    const bar = mk('div', 'sheet-bar');
    const btn = (label, fn) => {
      const b = mk('button', '', label);
      b.type = 'button';
      b.addEventListener('click', fn);
      bar.appendChild(b);
    };
    btn('Check', () => {
      const g = grade(units, getGuess);
      refresh();
      cellInputs.forEach(({ input, unit, index }) => {
        const v = getGuess(unit, index);
        input.classList.toggle('ok', !!v && v === unit.ans);
        input.classList.toggle('bad', !!v && v !== unit.ans);
      });
      if (sub) {
        for (const l of ALPHA) {
          if (!freq[l]) continue;
          tableInputs[l].classList.toggle('ok', !!state[l] && state[l] === truth[l]);
          tableInputs[l].classList.toggle('bad', !!state[l] && state[l] !== truth[l]);
        }
      }
      if (!g.errors) msg.textContent = `Solved: all ${g.total} letters are right.`;
      else {
        const parts = [`${g.right} of ${g.total} letters right`];
        if (g.wrong.length) parts.push(`${g.wrong.length} wrong`);
        if (g.blank) parts.push(`${g.blank} blank`);
        msg.textContent = parts.join(', ') + (g.errors <= 2 ? '. Two or fewer errors still earns full credit on the exam.' : '.');
      }
    });
    btn('Hint', () => {
      const g = grade(units, getGuess);
      if (!g.errors) {
        msg.textContent = 'Nothing left to hint: it is already solved.';
        return;
      }
      if (sub) {
        const open = [...ALPHA].filter((l) => freq[l] && state[l] !== truth[l]).sort((a, b) => freq[b] - freq[a]);
        const l = open[0];
        state[l] = truth[l];
        refresh();
        msg.textContent = `Hint: cipher ${l} is ${truth[l]}.`;
      } else {
        const i = units.findIndex((u, k) => !u.gap && state[k] !== u.ans);
        state[i] = units[i].ans;
        refresh();
        msg.textContent = `Hint: filled letter ${units.slice(0, i).filter((u) => !u.gap).length + 1}.`;
      }
    });
    btn('Show answer', () => {
      if (sub) for (const l of ALPHA) state[l] = truth[l] || state[l];
      else units.forEach((u, i) => !u.gap && (state[i] = u.ans));
      refresh();
      msg.textContent = 'Answer filled in.';
    });
    btn('Clear', () => {
      if (sub) for (const l of ALPHA) state[l] = '';
      else state.fill('');
      refresh();
      msg.textContent = '';
    });
    box.append(bar, msg);

    function highlight(key) {
      box.querySelectorAll('.hl').forEach((n) => n.classList.remove('hl'));
      if (!key) return;
      box.querySelectorAll(`[data-key="${key}"]`).forEach((n) => n.classList.add('hl'));
    }

    function refresh() {
      const dup = sub ? duplicates(state) : new Set();
      cellInputs.forEach(({ input, unit, index }) => {
        const v = getGuess(unit, index) || '';
        if (input.value !== v) input.value = v;
        input.classList.remove('ok', 'bad');
        input.classList.toggle('dup', !!v && dup.has(v));
      });
      if (sub) {
        for (const l of ALPHA) {
          const v = state[l] || '';
          if (tableInputs[l].value !== v) tableInputs[l].value = v;
          tableInputs[l].classList.remove('ok', 'bad');
          tableInputs[l].classList.toggle('dup', !!v && dup.has(v));
        }
      }
      if (dup.size) msg.textContent = `Two cipher letters share the plain letter ${[...dup].join(', ')}: one of them is wrong.`;
      else if (/share the plain letter/.test(msg.textContent)) msg.textContent = '';
    }

    el.replaceWith(box);
    refresh();
    return box;
  }

  return { ...core, core, mount };
});
