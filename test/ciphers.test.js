const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../ciphers.js');

test('Atbash is its own inverse and mirrors the alphabet', () => {
  assert.equal(C.atbash('ABCXYZ'), 'ZYXCBA');
  assert.equal(C.atbash(C.atbash('Secret, message!')), 'SECRET, MESSAGE!');
});

test('Caesar shifts and decodes; ROT13 is reciprocal', () => {
  assert.equal(C.caesar('ATTACK AT DAWN', 3), 'DWWDFN DW GDZQ');
  assert.equal(C.caesar('DWWDFN DW GDZQ', 3, true), 'ATTACK AT DAWN');
  assert.equal(C.caesar(C.caesar('HELLO', 13), 13), 'HELLO');
});

test('K1 aristocrat puts the keyword in the plaintext alphabet', () => {
  assert.equal(C.keyedAlphabet('KEYWORD'), 'KEYWORDABCFGHIJLMNPQSTUVXZ');
  assert.equal(C.aristocrat('KEY', 'KEYWORD'), 'ABC');
  assert.equal(C.aristocrat('ABC', 'KEYWORD', true), 'KEY');
});

test('random aristocrat alphabet round-trips', () => {
  const key = 'QWERTYUIOPASDFGHJKLZXCVBNM';
  const ct = C.aristocrat('HELLO WORLD', key);
  assert.equal(ct, 'ITSSG VGKSR');
  assert.equal(C.aristocrat(ct, key, true), 'HELLO WORLD');
});

test('patristocrat strips spaces and groups by five', () => {
  assert.equal(C.patristocrat('KEY KEY KEY', 'KEYWORD'), 'ABCAB CABC');
});

test('crib positions respect letter patterns and the no-self-map rule', () => {
  assert.deepEqual(C.cribPositions('FHCDLQ', 'HEARD'), [0]);
  assert.deepEqual(C.cribPositions('XQWQEX', 'EVER'), [1]);
  assert.deepEqual(C.cribPositions('MXYZYXM', 'LEVEL'), [1]);
  assert.deepEqual(C.cribPositions('ZZKLMKLM', 'EVER'), []);
  assert.deepEqual(C.cribPositions('EVER', 'EVER'), []);
});

test('Baconian 24-letter table', () => {
  assert.equal(C.baconEncode('A'), 'AAAAA');
  assert.equal(C.baconEncode('G'), 'AABBA');
  assert.equal(C.baconEncode('Z'), 'BABBB');
  assert.equal(C.baconEncode('U'), C.baconEncode('V'));
  assert.equal(C.baconEncode('I'), C.baconEncode('J'));
  assert.equal(C.baconDecode(C.baconEncode('HELLO')), 'HELLO');
});

test('Porta matches the official guide example and is reciprocal', () => {
  const ct = 'LWQNAWY GULTIQWQ WHYN OKYVTRKL';
  assert.equal(C.porta('SCIENCE OLYMPIAD CODE BREAKERS', 'PORTA'), ct);
  assert.equal(C.porta(ct, 'PORTA'), 'SCIENCE OLYMPIAD CODE BREAKERS');
});

test('Porta key recovery from a crib', () => {
  const crib = 'SCIEN';
  assert.deepEqual(C.portaKeyFromCrib(crib, C.porta(crib, 'PORTA')), ['O/P', 'O/P', 'Q/R', 'S/T', 'A/B']);
});

test('Complete columnar matches the official guide example', () => {
  const pt = 'HERE IS A COMPLETE COLUMNAR EXAMPLE';
  const ct = 'RCELR PEOTU ELHSP CNAEA LOAMI MEMXE';
  assert.deepEqual(C.columnOrder('ORDER'), [2, 3, 0, 1, 4]);
  assert.equal(C.columnarEncode(pt, 'ORDER'), ct);
  assert.equal(C.columnarDecode(ct, 'ORDER'), 'HEREISACOMPLETECOLUMNAREXAMPLE');
  assert.equal(C.columnarDecode(ct, '34125'), 'HEREISACOMPLETECOLUMNAREXAMPLE');
  assert.deepEqual(C.columnCounts(60, 9), [2, 3, 4, 5, 6]);
});

test('Cryptarithm solver finds the unique SOCIAL + SOLAR = VEHICLE answer', () => {
  const r = C.solveCryptarithm('SOCIAL+SOLAR=VEHICLE', 10);
  assert.equal(r.solutions.length, 1);
  assert.equal(r.solutions[0].V, 1);
  assert.equal(r.solutions[0].E, 0);
  assert.equal(r.solutions[0].S, 9);
  const s = C.solveCryptarithm('SEND+MORE=MONEY');
  assert.equal(s.solutions[0].M, 1);
  assert.equal(s.solutions[0].S, 9);
});

test('Fractionated Morse matches the official guide example', () => {
  assert.equal(C.fmorseEncode('CODEBUSTERS', 'DULCIMERS').replace(/ /g, ''), 'BRJATAEMDXEFD');
  assert.equal(C.fmorseDecode('BRJATAEMDXEFD', 'DULCIMERS'), 'CODEBUSTERS');
  const t = C.fmTable('DULCIMERS');
  assert.equal(t[0].triple, '...');
  assert.equal(t.find((e) => e.letter === 'Z').triple, 'xx-');
  assert.equal(C.fmorseDecode(C.fmorseEncode('SOLVE THE CODE', 'KEYWORD'), 'KEYWORD'), 'SOLVE THE CODE');
});

test('Nihilist matches the official guide example', () => {
  const ct = '36 35 35 67 54 28 64 36 36 66 36 76 34 48 64 47 46';
  assert.equal(C.nihilistEncode('EASY CIPHER EXAMPLE', 'FASHIONED', 'SENSE'), ct);
  assert.equal(C.nihilistDecode(ct, 'FASHIONED', 'SENSE'), 'EASYCIPHEREXAMPLE');
});

test('Checkerboard round-trips', () => {
  const enc = C.checkerboardEncode('SOLVE THE CODE', 'OLYMPIAD', 'WHITE', 'GRAYS');
  assert.equal(C.checkerboardDecode(enc, 'OLYMPIAD', 'WHITE', 'GRAYS'), 'SOLVETHECODE');
  assert.ok(C.checkerboardValid('WHITE', 'GRAYS'));
  assert.ok(!C.checkerboardValid('WHITE', 'GRASS'));
});

test('Homophonic matches the ACA GOLF example', () => {
  const ct = '16 26 11 99 69 46 33 03 88 79 54 83 12 06 38 94 67 24 04 00 27 89';
  assert.equal(C.homophonicDecode(ct, 'GOLF'), 'WORDDIVISIONSMAYBEKEPT');
  const t = C.homophonicTable('GOLF');
  assert.deepEqual(t[0].slice(0, 7), ['20', '21', '22', '23', '24', '25', '01']);
  assert.equal(t[3][0], '96');
  assert.equal(C.homophonicDecode(C.homophonicEncode('WORD DIVISIONS', 'GOLF'), 'GOLF'), 'WORDDIVISIONS');
  assert.deepEqual(C.homophonicKeyFromCrib('WORDDIVISIONS', ct), { key: 'GOLF', conflict: false });
});
