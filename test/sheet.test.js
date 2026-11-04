const test = require('node:test');
const assert = require('node:assert/strict');

global.window = { Ciphers: require('../ciphers.js'), Sheet: require('../sheet.js') };
require('../slides.js');
const Sheet = global.window.Sheet;
const C = global.window.Ciphers;
const { slides, SHEETS } = global.window.Slides;

test('substitution truth map comes from the ciphertext/answer pair', () => {
  const ct = C.aristocrat('THE CAT', 'OLYMPIAD');
  const truth = Sheet.truthOf(Sheet.fromCipher(ct, 'THE CAT'));
  for (const [cipher, plain] of Object.entries(truth)) assert.equal(C.aristocrat(plain, 'OLYMPIAD'), cipher);
  assert.equal(Object.keys(truth).length, 5);
});

test('inconsistent pairs are rejected', () => {
  assert.throws(() => Sheet.truthOf(Sheet.fromCipher('AB AB', 'XY XZ')));
  assert.throws(() => Sheet.fromCipher('ABC', 'XY'));
});

test('K1 keyword fills the replacement row: keyword first, then the unused letters', () => {
  const map = Sheet.k1Map(C.keyedAlphabet('OLYMPIAD'));
  assert.equal(map.A, 'O');
  assert.equal(map.H, 'D');
  assert.equal(map.I, 'B');
  assert.equal(Object.values(map).join('').length, 26);
});

test('duplicate plain letters are reported once', () => {
  assert.deepEqual([...Sheet.duplicates({ A: 'E', B: 'E', C: 'T', D: '' })], ['E']);
  assert.equal(Sheet.duplicates({ A: 'E', B: 'T' }).size, 0);
});

test('typing over an existing guess keeps only the new letter', () => {
  assert.equal(Sheet.newLetter('e', ''), 'E');
  assert.equal(Sheet.newLetter('ET', 'E'), 'T');
  assert.equal(Sheet.newLetter('TE', 'E'), 'T');
  assert.equal(Sheet.newLetter('4', 'E'), '');
});

test('grading counts right, wrong and blank letters by position', () => {
  const units = Sheet.fromAnswer('CAT', ['1', '2', '3']);
  const guesses = ['C', 'X', ''];
  const g = Sheet.grade(units, (u, i) => guesses[i]);
  assert.deepEqual({ total: g.total, right: g.right, blank: g.blank, errors: g.errors }, { total: 3, right: 1, blank: 1, errors: 2 });
  assert.deepEqual(g.wrong, [1]);
});

test('every sheet on every slide builds valid units', () => {
  assert.ok(Object.keys(SHEETS).length >= 1);
  for (const [id, def] of Object.entries(SHEETS)) {
    const units = def.mode === 'sub' || def.ct ? Sheet.fromCipher(def.ct, def.answer) : Sheet.fromAnswer(def.answer, def.tokens, def.wordGaps);
    assert.ok(units.some((u) => !u.gap), id);
    if (def.mode === 'sub') {
      Sheet.truthOf(units);
      for (const u of units) if (u.key) assert.notEqual(u.key, u.ans, `${def.title}: ${u.key} decodes to itself`);
    }
    const slide = slides.find((s) => s.html.includes(`data-sheet="${id}"`));
    assert.ok(slide, `${id} is placed on a slide`);
  }
});

test('shift and Atbash helper maps decode the real ciphers', () => {
  const ct = C.caesar('MEET AT NOON', 7);
  const m = Sheet.shiftMap(7);
  assert.equal([...ct].map((c) => m[c] || c).join(''), 'MEET AT NOON');
  const at = Sheet.atbashMap();
  assert.equal([...C.atbash('SCIENCE')].map((c) => at[c]).join(''), 'SCIENCE');
  assert.equal(Sheet.shiftMap(-3).D, 'G');
});

test('every cipher section has an exam sheet slide', () => {
  const have = new Set(slides.filter((s) => /the exam sheet$/.test(s.title)).map((s) => s.section));
  assert.equal(have.size, 13);
});

test('columnar crib walkthrough: the block order found from the crib rebuilds the plaintext', () => {
  const pt = 'HEREISACOMPLETECOLUMNAREXAMPLE';
  const flat = C.columnarEncode(pt, 'ORDER').replace(/ /g, '');
  const blocks = [...Array(5)].map((_, i) => flat.slice(i * 6, (i + 1) * 6));
  const crib = [...'COLU'].map((ch) => blocks.findIndex((b) => b[3] === ch));
  assert.deepEqual(crib, [2, 3, 0, 1]);
  const order = [...crib, 4];
  assert.equal([...Array(6)].map((_, r) => order.map((i) => blocks[i][r]).join('')).join(''), pt);
});
