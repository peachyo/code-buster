(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Ciphers = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const ALPHA25 = 'ABCDEFGHIKLMNOPQRSTUVWXYZ'; // no J (I/J share a cell)
  const BACON24 = 'ABCDEFGHIKLMNOPQRSTUWXYZ'; // I/J and U/V share a code

  const letters = (s) => String(s).toUpperCase().replace(/[^A-Z]/g, '');
  const groups = (s, n = 5) => (s.match(new RegExp('.{1,' + n + '}', 'g')) || []).join(' ');
  const mod = (a, m) => ((a % m) + m) % m;

  function keyedAlphabet(keyword, alphabet = ALPHA) {
    const seen = new Set();
    let out = '';
    for (let ch of letters(keyword) + alphabet) {
      if (!alphabet.includes(ch) && ch === 'J') ch = 'I';
      if (alphabet.includes(ch) && !seen.has(ch)) {
        seen.add(ch);
        out += ch;
      }
    }
    return out;
  }

  function mapLetters(text, from, to) {
    return String(text)
      .toUpperCase()
      .replace(/[A-Z]/g, (ch) => {
        const i = from.indexOf(ch);
        return i < 0 ? ch : to[i];
      });
  }

  // Atbash
  const REVERSED = [...ALPHA].reverse().join('');
  const atbash = (text) => mapLetters(text, ALPHA, REVERSED);

  // Caesar
  function caesar(text, shift, decode = false) {
    const k = mod(decode ? -shift : shift, 26);
    return mapLetters(text, ALPHA, ALPHA.slice(k) + ALPHA.slice(0, k));
  }

  // Aristocrat / Patristocrat: a 26-letter key is a random cipher alphabet, anything else is a K1 keyword
  function aristocratTables(key) {
    const k = letters(key);
    if (k.length === 26 && new Set(k).size === 26) return { plain: ALPHA, cipher: k };
    return { plain: keyedAlphabet(k), cipher: ALPHA };
  }
  function aristocrat(text, key, decode = false) {
    const { plain, cipher } = aristocratTables(key);
    return decode ? mapLetters(text, cipher, plain) : mapLetters(text, plain, cipher);
  }
  function patristocrat(text, key, decode = false) {
    return groups(letters(aristocrat(text, key, decode)));
  }

  // Finds where a known-plaintext crib could sit in a monoalphabetic ciphertext (letter pattern + no self-mapping)
  function cribPositions(cipherText, crib) {
    const ct = letters(cipherText);
    const cr = letters(crib);
    const hits = [];
    if (!cr.length) return hits;
    for (let i = 0; i + cr.length <= ct.length; i++) {
      const fwd = {};
      const back = {};
      let ok = true;
      for (let j = 0; j < cr.length && ok; j++) {
        const p = cr[j];
        const c = ct[i + j];
        if (p === c) ok = false;
        else if ((fwd[p] && fwd[p] !== c) || (back[c] && back[c] !== p)) ok = false;
        else {
          fwd[p] = c;
          back[c] = p;
        }
      }
      if (ok) hits.push(i);
    }
    return hits;
  }

  // Baconian (24-letter form)
  function baconEncode(text) {
    return letters(text)
      .replace(/J/g, 'I')
      .replace(/V/g, 'U')
      .split('')
      .map((ch) => BACON24.indexOf(ch).toString(2).padStart(5, '0').replace(/0/g, 'A').replace(/1/g, 'B'))
      .join('');
  }
  function baconDecode(ab) {
    const s = String(ab).toUpperCase().replace(/[^AB]/g, '');
    return (s.match(/.{5}/g) || [])
      .map((g) => BACON24[parseInt(g.replace(/A/g, '0').replace(/B/g, '1'), 2)] || '?')
      .join('');
  }

  // Porta (ACA tableau): key letters work in pairs AB, CD, ... YZ
  function porta(text, key) {
    const k = letters(key);
    if (!k) return String(text).toUpperCase();
    let n = 0;
    return String(text)
      .toUpperCase()
      .replace(/[A-Z]/g, (ch) => {
        const row = Math.floor(ALPHA.indexOf(k[n++ % k.length]) / 2);
        const p = ALPHA.indexOf(ch);
        return p < 13 ? ALPHA[13 + mod(p + row, 13)] : ALPHA[mod(p - 13 - row, 13)];
      });
  }
  function portaKeyFromCrib(plain, cipher) {
    const p = letters(plain);
    const c = letters(cipher);
    const out = [];
    for (let i = 0; i < Math.min(p.length, c.length); i++) {
      const pi = ALPHA.indexOf(p[i]);
      const ci = ALPHA.indexOf(c[i]);
      if (pi < 13 && ci >= 13) out.push(mod(ci - 13 - pi, 13));
      else if (pi >= 13 && ci < 13) out.push(mod(pi - 13 - ci, 13));
      else out.push(-1);
    }
    return out.map((r) => (r < 0 ? '??' : ALPHA[2 * r] + '/' + ALPHA[2 * r + 1]));
  }

  // Complete columnar transposition
  function columnOrder(key) {
    const k = String(key).trim();
    let ranks;
    if (/^\d+$/.test(k)) ranks = k.split('').map(Number);
    else {
      const l = letters(k).split('');
      ranks = l.map((ch, i) => l.filter((o, j) => o < ch || (o === ch && j < i)).length);
    }
    return ranks.map((r, col) => ({ r, col })).sort((a, b) => a.r - b.r || a.col - b.col).map((x) => x.col);
  }
  function columnarEncode(text, key, pad = 'X') {
    const order = columnOrder(key);
    const n = order.length;
    if (!n) return '';
    let t = letters(text);
    while (t.length % n) t += pad;
    const rows = t.length / n;
    let out = '';
    for (const col of order) for (let r = 0; r < rows; r++) out += t[r * n + col];
    return groups(out);
  }
  function columnarDecode(cipherText, key) {
    const order = columnOrder(key);
    const n = order.length;
    const t = letters(cipherText);
    if (!n || t.length % n) return null;
    const rows = t.length / n;
    const grid = Array.from({ length: rows }, () => Array(n));
    order.forEach((col, idx) => {
      for (let r = 0; r < rows; r++) grid[r][col] = t[idx * rows + r];
    });
    return grid.map((r) => r.join('')).join('');
  }
  function columnCounts(length, max = 11) {
    const out = [];
    for (let n = 2; n <= max; n++) if (length % n === 0) out.push(n);
    return out;
  }

  // Cryptarithm (sum of words = word)
  function solveCryptarithm(expr, limit = 5) {
    const [left, right] = String(expr).toUpperCase().replace(/\s+/g, '').split('=');
    if (!left || !right) return { error: 'Use the form SEND+MORE=MONEY' };
    const terms = left.split('+');
    if (terms.some((t) => !/^[A-Z]+$/.test(t)) || !/^[A-Z]+$/.test(right)) return { error: 'Use only letters, + and =' };
    const coef = {};
    const add = (word, sign) => {
      [...word].reverse().forEach((ch, i) => {
        coef[ch] = (coef[ch] || 0) + sign * Math.pow(10, i);
      });
    };
    terms.forEach((t) => add(t, 1));
    add(right, -1);
    const lead = new Set([...terms, right].filter((w) => w.length > 1).map((w) => w[0]));
    const ls = Object.keys(coef);
    if (ls.length > 10) return { error: 'A base-10 cryptarithm has at most 10 different letters' };
    const sols = [];
    const used = Array(10).fill(false);
    const assign = {};
    (function go(i, sum) {
      if (sols.length >= limit) return;
      if (i === ls.length) {
        if (sum === 0) sols.push({ ...assign });
        return;
      }
      for (let d = lead.has(ls[i]) ? 1 : 0; d < 10; d++) {
        if (used[d]) continue;
        used[d] = true;
        assign[ls[i]] = d;
        go(i + 1, sum + coef[ls[i]] * d);
        used[d] = false;
      }
      delete assign[ls[i]];
    })(0, 0);
    return { solutions: sols, letters: ls.length };
  }

  // Fractionated Morse
  const MORSE = {
    A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--',
    N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
  };
  const TRIPLE_SYMBOLS = ['.', '-', 'x'];
  const tripleOf = (i) => TRIPLE_SYMBOLS[Math.floor(i / 9)] + TRIPLE_SYMBOLS[Math.floor(i / 3) % 3] + TRIPLE_SYMBOLS[i % 3];
  function fmTable(keyword) {
    const alpha = keyedAlphabet(keyword);
    return [...alpha].map((letter, i) => ({ letter, triple: tripleOf(i) }));
  }
  function fmorseEncode(text, keyword) {
    const words = String(text).toUpperCase().replace(/[^A-Z ]/g, '').trim().split(/\s+/).filter(Boolean);
    let m = words.map((w) => [...w].map((c) => MORSE[c]).join('x')).join('xx');
    while (m.length % 3) m += 'x';
    const rev = Object.fromEntries(fmTable(keyword).map((e) => [e.triple, e.letter]));
    return groups(m.match(/.{3}/g).map((t) => rev[t] || '?').join(''));
  }
  function fmorseDecode(cipherText, keyword) {
    const fwd = Object.fromEntries(fmTable(keyword).map((e) => [e.letter, e.triple]));
    const morse = letters(cipherText).split('').map((c) => fwd[c]).join('');
    const rev = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));
    return morse
      .replace(/x{2,}/g, ' ')
      .trim()
      .split(' ')
      .map((w) => w.split('x').filter(Boolean).map((code) => rev[code] || '?').join(''))
      .join(' ');
  }

  // Polybius-based ciphers
  const poly = (keyword) => keyedAlphabet(keyword, ALPHA25);
  const jToI = (s) => letters(s).replace(/J/g, 'I');

  function nihilistEncode(text, polyKey, key) {
    const sq = poly(polyKey);
    const val = (ch) => 10 * (Math.floor(sq.indexOf(ch) / 5) + 1) + (sq.indexOf(ch) % 5) + 1;
    const k = jToI(key);
    if (!k) return '';
    return [...jToI(text)].map((ch, i) => val(ch) + val(k[i % k.length])).join(' ');
  }
  function nihilistDecode(numbers, polyKey, key) {
    const sq = poly(polyKey);
    const val = (ch) => 10 * (Math.floor(sq.indexOf(ch) / 5) + 1) + (sq.indexOf(ch) % 5) + 1;
    const k = jToI(key);
    if (!k) return '';
    return (String(numbers).match(/\d+/g) || [])
      .map((n, i) => {
        const v = Number(n) - val(k[i % k.length]);
        const r = Math.floor(v / 10) - 1;
        const c = (v % 10) - 1;
        return r >= 0 && r < 5 && c >= 0 && c < 5 ? sq[r * 5 + c] : '?';
      })
      .join('');
  }

  function checkerboardValid(rowLabels, colLabels) {
    const r = jToI(rowLabels);
    const c = jToI(colLabels);
    return r.length === 5 && c.length === 5 && new Set(r).size === 5 && new Set(c).size === 5;
  }
  function checkerboardEncode(text, squareKey, rowLabels, colLabels) {
    const sq = poly(squareKey);
    const r = jToI(rowLabels);
    const c = jToI(colLabels);
    return groups(
      [...jToI(text)]
        .map((ch) => {
          const i = sq.indexOf(ch);
          return r[Math.floor(i / 5)] + c[i % 5];
        })
        .join('')
    );
  }
  function checkerboardDecode(cipherText, squareKey, rowLabels, colLabels) {
    const sq = poly(squareKey);
    const r = jToI(rowLabels);
    const c = jToI(colLabels);
    return (jToI(cipherText).match(/../g) || [])
      .map((pair) => {
        const ri = r.indexOf(pair[0]);
        const ci = c.indexOf(pair[1]);
        return ri < 0 || ci < 0 ? '?' : sq[ri * 5 + ci];
      })
      .join('');
  }

  // Homophonic (ACA): four 25-number rows, each starting under one keyword letter
  function homophonicStarts(keyword) {
    const k = jToI(keyword).slice(0, 4);
    return k.length === 4 ? [...k].map((ch) => ALPHA25.indexOf(ch)) : null;
  }
  const two = (n) => String(n % 100).padStart(2, '0');
  function homophonicTable(keyword) {
    const starts = homophonicStarts(keyword);
    if (!starts) return null;
    return starts.map((s, r) => [...ALPHA25].map((_, p) => two(25 * r + mod(p - s, 25) + 1)));
  }
  function homophonicEncode(text, keyword) {
    const starts = homophonicStarts(keyword);
    if (!starts) return null;
    return [...jToI(text)]
      .map((ch, i) => {
        const r = (i * 3 + 1) % 4;
        return two(25 * r + mod(ALPHA25.indexOf(ch) - starts[r], 25) + 1);
      })
      .join(' ');
  }
  function homophonicDecode(numbers, keyword) {
    const starts = homophonicStarts(keyword);
    if (!starts) return null;
    const digits = String(numbers).replace(/\D/g, '');
    return (digits.match(/\d\d/g) || [])
      .map((d) => {
        const n = Number(d) || 100;
        const r = Math.floor((n - 1) / 25);
        return ALPHA25[(((n - 1) % 25) + starts[r]) % 25];
      })
      .join('');
  }
  function homophonicKeyFromCrib(plain, numbers) {
    const nums = (String(numbers).replace(/\D/g, '').match(/\d\d/g) || []).map((d) => Number(d) || 100);
    const p = jToI(plain);
    const key = ['?', '?', '?', '?'];
    let conflict = false;
    for (let i = 0; i < Math.min(p.length, nums.length); i++) {
      const r = Math.floor((nums[i] - 1) / 25);
      const start = ALPHA25[mod(ALPHA25.indexOf(p[i]) - ((nums[i] - 1) % 25), 25)];
      if (key[r] !== '?' && key[r] !== start) conflict = true;
      key[r] = start;
    }
    return { key: key.join(''), conflict };
  }

  function frequency(text) {
    const counts = Object.fromEntries([...ALPHA].map((c) => [c, 0]));
    for (const ch of letters(text)) counts[ch]++;
    return counts;
  }

  return {
    ALPHA, ALPHA25, BACON24, MORSE, letters, groups, keyedAlphabet, mapLetters,
    atbash, caesar, aristocratTables, aristocrat, patristocrat, cribPositions,
    baconEncode, baconDecode, porta, portaKeyFromCrib,
    columnOrder, columnarEncode, columnarDecode, columnCounts,
    solveCryptarithm, fmTable, fmorseEncode, fmorseDecode, poly,
    nihilistEncode, nihilistDecode, checkerboardValid, checkerboardEncode, checkerboardDecode,
    homophonicTable, homophonicEncode, homophonicDecode, homophonicKeyFromCrib, frequency,
  };
});
