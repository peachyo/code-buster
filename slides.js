/* Slide content. Every worked example is computed with ciphers.js, never typed by hand. */
(function () {
  const C = window.Ciphers;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  /* ---------- helpers ---------- */
  const TOOLS = {};
  let toolCount = 0;
  function tool(def) {
    const id = 't' + toolCount++;
    TOOLS[id] = def;
    return `<div class="tool" data-tool="${id}"></div>`;
  }
  const SHEETS = {};
  let sheetCount = 0;
  function sheet(def) {
    const id = 's' + sheetCount++;
    SHEETS[id] = def;
    return `<div class="sheet-slot" data-sheet="${id}"></div>`;
  }
  const examQ = (t) => `<p class="exam-q">${t}</p>`;
  const mono = (s) => `<pre class="mono">${esc(s)}</pre>`;
  const table = (rows, opts = {}) =>
    `<div class="tscroll"><table class="tbl ${opts.cls || ''}">` +
    rows
      .map((r, i) => {
        const tag = (opts.head && i === 0) || false ? 'th' : 'td';
        return '<tr>' + r.map((c, j) => `<${opts.rowHead && j === 0 ? 'th' : tag}>${c}</${opts.rowHead && j === 0 ? 'th' : tag}>`).join('') + '</tr>';
      })
      .join('') +
    '</table></div>';
  const alphaTable = (plain, cipher, labels = ['Plain', 'Cipher']) =>
    table(
      [[labels[0], ...[...plain]], [labels[1], ...[...cipher]]],
      { cls: 'alpha', rowHead: true }
    );
  const tips = (items) => `<ul class="tips">${items.map((t) => `<li>${t}</li>`).join('')}</ul>`;
  const steps = (items) => `<ol class="steps">${items.map((t) => `<li>${t}</li>`).join('')}</ol>`;
  const card = (title, body, cls = '') => `<div class="card ${cls}"><h3>${title}</h3>${body}</div>`;
  const cols = (...c) => `<div class="cols cols-${c.length}">${c.join('')}</div>`;
  const badges = (regional, state, rule) =>
    `<div class="badges"><span class="badge reg">Regional: ${regional}</span><span class="badge st">State: ${state}</span><span class="badge rule">Rule ${rule}</span></div>`;
  const key = (t) => `<code>${esc(t)}</code>`;

  const textField = (name, label, value, extra = {}) => ({ name, label, value, type: 'text', ...extra });

  /* ---------- official 2026-27 Division B list ---------- */
  const LIST = [
    ['Atbash', 'Decrypt (English, not Hebrew)', 'Same', '3.e.ix'],
    ['Caesar', 'Decrypt (shift cipher)', 'Same', '3.e.x'],
    ['Aristocrat', 'K1 or random alphabet, spaces kept, optional hint', 'Same', '3.e.i (1)'],
    ['Baconian', 'Decrypt; word form comes with a crib of 4+ letters', 'Same', '3.e.ii'],
    ['Patristocrat', 'K1 alphabet, spaces removed, groups of 5', 'Same', '3.e.i (2)'],
    ['Xenocrypt', 'Spanish, K1 English keyword alphabet (max 1)', '1 or 2 per exam', '3.e.iii / 3.f.ii'],
    ['Porta', 'Decrypt given the key', 'Cryptanalysis with a crib of 3+ characters', '3.e.vi / 3.f.iii'],
    ['Complete Columnar', 'Cryptanalysis, 9 columns or fewer, crib of at least columns − 1 letters', 'Same', '3.e.vii'],
    ['Cryptarithm', 'Base 10; decode a word or phrase from the mapping', 'Same', '3.e.v'],
    ['Homophonic', 'Cryptanalysis: crib shows 3+ letters of a 4-letter keyword', 'Decrypt given 3+ keyword letters', '3.e.xii / 3.f.vi'],
    ['Fractionated Morse', 'Cryptanalysis with a crib of 4+ plaintext characters', 'Same', '3.e.iv'],
    ['Checkerboard', 'Decrypt given the Polybius key', 'Cryptanalysis: two 5-letter keywords, crib of 5+ characters', '3.e.xi / 3.f.v'],
    ['Nihilist', 'Decrypt given the keys', 'Cryptanalysis: crib at least twice the keyword length', '3.e.viii / 3.f.iv'],
  ];

  const slides = [];
  const add = (s) => slides.push(s);

  // Simplest to hardest: the order of the sections in this deck. Difficulty and times are judgement, not official.
  const LADDER = [
    ['Atbash', 1, '1 to 2 min', 'Fixed mirror alphabet: no key at all', 'Always do it'],
    ['Caesar', 1, '2 to 3 min', 'One shift, at most 25 tries', 'Always do it'],
    ['Nihilist', 2, '4 to 6 min', 'With the keys given it is mechanical: subtract, then read the square. Harder at State/National if only a crib is given', 'Do it early'],
    ['Porta', 2, '5 to 8 min', 'Reciprocal tableau lookup; with only a crib it is slower', 'Easy when the key is given'],
    ['Checkerboard', 3, '6 to 10 min', 'Only the Polybius key is given: find the row and column labels from letter frequency, then pair lookup', 'Do it after the easy ones; likely a bonus (webinar)'],
    ['Complete Columnar', 3, '10 to 15 min', 'Column count and ordering, crib not marked', 'Cap at 10 minutes'],
    ['Cryptarithm', 3, '10 to 20 min', 'Pure logic search; zero errors allowed', 'Drop second'],
    ['Aristocrat', 3, '5 to 10 min', 'Frequency, word shapes and the hint; spaces kept. The most important cipher: the highest points, up to 2000 with the timing bonus', 'The timed question: whole team'],
    ['Baconian', 3, '3 to 5 min', 'Table lookup in groups of 5. Depends on how hard it is to decode the symbols into A and B: very easy if they are plain letters, up to medium if decoding takes more work', 'Do it early'],
    ['Fractionated Morse', 4, '15 to 20+ min', 'Crib alignment, then many Morse gaps to fill by hand', 'Drop first'],
    ['Patristocrat', 4, '10 to 15 min', 'Same as Aristocrat but no word breaks, so you rely on the hint, frequencies and patterns', 'After you can solve an Aristocrat'],
    ['Homophonic', 4, '8 to 12 min', 'Number to letter by rows; the missing 4th key letter', 'Bonus guaranteed: learn it'],
    ['Xenocrypt', 5, '10 to 15 min', 'Spanish letter frequencies and word shapes; hard without Spanish', 'Skip it if you do not know Spanish'],
  ];
  const LADDER_ORDER = LADDER.map((r) => r[0]);

  /* ================= INTRO ================= */
  add({
    section: 'Intro',
    cls: 'title-slide',
    title: '',
    html: `
      <div class="hero">
        <p class="eyebrow">Science Olympiad 2026–27 · Division B</p>
        <h1>Codebusters</h1>
        <p class="lead">Every cipher on the Division B list, explained from the simplest to the hardest, with worked examples and live tools.</p>
        <p class="hint">Use ← → keys, the buttons below, or swipe to move between slides.</p>
      </div>`,
  });

  add({
    section: 'Intro',
    title: 'How the event works',
    html:
      cols(
        card(
          'Format (2027 Rules Manual)',
          tips([
            'Team of up to <strong>3</strong>, about <strong>50 minutes</strong>',
            'Bring only writing utensils',
            'Written or computer-based exam; you may split the pages and work in any order',
            'Each teammate gets a resource sheet: Morse table, English/Spanish letter frequencies, Porta table, Atbash table and Baconian mappings (as the questions need)',
          ])
        ) +
          card(
            'What you do',
            `<p>You decrypt ciphertext. Some questions give you the key (just decrypt it), others give a <strong>crib</strong>: a piece of known plaintext whose position is marked on the ciphertext (except for Complete Columnar).</p>
             <p>For Aristocrats, Patristocrats and Xenocrypts, <strong>no letter ever decrypts to itself</strong>.</p>`
          )
      ) +
      `<p class="note">The Regional list is rule 3.e; State and National add rule 3.f. The next slide shows every cipher with what the rules give you.</p>`,
  });

  add({
    section: 'Intro',
    title: 'The 13 Division B ciphers',
    html:
      table([['#', 'Cipher', 'Regional (3.e)', 'State / National adds (3.f)', 'Rule'], ...LIST.map((r, i) => [String(i + 1), `<strong>${r[0]}</strong>`, r[1], r[2], r[3]])], { head: true, cls: 'list' }) +
      `<p class="note">Wording is condensed from the 2027 Division B Rules Manual. The order of this deck, simplest to hardest, is my own judgement, not an official ranking.</p>`,
  });

  add({
    section: 'Intro',
    title: 'Scoring and the timed question',
    html:
      cols(
        card(
          'Scoring',
          tips([
            'Final score = exam score + timing bonus + special bonus',
            '<strong>2 or fewer errors</strong> in the decoded plaintext still earns full credit',
            'Each additional error costs 100 points, never below zero for that question (a 400-point question with 5 errors earns 100)',
            '<strong>Cryptarithms</strong> allow zero errors; each error costs 100 points',
          ])
        ) +
          card(
            'Timed first question',
            tips([
              'The first question is always an <strong>Aristocrat</strong> (K1 or random alphabet)',
              'Signal your team when you have broken it; you may retry without penalty',
              'Timing bonus = <strong>2 × (600 − seconds)</strong>, so 6 minutes earns 480 points; after 10 minutes the bonus is zero',
            ])
          )
      ) +
      card(
        'Special bonus questions',
        `<p>Up to three questions that are not Aristocrats, Patristocrats or Xenocrypts are marked as special bonus questions, and at least one uses the <strong>Homophonic</strong> cipher. Solve them with no penalty points: one = 150, two = 400, all three = 750.</p>`
      ),
  });

  add({
    section: 'Intro',
    title: 'The timed question (rule 3.h)',
    html:
      badges('Always the first question', 'Same', '3.h, 4.f') +
      cols(
        card(
          'How it works',
          steps([
            'The first question of every exam is timed, and it is always an <strong>Aristocrat</strong> (K1 or random alphabet, spaces kept).',
            'Before the exam starts, the Event Supervisor announces the <strong>signal</strong> to use (for example, shouting “time” or quietly raising a hand).',
            'A team member gives the signal when the team has broken it. The supervisor records the time in seconds.',
            'The clock starts at the beginning of the event, not when you begin that question.',
            'If the answer is wrong you may <strong>try again repeatedly with no penalty</strong>. The clock keeps running until it is correct, meaning <strong>two or fewer errors</strong>.',
            'After <strong>10 minutes</strong> the timing bonus is zero, but you can still answer the question for its normal points.',
          ])
        ),
        card(
          'Bonus and what it means',
          table([['Solved at', 'Bonus'], ...[120, 180, 300, 360, 480, 540, 600].map((t) => [`${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`, String(2 * (600 - t))])], { head: true, cls: 'grid' }) +
            tips([
              'Bonus = 2 × (600 − seconds): each second is worth 2 points, each minute 120.',
              'The most you can earn is 1200 (at 0 seconds). A 5-minute solve earns 600, more than the 500-point question in the manual\u2019s own example.',
              'Because retries are free, give the signal the moment you have 0 to 2 errors. Do not hunt for the last letter.',
            ])
        )
      ) +
      `<p class="note">Tiebreakers (rule 4.i): select questions chosen by the Event Supervisor are used in this order: score, then degree of correctness, then number attempted. So an attempted, nearly right answer is worth more than a blank.</p>`,
  });

  add({
    section: 'Intro',
    title: 'Reading an exam question',
    html:
      `<p>Each question is a short piece of flavor text followed by one instruction. The cipher type and alphabet type are in the first sentence, and a hint may follow.</p>` +
      examQ('The following quote has been encoded with an Aristocrat using a K1 alphabet. You are told that the cipher contains OFF. What does it say?') +
      cols(
        card('What each part tells you', tips(['<strong>Cipher</strong>: which method to attack', '<strong>Alphabet</strong>: K1 (keyword) or random', '<strong>Hint</strong>: plaintext you can use as a crib', '<strong>Question</strong>: usually “what does it say?”'])),
        card('Common hint phrases', tips(['“the cipher contains …”', '“the cipher starts with …” (Xenocrypt)', '“the cipher ends with …” (Patristocrat)', '“has … somewhere in it” (Columnar)'])),
        card('Answering', tips(['Write the plaintext below the cipher, letter for letter', 'Two or fewer errors still earns full credit', 'Cryptarithms allow no errors'])) 
      ) +
      `<p class="note">The exam-sheet slide in each cipher section is interactive: type in the boxes under the cipher, use the frequency table, then press Check.</p>`,
  });

  const FREQ_ENGLISH = 'ETAOINSHRDLCUMWFGYPBVKJXQZ';
  add({
    section: 'Toolbox',
    title: 'Universal toolbox: English statistics',
    html:
      cols(
        card('Letter frequency', `<p class="big mono">${[...FREQ_ENGLISH.slice(0, 12)].join(' ')} …</p><p>Most common to least common: <strong>ETAOIN SHRDLU</strong> then C M W F G Y P B, with V K J X Q Z rare.</p>`) +
          card(
            'Patterns',
            tips([
              'One-letter words: <strong>A</strong>, <strong>I</strong>',
              'Two-letter words: OF TO IN IT IS BE AS AT SO WE HE BY OR ON DO IF ME MY UP AN GO NO US AM',
              'Three-letter words: THE AND FOR ARE BUT NOT YOU ALL HIS HAD HAS FEW',
              'Common digraphs: TH HE IN ER AN RE ND AT ON NT',
              'Common trigrams: THE AND THA ENT ING ION TIO FOR <strong>GHT</strong>',
              'Common double letters: LL EE SS OO TT FF RR NN PP CC',
            ])
          )
      ) +
      cols(
        card(
          'Three-letter words that start with a vowel',
          `<dl>
            <dt>A</dt><dd>AND ARE ALL ANY ANT ACT AGE AGO AIR ARM ART ASK ATE</dd>
            <dt>E</dt><dd>END EAT EAR EGG EYE EVE EBB ERA</dd>
            <dt>I</dt><dd>ITS ILL ICE INK INN IRE ION IVY</dd>
            <dt>O</dt><dd>OUR OUT ONE OLD OFF OIL OWN OWL ODD OAK OPT ORE</dd>
            <dt>U</dt><dd>USE UGH UPS URN</dd>
          </dl>`
        ),
        card(
          'Common endings and beginnings',
          `<p><strong>Suffixes</strong>: -ING -ED -ER -LY -TION -ION -MENT -NESS -ABLE -IBLE -OUS -IVE -ITY -S -ES -AL -FUL -LESS</p>
           <p><strong>Prefixes</strong>: UN- RE- IN- IM- DIS- EN- EM- NON- OVER- MIS- SUB- PRE- INTER- FORE- DE- TRANS- SUPER- SEMI- ANTI-</p>`
        )
      ) +
      cols(
        card(
          'GHT is very common',
          `<p>The cluster <code>GHT</code> turns up constantly and almost always follows a vowel, most often <strong>I</strong> (IGHT), or <strong>OU</strong> / <strong>AU</strong> (OUGHT, AUGHT).</p>
           <p class="mono">NIGHT LIGHT RIGHT SIGHT MIGHT FIGHT TIGHT EIGHT<br>BOUGHT THOUGHT BROUGHT FOUGHT CAUGHT TAUGHT</p>`
        )
      ),
  });

  const EN_REF = 'English, most to least common: E T A O I N S H R D L U (the resource sheet has the full table).';

  /* ================= 1. ATBASH ================= */
  const atbashSample = 'SCIENCE OLYMPIAD CODEBUSTERS';
  add({
    section: '1 · Atbash',
    title: 'Atbash: how it works',
    html:
      badges('Decrypt', 'Same', '3.e.ix') +
      `<p>Atbash mirrors the alphabet: the first letter swaps with the last, the second with the second-to-last, and so on.</p>` +
      alphaTable(C.ALPHA, C.atbash(C.ALPHA)) +
      cols(
        card('Example', mono(`Plain : ${atbashSample}\nCipher: ${C.atbash(atbashSample)}`)),
        card('Properties', tips(['No key: there is exactly one Atbash alphabet', 'Self-inverse: encrypting twice returns the original', 'No letter ever maps to itself (A↔Z … M↔N)', 'Same as an Affine cipher with a = 25, b = 25'])) 
      ),
  });
  const atbashQ = 'PRACTICE MAKES THE PATTERNS OBVIOUS';
  add({
    section: '1 · Atbash',
    title: 'Atbash: the exam sheet',
    html:
      examQ('The following quote has been encoded with the Atbash cipher. What does it say?') +
      `<p>The Atbash mapping never changes, so it is shown here as a reference (the exam gives you a resource sheet with it). Use it to fill in the Replacement row and decode the message below.</p>` +
      alphaTable(C.ALPHA, C.atbash(C.ALPHA)) +
      sheet({ mode: 'sub', title: 'Atbash', ct: C.atbash(atbashQ), answer: atbashQ, ref: EN_REF }) +
      cols(
        card('Do this first', tips(['Write the Atbash alphabet once: A↔Z, B↔Y, C↔X …', `Read the short words: ${key(C.atbash('THE'))} is THE, ${key(C.atbash('OF'))} is OF.`])),
        card('Why it is quick', tips(['There is no key to find, so the whole question is a lookup', 'Spend the time you save on the harder ciphers']))
      ),
  });
  add({
    section: '1 · Atbash',
    title: 'Atbash: breaking it',
    html:
      `<p>Because there is no key, “breaking” Atbash is just applying the mirror. The skill is <em>recognising</em> it quickly.</p>` +
      tips([
        `A one-letter word is <strong>Z</strong> (from A) or <strong>R</strong> (from I).`,
        `Common words become familiar shapes: THE → ${key(C.atbash('THE'))}, AND → ${key(C.atbash('AND'))}, OF → ${key(C.atbash('OF'))}.`,
        `If a test says “Atbash” you just apply the table. If it does not say, a flat frequency count with ETAOIN-reversed letters (V G Z L R M …) is the giveaway.`,
        `Atbash is also known from geocaching, where it is used in hint encodings.`,
      ]) +
      tool({
        title: 'Try it: Atbash (encode and decode are identical)',
        fields: [textField('text', 'Text', atbashSample, { wide: true })],
        run: ({ text }) => mono(C.atbash(text)),
      }),
  });

  /* ================= 2. CAESAR ================= */
  const caesarPlain = 'MEET AT THE LIBRARY AT NOON';
  add({
    section: '2 · Caesar',
    title: 'Caesar: how it works',
    html:
      badges('Decrypt', 'Same', '3.e.x') +
      `<p>Slide every letter a fixed number of places along the alphabet. With shift <strong>k</strong>: <code>C = (P + k) mod 26</code>.</p>` +
      alphaTable(C.ALPHA, C.caesar(C.ALPHA, 3), ['Plain', 'Shift 3']) +
      cols(
        card('Example (shift 3)', mono(`Plain : ${caesarPlain}\nCipher: ${C.caesar(caesarPlain, 3)}`)),
        card('Properties', tips(['Only 25 useful keys', 'ROT13 (shift 13) is its own inverse', 'Word spaces are usually kept, so word shapes survive']))
      ),
  });
  const caesarQ = 'FRIDAY MEETING MOVED TO THE SCIENCE LAB';
  add({
    section: '2 · Caesar',
    title: 'Caesar: the exam sheet',
    html:
      examQ('The following quote has been encoded with the Caesar cipher. What does it say?') +
      `<p>The shift is not given. Find one pair (for example, the one-letter words or the most common letter as E), work out the shift, then enter it in <strong>Apply shift</strong> to fill the whole Replacement row.</p>` +
      sheet({ mode: 'sub', title: 'Caesar', ct: C.caesar(caesarQ, 7), answer: caesarQ, shift: true, hideFreq: true, ref: EN_REF }) +
      cols(
        card('Finding the shift', tips(['Guess the most common cipher letter is E; the distance from E is the shift', 'A pair such as cipher H = plain A gives a shift of 7', 'Once you have one pair, every other pair follows']))
      ),
  });
  add({
    section: '2 · Caesar',
    title: 'Caesar: breaking it',
    html:
      steps([
        'Brute force: try all 25 shifts and read the one that makes sense.',
        'Faster: assume the most common ciphertext letter is E and compute the shift.',
        'Use one-letter words (A, I) and short words (THE, AND) to read the shift off directly.',
      ]) +
      tool({
        title: 'Try it: leave the shift blank to see all 25 decodings',
        fields: [
          textField('text', 'Text', C.caesar(caesarPlain, 7), { wide: true }),
          { name: 'shift', label: 'Shift (blank = all)', value: '', type: 'number' },
          { name: 'mode', label: 'Mode', type: 'select', options: ['Decode', 'Encode'], value: 'Decode' },
        ],
        run: ({ text, shift, mode }) => {
          if (shift === '') {
            return mono([...Array(25)].map((_, i) => `${String(i + 1).padStart(2)}: ${C.caesar(text, i + 1, true)}`).join('\n'));
          }
          return mono(C.caesar(text, Number(shift), mode === 'Decode'));
        },
      }),
  });

  /* ================= 3. ARISTOCRAT ================= */
  const aristoPlain = 'THE KEY TO CODEBUSTERS IS LOOKING FOR PATTERNS';
  const aristoKey = 'OLYMPIAD';
  const randomKey = 'QWERTYUIOPASDFGHJKLZXCVBNM';
  add({
    section: '3 · Aristocrat',
    title: 'Aristocrat: how it works',
    html:
      badges('K1 or random alphabet', 'Same', '3.e.i (1)') +
      `<p>A <strong>monoalphabetic substitution</strong>: every plaintext letter is replaced by one fixed ciphertext letter. Word spaces stay in. Division B uses a <strong>random alphabet</strong> or a <strong>K1</strong> keyed alphabet (next slide).</p>` +
      `<p><strong>Ciphertext</strong></p>` +
      mono(C.aristocrat(aristoPlain, randomKey)) +
      (() => {
        const ct = C.aristocrat(aristoPlain, randomKey);
        const f = C.frequency(ct);
        return table(
          [
            ['Cipher', ...[...C.ALPHA]],
            ['Frequency', ...[...C.ALPHA].map((l) => f[l] || '·')],
            ['Replacement', ...[...C.ALPHA].map((l) => (f[l] ? `<strong>${C.ALPHA[randomKey.indexOf(l)]}</strong>` : ''))],
          ],
          { cls: 'alpha', rowHead: true }
        );
      })() +
      `<p><strong>Answer</strong></p>` +
      mono(aristoPlain) +
      `<p class="note">No letter is ever enciphered as itself.</p>`,
  });
  const k1 = C.aristocratTables(aristoKey);
  const k1Ct = C.aristocrat(aristoPlain, aristoKey);
  const freqTable = (ct, kw) => {
    const f = C.frequency(ct);
    const t = C.aristocratTables(kw);
    const inKey = new Set(kw);
    return table(
      [
        ['Cipher', ...[...C.ALPHA]],
        ['Frequency', ...[...C.ALPHA].map((l) => f[l] || '·')],
        ['Replacement', ...[...t.plain].map((l) => (inKey.has(l) ? `<strong>${l}</strong>` : l))],
      ],
      { cls: 'alpha', rowHead: true }
    );
  };
  add({
    section: '3 · Aristocrat',
    title: 'Aristocrat: K1 keyword alphabets',
    html:
      `<p>The Division B rules say Aristocrats use <strong>K1 or random</strong> alphabets, and Patristocrats and Xenocrypts use K1. In a <strong>K1</strong> cipher the keyword goes in the <em>plain</em> alphabet and the cipher alphabet stays plain A–Z.</p>` +
      alphaTable(k1.plain, k1.cipher) +
      cols(
        card(
          'How it is built',
          steps([
            `Pick a keyword (here ${key(aristoKey)}) and drop repeated letters.`,
            'Write the keyword, then every <strong>remaining letter in alphabetical order</strong>, skipping the letters already used in the keyword.',
            'Put it above the ordinary alphabet. Each plaintext letter is replaced by the cipher letter beneath it.',
          ])
        ),
        card(
          'How you solve it on the exam',
          steps([
            'You get the ciphertext and a <strong>frequency table</strong>: how often each cipher letter appears.',
            '<strong>Start exactly like a random Aristocrat</strong>: frequency, one-letter words, THE, AND, double letters and the crib. Write the pairs you find into the Replacement row.',
            'Look for <strong>neighbours</strong>: cipher letters side by side in the table that decode to letters side by side in the alphabet (skipping letters the keyword uses). That is the continuous alphabet. Extend it left and right.',
            'Find the <strong>boundary</strong>: where the continuous run starts. Every cipher letter before it belongs to the keyword, so the keyword length is that count.',
            'The plain letters that are <strong>missing from the run</strong> are the keyword letters. Use the pairs you already know to put them in order and read the keyword.',
            'Fill in the rest of the Replacement row and read the message.',
          ])
        )
      ) +
      card(
        'Why it is easier than a random alphabet',
        tips([
          'You solve it with the same tools as a random alphabet, and the continuous run of the alphabet then <strong>gives you the keyword</strong> instead of you guessing it.',
          'Everything after the keyword is fixed, so each new pair also fills in its neighbours.',
          'The frequency table is a check: with the right alphabet, the busiest cipher letters sit over E, T, A, O, I, N.',
          'A partly right keyword already gives readable fragments, which tell you which letters to change.',
        ])
      ) +
      card(
        'Worked example: keyword ' + aristoKey,
        `<p><strong>Ciphertext</strong></p>` +
          mono(k1Ct) +
          freqTable(k1Ct, aristoKey) +
          `<p><strong>Answer</strong></p>` +
          mono(aristoPlain) +
          `<p>The keyword ${key(aristoKey)} (bold) starts the Replacement row under A. The rest of the row is every other letter in alphabetical order, so <strong>every cipher letter has a replacement</strong>, even the ones with no frequency (unlike a random alphabet, where those stay unknown).</p>`
      ),
  });
  const randKey = 'ZQMWXBKRVETJHAFYDLPCOSNGUI';
  const randPlain = 'THE SECRET TO SOLVING CODES IS TO LOOK FOR WORD PATTERNS FIRST';
  const randCt = C.aristocrat(randPlain, randKey);
  const randHint = 'PATTERNS';
  const k1Key2 = 'JOURNEY';
  const k1Plain2 = 'PRACTICE MAKES PERFECT SO KEEP SOLVING A FEW CIPHERS EVERY DAY';
  const k1Ct2 = C.aristocrat(k1Plain2, k1Key2);
  const k1Hint = 'PRACTICE';
  const k1Alpha2 = C.aristocratTables(k1Key2).plain;
  const pairsOf = (word, kw) => {
    const out = {};
    const ct = C.aristocrat(word, kw);
    [...word].forEach((p, i) => (out[ct[i]] = p));
    return out;
  };
  const stageTable = (ct, known, bold) => {
    const f = C.frequency(ct);
    return table(
      [
        ['Cipher', ...[...C.ALPHA]],
        ['Frequency', ...[...C.ALPHA].map((l) => f[l] || '·')],
        ['Replacement', ...[...C.ALPHA].map((l) => (known[l] ? (bold && bold.has(l) ? `<strong>${known[l]}</strong>` : known[l]) : ''))],
      ],
      { cls: 'alpha', rowHead: true }
    );
  };
  const k1Pairs = pairsOf(k1Hint, k1Key2);
  const k1Run = {};
  const k1Len = new Set(k1Key2).size;
  [...C.ALPHA].forEach((c, i) => {
    if (i >= k1Len) k1Run[c] = k1Alpha2[i];
  });
  const k1Full = {};
  [...C.ALPHA].forEach((c, i) => (k1Full[c] = k1Alpha2[i]));
  add({
    section: '3 · Aristocrat',
    title: 'Aristocrat: the exam sheet',
    html:
      `<h3>Example 1: regular Aristocrat (random alphabet)</h3>` +
      examQ(`… encoded in an Aristocrat using a random alphabet. You are told that the cipher contains ${randHint}. What does it say?`) +
      `<p>Solve it right here. Type a guess in the box under any cipher letter and it fills in everywhere that letter appears. You can also edit the <strong>Replacement</strong> row of the frequency table.</p>` +
      sheet({ mode: 'sub', title: 'Aristocrat · random alphabet', ct: randCt, answer: randPlain, ref: EN_REF }) +
      card(
        'Using the hint',
        tips([
          `The hint says the word ${key(randHint)} appears. Its letter pattern (${[...randHint].map((c, i, a) => String.fromCharCode(65 + [...new Set(a)].indexOf(c))).join('')}) matches only a few cipher words; ${key(C.aristocrat(randHint, randKey))} is the one here.`,
          'Every hint letter gives a cipher → plain pair for your Replacement row. Fill those in everywhere, then work out the short words around them.',
        ])
      ) +
      `<h3>Example 2: Aristocrat with a K1 alphabet</h3>` +
      examQ(`… encoded in an Aristocrat using a K1 alphabet. You are told that the cipher contains ${k1Hint}. What does it say?`) +
      sheet({ mode: 'sub', title: 'Aristocrat · K1 alphabet', ct: k1Ct2, answer: k1Plain2, ref: EN_REF }) +
      card(
        'Solving it: patterns first, keyword last',
        `<p><strong>1. Pairs from the hint.</strong> ${key(k1Hint)} is ${key(C.aristocrat(k1Hint, k1Key2))} (the repeated letter pattern gives it away). Frequency and short words add more.</p>` +
          stageTable(k1Ct2, k1Pairs) +
          `<p><strong>2. Find the continuous alphabet.</strong> H = A and J = C, so I = B. Counting on, K = D, and then L = F: E was skipped, so E must be in the keyword. The run keeps going (M = G, N = H, O = I) and your other pairs fit it: O = I, S = P, V = T. Each time a plain letter is skipped, that letter belongs to the keyword. Extend the run to the end of the row.</p>` +
          stageTable(k1Ct2, k1Run) +
          `<p><strong>3. Find the boundary and the keyword.</strong> The run starts at H, so the first seven cipher letters (A–G) hold the keyword. The plain letters never used in the run are E, J, N, O, R, U, Y, and those are the keyword letters. You already know D = R (fourth) and F = E (sixth), so the pattern is ???R?E? and the word is ${key(k1Key2)}. (Z = Z is the one letter that maps to itself, but Z never appears in the message.)</p>` +
          stageTable(k1Ct2, k1Full, new Set([...C.ALPHA].slice(0, k1Len))) +
          `<p>Read the ciphertext through the full row and copy down the plaintext. Two or fewer errors still earn full credit.</p>`
      ) +
      `<p class="note">Question wording follows past Toebes practice tests. Patristocrats say “the cipher ends with …” and Xenocrypts “starts with …”.</p>`,
  });
  add({
    section: '3 · Aristocrat',
    title: 'Aristocrat: breaking it',
    html:
      steps([
        'Use the frequency table: the busiest cipher letters are probably E, T, A, O, I, N (the English statistics on page 7 are your cheat sheet).',
        'Find one- and two-letter words: single letters are A or I.',
        'Look for THE, AND, THAT, IT IS, and for apostrophes (’S, N’T).',
        'Double letters are usually LL, EE, SS, OO, TT.',
        'Fill in letters you have found everywhere, then guess the remaining words.',
        'With a crib: match its letter pattern against the ciphertext first.',
        'K1 only: once you have a few pairs, look for the continuous alphabet and the keyword boundary (see “Aristocrat: the exam sheet”).',
      ]) +
      tool({
        title: 'Try it: encode / decode (key = a keyword, or a full 26-letter alphabet)',
        fields: [
          textField('text', 'Text', C.aristocrat(aristoPlain, aristoKey), { wide: true }),
          textField('key', 'Keyword or 26-letter alphabet', aristoKey),
          { name: 'mode', label: 'Mode', type: 'select', options: ['Decode', 'Encode'], value: 'Decode' },
        ],
        run: ({ text, key: k, mode }) => mono(C.aristocrat(text, k, mode === 'Decode')),
      }),
  });

  /* ================= 4. BACONIAN ================= */
  const baconMsg = 'CODE';
  const baconCarrier = 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG AND KEEPS RUNNING';
  function carrierRender(msg, carrier) {
    const syms = C.baconEncode(msg);
    let n = 0;
    return [...carrier].map((ch) => {
      if (!/[A-Za-z]/.test(ch) || n >= syms.length) return esc(ch);
      return syms[n++] === 'B' ? `<b>${esc(ch)}</b>` : esc(ch);
    }).join('');
  }
  add({
    section: '4 · Baconian',
    title: 'Baconian: how it works',
    html:
      badges('Decrypt; word form has a 4+ letter crib', 'Same', '3.e.ii') +
      `<p>Each plaintext letter becomes a group of <strong>five symbols</strong> drawn from two (A and B). In the 24-letter version I = J and U = V share a code.</p>` +
      table(
        [...Array(6)].map((_, r) => [...Array(4)].map((__, c) => {
          const l = C.BACON24[r * 4 + c];
          return `<strong>${l === 'I' ? 'I/J' : l === 'U' ? 'U/V' : l}</strong> ${C.baconEncode(l)}`;
        })),
        { cls: 'bacon' }
      ) +
      cols(
        card('Example', mono(`${baconMsg}\n${[...baconMsg].map((l) => C.baconEncode(l)).join(' ')}`)),
        card('Three ways to hide A/B', tips(['<strong>Letter</strong>: the ciphertext is literally A and B letters', '<strong>Glyphs or symbols</strong>: any two shapes stand for A and B', '<strong>Rendering variations</strong>: bold, underline or italic versus plain mark A and B', '<strong>Word form</strong>: a message in words, with a crib of at least 4 plaintext letters']))
      ),
  });
  const baconExamA = 'CIPHER';
  const baconCribB = 'LOGIC';
  const baconExamB = 'LOGICANDCODES';
  const baconCribC = 'SOLVE';
  const baconExamC = 'SOLVETHECODE';
  // Each A becomes a letter or symbol from the first set, each B one from the second (picked in a fixed rotation).
  const baconTokens = (msg, setA, setB) => {
    let n = 0;
    return C.baconEncode(msg)
      .match(/.{5}/g)
      .map((g) =>
        [...g]
          .map((s) => {
            const set = s === 'A' ? setA : setB;
            return set[(n++ * 7 + 3) % set.length];
          })
          .join('')
      );
  };
  const baconLettersA = [...'RMDK'];
  const baconLettersB = [...'LEWT'];
  const baconSymA = ['\u2605', '\u25cf', '\u25c6'];
  const baconSymB = ['\u25b2', '\u25a0', '\u271a'];
  const baconTokB = baconTokens(baconExamB, baconLettersA, baconLettersB);
  const baconTokC = baconTokens(baconExamC, baconSymA, baconSymB);
  add({
    section: '4 · Baconian',
    title: 'Baconian: the exam sheet',
    html:
      examQ('The following quote has been encoded with the Baconian cipher using the letters A and B. What does it say?') +
      `<p>Split the A/B string into groups of five, look each group up in the table, and type the plaintext letter under it.</p>` +
      sheet({ mode: 'free', title: 'Baconian · A/B letters', answer: baconExamA, tokens: C.baconEncode(baconExamA).match(/.{5}/g) }) +
      `<p class="note">On the exam the two symbols are not always A and B. The next slide has the cases where a set of letters, or a set of symbols, stands for each one.</p>`,
  });
  add({
    section: '4 · Baconian',
    title: 'Baconian: sets of letters or symbols',
    html:
      `<p>On the exam the two symbols can each be shown by several different letters or symbols. You are not told which belong together: the crib tells you.</p>` +
      examQ(`The following has been encoded with the Baconian cipher, using several different letters for each of the two symbols. The plaintext starts with ${baconCribB}. What does it say?`) +
      sheet({ mode: 'free', title: 'Baconian · sets of letters', answer: baconExamB, tokens: baconTokB }) +
      examQ(`The following has been encoded with the Baconian cipher, using several different symbols for each of the two. The plaintext starts with ${baconCribC}. What does it say?`) +
      sheet({ mode: 'free', title: 'Baconian · sets of symbols', answer: baconExamC, tokens: baconTokC }) +
      steps([
        `The crib is ${baconCribB.length} letters, so the first ${baconCribB.length} groups of five are known. Look up each crib letter in the table to get its five A/B symbols.`,
        'Write those A/B symbols under the first 25 characters. Every character that sits over an A is in the A set; every one over a B is in the B set.',
        'Now rewrite the rest of the text as A or B using those two sets.',
        'Split into groups of five and look each up. If a group starts with BB, a character was put in the wrong set (no letter starts with BB).',
      ]),
  });
  add({
    section: '4 · Baconian',
    title: 'Baconian: breaking it',
    html:
      cols(
        tips([
          'Split into groups of <strong>five</strong>. Nulls (extra padding symbols) may shift the grouping.',
          'No code starts with BB in the 24-letter table, so you can test where groups begin.',
          'Five identical symbols (AAAAA) is the letter A, so runs help you tell which symbol is “A”.',
          'In typical English text the A symbols outnumber the B symbols.',
          'A crib gives you known five-symbol groups to anchor the grouping.',
        ]),
        card('Carrier-text example', `<p class="carrier">${carrierRender(baconMsg, baconCarrier)}</p><p class="muted">Bold letters are B, normal letters are A. Reads: ${C.baconEncode(baconMsg).match(/.{5}/g).join(' ')} = ${baconMsg}.</p>`)
      ) +
      tool({
        title: 'Try it: Baconian',
        fields: [
          textField('text', 'Text', C.baconEncode('SCIENCE'), { wide: true }),
          { name: 'mode', label: 'Mode', type: 'select', options: ['Decode A/B', 'Encode letters'], value: 'Decode A/B' },
        ],
        run: ({ text, mode }) => {
          if (mode === 'Encode letters') return mono(C.baconEncode(text).match(/.{1,5}/g)?.join(' ') || '');
          const clean = text.toUpperCase().replace(/[^AB]/g, '');
          return mono((clean.match(/.{1,5}/g) || []).join(' ') + '\n→ ' + C.baconDecode(clean));
        },
      }),
  });

  /* ================= 5. PATRISTOCRAT ================= */
  const patriPlain = 'THE HARDEST PART OF A PATRISTOCRAT IS THAT THERE ARE NO WORD BREAKS';
  const patriCt = C.patristocrat(patriPlain, aristoKey);
  add({
    section: '5 · Patristocrat',
    title: 'Patristocrat: how it works',
    html:
      badges('K1 alphabet only', 'Same', '3.e.i (2)') +
      `<p>The same cipher as the Aristocrat, but all <strong>word spaces are removed</strong> and the text is regrouped in blocks of five. You lose every word-length clue.</p>` +
      cols(
        card(`Example (K1, keyword ${aristoKey})`, mono(`Plain : ${patriPlain}\nCipher: ${patriCt}`)),
        card('What changes', tips(['Same substitution rules', 'Same frequency counts', 'No 1-, 2-, 3-letter words to latch onto', 'You rely on the hint, the frequencies and letter patterns']))
      ),
  });
  add({
    section: '5 · Patristocrat',
    title: 'Patristocrat: the exam sheet',
    html:
      examQ('The following quote has been encoded with a Patristocrat using a K1 alphabet. You are told that the cipher ends with BREAKS. What does it say?') +
      `<p>The spaces are gone and the text is in groups of five, so you have no word shapes. You rely on three things: the <strong>hint</strong>, the <strong>frequency table</strong> and <strong>letter patterns</strong> (repeated groups such as THE, AND, ING).</p>` +
      sheet({ mode: 'sub', title: 'Patristocrat · K1 alphabet', ct: patriCt, answer: patriPlain, ref: EN_REF }) +
      cols(
        card('Using the hint', tips(['BREAKS sits at the very end, so its letters are the last cipher letters', 'Those six pairs go straight into the Replacement row', 'Try the keyword that fits those pairs, then read the rest'])),
        card('Reading without spaces', tips(['Look for THE, AND, ING and TION', 'Once part of the text is plain, the word breaks appear on their own']))
      ),
  });
  add({
    section: '5 · Patristocrat',
    title: 'Patristocrat: breaking it',
    html:
      steps([
        'Start from the <strong>hint</strong> and the <strong>frequency table</strong>: the busiest cipher letters are probably E, T, A, O, I, N (page 7 is your cheat sheet).',
        'Take the crib and write its <strong>letter pattern</strong>. THAT is <code>ABCA</code>; EVER is <code>ABCB</code>.',
        'Slide it along the ciphertext and keep only the positions where the pattern fits (and nothing maps to itself).',
        'Use each hit to fill in letters, then extend the words around it.',
        'Look for common trigrams (THE, AND, ING) as repeated three-letter groups.',
      ]) +
      tool({
        title: 'Try it: crib finder',
        fields: [textField('ct', 'Ciphertext', patriCt, { wide: true }), textField('crib', 'Crib (plaintext)', 'THAT')],
        run: ({ ct, crib }) => {
          const letters = ct.toUpperCase().replace(/[^A-Z]/g, '');
          const hits = C.cribPositions(letters, crib);
          if (!crib.trim()) return '<p class="muted">Enter a crib.</p>';
          if (!hits.length) return '<p class="muted">No position matches that crib.</p>';
          const cr = crib.toUpperCase().replace(/[^A-Z]/g, '');
          return hits.map((h) => `<p><strong>Position ${h + 1}</strong>: ${esc(letters.slice(h, h + cr.length))} = ${esc(cr)}</p>`).join('');
        },
      }),
  });

  /* ================= 6. XENOCRYPT ================= */
  const spanishPlain = 'LA CLAVE DE UN BUEN CODIGO ES SU SECRETO';
  const xenoKey = 'OLYMPIAD';
  add({
    section: '6 · Xenocrypt',
    title: 'Xenocrypt: how it works',
    html:
      badges('1 per exam (max)', '1 or 2 per exam', '3.e.iii / 3.f.ii') +
      `<p>A Xenocrypt is an <strong>Aristocrat written in another language</strong> (<strong>Spanish</strong> in Division B). It is encoded with a <strong>K1 alphabet whose keyword is an English word</strong>, so everything on the K1 slide applies. The English statistics no longer apply to the plaintext.</p>` +
      cols(
        card(`Example (K1, English keyword ${xenoKey})`, mono(`Plain : ${spanishPlain}\nCipher: ${C.aristocrat(spanishPlain, xenoKey)}`)),
        card('Spanish statistics (approx.)', tips(['Commonest letters: <strong>E A O S R N I D L C T U</strong>', 'Rare letters: K, W, X; Q is nearly always followed by U', 'Common short words: DE LA EL EN Y A QUE LOS UN SE NO', 'Typical endings: -OS -AS -ES -ADO -CION -MENTE']))
      ),
  });
  const ES_REF = 'Spanish, most to least common: E A O S R N I D L C T U (not the English order).';
  add({
    section: '6 · Xenocrypt',
    title: 'Xenocrypt: the exam sheet',
    html:
      examQ('The following quote in Spanish has been encoded with a Xenocrypt using a K1 alphabet. You are told that the cipher starts with LA. What does it say?') +
      `<p>The plaintext is Spanish, but the keyword behind the K1 alphabet is an English word. Use Spanish letter frequencies.</p>` +
      sheet({ mode: 'sub', title: 'Xenocrypt · Spanish K1', ct: C.aristocrat(spanishPlain, xenoKey), answer: spanishPlain, ref: ES_REF }) +
      cols(
        card('Spanish shortcuts', tips(['Short words: DE, LA, EL, EN, UN, ES, SU, SE, LO, QUE, LOS, LAS', 'Most words end in a vowel; many end in -O, -A or -S', 'The commonest cipher letter is probably E or A']))
      ),
  });
  add({
    section: '6 · Xenocrypt',
    title: 'Xenocrypt: breaking it',
    html:
      tips([
        'Count letters: E and A (then O) usually dominate.',
        'Look for one-letter words: A, Y, O. A two-letter word ending in E is often DE, LE, ME, SE or TE.',
        'Spot articles (LA, EL, LOS, LAS, UN) before nouns.',
        'Because the key is K1, look for runs of letters in alphabetical order, as in the Aristocrat.',
        'Practise in the language: knowing the vocabulary is the real advantage.',
        'It is usually a slower puzzle, so attempt it after the easier ones.',
      ]) +
      tool({
        title: 'Try it: decode with a key (or look at the frequency)',
        fields: [
          textField('text', 'Text', C.aristocrat(spanishPlain, xenoKey), { wide: true }),
          textField('key', 'Keyword or 26-letter alphabet', xenoKey),
          { name: 'mode', label: 'Mode', type: 'select', options: ['Decode', 'Encode'], value: 'Decode' },
        ],
        run: ({ text, key: k, mode }) => {
          const out = C.aristocrat(text, k, mode === 'Decode');
          const f = C.frequency(text);
          const top = Object.entries(f).sort((a, b) => b[1] - a[1]).filter((e) => e[1]).slice(0, 8).map(([l, n]) => `${l}:${n}`).join('  ');
          return mono(out) + `<p class="muted">Most common input letters: ${top}</p>`;
        },
      }),
  });

  /* ================= 7. PORTA ================= */
  const portaPlain = 'SCIENCE OLYMPIAD CODE BREAKERS';
  const portaKey = 'PORTA';
  const portaTableau = [...Array(13)].map((_, r) => [`${C.ALPHA[2 * r]}${C.ALPHA[2 * r + 1]}`, ...[...C.ALPHA.slice(0, 13)].map((p) => C.porta(p, C.ALPHA[2 * r]))]);
  add({
    section: '7 · Porta',
    title: 'Porta: how it works',
    html:
      badges('Decrypt given the key', 'Cryptanalysis, crib of 3+ characters', '3.e.vi / 3.f.iii') +
      `<p>A <strong>polyalphabetic</strong> cipher: a repeating keyword picks one of 13 reciprocal alphabets for each letter. Key letters work in pairs (A/B, C/D … Y/Z). Plain letters A–M become N–Z and vice versa.</p>` +
      table([['Key', ...[...C.ALPHA.slice(0, 13)]], ...portaTableau], { head: true, rowHead: true, cls: 'alpha porta' }) +
      `<p class="note">The left column labels the key pair (the row). The top row holds plain letters A–M only. Plain A–M: find it in the top row, and the cell below it, on the key's row, is the cipher letter. Plain N–Z: find it in the body of the key's row, and the letter above it in the top row is the answer.</p>`,
  });
  const portaLetters = portaPlain.replace(/[^A-Z]/g, '');
  const portaSteps = [...portaLetters].slice(0, 8).map((p, i) => {
    const k = portaKey[i % portaKey.length];
    const row = `${C.ALPHA[Math.floor(C.ALPHA.indexOf(k) / 2) * 2]}${C.ALPHA[Math.floor(C.ALPHA.indexOf(k) / 2) * 2 + 1]}`;
    return [p, k, row, C.porta(p, k)];
  });
  add({
    section: '7 · Porta',
    title: 'Porta: step by step',
    html:
      `<p><strong>Yes, the same key is used again and again.</strong> Write the keyword ${key(portaKey)} under the text and repeat it as many times as needed, <strong>one key letter per message letter</strong>. Spaces get no key letter. Every letter is then changed using the tableau row of the key letter above or below it.</p>` +
      table(
        [['Text', ...portaSteps.map((s) => s[0])], ['Key letter', ...portaSteps.map((s) => s[1])], ['Tableau row', ...portaSteps.map((s) => s[2])], ['Result', ...portaSteps.map((s) => `<strong>${s[3]}</strong>`)]],
        { rowHead: true, cls: 'alpha' }
      ) +
      cols(
        card(
          'One letter, in three moves',
          steps([
            `Take the key letter for this position (the ${key(portaKey)} cycle: P, O, R, T, A, P, O, R …).`,
            `Find its row in the tableau on the previous slide. Rows come in pairs, so P and O share the row labelled <code>OP</code>, R is in <code>QR</code>, T in <code>ST</code>, A in <code>AB</code>.`,
            `Find your letter in that row. If it is in the top row (A–M), the answer is the letter directly under it. If it is in the body (N–Z), the answer is the letter in the top row above it.`,
            `Example 1: plain <code>C</code>, key <code>O</code>. Use row <code>OP</code>. C is in the top row, and under it is <strong>${C.porta('C', 'O')}</strong>.`,
            `Example 2: plain <code>O</code>, key <code>R</code>. Use row <code>QR</code>. O is not in the top row, so find it in the body of that row; the top-row letter above it is <strong>${C.porta('O', 'R')}</strong>.`,
          ])
        ),
        card(
          'Decoding is the same',
          tips([
            'Porta is reciprocal: running the same steps on the ciphertext gives back the plaintext.',
            'So to decode, repeat the key over the ciphertext and look every letter up the same way.',
            `The result for the first letter above: S with key P gives ${key(C.porta('S', 'P'))}, and L with key P gives ${key(C.porta('L', 'P'))} back.`,
          ])
        )
      ),
  });
  add({
    section: '7 · Porta',
    title: 'Porta: the exam sheet',
    html:
      examQ(`The following quote has been encoded with the Porta cipher using the keyword ${portaKey}. What does it say?`) +
      `<p>Porta has no frequency table: each box depends on the key letter above it. Line the keyword up under the ciphertext, find that key's row in the tableau, then look up the cipher letter. The same step encodes and decodes.</p>` +
      sheet({ mode: 'free', title: 'Porta', ct: C.porta(portaPlain, portaKey), answer: portaPlain }) +
      cols(
        card('Per letter', tips([`The keyword ${key(portaKey)} repeats under the letters, skipping spaces`, 'Each key letter pair (AB, CD, …) picks a row of the tableau', 'Cipher in the first half of the alphabet gives plain from the second half, and the reverse'])),
        card('Check yourself', tips(['Porta never leaves a letter unchanged', 'If a word looks wrong, check you did not advance the key across a space']))
      ),
  });
  add({
    section: '7 · Porta',
    title: 'Porta: example and breaking it',
    html:
      cols(
        card('Example (key PORTA)', mono(`Plain : ${portaPlain}\nCipher: ${C.porta(portaPlain, portaKey)}`)),
        card('Key facts', tips(['Reciprocal: encoding and decoding are the same operation', 'The key advances across words (spaces are skipped)', 'Only 13 distinct key rows exist, so each pair (A/B …) is equivalent']))
      ) +
      tips([
        'With the key, decode by applying the same table again.',
        'Cryptanalysis: align the crib with the ciphertext, then read off the key pair for each crib letter. Repeating pairs reveal the key length and keyword.',
      ]) +
      tool({
        title: 'Try it: Porta',
        fields: [
          textField('text', 'Text', C.porta(portaPlain, portaKey), { wide: true }),
          textField('key', 'Key', portaKey),
        ],
        run: ({ text, key: k }) => mono(C.porta(text, k)),
      }) +
      tool({
        title: 'Try it: recover key pairs from a crib',
        fields: [textField('plain', 'Crib (aligned from the start)', 'SCIEN'), textField('ct', 'Matching ciphertext', 'LWQNA')],
        run: ({ plain, ct }) => mono(C.portaKeyFromCrib(plain, ct).join('  ')),
      }),
  });

  /* ================= 8. COMPLETE COLUMNAR ================= */
  const colPlain = 'WRITE THE MESSAGE IN ROWS AND READ DOWN THE COLUMNS';
  const colKey = 'PLANET';
  const colCt = C.columnarEncode(colPlain, colKey);
  const colLetters = colPlain.replace(/[^A-Z]/g, '');
  const colRank = (() => {
    const o = C.columnOrder(colKey);
    const rank = Array(o.length);
    o.forEach((c, i) => (rank[c] = i + 1));
    return rank;
  })();
  add({
    section: '8 · Complete Columnar',
    title: 'Complete Columnar: how it works',
    html:
      badges('Cryptanalysis, 9 columns or fewer', 'Same', '3.e.vii') +
      `<p>A <strong>transposition</strong> cipher: the letters are not changed, only rearranged. Write the plaintext in rows under a keyword, then read the columns in the alphabetical order of the keyword letters.</p>` +
      table(
        [
          [...colKey].map((l) => `<strong>${l}</strong>`),
          colRank.map((n) => `<em>${n}</em>`),
          ...(colLetters.match(new RegExp('.{1,' + colKey.length + '}', 'g')) || []).map((r) => [...r]),
        ],
        { cls: 'grid' }
      ) +
      cols(
        card(
          'Reading and breaking it up',
          `<p>Encode: read column 1, then 2, then 3 … from top to bottom.</p>` + mono(colCt) +
            `<p><strong>To break it up, write the letters down the page from top to bottom</strong>, one block at a time, so each block becomes a column. Then read the rows across.</p>`
        ),
        card('“Complete”', tips(['Every row is full: the length is a multiple of the key length', 'If the text is short, X pads it', 'Division B limit: 9 columns or fewer; the crib is no shorter than columns − 1 and its position is not marked']))
      ),
  });
  const colN = colKey.length;
  const colRows = colLetters.length / colN;
  const colFlat = colCt.replace(/ /g, '');
  // Block i of the ciphertext is the column whose key letter has rank i + 1.
  const colBlocks = [...Array(colN)].map((_, i) => colFlat.slice(i * colRows, (i + 1) * colRows));
  const colOrder = C.columnOrder(colKey);
  const cribWord = 'WRITE';
  const cribRow = 0;
  // The crib starts in the first grid column, so crib letter i sits in column i.
  const cribBlocks = [...cribWord].map((_, i) => colRank[i] - 1);
  const cribArrange = [...cribBlocks, ...colBlocks.map((_, i) => i).filter((i) => !cribBlocks.includes(i))];
  add({
    section: '8 · Complete Columnar',
    title: 'Complete Columnar: how the key is used',
    html:
      `<p>The key does one job: it says <strong>in what order the columns are read off</strong>. The letters themselves are never changed.</p>` +
      cols(
        card(
          'Encoding',
          steps([
            `Write the plaintext in rows ${colN} letters wide (the key ${key(colKey)} has ${colN} letters, so ${colN} columns).`,
            `Put one key letter over each column, then number the key letters in alphabetical order (${[...colKey].map((l, i) => `${l}=${[...colKey].map((_, c) => colOrder.indexOf(c) + 1)[i]}`).join(', ')}). A repeated letter is numbered left to right.`,
            'Read the column numbered 1 from top to bottom, then column 2, and so on.',
            'That is the ciphertext: it is whole columns laid end to end.',
          ])
        ),
        card(
          'What a block is',
          `<p>With ${colRows} rows, every column has ${colRows} letters, so the ciphertext is <strong>${colN} blocks of ${colRows} letters</strong>. Block 1 is the whole column that had rank 1, block 2 the one with rank 2, and so on.</p>` +
            `<p class="note">The ciphertext is usually printed in groups of 5. Those groups are only for reading and do <strong>not</strong> mark where a column starts or ends.</p>`
        )
      ) +
      `<p>To decode with the key, cut the ciphertext into those blocks, put block 1 under the key letter ranked 1, block 2 under the one ranked 2, and read the grid across, row by row. <strong>Write each block from top to bottom</strong> so it forms a column.</p>`,
  });
  add({
    section: '8 · Complete Columnar',
    title: 'Complete Columnar: without the key',
    html:
      `<p>If you are not given the key, you still know the blocks (cut the ciphertext into ${colN} equal pieces). What you do not know is the <strong>order they sit in</strong>. The crib tells you.</p>` +
      examQ(`The plaintext has ${cribWord} somewhere in it.`) +
      steps([
        `Cut the ciphertext into the blocks: ${colBlocks.map((b, i) => `<code>${b}</code>`).join(' ')}. <strong>Write each block down the page from top to bottom</strong> as its own column, so the grid can be read across.`,
        `${cribWord} is ${cribWord.length} letters, so it spans ${cribWord.length} neighbouring columns on one row. In a row, those letters must be the same distance down in their blocks.`,
        `Try each row number. At row ${cribRow + 1}: block ${cribBlocks[0] + 1} has ${cribWord[0]}, block ${cribBlocks[1] + 1} has ${cribWord[1]}, block ${cribBlocks[2] + 1} has ${cribWord[2]}, block ${cribBlocks[3] + 1} has ${cribWord[3]}, block ${cribBlocks[4] + 1} has ${cribWord[4]}. So those blocks sit side by side in that order.`,
        `One block is left over (block ${cribArrange[colN - 1] + 1}). Try it before or after the others and see which makes the other rows read as English.`,
        `Read across: the arrangement is blocks ${cribArrange.map((i) => i + 1).join(', ')}.`,
      ]) +
      table(
        [...Array(colRows)].map((_, r) => cribArrange.map((i) => colBlocks[i][r])),
        { cls: 'grid' }
      ) +
      `<p class="note">The order of the blocks is the key's rank order: the first column has rank ${cribArrange[0] + 1}, the next ${cribArrange[1] + 1}, and so on. Here that reads ${cribArrange.map((i) => i + 1).join('')}, which is ${key(colKey)}: ${[...colKey].map((l, i) => `${l}=${colRank[i]}`).join(', ')}.</p>`,
  });
  add({
    section: '8 · Complete Columnar',
    title: 'Complete Columnar: the exam sheet',
    html:
      examQ(`The following quote has been encoded with a Complete Columnar cipher. You are told that the plaintext has ${cribWord} somewhere in it. What does it say?`) +
      mono(colCt) +
      `<p>There is no substitution table: you rebuild the grid. Work out the row and column counts, cut the ciphertext into columns, and use the crib to decide which columns sit next to each other. Write the plaintext on the answer line.</p>` +
      sheet({ mode: 'free', title: 'Complete Columnar', answer: colPlain, wordGaps: true }) +
      cols(
        card('Attack order', steps(['List column counts that divide the length (9 or fewer)', 'Cut the ciphertext into columns of the right heights', 'Slide columns side by side until the crib appears across a row', 'Read the rows left to right'])),
        card('Why the crib matters', tips(['A crib of at least columns − 1 letters spans almost every column', 'Each crib letter pins one column to one position']))
      ),
  });
  add({
    section: '8 · Complete Columnar',
    title: 'Complete Columnar: breaking it',
    html:
      steps([
        'Factor the ciphertext length: each factor up to the column limit is a candidate number of columns.',
        'For each candidate, cut the ciphertext into that many <strong>equal blocks</strong>. Each block is one column.',
        'Spot padding: a trailing X (or a block ending that looks odd) indicates the last row.',
        'Use the crib (say EVER) to find which columns sit side by side, then reorder the columns so the rows read as English.',
      ]) +
      tool({
        title: 'Try it: candidate column counts, or decode with a key',
        fields: [
          textField('ct', 'Ciphertext', colCt, { wide: true }),
          textField('key', 'Key (optional)', ''),
          { name: 'max', label: 'Max columns', type: 'number', value: 9 },
        ],
        run: ({ ct, key: k, max }) => {
          const clean = ct.toUpperCase().replace(/[^A-Z]/g, '');
          if (k.trim()) return mono(C.columnarDecode(clean, k));
          const counts = C.columnCounts(clean.length, Number(max) || 9);
          if (!counts.length) return `<p class="muted">${clean.length} letters: no column count divides evenly.</p>`;
          return (
            `<p>${clean.length} letters → try ${counts.join(', ')} columns.</p>` +
            counts.map((n) => {
              const rows = clean.length / n;
              const blocks = [...Array(n)].map((_, i) => clean.slice(i * rows, (i + 1) * rows));
              return `<p><strong>${n} columns</strong> (${rows} rows):</p>` + table([blocks.map((_, i) => `col ${i + 1}`), ...[...Array(rows)].map((_, r) => blocks.map((b) => b[r]))], { cls: 'grid small' });
            }).join('')
          );
        },
      }),
  });

  /* ================= 9. CRYPTARITHM ================= */
  const crypt = 'SOCIAL+SOLAR=VEHICLE';
  const cryptSol = C.solveCryptarithm(crypt, 10).solutions[0];
  const cryptNum = (w) => [...w].map((l) => cryptSol[l]).join('');
  add({
    section: '9 · Cryptarithm',
    title: 'Cryptarithm: how it works',
    html:
      badges('Base 10, zero errors allowed', 'Same', '3.e.v') +
      `<p>An arithmetic puzzle where each <strong>letter stands for a different digit</strong> (base 10). Leading letters are never zero.</p>` +
      cols(
        card('Puzzle', mono(`  SOCIAL\n+  SOLAR\n-------\n VEHICLE`)),
        card('Solution', mono(`  ${cryptNum('SOCIAL')}\n+  ${cryptNum('SOLAR')}\n-------\n ${cryptNum('VEHICLE')}`))
      ) +
      table([['Letter', ...Object.keys(cryptSol).sort()], ['Digit', ...Object.keys(cryptSol).sort().map((l) => cryptSol[l])]], { rowHead: true, cls: 'alpha' }),
  });
  const cryptAnsWord = 'CLEAR';
  add({
    section: '9 · Cryptarithm',
    title: 'Cryptarithm: the exam sheet',
    html:
      examQ(`Solve the following cryptarithm: SOCIAL + SOLAR = VEHICLE. What do the values ${[...cryptNum(cryptAnsWord)].join(' ')} decode to?`) +
      `<p>Solve the sum first (see the next slide for the order), then turn each digit back into its letter. A single wrong digit makes the answer wrong, because Cryptarithm allows no errors.</p>` +
      sheet({ mode: 'free', title: 'Cryptarithm', answer: cryptAnsWord, tokens: [...cryptNum(cryptAnsWord)] }) +
      cols(
        card('Start here', tips(['VEHICLE is one digit longer than SOCIAL, so V = 1', 'Look at the units column: L + R ends in E', 'O and L repeat in SOCIAL and SOLAR, which limits the choices'])),
        card('Check', tips(['Ten different letters need ten different digits', 'Add the numbers back up before you answer']))
      ),
  });
  add({
    section: '9 · Cryptarithm',
    title: 'Cryptarithm: breaking it',
    html:
      steps([
        '<strong>Crack it by finding the 0s.</strong> A column that gives a letter back unchanged means 0 or 9. Here the left column is S + carry = 10 + E, and the only way is S = 9 with a carry in, so <strong>E = 0</strong>.',
        '<strong>The carry is 1.</strong> A carry is never more than 1, so the extra leading letter is 1 (V = 1). Carries also link <strong>neighbouring numbers</strong>: O + S + carry gives H, so with S = 9 the letter H is just <strong>one less than O</strong> (H = O − 1).',
        '<strong>Ten letters means all ten digits.</strong> SOCIAL + SOLAR = VEHICLE uses ten different letters, so every digit 0–9 appears exactly once. Cross off digits as you place them; the last digit left goes to the last letter.',
      ]) +
      tips([
        'Work column by column from the right: the same letter must have the same digit in every column it appears in.',
        'Add the numbers back up before you answer, and read the answer from the letter→digit mapping (follow each question’s instructions).',
      ]) +
      tool({
        title: 'Try it: solver (use + and =)',
        fields: [textField('expr', 'Equation', crypt, { wide: true })],
        run: ({ expr }) => {
          const r = C.solveCryptarithm(expr.toUpperCase(), 5);
          if (!r.solutions.length) return '<p class="muted">No solution found.</p>';
          return r.solutions.map((s) => table([['Letter', ...Object.keys(s).sort()], ['Digit', ...Object.keys(s).sort().map((l) => s[l])]], { rowHead: true, cls: 'alpha' })).join('');
        },
      }),
  });

  /* ================= 10. HOMOPHONIC ================= */
  const homoKey = 'GOLF';
  const homoCt = '16 26 11 99 69 46 33 03 88 79 54 83 12 06 38 94 67 24 04 00 27 89';
  const homoTable = C.homophonicTable(homoKey);
  add({
    section: '10 · Homophonic',
    title: 'Homophonic: how it works',
    html:
      badges('Crib shows 3+ keyword letters', 'Decrypt given 3+ keyword letters', '3.e.xii / 3.f.vi') +
      `<p>Each plaintext letter can be written as <strong>four different two-digit numbers</strong> (01–00). A four-letter keyword says where each of the four rows starts: the numbers 01, 26, 51, 76 sit under the four keyword letters.</p>` +
      table(
        [['', ...[...C.ALPHA25].map((l) => (l === 'I' ? 'I/J' : l))], ...homoTable.map((r, i) => [`${homoKey[i]} row`, ...r])],
        { head: true, rowHead: true, cls: 'alpha homo' }
      ) +
      cols(
        card('Example (key GOLF)', mono(`Cipher: ${homoCt}\nPlain : ${C.homophonicDecode(homoCt, homoKey)}`)),
        card('Why it is hard', tips(['Frequency analysis fails: a letter is spread over four numbers', 'Each row is a cyclic shift of the same alphabet']))
      ),
  });
  const homoPlain = C.homophonicDecode(homoCt, homoKey);
  const homoCtList = homoCt.split(' ');
  const homoRepeats = (() => {
    const m = {};
    [...C.homophonicDecode(homoCt, homoKey)].forEach((l, i) => (m[l] = m[l] || []).push(homoCtList[i]));
    return Object.entries(m).filter(([, v]) => v.length > 1);
  })();
  add({
    section: '10 · Homophonic',
    title: 'Homophonic: why one letter has several numbers',
    html:
      `<p>It is on purpose. In an ordinary substitution cipher, E is always the same symbol, so E is the most common symbol and you can find it by counting. Homophonic hands each letter <strong>four</strong> possible numbers, one from each row of the table, and the writer switches between them. A letter that would be one common symbol is now four rarer ones, so counting stops working.</p>` +
      cols(
        card(
          'Same letter, different numbers',
          table(
            [['Plain letter', 'Numbers in the example'], ...homoRepeats.map(([l, v]) => [`<strong>${l}</strong>`, v.join(', ')])],
            { head: true, cls: 'alpha' }
          ) + `<p class="muted">The example has ${homoCtList.length} letters and ${new Set(homoCtList).size} different numbers: no number repeats, so there is nothing to count.</p>`
        ),
        card(
          'Decoding is still unambiguous',
          tips([
            'The table holds each number 01–00 exactly once, so a number means exactly one letter.',
            'Only <em>encoding</em> has a choice (which of the four numbers to write). Decoding never does.',
            'So with the keyword you decode by lookup; without it, you rebuild the table from the crib.',
          ])
        )
      ) +
      card(
        'Looking up a number',
        steps([
          'Find the row from the number: 01–25 is the first row, 26–50 the second, 51–75 the third, 76–00 the fourth (00 counts as 100).',
          `In each row the first number (01, 26, 51, 76) sits under that row's keyword letter, and the numbers continue to the right, wrapping around the alphabet. For key ${key(homoKey)} the rows start under ${[...homoKey].map((l) => key(l)).join(', ')}.`,
          (() => {
            const ex = (n) => {
              const r = Math.floor(((Number(n) || 100) - 1) / 25);
              const stepsAway = (Number(n) || 100) - (25 * r + 1);
              return `${key(n)} is in row ${r + 1}, whose first number ${String(25 * r + 1).padStart(2, '0')} is under ${homoKey[r]}. It is ${stepsAway} places further on, so count ${stepsAway} letters on from ${homoKey[r]} (wrapping around, with I and J as one letter): <strong>${C.homophonicDecode(n, homoKey)}</strong>.`;
            };
            return `Example 1: ${ex('99')}<br>Example 2: ${ex('69')}<br>Two different numbers, the same letter.`;
          })(),
          'Easiest in practice: find the number in the table and read the letter at the top of its column.',
        ])
      ),
  });
  const homoMissing = card(
    'The missing fourth keyword letter',
    (() => {
          const A25 = C.ALPHA25;
          const starts = [...homoKey.slice(0, 3)].map((l) => A25.indexOf(l));
          const partial = homoCtList
            .map((n) => {
              const v = Number(n) || 100;
              const r = Math.floor((v - 1) / 25);
              return r < 3 ? A25[((v - 1) % 25 + starts[r]) % 25] : '_';
            })
            .join('');
          const firstGap = homoCtList.findIndex((n) => (Number(n) || 100) > 75);
          const n = Number(homoCtList[firstGap]);
          const guess = homoPlain[firstGap];
          const back = n - 76;
          const startLetter = A25[(((A25.indexOf(guess) - back) % 25) + 25) % 25];
          return steps([
            `Fill the first three rows from the keyword letters, so you can decode every number from 01 to 75. Every number from 76 to 00 (row 4) stays a blank for now: <span class="mono">${partial}</span>`,
            `Read what you have as words. The start reads <strong>${partial.slice(0, firstGap + 4)}</strong>, and the blank right after WOR is most likely <strong>${guess}</strong> (WORD).`,
            `That blank is the number ${key(homoCtList[firstGap])}, in row 4. It is ${back} places after that row's first number 76, so row 4 starts ${back} letters <em>before</em> ${guess}. Count back ${back} from ${guess}: you land on <strong>${startLetter}</strong>.`,
            `The fourth keyword letter is ${startLetter}, so the keyword is ${key(homoKey.slice(0, 3) + startLetter)}. Now every row-4 number decodes too, and you can check the rest of the message.`,
          ]);
    })()
  );
  add({
    section: '10 · Homophonic',
    title: 'Homophonic: the exam sheet',
    html:
      examQ(`The following quote has been encoded with the Homophonic cipher. The first three letters of the keyword are ${homoKey.slice(0, 3)}. What does it say?`) +
      `<p>Three keyword letters give you three of the four row starts. The fourth row start is not given: you find it from the text itself (see below).</p>` +
      sheet({ mode: 'free', title: 'Homophonic', answer: homoPlain, tokens: homoCt.split(' ') }) +
      homoMissing +
      cols(
        card('Building the table', tips(['Row starts are the numbers 01, 26, 51 and 76', 'Write the keyword letter at the start of each row, then continue the alphabet', 'Each number then reads off as one letter'])),
        card('Tip', tips(['Plaintext has no spaces here: look for common words as you go', 'Work in the order of the numbers and fill in letters as you find them']))
      ),
  });
  add({
    section: '10 · Homophonic',
    title: 'Homophonic: breaking it',
    html:
      steps([
        'Each row is the alphabet shifted, so <strong>one known pair (letter, number) fixes that row’s start</strong>: the row starts that many places before the letter.',
        'You are told 3 of the 4 keyword letters (or a crib that shows them). That fills three rows, so every number from 01 to 75 decodes at once.',
        'The numbers 76–00 are the fourth row (00 is read as 100). Leave them blank and read the rest as words.',
        'Guess one blank from context, then count back from that letter to find the fourth row’s start letter (below).',
        'With all four rows known you know the keyword and every number, so you can check the whole message.',
      ]) +
      homoMissing +
      tool({
        title: 'Try it: Homophonic decode with a key',
        fields: [textField('ct', 'Numbers', homoCt, { wide: true }), textField('key', 'Four-letter key', homoKey)],
        run: ({ ct, key: k }) => mono(C.homophonicDecode(ct, k) || 'Key needs four letters.'),
      }) +
      tool({
        title: 'Try it: recover key letters from a crib',
        fields: [textField('plain', 'Crib (from the start)', 'WORDDIVISIONS'), textField('ct', 'Numbers', homoCt, { wide: true })],
        run: ({ plain, ct }) => {
          const r = C.homophonicKeyFromCrib(plain, ct);
          return mono(`Key letters: ${r.key.split('').join(' ')}${r.conflict ? '\n(conflicting pairs: check the crib)' : ''}`);
        },
      }),
  });

  /* ================= 11. FRACTIONATED MORSE ================= */
  const fmWord = 'CODEBUSTERS';
  const fmKey = 'DULCIMERS';
  const fmMorse = [...fmWord].map((c) => C.MORSE[c]).join('x');
  add({
    section: '11 · Fractionated Morse',
    title: 'Fractionated Morse: how it works',
    html:
      badges('Cryptanalysis, crib of 4+ characters', 'Same', '3.e.iv') +
      `<p>The plaintext is turned into Morse code (letters separated by <code>x</code>, words by <code>xx</code>), cut into <strong>triplets</strong> of ., - and x, and each triplet is replaced by a letter of a <strong>keyed alphabet</strong>.</p>` +
      table(
        [C.fmTable(fmKey).map((e) => `<strong>${e.letter}</strong>`), C.fmTable(fmKey).map((e) => `<span class="trip">${esc(e.triple)}</span>`)],
        { cls: 'grid small' }
      ) +
      cols(
        card('Steps', mono(`Plain : ${fmWord}\nMorse : ${fmMorse}x\nSplit : ${(fmMorse + 'x').padEnd(Math.ceil((fmMorse.length + 1) / 3) * 3, 'x').match(/.{3}/g).join(' ')}\nCipher: ${C.fmorseEncode(fmWord, fmKey).replace(/ /g, '')}`)),
        card('Notes', tips(['26 of 27 triplets are used: there is no xxx', 'The keyword fills the alphabet first, so the first letters get the first triplets', 'The text is padded with x to fill the last triplet']))
      ),
  });
  const fmT = C.fmTable(fmKey);
  const fmExam = 'MORSE CODE IS FUN';
  const fmTrip = (t) => `<span class="trip">${esc(t)}</span>`;
  const fmCell = (e) => `<strong>${e.letter}</strong> ${fmTrip(e.triple)}`;
  add({
    section: '11 · Fractionated Morse',
    title: 'Fractionated Morse: the triplet table',
    html:
      `<p>A triplet is three symbols, each one of <code>.</code> <code>-</code> <code>x</code>. That gives 3 × 3 × 3 = 27 triplets. They are always listed in the same order: the first symbol changes slowest (all the <code>.</code> ones, then <code>-</code>, then <code>x</code>), and the last symbol changes fastest.</p>` +
      table(
        [
          ['Starts with', 'Triplet and its letter, in order'].map((h) => `<strong>${h}</strong>`),
          ...[0, 1, 2].map((g) => [
            `<code>${C.fmTable('A')[g * 9].triple[0]}</code>`,
            fmT.slice(g * 9, g * 9 + 9).map(fmCell).join(' &nbsp; ') + (g === 2 ? ` &nbsp; ${fmTrip('xxx')} unused` : ''),
          ]),
        ],
        { head: true, rowHead: true }
      ) +
      cols(
        card(
          'Building it from the keyword',
          steps([
            `Write the keyword ${key(fmKey)} and then the rest of the alphabet in order, skipping letters already used: <span class="mono">${C.keyedAlphabet(fmKey)}</span>`,
            'Put that keyed alphabet next to the 27 triplets in order. The first letter gets <code>...</code>, the second <code>..-</code>, the third <code>..x</code>, and so on.',
            `The 26 letters use up the first 26 triplets. ${fmTrip('xxx')} gets no letter, because three x in a row never happens in Morse (a word break is only xx).`,
          ])
        ),
        card(
          'What you get',
          tips([
            `With ${key(fmKey)}, the letter D stands for ${fmTrip('...')}, U for ${fmTrip('..-')} and L for ${fmTrip('..x')}.`,
            'A different keyword gives a different table. The triplets always run in the same order; only the letters change.',
            'On the exam you build this table first. Everything after that is lookup.',
          ])
        )
      ),
  });
  const fmEnc = (() => {
    const letters = [...fmWord];
    const morse = letters.map((c) => C.MORSE[c]);
    const joined = morse.join('x');
    const padded = joined + 'x'.repeat((3 - (joined.length % 3)) % 3);
    const trips = padded.match(/.{3}/g);
    const byTriple = Object.fromEntries(fmT.map((e) => [e.triple, e.letter]));
    return { letters, morse, joined, padded, trips, out: trips.map((t) => byTriple[t]) };
  })();
  add({
    section: '11 · Fractionated Morse',
    title: 'Fractionated Morse: encoding step by step',
    html:
      `<p>Encode <strong>${fmWord}</strong> with the keyword ${key(fmKey)}.</p>` +
      steps([
        'Write each plaintext letter in Morse.',
        'Join the letters with one <code>x</code> between them (use <code>xx</code> between words). Add <code>x</code> at the end until the length is a multiple of 3.',
        'Cut the whole string into triplets. Ignore where the letters ended: the cuts fall wherever they fall.',
        'Replace each triplet by its letter from the table on the previous slide.',
      ]) +
      table(
        [
          ['Letter', ...fmEnc.letters].map((t) => `<strong>${t}</strong>`),
          ['Morse', ...fmEnc.morse.map((m) => `<code>${m}</code>`)],
        ],
        { head: true, rowHead: true, cls: 'grid small' }
      ) +
      mono(
        `Joined : ${fmEnc.joined}${'x'.repeat(fmEnc.padded.length - fmEnc.joined.length)}   (${fmEnc.joined.length} symbols + ${fmEnc.padded.length - fmEnc.joined.length} padding x)\nTriplets: ${fmEnc.trips.join(' ')}`
      ) +
      table(
        [
          ['Triplet', ...fmEnc.trips.map((t) => fmTrip(t))],
          ['Cipher letter', ...fmEnc.out.map((l) => `<strong>${l}</strong>`)],
        ],
        { head: true, rowHead: true, cls: 'grid small' }
      ) +
      `<p class="muted">Result: <strong>${fmEnc.out.join('')}</strong>. Notice that one cipher letter does not stand for one plaintext letter. A triplet can hold the end of one Morse letter, the separator x, and the start of the next one. That is the "fractionated" part.</p>`,
  });
  const fmDec = (() => {
    const cipher = C.fmorseEncode(fmExam, fmKey).replace(/ /g, '');
    const trips = [...cipher].map((l) => fmT.find((e) => e.letter === l).triple);
    const joined = trips.join('');
    const readable = joined
      .replace(/x+$/, '')
      .replace(/xx/g, '#')
      .replace(/x/g, ' ')
      .replace(/#/g, ' / ');
    return { cipher, trips, joined, readable };
  })();
  add({
    section: '11 · Fractionated Morse',
    title: 'Fractionated Morse: decoding step by step',
    html:
      examQ(`Decode ${fmDec.cipher} with the keyword ${fmKey}.`) +
      steps([
        'Build the triplet table from the keyword.',
        'Replace every cipher letter by its triplet and write them one after another.',
        'Now read the string as Morse: a single <code>x</code> ends a letter, <code>xx</code> ends a word. The triplet boundaries no longer matter.',
        'Turn each Morse group back into a letter.',
      ]) +
      table(
        [
          ['Cipher', ...[...fmDec.cipher].map((l) => `<strong>${l}</strong>`)],
          ['Triplet', ...fmDec.trips.map((t) => fmTrip(t))],
        ],
        { head: true, rowHead: true, cls: 'grid small' }
      ) +
      mono(`Joined : ${fmDec.joined}\nMorse  : ${fmDec.readable}   ( / = word break )\nPlain  : ${C.fmorseDecode(fmDec.cipher, fmKey)}`) +
      tips([
        'Extra <code>x</code> at the very end is padding. Ignore it.',
        'A triplet may be split across two Morse letters, for example <code>.x.</code> is the end of an E and the start of the next letter.',
      ]),
  });
  add({
    section: '11 · Fractionated Morse',
    title: 'Fractionated Morse: the exam sheet',
    html:
      examQ(`The following quote has been encoded with the Fractionated Morse cipher using the keyword ${fmKey}. What does it say?`) +
      mono(C.fmorseEncode(fmExam, fmKey)) +
      `<p>At competition you may only get a crib instead of the key; this slide gives the key so you can practise the mechanics. Build the keyed triplet table, turn every letter into three symbols, join them, then read the Morse.</p>` +
      sheet({ mode: 'free', title: 'Fractionated Morse', answer: fmExam, wordGaps: true }) +
      cols(
        card('Mechanics', steps(['Write the keyed alphabet against the 26 triplets', 'Replace each cipher letter by its triplet', 'Join the triplets into one long string of . - x', 'Cut at x (letters) and xx (words), then read the Morse'])),
        card('Common slips', tips(['xx is a word break, a single x only ends a letter', 'The last letter may be followed by padding x'])) 
      ),
  });
  const fmCrib = (() => {
    const text = 'THE CODEBUSTERS ARE FUN';
    const crib = 'CODEBUSTERS';
    const ct = C.fmorseEncode(text, fmKey).replace(/ /g, '');
    const cribMorse = (c) => [...c].map((ch) => C.MORSE[ch]).join('x');
    const before = [...'THE'].map((ch) => C.MORSE[ch]).join('x') + 'xx';
    const start = before.length;
    const trueAlign = (3 - (start % 3)) % 3;
    const truePos = Math.ceil(start / 3);
    const fullTriplets = (c, a) => cribMorse(c).slice(a).match(/.{3}/g) || [];
    const survivors = (c) => {
      let n = 0;
      for (let a = 0; a < 3; a++) {
        const trip = fullTriplets(c, a);
        for (let j = 0; j + trip.length <= ct.length; j++) {
          const t2l = {};
          const l2t = {};
          let ok = true;
          trip.forEach((t, i) => {
            const l = ct[j + i];
            if ((t2l[t] && t2l[t] !== l) || (l2t[l] && l2t[l] !== t)) ok = false;
            t2l[t] = l;
            l2t[l] = t;
          });
          if (ok) n++;
        }
      }
      return n;
    };
    const trips = fullTriplets(crib, trueAlign);
    const pairs = trips.map((t, i) => [t, ct[truePos + i]]);
    const known = Object.fromEntries(pairs.map(([t, l]) => [l, t]));
    const partial = [...ct].map((l) => known[l] || '???');
    return { text, crib, ct, cribMorse: cribMorse(crib), trueAlign, truePos, fullTriplets, survivors, trips, pairs, known, partial };
  })();
  add({
    section: '11 · Fractionated Morse',
    title: 'Fractionated Morse: with only a crib',
    html:
      examQ(`The following quote has been encoded with the Fractionated Morse cipher. The deciphered text contains the letters ${fmCrib.crib}. What does it say?`) +
      `<p>Cipher: ${key(fmCrib.ct)}. You do not know the keyword, only a piece of the plaintext. The plan: turn the crib into triplets, slide it along the ciphertext, and see which placements make sense.</p>` +
      steps([
        `Write the crib in Morse: <span class="mono">${fmCrib.cribMorse}</span>`,
        'You do not know where the crib starts relative to a triplet cut, so there are <strong>three alignments</strong>: the first full triplet starts after 0, 1 or 2 leading symbols (those belong to the triplet before the crib).',
        'For each alignment, cut the rest into triplets. Each triplet should line up with one cipher letter. Slide that run of triplets along the ciphertext.',
        'A placement is possible only if it is consistent: the same triplet always means the same cipher letter and different triplets never share a letter. Throw out the rest.',
      ]) +
      table(
        [
          ['Alignment', 'Leading symbols skipped', 'Triplets from the crib'].map((h) => `<strong>${h}</strong>`),
          ...[0, 1, 2].map((a) => [`${a}`, `<code>${fmCrib.cribMorse.slice(0, a) || '(none)'}</code>`, fmCrib.fullTriplets(fmCrib.crib, a).map(fmTrip).join(' ')]),
        ],
        { head: true }
      ) +
      cols(
        card(
          'Longer crib, fewer placements',
          table(
            [
              ['Crib', 'Placements that pass'].map((h) => `<strong>${h}</strong>`),
              ...['CODE', 'CODEB', 'CODEBUS', fmCrib.crib].map((c) => [`<code>${c}</code>`, String(fmCrib.survivors(c))]),
            ],
            { head: true }
          ) + `<p class="muted">Counted over all 3 alignments and every start position in this ciphertext (${fmCrib.ct.length} letters). Short cribs leave many; you then test each by decoding the neighbours.</p>`
        ),
        card(
          `Right answer: alignment ${fmCrib.trueAlign}, starting at cipher letter ${fmCrib.truePos + 1}`,
          table(
            [
              ['Triplet', ...fmCrib.pairs.map(([t]) => fmTrip(t))],
              ['Cipher', ...fmCrib.pairs.map(([, l]) => `<strong>${l}</strong>`)],
            ],
            { head: true, rowHead: true, cls: 'grid small' }
          ) + `<p class="muted">Each pair is a row of the key table, so you know ${Object.keys(fmCrib.known).length} of the 26 letter-triplet links without the keyword.</p>`
        )
      ) +
      card(
        'Use the pairs on the rest of the message',
        mono(`Cipher : ${[...fmCrib.ct].join('   ')}\nTriplet: ${fmCrib.partial.join(' ')}`) +
          tips([
            'Every cipher letter you already know now gives its triplet. The ??? ones are still unknown.',
            'Triplets near the crib have to continue the Morse into real words, which tells you the missing triplets and so more key letters.',
            'The keyword fills the alphabet first and the rest follows in alphabetical order, so the pairs also tell you which keyword letters are possible.',
          ])
      ),
  });
  const fmFinish = (() => {
    const { ct, known, text } = fmCrib;
    const truth = Object.fromEntries(fmT.map((e) => [e.letter, e.triple]));
    const unknown = [...new Set([...ct].filter((l) => !known[l]))];
    const used = new Set(Object.values(known));
    const free = fmT.map((e) => e.triple).filter((t) => !used.has(t));
    const rev = Object.fromEntries(Object.entries(C.MORSE).map(([k, v]) => [v, k]));
    const decode = (map) => {
      const s = [...ct].map((l) => map[l]).join('').replace(/x+$/, '');
      const out = [];
      for (const w of s.split(/xx(?!x)/)) {
        const g = w.split('x');
        if (g.some((q) => !rev[q])) return null;
        out.push(g.map((q) => rev[q]).join(''));
      }
      return out.join(' ');
    };
    const gapOptions = (group, others) => {
      const fixed = { ...known };
      others.forEach((l) => (fixed[l] = truth[l]));
      const found = [];
      const rec = (i, asg) => {
        if (i === group.length) {
          const d = decode({ ...fixed, ...asg });
          if (d) found.push(d);
          return;
        }
        for (const t of free) {
          if (Object.values(asg).includes(t) || others.some((l) => truth[l] === t)) continue;
          rec(i + 1, { ...asg, [group[i]]: t });
        }
      };
      rec(0, {});
      return found;
    };
    const firstPos = (l) => ct.indexOf(l);
    const gapA = unknown.filter((l) => firstPos(l) < fmCrib.truePos);
    const gapB = unknown.filter((l) => firstPos(l) >= fmCrib.truePos);
    const optsA = gapOptions(gapA, gapB);
    const optsB = gapOptions(gapB, gapA);
    const pick = (opts) => {
      const others = opts.filter((o) => o !== text).slice(0, 5);
      return [...others, text];
    };
    const keyed = C.keyedAlphabet(fmKey);
    return { unknown, free, gapA, gapB, optsA, optsB, pickA: pick(optsA), pickB: pick(optsB), keyed, text };
  })();
  add({
    section: '11 · Fractionated Morse',
    title: 'Fractionated Morse: finishing the solve',
    html:
      `<p>You have the crib placed and a few letters guessed, but gaps remain. After the crib above, ${fmFinish.unknown.length} of the ${fmCrib.ct.length} cipher letters (${fmFinish.unknown.map((l) => `<strong>${l}</strong>`).join(', ')}) are still unknown. Here is how to close them.</p>` +
      mono(`Cipher : ${[...fmCrib.ct].join('   ')}\nTriplet: ${fmCrib.partial.join(' ')}`) +
      steps([
        `<strong>Fill in every known cipher letter everywhere.</strong> A pair found in one place applies to every copy of that letter. Here that already covers ${fmCrib.ct.length - fmFinish.unknown.length} of ${fmCrib.ct.length} letters.`,
        `<strong>Cross out used triplets.</strong> One triplet means one letter, so an unknown letter can only be one of the ${fmFinish.free.length} triplets not yet used (${fmFinish.free.map(fmTrip).join(' ')}).`,
        '<strong>Work one gap at a time.</strong> Write the known triplets either side of the gap. The Morse has to stay valid: every group between x is a real letter (1 to 4 symbols), and nothing like xxx.',
        '<strong>Read it as English.</strong> Try each triplet that keeps the Morse valid and look for a word. Valid Morse is not much of a filter, so use word shapes: THE, AND, a repeated word, a word ending in a known letter.',
        '<strong>Check the pair.</strong> When you pick a triplet for a cipher letter, every other place that cipher letter appears must still read as Morse. If one does not, the guess is wrong.',
      ]) +
      cols(
        card(
          `Gap at the start (${fmFinish.gapA.join(', ')})`,
          `<p class="muted">${fmFinish.optsA.length} triplet choices keep the Morse valid. A few of the readings:</p>` +
            tips(fmFinish.pickA.map((t, i, a) => (i === a.length - 1 ? `<strong>${esc(t)}</strong> &larr; the one that reads as English` : esc(t))))
        ),
        card(
          `Gap near the end (${fmFinish.gapB.join(', ')})`,
          `<p class="muted">${fmFinish.optsB.length} choices keep the Morse valid. A few of the readings:</p>` +
            tips(fmFinish.pickB.map((t, i, a) => (i === a.length - 1 ? `<strong>${esc(t)}</strong> &larr; the one that reads as English` : esc(t))))
        )
      ) +
      card(
        'Then read off the keyword',
        `<p>With the full table in triplet order the keyword is the part that is <em>not</em> alphabetical, because the rest of the alphabet follows in order:</p>` +
          mono(`${fmFinish.keyed.slice(0, fmKey.length)} | ${fmFinish.keyed.slice(fmKey.length)}`) +
          `<p class="muted">The letters before the bar are the keyword ${key(fmKey)}. Letters after it run A B F G H ... because the keyword letters are skipped.</p>`
      ),
  });
  add({
    section: '11 · Fractionated Morse',
    title: 'Fractionated Morse: breaking it',
    html:
      steps([
        'Write the crib in Morse. Its triplets can start at <strong>three different alignments</strong>; try each against the ciphertext.',
        'A confirmed letter-to-triplet pair gives you a row of the key table.',
        'Letters not in the keyword follow in alphabetical order, so their triplets also run in order: that helps you fill in the unknown ones.',
        'Look for xx, which marks a word break, and for impossible combos (such as xxx) to rule out guesses.',
      ]) +
      tool({
        title: 'Try it: Fractionated Morse',
        fields: [
          textField('text', 'Text', C.fmorseEncode(fmWord, fmKey), { wide: true }),
          textField('key', 'Keyword', fmKey),
          { name: 'mode', label: 'Mode', type: 'select', options: ['Decode', 'Encode'], value: 'Decode' },
        ],
        run: ({ text, key: k, mode }) => mono(mode === 'Decode' ? C.fmorseDecode(text, k) : C.fmorseEncode(text, k)),
      }),
  });

  /* ================= 12. CHECKERBOARD ================= */
  const cbPlain = 'SOLVE THE CODE';
  const cbSq = 'OLYMPIAD';
  const cbRows = 'WHITE';
  const cbCols = 'GRAYS';
  const cbSquare = C.poly(cbSq);
  add({
    section: '12 · Checkerboard',
    title: 'Checkerboard: how it works',
    html:
      badges('Decrypt given the Polybius key', 'Cryptanalysis, crib of 5+ characters', '3.e.xi / 3.f.v') +
      `<p>A keyed <strong>5×5 Polybius square</strong> (I and J share a cell) whose rows and columns are labelled with letters. Each plaintext letter is replaced by the pair of letters at its row and column.</p>` +
      table(
        [['', ...[...cbCols].map((l) => `<strong>${l}</strong>`)], ...[...cbRows].map((l, r) => [`<strong>${l}</strong>`, ...[...cbSquare.slice(r * 5, r * 5 + 5)]])],
        { cls: 'grid' }
      ) +
      cols(
        card('Example', mono(`Plain : ${cbPlain}\nCipher: ${C.checkerboardEncode(cbPlain, cbSq, cbRows, cbCols)}`)),
        card('Why it is different', tips(['Output uses only the 10 label letters', 'Two ciphertext letters per plaintext letter', 'The first letter of each pair is always a <em>row</em> label', 'Every row and column label letter appears in the ciphertext']))
      ),
  });
  const cbPairs = C.checkerboardEncode(cbPlain, cbSq, cbRows, cbCols).replace(/[^A-Z]/gi, '').match(/.{2}/g);
  add({
    section: '12 · Checkerboard',
    title: 'Checkerboard: the exam sheet',
    html:
      examQ(`The following quote has been encoded with the Checkerboard cipher with a polybius key of ${cbSq}. What does it say?`) +
      `<p>Like the real exam, only the Polybius key is given, <strong>not the row and column labels</strong>. Every plaintext letter is a pair (row label, then column label). Work out the labels first: see the next slide.</p>` +
      sheet({ mode: 'free', title: 'Checkerboard', answer: cbPlain, tokens: cbPairs, wordGaps: true }) +
      cols(
        card('The square', mono(C.poly(cbSq).match(/.{5}/g).map((r) => [...r].join(' ')).join('\n'))),
        card('Remember', tips(['I and J share a cell (25-letter square)', 'The keyword goes in first, then the unused letters in order', 'Rows are numbered 1 to 5 from the top, columns 1 to 5 from the left']))
      ),
  });
  const cbFirst = [...new Set(cbPairs.map((p) => p[0]))].join(' ');
  const cbSecond = [...new Set(cbPairs.map((p) => p[1]))].join(' ');
  add({
    section: '12 · Checkerboard',
    title: 'Checkerboard: when only the Polybius key is given',
    html:
      badges('Decrypt given the Polybius key', 'Cryptanalysis, crib of 5+ characters', '3.e.xi / 3.f.v') +
      `<p>The labels are two 5-letter keywords, and you are <strong>not</strong> told them. Rule 3.e.xi guarantees all ten label letters appear in the ciphertext, so you can find them. Same example: Polybius key <strong>${cbSq}</strong>.</p>` +
      cols(
        card('Free information', tips([
          `The ciphertext is pairs: <strong>${cbPairs.join(' ')}</strong>.`,
          `First letters of the pairs are the <strong>row</strong> labels: ${cbFirst}.`,
          `Second letters are the <strong>column</strong> labels: ${cbSecond}.`,
          'So only their <em>order</em> is unknown: which is row 1, row 2, \u2026',
        ])),
        card('Square (known)', mono(C.poly(cbSq).match(/.{5}/g).map((r) => [...r].join(' ')).join('\n')))
      ) +
      steps([
        'Count the pairs. <strong>IG</strong> is most common (3 times): probably <strong>E</strong>. E is row 3, column 1, so <strong>I = row 3</strong> and <strong>G = column 1</strong>.',
        'Next, <strong>WG</strong> (twice): probably <strong>O</strong>. O is row 1, column 1, and G is already column 1, so the guess agrees with what you know. <strong>W = row 1</strong>.',
        'Look for THE, which ends in E: <strong>TS IY IG</strong>. H is row 3, column 4 and I is already row 3, so <strong>Y = column 4</strong>. T is row 4, column 5, so <strong>T = row 4</strong> and <strong>S = column 5</strong>.',
        'Decode what you can: TY = S, WG = O, then WR is row 1 with an unknown column: L (column 2) makes SOLVE, so <strong>R = column 2</strong>, and <strong>A = column 3</strong> is left.',
        'Rows 2 and 5 are left for H and E. HS is column 5: row 2 gives C (CODE), so <strong>H = row 2</strong> and <strong>E = row 5</strong>. Check: ER = V, HA = D.',
        'Result: rows <strong>W H I T E</strong>, columns <strong>G R A Y S</strong>, message <strong>SOLVE THE CODE</strong>.',
      ]) +
      cols(
        card('Why guesses are safe', tips([
          'A pair\u2019s first letter fixes the <em>row</em>, so each guess narrows every pair starting with that letter to one row of 5 letters.',
          'If a guess puts one label in two different rows or columns, the guess is wrong: go back.',
          'Start with E, then T, A, O: the common letters give you the labels fastest.',
        ])),
        card('With a crib (State and National)', tips([
          'The crib\u2019s 5+ letters each give a row label and a column label directly, usually fixing most of the ten.',
          'The remaining labels follow from the same consistency checks.',
        ]))
      ),
  });
  const cb2Sq = 'CHAMPION';
  const cb2Rows = 'MOUSE';
  const cb2Cols = 'LIGHT';
  const cb2Plain = 'CRACK THE CODE WITH A KEY';
  const cb2Ct = C.checkerboardEncode(cb2Plain, cb2Sq, cb2Rows, cb2Cols);
  const cb2Square = C.poly(cb2Sq);
  add({
    section: '12 · Checkerboard',
    title: 'Checkerboard: breaking it',
    html:
      steps([
        'Count the distinct letters: ten of them (five row labels, five column labels). All ten appear in the ciphertext, so the missing letters are not labels.',
        'Split the ciphertext into pairs; the first letters are the row labels, the second are the column labels.',
        'Do a frequency count on the <strong>pairs</strong> (each pair is one plaintext letter).',
        'Use the crib to place plaintext letters into the square, then fill the gaps from the keyword pattern.',
      ]) +
      `<p>A second example, with the labels already found (labels <strong>${cb2Rows}</strong> down the side, <strong>${cb2Cols}</strong> across the top; Polybius key <strong>${cb2Sq}</strong>):</p>` +
      table(
        [['', ...[...cb2Cols].map((l) => `<strong>${l}</strong>`)], ...[...cb2Rows].map((l, r) => [`<strong>${l}</strong>`, ...[...cb2Square.slice(r * 5, r * 5 + 5)]])],
        { cls: 'grid' }
      ) +
      examQ(`Decode the ciphertext with the square above.`) +
      mono(cb2Ct) +
      sheet({ mode: 'free', title: 'Checkerboard: decode with the square', answer: cb2Plain, tokens: cb2Ct.replace(/ /g, '').match(/.{2}/g), wordGaps: true }),
  });

  /* ================= 13. NIHILIST ================= */
  const nihPlain = 'EASY CIPHER EXAMPLE';
  const nihPoly = 'FASHIONED';
  const nihKey = 'SENSE';
  const nihSquare = C.poly(nihPoly);
  const nihCt = C.nihilistEncode(nihPlain, nihPoly, nihKey);
  add({
    section: '13 · Nihilist',
    title: 'Nihilist Substitution: how it works',
    html:
      badges('Decrypt given the keys', 'Cryptanalysis, crib of 2x keyword length', '3.e.viii / 3.f.iv') +
      `<p>Build a keyed 5×5 Polybius square. Every letter has a two-digit coordinate (row, column). Then <strong>add</strong> a repeating keyword’s coordinates, number by number.</p>` +
      table(
        [['', 1, 2, 3, 4, 5].map(String), ...[...Array(5)].map((_, r) => [String(r + 1), ...[...nihSquare.slice(r * 5, r * 5 + 5)]])],
        { cls: 'grid', head: true }
      ) +
      cols(
        card('Worked example', mono(`Plain: ${nihPlain.replace(/ /g, '')}\nSquare key: ${nihPoly} · Key: ${nihKey}\nCipher: ${nihCt}`)),
        card('Properties', tips(['Numbers are sums from 22 to 110', 'Fully reversible: subtract the key, look up the coordinate', 'Polyalphabetic: the same letter gets different numbers']))
      ),
  });
  const nihVal = (ch) => {
    const i = nihSquare.indexOf(ch === 'J' ? 'I' : ch);
    return 10 * (Math.floor(i / 5) + 1) + (i % 5) + 1;
  };
  const nihLetters = [...nihPlain.replace(/ /g, '')];
  const nihNums = nihCt.split(' ').map(Number);
  const nihGrid = table(
    [['', 1, 2, 3, 4, 5].map(String), ...[...Array(5)].map((_, r) => [String(r + 1), ...[...nihSquare.slice(r * 5, r * 5 + 5)]])],
    { cls: 'grid', head: true }
  );
  const nihShow = 8;
  const nihKeyTable = table(
    [['Key letter', ...[...nihKey].map((c) => c)], ['Row, column', ...[...nihKey].map((c) => String(nihVal(c)))]],
    { cls: 'grid', head: true }
  );
  const nihDecodeRows = nihNums.slice(0, nihShow).map((n, i) => {
    const kc = nihKey[i % nihKey.length];
    const v = n - nihVal(kc);
    return [String(i + 1), String(n), `${kc} = ${nihVal(kc)}`, `${n} − ${nihVal(kc)} = ${v}`, `row ${Math.floor(v / 10)}, col ${v % 10}`, nihSquare[(Math.floor(v / 10) - 1) * 5 + (v % 10) - 1]];
  });
  const nihEncodeRows = nihLetters.slice(0, 4).map((ch, i) => {
    const kc = nihKey[i % nihKey.length];
    return [ch, String(nihVal(ch)), `${kc} = ${nihVal(kc)}`, `${nihVal(ch)} + ${nihVal(kc)} = ${nihVal(ch) + nihVal(kc)}`];
  });
  add({
    section: '13 · Nihilist',
    title: 'Nihilist: finding letters with numbers',
    html:
      badges('Decrypt given the keys', 'Cryptanalysis, crib of 2x keyword length', '3.e.viii / 3.f.iv') +
      `<p>Nihilist is only arithmetic and a table lookup. Here the Polybius key is <strong>${nihPoly}</strong> and the keyword is <strong>${nihKey}</strong>. Build the 5×5 square first, then turn the <em>keyword</em> into numbers.</p>` +
      nihGrid +
      cols(
        card('Step 1: reading the square', steps([
          'A letter\u2019s number is its <strong>row digit</strong> (left side) followed by its <strong>column digit</strong> (top).',
          `${nihKey[0]} is in row ${Math.floor(nihVal(nihKey[0]) / 10)}, column ${nihVal(nihKey[0]) % 10}, so ${nihKey[0]} = ${nihVal(nihKey[0])}.`,
          `${nihKey[1]} is in row ${Math.floor(nihVal(nihKey[1]) / 10)}, column ${nihVal(nihKey[1]) % 10}, so ${nihKey[1]} = ${nihVal(nihKey[1])}.`,
          'I and J share a cell.',
        ])),
        card('Step 2: the keyword as numbers', nihKeyTable + `<p class="muted">Write these under the ciphertext and repeat them: ${[...nihKey].map((c) => nihVal(c)).join(', ')}, ${[...nihKey].map((c) => nihVal(c)).join(', ')}, …</p>`)
      ) +
      `<h3>Decoding, number by number</h3>` +
      table([['#', 'Cipher', 'Key letter', 'Subtract', 'Read the square', 'Letter'], ...nihDecodeRows], { cls: 'grid', head: true }) +
      `<p class="muted">First ${nihShow} of ${nihNums.length} numbers. Ordinary subtraction is fine: the answer is always a two-digit number whose digits are each 1 to 5.</p>` +
      card('If the subtraction looks negative', tips([
        '<strong>Digit by digit, a negative is normal: borrow.</strong> 40 \u2212 25: the ones digit 0 \u2212 5 is negative, so borrow from the tens: 10 \u2212 5 = 5, then 3 \u2212 2 = 1, giving 15. Subtracting the whole numbers does it for you.',
        '<strong>If the whole number comes out negative, or under 11, you have the wrong key letter.</strong> A correct decode is always 11 to 55 (both digits 1 to 5), because ciphertext = plain + key and the plain number is at least 11.',
        'The usual cause is a misaligned keyword: one key letter per plaintext letter, with spaces and punctuation not using up a key letter. Slide the keyword one place and retry.',
        'The other cause is a wrong key number: re-read it from the square, row digit first.',
      ])),
  });
  add({
    section: '13 · Nihilist',
    title: 'Nihilist: encoding, and why sums reach 110',
    html:
      badges('Decrypt given the keys', 'Cryptanalysis, crib of 2x keyword length', '3.e.viii / 3.f.iv') +
      `<p>To encode, <strong>add</strong> instead. The plaintext letter\u2019s number plus the keyword letter\u2019s number is the ciphertext number.</p>` +
      table([['Plain', 'Its number', 'Key letter', 'Add'], ...nihEncodeRows], { cls: 'grid', head: true }) +
      cols(
        card('Why the range is 22 to 110', tips([
          'Smallest square number is 11, so the smallest sum is 11 + 11 = 22.',
          'Largest is 55, so the largest sum is 55 + 55 = 110.',
          'Add and subtract as ordinary whole numbers, not digit by digit.',
        ])),
        card('If your answer is not in the grid', tips([
          'A result such as 07 or 68 (a digit of 0, 6 or more) means you subtracted with the wrong key letter.',
          'Check the keyword is lined up: one key letter per plaintext letter, ignoring spaces.',
          'Re-read the key letter\u2019s number from the square. A row/column swap is the most common slip.',
        ]))
      ),
  });
  add({
    section: '13 · Nihilist',
    title: 'Nihilist: the exam sheet',
    html:
      examQ(`The following quote has been encoded with the Nihilist Substitution cipher. The Polybius key is ${nihPoly} and the keyword is ${nihKey}. What does it say?`) +
      `<p>Each number is a plaintext coordinate plus a keyword coordinate. Subtract the keyword's coordinate (repeating the keyword along the message), then read the letter from the square.</p>` +
      sheet({ mode: 'free', title: 'Nihilist', answer: nihPlain, tokens: nihCt.split(' '), wordGaps: true }) +
      cols(
        card('Per number', steps(['Turn each keyword letter into its two-digit square coordinate (row, column)', 'Subtract that number from the ciphertext number', 'Look the two-digit result up in the Polybius square: row digit, then column digit'])),
        card('Watch out', tips(['Repeat the keyword along the message, one key letter per plaintext letter', 'Spaces in the message do not use up keyword letters', 'Both digits of the result must be 1 to 5; if not, the keyword is misaligned']))
      ),
  });
  add({
    section: '13 · Nihilist',
    title: 'Nihilist: breaking it',
    html:
      steps([
        'The key length is the period of the repeats. Look for equal numbers at a fixed spacing.',
        'Use the crib: subtract each crib letter’s coordinate from the matching number to get the key coordinates.',
        'Repeat across the ciphertext to rebuild the key, then subtract to get plaintext coordinates.',
        'Place the recovered letters into the 5×5 square and fill the rest from the keyword pattern.',
      ]) +
      tool({
        title: 'Try it: Nihilist',
        fields: [
          textField('text', 'Text', nihCt, { wide: true }),
          textField('poly', 'Square keyword', nihPoly),
          textField('key', 'Key', nihKey),
          { name: 'mode', label: 'Mode', type: 'select', options: ['Decode', 'Encode'], value: 'Decode' },
        ],
        run: ({ text, poly, key: k, mode }) => mono(mode === 'Decode' ? C.nihilistDecode(text, poly, k) : C.nihilistEncode(text, poly, k)),
      }),
  });

  /* ================= WRAP-UP ================= */
  const dots = (n) => '●'.repeat(n) + '○'.repeat(5 - n);
  add({
    section: 'Wrap-up',
    title: 'The ladder: simplest to hardest',
    html:
      table(
        [
          ['#', 'Cipher', 'Difficulty', 'Rough time', 'What decides it', 'If time is short'],
          ...LADDER.map((r, i) => [String(i + 1), `<strong>${r[0]}</strong>`, dots(r[1]), r[2], r[3], r[4]]),
        ],
        { head: true, cls: 'list' }
      ) +
      `<p class="note">Difficulty and times are my own judgement for a prepared student, not official. They assume the question gives you the key or crib the rules allow. Rank 1 to 13 is also the order of the sections in this deck.</p>`,
  });

  const timingRow = (secs) => [`${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`, String(Math.max(0, 2 * (600 - secs)))];
  add({
    section: 'Wrap-up',
    title: 'Test strategy: where the points are',
    html:
      `<p>The manual does <strong>not</strong> set points per cipher. The exam writer chooses them and prints them beside each question, so read the point values first. The manual\u2019s own examples use 400- and 500-point questions. What <em>is</em> fixed is below.</p>` +
      cols(
        card(
          'Timing bonus on the first question',
          table([['Solved at', 'Bonus'], ...[180, 300, 360, 420, 480, 600].map(timingRow)], { head: true, cls: 'grid' }) +
            `<p class="muted">2 × (600 − seconds). The first question is always an Aristocrat. Wrong answers can be retried freely until 10:00.</p>`
        ),
        card(
          'Errors',
          tips([
            '<strong>0 to 2 errors = full credit.</strong> Do not burn minutes polishing the last letter.',
            'From the 3rd error on, each one costs 100, down to zero.',
            '<strong>Cryptarithm is different:</strong> zero errors for full credit.',
            'A near-miss on a big question is still worth submitting.',
          ])
        ),
        card(
          'Special bonus',
          tips([
            'Up to 3 marked questions; <strong>at least one is Homophonic</strong>.',
            'Never an Aristocrat, Patristocrat or Xenocrypt.',
            '1 solved = 150, 2 = 400, 3 = 750, each with no penalty points.',
            'So the 2nd bonus adds 250 and the 3rd adds 350 on top.',
          ])
        )
      ),
  });
  // Real data: 27 Toebes 2026 Division B sample tests (14 Regional, 13 State). Minutes use the midpoints of the LADDER times.
  add({
    section: 'Wrap-up',
    title: 'Points by cipher type (2026 sample tests)',
    html:
      `<p>I averaged the point values printed on <strong>27 real Division B sample tests</strong> from Toebes (14 Regional, 13 State). Each test has 25 to 30 questions. Format: Regional / State.</p>` +
      table(
        [
          ['Cipher', 'Per test', 'Avg points', 'Share of test', 'Points per minute (State)'],
          ['Atbash', '1 / 2', '74 / 82', '1% / 2%', '~55'],
          ['Caesar', '1 / 2', '128 / 124', '2% / 3%', '~50'],
          ['Baconian', '3 / 3', '276 / 302', '14% / 11%', '~75'],
          ['Nihilist', '2 / 2', '203 / 312', '6% / 7%', '~62'],
          ['Checkerboard', '2 / 2', '242 / 319', '8% / 8%', '~40'],
          ['Aristocrat', '5 / 7', '235 / 296', '21% / 25%', '~39'],
          ['Porta', '2 / 2', '131 / 193', '4% / 5%', '~30'],
          ['Patristocrat', '1 / 2', '547 / 496', '10% / 12%', '~40'],
          ['Complete Columnar', '2 / 2', '231 / 270', '8% / 6%', '~22'],
          ['Fractionated Morse', '2 / 2', '430 / 409', '14% / 10%', '~23'],
          ['Cryptarithm', '2 / 2', '249 / 272', '8% / 7%', '~18'],
          ['Affine (not in 2027)', '2 / 2', '136 / 229', '4% / 5%', 'n/a'],
        ],
        { head: true, cls: 'list' }
      ) +
      `<p class="note"><strong>Data:</strong> counts, averages and shares. <strong>My estimate:</strong> the minutes behind points per minute. <strong>Gaps:</strong> these 2026 tests contain no Homophonic or Xenocrypt (new in 2027) and do include Affine (gone in 2027), so the real 2027 spread will differ a little. Only the timed Aristocrat is always an Aristocrat: its points average about 210 (200 to 273).</p>`,
  });
  add({
    section: 'Wrap-up',
    title: 'How many points can you win?',
    html:
      `<p>A whole test is worth <strong>about 6,100 points at Regional</strong> and <strong>about 8,400 at State</strong> (range 5,900 to 7,000 and 8,100 to 8,600), before the timing bonus (up to 1,200) and special bonus (up to 750). Cumulative points if you solve everything in each group <em>perfectly</em> (0 to 2 errors):</p>` +
      table(
        [
          ['Group, in the order to attempt', 'Regional', 'State'],
          ['1. Atbash, Caesar, Porta, all Aristocrats', '1,715 (28%)', '2,872 (34%)'],
          ['2. + Nihilist, Checkerboard, Complete Columnar', '3,052 (50%)', '4,674 (56%)'],
          ['3. + Baconian, Cryptarithm', '4,378 (72%)', '6,124 (73%)'],
          ['4. + Fractionated Morse, Patristocrat', '5,824 (96%)', '7,935 (95%)'],
        ],
        { head: true, cls: 'list' }
      ) +
      cols(
        card(
          'What the numbers say',
          tips([
            '<strong>Aristocrats are the biggest block</strong>: a fifth to a quarter of the whole test. Be fast and accurate on them.',
            'Groups 1 and 2 are about half the points and none needs the hardest ciphers.',
            'Baconian and Nihilist pay the most per minute; Cryptarithm and Complete Columnar the least.',
            '<strong>Patristocrat is worth a lot (500+) but costs a lot</strong>: attempt it only after group 2.',
            'Timing bonus: finishing the timed Aristocrat in 3 minutes is 840 points, worth more than a whole Porta question.',
          ])
        ),
        card(
          'What I cannot tell you',
          tips([
            '<strong>The data has no winning scores.</strong> It lists question values, not results, so I cannot say what score wins.',
            'No team solves everything perfectly in 50 minutes, so winning scores are well below the totals above.',
            'To find your target: take last year\u2019s results for your region or State, and compare them with the group totals here.',
            'Practise on a sample test and note your score and your group at 50 minutes.',
          ])
        )
      ),
  });
  add({
    section: 'Wrap-up',
    title: 'Test strategy: what to do and what to drop',
    html:
      cols(
        card(
          'In the 50 minutes',
          steps([
            'First 2 minutes: one person skims every question and the point values; the others start the timed Aristocrat.',
            'Whole team on the timed Aristocrat until it is solved. Every extra minute costs 120 bonus points.',
            'Then split by strength. Take <strong>Atbash, Caesar, Nihilist and Baconian</strong> first: when the key is given they are mostly arithmetic and cannot stall. <strong>Checkerboard</strong> comes next: you must find the labels yourself, but it is still mechanical.',
            'Then <strong>Aristocrats and Porta</strong>, then Homophonic.',
            '<strong>Patristocrat</strong> comes after those: no word breaks makes it slow, so it is worth it only when the easier ones are done.',
            'Put the <strong>Homophonic</strong> bonus questions ahead of other hard ones.',
          ])
        ),
        card(
          'Drop rules (my judgement)',
          tips([
            '<strong>Skip if you do not know Spanish:</strong> Xenocrypt. There is only 1 at Regional, and 1 or 2 at State and National, so you lose few questions.',
            '<strong>Give up first (of the rest):</strong> Cryptarithm and Complete Columnar. In the sample tests they pay the fewest points per minute (about 18 and 22), and Cryptarithm allows zero errors.',
            '<strong>Fractionated Morse</strong> pays well (about 410 to 430) but takes the longest, and one wrong triplet wrecks a word. Try it only when the rest is done.',
            '<strong>Complete Columnar:</strong> try for 10 minutes; if the column count is still undecided, move on.',
            'A cap of about 12 minutes per question; set a timer and swap people when it rings.',
            'Fill every answer with your best guess: 0 to 2 errors cost nothing and extra errors only subtract 100 each.',
          ])
        )
      ) +
      `<p class="note">Aim to be decisive in the last 5 minutes: finish a half-done question rather than starting a new hard one.</p>`,
  });
  add({
    section: 'Wrap-up',
    title: 'Test strategy: dividing the work among three',
    html:
      `<p>You may separate the pages and work in any order (rule 3.d), and the exam is printed single-sided so each teammate can hold their own pages. Split by <strong>type of thinking</strong>, not by page order. This is a suggestion; swap roles to match your team.</p>` +
      table(
        [
          ['Role', 'Takes', 'Why'],
          ['<strong>A: word person</strong>', 'Timed Aristocrat, other Aristocrats, Patristocrat, Xenocrypt if anyone knows Spanish', 'Frequency and word patterns need a feel for English'],
          ['<strong>B: table person</strong>', 'Atbash, Caesar, Nihilist, Baconian, Checkerboard, Porta', 'Careful lookups and arithmetic. Checkerboard is a likely bonus'],
          ['<strong>C: logic person</strong>', 'Homophonic, Complete Columnar, then Cryptarithm and Fractionated Morse if time is left', 'Needs search and patience. Homophonic is a certain bonus'],
        ],
        { head: true, cls: 'list' }
      ) +
      cols(
        card(
          'Timeline',
          steps([
            '<strong>0 to 5 min:</strong> all three on the timed Aristocrat, since each minute is 120 points. A leads and writes the guesses; B counts letters; C hunts for the hint word and short words. Whoever sees it gives the signal.',
            '<strong>5 to 35 min:</strong> split as in the table. Hand your finished pages to the signal person, and write the final answer on that question\u2019s page.',
            '<strong>Around 35 min:</strong> quick check-in. Say what is stuck and what is nearly done.',
            '<strong>35 to 45 min:</strong> whoever is free takes the nearest-to-finished question, or a bonus question.',
            '<strong>Last 5 min:</strong> everyone fills every blank with a best guess and checks the numbered answers.',
          ])
        ),
        card(
          'Working rules',
          tips([
            'If you are stuck on a question for about 10 minutes, <strong>pass the page</strong> to a teammate. A fresh view often sees the word you missed, and your pencil work stays on the page.',
            'Each person writes the question\u2019s points at the top of their pages, so the team can see where the points are.',
            'The finished person never sits idle: ask the others which question to take next.',
            'Do not let all three attack the same hard cipher. Two on Fractionated Morse means two fewer easy questions done.',
            'Keep the resource sheet next to the cipher that needs it (Porta table, Morse table, Baconian mappings, letter frequencies).',
          ])
        )
      ),
  });
  add({
    section: 'Wrap-up',
    title: 'Test strategy: what the bonus questions will be',
    html:
      cols(
        card(
          'What the rules guarantee',
          tips([
            '<strong>Homophonic: at least one</strong> special bonus question uses it (rules 3.e.xii or 3.f.vi).',
            'Up to three bonus questions, and none is an Aristocrat, Patristocrat or Xenocrypt.',
            'Bonus questions are marked on the exam, so you will see them.',
          ])
        ),
        card(
          'What is likely',
          tips([
            '<strong>Checkerboard: very likely.</strong> The webinar said so, and the data agrees: it was a bonus question in <strong>all 27</strong> 2026 Division B sample tests (not stated in the rules, so still not a guarantee).',
            'The other two bonus slots rotated in those tests. Regional: Baconian and Fractionated Morse (all 14). State: Nihilist and Affine (all 13). Affine is gone in 2027 and Homophonic is guaranteed, so expect Homophonic to take a slot.',
            'Bonus questions averaged about 310 (Regional) and 330 (State) points, plus the special bonus for solving them.',
          ])
        )
      ) +
      card(
        'Study order for the bonus',
        steps([
          'Homophonic until you can finish it reliably: it is the only guaranteed one.',
          '<strong>Checkerboard</strong>, since the webinar flagged it. Know the missing-label trick: all 10 row and column letters must appear in the ciphertext.',
          'Nihilist and Baconian: the most points per minute, and both rotated into the bonus slots.',
          'Complete Columnar next.',
          'Fractionated Morse and Cryptarithm last; learn them only if the rest is solid.',
        ])
      ),
  });

  add({
    section: 'Wrap-up',
    title: 'Sources and caveats',
    html:
      cols(
        card('Sources', `<ul class="links">
          <li><a href="https://www.soinc.org/codebusters-b" target="_blank" rel="noopener">Science Olympiad: Codebusters (Division B)</a></li>
          <li><a href="https://toebes.com/codebusters/Rule-Summary-2027.html" target="_blank" rel="noopener">Toebes: 2027 rules summary</a></li>
          <li><a href="https://toebes.com/codebusters/CodeBusters_Overview25.pdf" target="_blank" rel="noopener">Toebes: Codebusters overview guide (2025)</a></li>
          <li><a href="https://toebes.com/codebusters/TestBuild.html" target="_blank" rel="noopener">Toebes: test builder (question wording)</a></li>
          <li><a href="https://toebes.com/codebusters/samples.html" target="_blank" rel="noopener">Toebes: 2026 sample tests (source of the points data)</a></li>
          <li><a href="https://toebes.com/codebusters/index.html" target="_blank" rel="noopener">Toebes: past practice tests</a></li>
          <li><a href="https://www.cryptogram.org/downloads/aca.info/ciphers/Checkerboard.pdf" target="_blank" rel="noopener">ACA: Checkerboard</a></li>
          <li><a href="https://www.cryptogram.org/downloads/aca.info/ciphers/Homophonic.pdf" target="_blank" rel="noopener">ACA: Homophonic</a></li>
        </ul>`),
        card('Caveats', tips([
          'The <strong>official Rules Manual</strong> always takes precedence over this deck.',
          'Rules content comes from the official 2027 Division B Rules Manual (Codebusters section, PDF pages 19–20).',
          'Worked examples follow the Toebes 2025 overview guide and ACA documents; the mechanics are the same. K2 and K3 alphabets appear in those guides but not in the Division B rules, so they are not covered.',
          'The exam-sheet slides use question wording modelled on the Toebes test builder and past tests. The texts and keys are my own examples, not copied from any past exam. Where a cryptanalysis question would give only a crib, a few slides give the key so you can practise the mechanics.',
          'The difficulty ordering is my judgement.',
        ]))
      ),
  });

  /* Put the cipher sections in ladder order and renumber them. */
  (function reorder() {
    const num = /^\d+ · (.+)$/;
    const firstCipher = slides.findIndex((s) => num.test(s.section));
    const lastCipher = slides.length - 1 - [...slides].reverse().findIndex((s) => num.test(s.section));
    const body = slides.slice(firstCipher, lastCipher + 1);
    const byName = new Map();
    for (const s of body) {
      const name = s.section.match(num)[1];
      if (!byName.has(name)) byName.set(name, []);
      byName.get(name).push(s);
    }
    const sorted = [];
    LADDER_ORDER.forEach((name, i) => {
      for (const s of byName.get(name) || []) {
        s.section = `${i + 1} · ${name}`;
        sorted.push(s);
      }
    });
    slides.splice(firstCipher, body.length, ...sorted);
  })();

  window.Slides = { slides, TOOLS, SHEETS };
})();
