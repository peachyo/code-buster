const test = require('node:test');
const assert = require('node:assert/strict');

global.window = { Ciphers: require('../ciphers.js') };
require('../slides.js');
const { slides, TOOLS } = global.window.Slides;

test('deck has the intro, 13 ciphers (Aristocrat has 4 slides) and the wrap-up', () => {
  assert.equal(slides.filter((s) => /^\d+ · /.test(s.section)).length, 53);
  assert.equal(new Set(slides.filter((s) => /^\d+ · /.test(s.section)).map((s) => s.section)).size, 13);
});

test('every slide renders non-empty html without placeholders', () => {
  for (const s of slides) {
    assert.ok(s.html.length > 20, s.title);
    assert.ok(!/undefined|NaN|\[object/.test(s.html), `bad content in "${s.title}"`);
  }
});

test('every widget runs on its default input and gives a real answer', () => {
  for (const [id, def] of Object.entries(TOOLS)) {
    const values = Object.fromEntries(def.fields.map((f) => [f.name, f.value]));
    const out = def.run(values);
    assert.equal(typeof out, 'string', def.title);
    assert.ok(out.length > 0, `${id} ${def.title}`);
    assert.ok(!/undefined|NaN|\[object|Cannot compute|Key needs|No solution|No position/.test(out), `${def.title}: ${out.slice(0, 120)}`);
  }
});

test('default widget inputs decode to the expected plaintext', () => {
  const byTitle = (t) => Object.values(TOOLS).find((d) => d.title.startsWith(t));
  const run = (t, over = {}) => {
    const d = byTitle(t);
    return d.run({ ...Object.fromEntries(d.fields.map((f) => [f.name, f.value])), ...over });
  };
  assert.match(run('Try it: Porta'), /SCIENCE OLYMPIAD CODE BREAKERS/);
  assert.match(run('Try it: Fractionated Morse'), /CODEBUSTERS/);
  assert.match(run('Try it: Nihilist'), /EASYCIPHEREXAMPLE/);
  assert.match(run('Try it: Homophonic decode'), /WORDDIVISIONSMAYBEKEPT/);
  assert.match(run('Try it: Baconian'), /SCIENCE/);
  assert.match(run('Try it: encode / decode'), /THE KEY TO CODEBUSTERS IS LOOKING FOR PATTERNS/);
});

test('widgets escape hostile input', () => {
  const d = Object.values(TOOLS).find((t) => t.title.startsWith('Try it: Atbash'));
  assert.ok(!d.run({ text: '<img src=x onerror=alert(1)>' }).includes('<img'));
});
