/* ============================================================
   QuizMaster Pro — app.js
   ============================================================ */

const BASE = 'http://localhost:8080/api';

// ─── STATE ────────────────────────────────────────────────────
let token            = localStorage.getItem('qmToken') || null;
let currentUser      = JSON.parse(localStorage.getItem('qmUser') || 'null');
let allQuizzes       = [];
let filteredQuizzes  = [];
let activeQCat       = 'ALL';
let currentQuiz      = null;
let currentQuestions = [];
let currentAnswers   = {};
let currentQIndex    = 0;
let timerInterval    = null;
let timerMax         = 0;
let timerLeft        = 0;
let quizStartTime    = null;
let notes            = JSON.parse(localStorage.getItem('qmNotes') || '[]');
let activeNoteId     = null;
let noteCatFilter    = 'ALL';
let subjectNotes     = JSON.parse(localStorage.getItem('qmSubjectNotes') || '{}');
let activeSubjectId  = null;
let monacoEditors    = {};
let questionLanguages = {};

const PROTECTED_PAGES = new Set([
  'quizzes','attempt','result','results','notes','leaderboard','admin'
]);

const CS_SUBJECTS = [
  { id:'dsa',      code:'DSA',  title:'Data Structures & Algorithms', icon:'⌘', color:'#f0c040', summary:'Arrays, trees, graphs, sorting, dynamic programming' },
  { id:'os',       code:'OS',   title:'Operating Systems',            icon:'◫', color:'#6fb3ff', summary:'Processes, memory, scheduling, deadlocks, files' },
  { id:'dbms',     code:'DBMS', title:'Database Management Systems',  icon:'▦', color:'#50fa7b', summary:'SQL, normalization, transactions, indexing' },
  { id:'cn',       code:'CN',   title:'Computer Networks',            icon:'⇄', color:'#ff8a65', summary:'OSI, TCP/IP, routing, DNS, congestion control' },
  { id:'oops',     code:'OOP',  title:'Object Oriented Programming',  icon:'◇', color:'#c084fc', summary:'Classes, inheritance, polymorphism, design basics' },
  { id:'coa',      code:'COA',  title:'Computer Organization',        icon:'▣', color:'#ff5555', summary:'CPU, memory hierarchy, instruction formats, pipelines' },
  { id:'se',       code:'SE',   title:'Software Engineering',         icon:'✎', color:'#9ccc65', summary:'SDLC, testing, UML, requirements, project models' },
  { id:'toc',      code:'TOC',  title:'Theory of Computation',        icon:'λ', color:'#80deea', summary:'Automata, grammar, Turing machines, decidability' },
  { id:'compiler', code:'CD',   title:'Compiler Design',              icon:'{}',color:'#f48fb1', summary:'Lexing, parsing, semantic analysis, code generation' },
  { id:'ai',       code:'AI',   title:'Artificial Intelligence',      icon:'◎', color:'#b39ddb', summary:'Search, logic, ML basics, planning, agents' }
];

// ─── LANGUAGES ────────────────────────────────────────────────
const LANGUAGES = [
  { value:'javascript', label:'JavaScript', icon:'🟨' },
  { value:'python',     label:'Python',     icon:'🐍' },
  { value:'java',       label:'Java',       icon:'☕' },
  { value:'cpp',        label:'C++',        icon:'⚡' },
  { value:'c',          label:'C',          icon:'🔵' },
  { value:'csharp',     label:'C#',         icon:'💜' },
  { value:'typescript', label:'TypeScript', icon:'🔷' },
  { value:'go',         label:'Go',         icon:'🐹' },
  { value:'rust',       label:'Rust',       icon:'🦀' },
  { value:'php',        label:'PHP',        icon:'🐘' },
  { value:'ruby',       label:'Ruby',       icon:'💎' },
  { value:'swift',      label:'Swift',      icon:'🍎' },
  { value:'kotlin',     label:'Kotlin',     icon:'🎯' },
  { value:'sql',        label:'SQL',        icon:'🗄️' },
];

const STARTER_TEMPLATES = {
  javascript: `function solution() {\n  // write your code here\n  console.log();\n}`,
  python:     `def solution():\n    # write your code here\n    print()`,
  java:       `public class Main {\n    public static void main(String[] args) {\n        // write your code here\n    }\n}`,
  cpp:        `#include <iostream>\nusing namespace std;\n\nint main() {\n    // write your code here\n    return 0;\n}`,
  c:          `#include <stdio.h>\n\nint main() {\n    // write your code here\n    return 0;\n}`,
  csharp:     `using System;\n\nclass Solution {\n    static void Main() {\n        // write your code here\n    }\n}`,
  typescript: `function solution(): void {\n  // write your code here\n  console.log();\n}`,
  go:         `package main\n\nimport "fmt"\n\nfunc main() {\n    // write your code here\n    fmt.Println()\n}`,
  rust:       `fn main() {\n    // write your code here\n    println!();\n}`,
  php:        `<?php\n\n// write your code here\necho "";\n?>`,
  ruby:       `# write your code here\nputs ""`,
  swift:      `import Foundation\n\n// write your code here\nprint("")`,
  kotlin:     `fun main() {\n    // write your code here\n    println()\n}`,
  sql:        `-- write your SQL query here\nSELECT * FROM table_name;`,
};

// ─── CURSOR ───────────────────────────────────────────────────
let mx = 0, my = 0, cx = 0, cy = 0;
let cursorEl    = null;
let cursorDotEl = null;

document.addEventListener('DOMContentLoaded', () => {
  cursorEl    = document.getElementById('cursor');
  cursorDotEl = document.getElementById('cursorDot');
  startCursor();
});

function startCursor() {
  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    if (cursorDotEl) {
      cursorDotEl.style.left = mx + 'px';
      cursorDotEl.style.top  = my + 'px';
    }
  });

  (function animCursor() {
    cx += (mx - cx) * 0.12;
    cy += (my - cy) * 0.12;
    if (cursorEl) {
      cursorEl.style.left = cx + 'px';
      cursorEl.style.top  = cy + 'px';
    }
    requestAnimationFrame(animCursor);
  })();
}

// ─── NAV MOBILE ───────────────────────────────────────────────
function toggleMobile() {
  const links = document.getElementById('navLinks');
  links.style.display      = links.style.display === 'flex' ? 'none' : 'flex';
  links.style.flexDirection = 'column';
  links.style.position      = 'absolute';
  links.style.top           = '64px';
  links.style.left          = '0';
  links.style.right         = '0';
  links.style.background    = 'var(--bg2)';
  links.style.padding       = '16px 20px';
  links.style.borderBottom  = '1px solid var(--border)';
}

// ─── INIT ─────────────────────────────────────────────────────
window.onload = async () => {
  updateNav();
  showPage('home');
  await loadAllQuizzes();
  loadHomeStats();
  renderSubjectCovers();
  loadLeaderboard();
};

// ─── PAGE ROUTER ──────────────────────────────────────────────
function showPage(page) {
  if (PROTECTED_PAGES.has(page) && !token) {
    toast('Please sign in first.', 'error');
    page = 'auth';
  }
  if (page === 'admin') {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      toast('Access denied.', 'error');
      page = token ? 'quizzes' : 'auth';
    }
  }
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById('page-' + page);
  if (!el) return;
  el.classList.add('active');
  window.scrollTo(0, 0);

  if (page === 'quizzes')     renderQuizGrid(filteredQuizzes);
  if (page === 'results')     loadMyResults();
  if (page === 'leaderboard') loadLeaderboard();
  if (page === 'notes')       renderSubjectCovers();
  if (page === 'admin')       { loadAdminQuizList(); loadAdminQuizSelect(); }
}

function goCategory(cat) {
  if (!token) { toast('Please sign in first.', 'error'); showPage('auth'); return; }
  activeQCat = cat;
  document.querySelectorAll('.qcat-tab').forEach(b => {
    b.classList.toggle('active', b.dataset.cat === cat);
  });
  filterAndRender();
  showPage('quizzes');
}

// ─── NAV UPDATE ───────────────────────────────────────────────
function updateNav() {
  const li      = !!token;
  const isAdmin = currentUser?.role === 'ADMIN';

  document.getElementById('btnLogin').style.display   = li ? 'none' : '';
  document.getElementById('btnLogout').style.display  = li ? '' : 'none';
  document.getElementById('navUser').style.display    = li ? '' : 'none';
  document.getElementById('navResults').style.display = 'none';
  document.getElementById('navNotes').style.display   = li ? '' : 'none';

  if (li && currentUser) {
    document.getElementById('userName').textContent   = currentUser.username;
    document.getElementById('userAvatar').textContent = currentUser.username[0].toUpperCase();
  }

  let adminLink = document.getElementById('navAdmin');
  if (!adminLink) {
    adminLink = document.createElement('a');
    adminLink.id        = 'navAdmin';
    adminLink.className = 'nav-link';
    adminLink.textContent = 'Admin';
    adminLink.setAttribute('onclick', "showPage('admin')");
    document.getElementById('navLinks').appendChild(adminLink);
  }
  adminLink.style.display = isAdmin ? '' : 'none';
}

// ─── HTTP ─────────────────────────────────────────────────────
async function api(method, path, body = null, auth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(BASE + path, {
    method, headers,
    body: body ? JSON.stringify(body) : null
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
  return data;
}

// ─── AUTH ─────────────────────────────────────────────────────
function switchAuthTab(tab) {
  document.getElementById('aform-login').style.display    = tab === 'login'    ? '' : 'none';
  document.getElementById('aform-register').style.display = tab === 'register' ? '' : 'none';
  document.getElementById('atab-login').classList.toggle('active', tab === 'login');
  document.getElementById('atab-register').classList.toggle('active', tab === 'register');
  document.getElementById('authMsg').className = 'auth-msg';
}

async function login() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const msg      = document.getElementById('authMsg');
  if (!username || !password) { setMsg(msg, 'Fill in all fields', 'error'); return; }
  try {
    const d = await api('POST', '/auth/login', { username, password }, false);
    saveAuth(d);
    toast('Welcome back, ' + d.username + '! 👋', 'success');
    showPage(d.role === 'ADMIN' ? 'admin' : 'quizzes');
  } catch (e) {
    setMsg(msg, e.message, 'error');
  }
}

async function register() {
  const username = document.getElementById('regUsername').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const msg      = document.getElementById('authMsg');
  if (!username || !email || !password) { setMsg(msg, 'Fill in all fields', 'error'); return; }
  try {
    const d = await api('POST', '/auth/register', { username, email, password }, false);
    saveAuth(d);
    toast('Account created! Welcome 🎉', 'success');
    showPage('quizzes');
  } catch (e) {
    setMsg(msg, e.message, 'error');
  }
}

function saveAuth(d) {
  token       = d.token;
  currentUser = { username: d.username, role: d.role, userId: d.userId };
  localStorage.setItem('qmToken', token);
  localStorage.setItem('qmUser', JSON.stringify(currentUser));
  updateNav();
}

function logout() {
  token = null; currentUser = null;
  localStorage.removeItem('qmToken');
  localStorage.removeItem('qmUser');
  updateNav();
  showPage('home');
  toast('Signed out successfully');
}

// ─── HOME STATS ───────────────────────────────────────────────
function loadHomeStats() {
  const counts = {};
  allQuizzes.forEach(q => { counts[q.category] = (counts[q.category] || 0) + 1; });
  document.getElementById('statQuizzes').textContent = allQuizzes.length;

  const cats = { SCIENCE:'fcScience', TECHNOLOGY:'fcTech', MATHEMATICS:'fcMath' };
  for (const [cat, id] of Object.entries(cats)) {
    const el = document.getElementById(id);
    if (el) el.textContent = (counts[cat] || 0) + ' quiz' + ((counts[cat] || 0) !== 1 ? 'zes' : '');
  }
  const catEls = {
    SCIENCE:'catCntScience', MATHEMATICS:'catCntMath',
    HISTORY:'catCntHistory', TECHNOLOGY:'catCntTech', SPORTS:'catCntSports'
  };
  for (const [cat, id] of Object.entries(catEls)) {
    const el = document.getElementById(id);
    const n  = counts[cat] || 0;
    if (el) el.textContent = n + ' quiz' + (n !== 1 ? 'zes' : '');
  }
}

// ─── QUIZZES ──────────────────────────────────────────────────
async function loadAllQuizzes() {
  try {
    allQuizzes = await api('GET', '/quizzes/all', null, false);
    if (!Array.isArray(allQuizzes)) allQuizzes = [];
    filteredQuizzes = [...allQuizzes];
  } catch (e) {
    allQuizzes = []; filteredQuizzes = [];
    toast('Could not reach backend. Please try again later.', 'error');
  }
}

function setQCat(cat, btn) {
  activeQCat = cat;
  document.querySelectorAll('.qcat-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  filterAndRender();
}

function filterQuizzes() { filterAndRender(); }

function filterAndRender() {
  const search = (document.getElementById('quizSearch')?.value || '').toLowerCase();
  filteredQuizzes = allQuizzes.filter(q => {
    const catOk    = activeQCat === 'ALL' || q.category === activeQCat;
    const searchOk = !search ||
      q.title.toLowerCase().includes(search) ||
      (q.description || '').toLowerCase().includes(search) ||
      q.category.toLowerCase().includes(search);
    return catOk && searchOk;
  });
  renderQuizGrid(filteredQuizzes);
}

function renderQuizGrid(quizzes) {
  const grid = document.getElementById('quizGrid');
  if (!grid) return;
  if (!quizzes || !quizzes.length) {
    grid.innerHTML = `<div class="empty-state"><span>🔍</span>No quizzes found.</div>`;
    return;
  }
  grid.innerHTML = quizzes.map(q => `
    <div class="quiz-card" onclick="startQuiz(${JSON.stringify(q.id)})">
      <div class="qc-top">
        <span class="qc-badge badge-${q.category}">${q.category}</span>
        <span class="qc-time">⏱ ${q.timeLimitMinutes}m</span>
      </div>
      <h3>${esc(q.title)}</h3>
      <p>${esc(q.description || 'Test your knowledge.')}</p>
      <div class="qc-meta">
        <span>📝 ${q.questionCount || 0} questions</span>
        <span>👤 ${esc(q.createdBy || 'Admin')}</span>
      </div>
      <button class="qc-start"
        onclick="event.stopPropagation(); startQuiz(${JSON.stringify(q.id)})">
        Start Quiz <span>→</span>
      </button>
    </div>`).join('');
}

// ─── QUIZ ATTEMPT ─────────────────────────────────────────────
async function startQuiz(quizId) {
  if (!token) { toast('Please sign in first.', 'error'); showPage('auth'); return; }
  toast('Loading quiz...', '');
  try {
    const [quiz, questions] = await Promise.all([
      api('GET', '/quizzes/' + quizId, null, false),
      api('GET', '/questions/quiz/' + quizId)
    ]);
    if (!questions || questions.length === 0) {
      toast('This quiz has no questions yet!', 'error'); return;
    }
    currentQuiz       = quiz;
    currentQuestions  = questions;
    currentAnswers    = {};
    currentQIndex     = 0;
    quizStartTime     = Date.now();
    monacoEditors     = {};
    questionLanguages = {};

    document.getElementById('sbTitle').textContent  = quiz.title;
    document.getElementById('sbCat').textContent    = quiz.category;
    document.getElementById('qTotalSb').textContent = questions.length;

    showPage('attempt');
    renderQuestion();
    buildQMap();
    startTimer(quiz.timeLimitMinutes * 60);
    toast('Quiz started! Good luck 🍀', 'success');
  } catch (e) {
    toast('Failed to load quiz: ' + e.message, 'error');
  }
}

// ─── RENDER QUESTION ──────────────────────────────────────────
function renderQuestion() {
  const q     = currentQuestions[currentQIndex];
  const total = currentQuestions.length;

  document.getElementById('qCurrent').textContent = currentQIndex + 1;
  document.getElementById('qTotal').textContent   = total;
  document.getElementById('aqMarks').textContent  =
      (q.marks || 1) + ' mark' + ((q.marks || 1) > 1 ? 's' : '');

  const answered = Object.values(currentAnswers)
      .filter(v => String(v || '').trim()).length;
  document.getElementById('qDone').textContent       = answered;
  document.getElementById('asbProgFill').style.width = ((answered / total) * 100) + '%';

  if (q.type === 'CODING') {
    renderCodingQuestion(q, total);
  } else {
    const sel = currentAnswers[q.id] || '';
    document.getElementById('questionArea').innerHTML = `
      <div class="question-text">${currentQIndex + 1}. ${esc(q.questionText)}</div>
      <div class="options-grid">
        ${['A','B','C','D'].map(opt => `
          <button class="opt-btn ${sel === opt ? 'selected' : ''}"
            onclick="selectAnswer('${opt}')">
            <div class="opt-letter">${opt}</div>
            <div class="opt-text">${esc(q['option' + opt] || '')}</div>
          </button>`).join('')}
      </div>`;
  }

  document.getElementById('btnPrev').style.visibility =
      currentQIndex === 0 ? 'hidden' : 'visible';
  document.getElementById('btnNext').style.display =
      currentQIndex < total - 1 ? '' : 'none';

  buildDots();
  updateQMap();
}

// ─── RENDER CODING QUESTION ───────────────────────────────────
function renderCodingQuestion(q, total) {
  const editorId    = 'monaco-editor-' + q.id;
  const currentLang = questionLanguages[q.id] || 'javascript';
  const starterCode = (q.starterCode || STARTER_TEMPLATES.javascript).replace(/\\n/g, '\n');
  const savedCode   = currentAnswers[q.id] || starterCode;

  const langOptions = LANGUAGES.map(l =>
    `<option value="${l.value}" ${currentLang === l.value ? 'selected' : ''}>${l.icon} ${l.label}</option>`
  ).join('');

  document.getElementById('questionArea').innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap">
      <span style="font-family:var(--mono);font-size:0.7rem;padding:4px 12px;border-radius:6px;
        background:rgba(240,192,64,0.12);border:1px solid rgba(240,192,64,0.3);color:var(--gold)">
        ⚡ CODING QUESTION
      </span>
      <span style="font-family:var(--mono);font-size:0.7rem;padding:4px 12px;border-radius:6px;
        border:1px solid var(--border2);color:var(--text2)">
        ${q.marks || 1} marks
      </span>
    </div>

    <div class="question-text">${currentQIndex + 1}. ${esc(q.questionText)}</div>

    ${q.sampleInput ? `
    <div class="sample-io">
      <div class="sio-box">
        <div class="sio-label">Sample Input</div>
        <pre>${esc(q.sampleInput)}</pre>
      </div>
      <div class="sio-box">
        <div class="sio-label">Expected Output</div>
        <pre>${esc(q.expectedOutput || '—')}</pre>
      </div>
    </div>` : ''}

    <div class="coding-ide">
      <div class="ide-topbar">
        <div style="display:flex;align-items:center;gap:10px">
          <select class="ide-lang-select" id="lang-select-${q.id}"
            onchange="switchLanguage(${q.id}, this.value)">
            ${langOptions}
          </select>
          <button class="ide-reset-btn" onclick="resetCode(${q.id})">↺ Reset</button>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <div class="ide-status-bar">
            <div class="ide-status-dot" id="ide-dot-${q.id}"></div>
            <span id="ide-status-${q.id}">Ready</span>
          </div>
          <button class="ide-run-btn" id="run-btn-${q.id}"
            onclick="runCode(${q.id}, '${esc(q.expectedOutput || '')}')">
            ▶ Run Code
          </button>
        </div>
      </div>

      <div class="ide-editor-wrap" id="${editorId}"></div>

      <div class="ide-bottom">
        <div class="ide-panel">
          <div class="ide-panel-label">Input</div>
          <pre>${esc(q.sampleInput || 'No sample input')}</pre>
        </div>
        <div class="ide-panel">
          <div class="ide-panel-label">Output</div>
          <div id="ide-output-${q.id}">
            <pre style="color:#f0c040">Click Run to execute...</pre>
          </div>
        </div>
      </div>
    </div>

    ${q.explanation ? `
    <div style="margin-top:12px;padding:12px 16px;background:var(--bg2);
      border:1px solid var(--border);border-radius:var(--radius);
      font-size:0.82rem;color:var(--text2)">
      💡 <strong>Hint:</strong> ${esc(q.explanation)}
    </div>` : ''}
  `;

  setTimeout(() => initMonacoEditor(q.id, savedCode, currentLang), 100);
}

// ─── MONACO INIT ──────────────────────────────────────────────
function initMonacoEditor(questionId, code, language) {
  if (!window.monacoReady || typeof monaco === 'undefined') {
    setTimeout(() => initMonacoEditor(questionId, code, language), 200);
    return;
  }

  const editorId  = 'monaco-editor-' + questionId;
  const container = document.getElementById(editorId);
  if (!container) return;

  if (monacoEditors[questionId]) {
    monacoEditors[questionId].dispose();
    delete monacoEditors[questionId];
  }

  const editor = monaco.editor.create(container, {
    value:                code || STARTER_TEMPLATES[language] || '',
    language:             language || 'javascript',
    theme:                'quizmaster-dark',
    fontSize:             14,
    fontFamily:           "'DM Mono', 'Fira Code', 'Consolas', monospace",
    fontLigatures:        true,
    minimap:              { enabled: false },
    scrollBeyondLastLine: false,
    lineNumbers:          'on',
    roundedSelection:     true,
    automaticLayout:      true,
    tabSize:              2,
    wordWrap:             'on',
    padding:              { top: 14, bottom: 14 },
    overviewRulerLanes:   0,
    scrollbar:            { vertical:'auto', horizontal:'hidden', verticalScrollbarSize:5 },
    suggest:              { showKeywords: true },
    quickSuggestions:     true,
    cursorBlinking:       'smooth',
    cursorStyle:          'line',
    renderLineHighlight:  'line',
  });

  monacoEditors[questionId] = editor;

  editor.onDidChangeModelContent(() => {
    currentAnswers[questionId] = editor.getValue();
    const ans   = Object.values(currentAnswers).filter(v => String(v||'').trim()).length;
    const total = currentQuestions.length;
    document.getElementById('qDone').textContent       = ans;
    document.getElementById('asbProgFill').style.width = ((ans/total)*100)+'%';
    updateQMap();
    buildDots();
  });
}

// ─── SWITCH LANGUAGE ──────────────────────────────────────────
function switchLanguage(questionId, newLang) {
  questionLanguages[questionId] = newLang;
  const editor = monacoEditors[questionId];
  if (!editor) return;

  const model = editor.getModel();
  if (model) monaco.editor.setModelLanguage(model, newLang);

  const currentCode = editor.getValue().trim();
  const isDefault   = Object.values(STARTER_TEMPLATES).some(t => t.trim() === currentCode) || !currentCode;
  if (isDefault) {
    editor.setValue(STARTER_TEMPLATES[newLang] || `// Write your ${newLang} solution here\n`);
  }

  const langLabel = LANGUAGES.find(l => l.value === newLang)?.label || newLang;
  toast('Switched to ' + langLabel, '');
}

// ─── RESET CODE ───────────────────────────────────────────────
function resetCode(questionId) {
  const editor = monacoEditors[questionId];
  if (!editor) return;
  const lang     = questionLanguages[questionId] || 'javascript';
  const template = STARTER_TEMPLATES[lang] || '// write your solution here\n';
  if (confirm('Reset code to starter template?')) {
    editor.setValue(template);
    delete currentAnswers[questionId];
    updateQMap(); buildDots();
    toast('Code reset');
  }
}

// ─── RUN CODE ─────────────────────────────────────────────────
// Using local code execution server at http://localhost:3000
// Start it with: cd code-execution/backend && npm start

const LOCAL_LANG_MAP = {
  python: 'python',
  java:   'java',
  cpp:    'cpp',
  c:      'c',
  go:     'go',
};

async function runCode(questionId, expectedOutput) {
  const editor   = monacoEditors[questionId];
  const outputEl = document.getElementById('ide-output-' + questionId);
  const runBtn   = document.getElementById('run-btn-' + questionId);
  const statusEl = document.getElementById('ide-status-' + questionId);
  const dotEl    = document.getElementById('ide-dot-' + questionId);
  const lang     = questionLanguages[questionId] || 'javascript';

  if (!editor) return;
  const code = editor.getValue();
  if (!code.trim()) {
    outputEl.innerHTML = `<pre style="color:#ff5555;font-family:var(--mono);font-size:0.82rem">⚠ Write some code first</pre>`;
    return;
  }

  // Save answer
  currentAnswers[questionId] = code;
  const ans   = Object.values(currentAnswers).filter(v => String(v||'').trim()).length;
  const total = currentQuestions.length;
  document.getElementById('qDone').textContent       = ans;
  document.getElementById('asbProgFill').style.width = ((ans/total)*100)+'%';
  updateQMap(); buildDots();

  // Running state UI
  runBtn.disabled         = true;
  runBtn.style.opacity    = '0.7';
  runBtn.style.cursor     = 'not-allowed';
  runBtn.style.background = '#f0c040';
  runBtn.textContent      = '⏳ Running...';
  if (statusEl) statusEl.textContent   = 'Running';
  if (dotEl)    dotEl.style.background = '#f0c040';
  outputEl.innerHTML = `<pre style="color:#f0c040;font-family:var(--mono);font-size:0.82rem">⏳ Compiling & running your code...</pre>`;

  // ── JavaScript: run locally in browser ──────────────────────
  if (lang === 'javascript') {
    try {
      const logs = [];
      const sandboxConsole = {
        log:   (...a) => logs.push(a.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' ')),
        error: (...a) => logs.push('ERROR: ' + a.join(' ')),
        warn:  (...a) => logs.push('WARN: '  + a.join(' ')),
        info:  (...a) => logs.push(a.join(' ')),
      };
      const fn = new Function('console', code);
      fn(sandboxConsole);
      const output = logs.join('\n') || '(no output — use console.log to print)';
      showCodeResult(outputEl, runBtn, statusEl, dotEl, output, false, expectedOutput);
    } catch (err) {
      showCodeResult(outputEl, runBtn, statusEl, dotEl, err.message, true, expectedOutput);
    }
    return;
  }

  // ── All other languages: local execution server ──────────────
  const serverLang = LOCAL_LANG_MAP[lang];
  if (!serverLang) {
    showCodeResult(outputEl, runBtn, statusEl, dotEl,
      `"${lang}" is not supported yet.\nSupported: JavaScript, Java, Python, C, C++, Go.`,
      false, expectedOutput);
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/api/execute', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: serverLang,
        code:     code,
        input:    currentQuestions[currentQIndex]?.sampleInput || ''
      })
    });

    if (!res.ok) throw new Error('Server error: ' + res.status);
    const data = await res.json();

    const output  = (data.stdout || data.stderr || '(no output)').trim();
    const isError = !data.success;

    showCodeResult(outputEl, runBtn, statusEl, dotEl, output, isError, expectedOutput);

  } catch (err) {
    showCodeResult(outputEl, runBtn, statusEl, dotEl,
      '❌ Local runner not reachable.\n\nMake sure your code execution server is running:\n  cd code-execution/backend\n  npm start\n\nError: ' + err.message,
      true, expectedOutput);
  }
}

// ─── Shared result renderer ────────────────────────────────────
function showCodeResult(outputEl, runBtn, statusEl, dotEl, output, isError, expectedOutput) {
  const expected  = (expectedOutput || '').trim().toLowerCase();
  const actualOut = output.trim().toLowerCase();
  const isMatch   = !isError && expected && actualOut.includes(expected);

  if (isError) {
    outputEl.innerHTML = `
      <pre style="font-family:var(--mono);font-size:0.82rem;color:#ff5555;margin:0;white-space:pre-wrap">${esc(output)}</pre>`;
  } else if (isMatch) {
    outputEl.innerHTML = `
      <div style="margin-bottom:8px;padding:6px 10px;background:rgba(80,250,123,0.1);
        border:1px solid rgba(80,250,123,0.3);border-radius:6px;
        font-family:var(--mono);font-size:0.8rem;color:#50fa7b;font-weight:bold">
        ✅ Correct! Output matches expected.
      </div>
      <pre style="font-family:var(--mono);font-size:0.82rem;color:#50fa7b;margin:0;white-space:pre-wrap">${esc(output)}</pre>`;
  } else if (!isError && expected) {
    outputEl.innerHTML = `
      <div style="margin-bottom:6px;padding:6px 10px;background:rgba(255,85,85,0.1);
        border:1px solid rgba(255,85,85,0.3);border-radius:6px;
        font-family:var(--mono);font-size:0.8rem;color:#ff5555;font-weight:bold">
        ❌ Wrong Answer
      </div>
      <div style="margin-bottom:4px;font-family:var(--mono);font-size:0.75rem;color:#aaa">Your Output:</div>
      <pre style="font-family:var(--mono);font-size:0.82rem;color:#f0f0f0;margin:0 0 10px;
        white-space:pre-wrap;padding:6px 10px;background:rgba(255,85,85,0.07);
        border-radius:4px;border-left:3px solid #ff5555">${esc(output) || '(no output)'}</pre>
      <div style="margin-bottom:4px;font-family:var(--mono);font-size:0.75rem;color:#aaa">✅ Correct Output:</div>
      <pre style="font-family:var(--mono);font-size:0.82rem;color:#50fa7b;margin:0;
        white-space:pre-wrap;padding:6px 10px;background:rgba(80,250,123,0.07);
        border-radius:4px;border-left:3px solid #50fa7b">${esc((expectedOutput||'').trim())}</pre>`;
  } else {
    outputEl.innerHTML = `
      <pre style="font-family:var(--mono);font-size:0.82rem;color:#f0f0f0;margin:0;white-space:pre-wrap">${esc(output)}</pre>`;
  }

  runBtn.disabled         = false;
  runBtn.style.opacity    = '1';
  runBtn.style.cursor     = 'pointer';
  runBtn.style.background = isMatch ? '#50fa7b' : isError ? '#ff5555' : '#f0c040';
  runBtn.textContent      = '▶ Run Code';
  if (statusEl) statusEl.textContent   = isError ? 'Error' : isMatch ? 'Passed ✓' : expected ? 'Wrong ✗' : 'Done';
  if (dotEl)    dotEl.style.background = isError ? '#ff5555' : isMatch ? '#50fa7b' : expected ? '#ff5555' : '#f0c040';
}

// ─── MCQ ──────────────────────────────────────────────────────
function selectAnswer(opt) {
  currentAnswers[currentQuestions[currentQIndex].id] = opt;
  renderQuestion();
}

function prevQuestion() {
  if (currentQIndex > 0) { currentQIndex--; renderQuestion(); }
}
function nextQuestion() {
  if (currentQIndex < currentQuestions.length - 1) { currentQIndex++; renderQuestion(); }
}

function buildQMap() {
  const map = document.getElementById('qMap');
  if (!map) return;
  map.innerHTML = currentQuestions.map((_, i) =>
    `<div class="qm-btn ${i===0?'current':''}" id="qmb-${i}" onclick="jumpTo(${i})">${i+1}</div>`
  ).join('');
}

function updateQMap() {
  currentQuestions.forEach((q, i) => {
    const btn = document.getElementById('qmb-' + i);
    if (!btn) return;
    btn.className = 'qm-btn' +
      (i === currentQIndex ? ' current' : '') +
      (String(currentAnswers[q.id]||'').trim() ? ' answered' : '');
  });
}

function jumpTo(i) { currentQIndex = i; renderQuestion(); }

function buildDots() {
  const dotsEl = document.getElementById('aqDots');
  if (!dotsEl) return;
  dotsEl.innerHTML = currentQuestions.map((q, i) =>
    `<div class="aq-dot ${i===currentQIndex?' current':''} ${String(currentAnswers[q.id]||'').trim()?' answered':''}"
      onclick="jumpTo(${i})"></div>`
  ).join('');
}

// ─── TIMER ────────────────────────────────────────────────────
function startTimer(seconds) {
  clearInterval(timerInterval);
  timerMax = seconds; timerLeft = seconds;

  function tick() {
    timerLeft--;
    const m = Math.floor(timerLeft/60).toString().padStart(2,'0');
    const s = (timerLeft%60).toString().padStart(2,'0');
    document.getElementById('timerDisplay').textContent = m+':'+s;

    const pct    = timerLeft / timerMax;
    const circ   = 2 * Math.PI * 42;
    const offset = circ * (1 - pct);
    const ring   = document.getElementById('ringFill');
    if (ring) {
      ring.style.strokeDashoffset = offset;
      ring.classList.toggle('danger', timerLeft <= 60);
    }
    if (timerLeft <= 0) {
      clearInterval(timerInterval);
      toast("Time's up!", 'error');
      submitQuiz();
    }
  }
  tick();
  timerInterval = setInterval(tick, 1000);
}

// ─── SUBMIT QUIZ ──────────────────────────────────────────────
async function submitQuiz() {
  // Save all Monaco editor answers
  currentQuestions.forEach(q => {
    if (q.type === 'CODING') {
      const editor = monacoEditors[q.id];
      if (editor) {
        const code = editor.getValue();
        if (code && code.trim()) currentAnswers[q.id] = code;
      }
    }
  });

  const answered = Object.values(currentAnswers).filter(v => String(v||'').trim()).length;
  const total    = currentQuestions.length;
  if (answered < total && !confirm(`You answered ${answered}/${total}. Submit anyway?`)) return;

  clearInterval(timerInterval);
  const timeTaken = Math.round((Date.now() - quizStartTime) / 1000);

  try {
    const result = await api('POST', '/results/submit', {
      quizId:  currentQuiz.id,
      answers: currentAnswers
    });
    showResult(result, timeTaken);
  } catch (e) {
    toast('Submit failed: ' + e.message, 'error');
  }
}

// ─── SHOW RESULT ──────────────────────────────────────────────
function showResult(result, timeTaken) {
  showPage('result');
  const isFail  = result.grade === 'F';
  const gradeEl = document.getElementById('rcGrade');
  gradeEl.textContent = result.grade;
  gradeEl.className   = 'rc-grade' + (isFail ? ' fail' : '');

  const titles = {
    'A+':'Outstanding! 🏆','A':'Excellent! 🌟','B':'Great work! 👏',
    'C':'Good effort! 💪','D':'Keep trying! 📚','F':'Don\'t give up! 🔥'
  };
  document.getElementById('rcTitle').textContent    = titles[result.grade] || 'Done!';
  document.getElementById('rcSubtitle').textContent = currentQuiz?.title || '';
  document.getElementById('rcScore').textContent    = result.score + '/' + result.totalMarks;
  document.getElementById('rcCorrect').textContent  = result.correctAnswers + '/' + result.totalQuestions;
  document.getElementById('rcPercent').textContent  = result.percentage + '%';

  const m = Math.floor(timeTaken/60), s = timeTaken%60;
  document.getElementById('rcTime').textContent = m > 0 ? `${m}m ${s}s` : `${s}s`;

  setTimeout(() => {
    document.getElementById('rcBarFill').style.width = result.percentage + '%';
  }, 200);

  if (!isFail) spawnConfetti();
}

function spawnConfetti() {
  const el = document.getElementById('confetti');
  if (!el) return;
  const colors = ['#f0c040','#50fa7b','#6fb3ff','#ff5555','#c084fc'];
  for (let i = 0; i < 60; i++) {
    const dot = document.createElement('div');
    dot.style.cssText = `
      position:absolute;width:8px;height:8px;border-radius:50%;
      background:${colors[i%colors.length]};
      left:${Math.random()*100}%;top:-10px;
      animation:confetti-fall ${1.5+Math.random()*2}s ${Math.random()*0.8}s ease-in forwards;
    `;
    el.appendChild(dot);
  }
  const style = document.createElement('style');
  style.textContent = `@keyframes confetti-fall{to{top:110%;transform:rotate(720deg) translateX(${Math.random()*200-100}px);opacity:0}}`;
  document.head.appendChild(style);
  setTimeout(() => { el.innerHTML = ''; }, 4000);
}

// ─── MY RESULTS ───────────────────────────────────────────────
async function loadMyResults() {
  if (!token) {
    document.getElementById('resultsList').innerHTML = '<div class="no-results">Sign in to view your results.</div>';
    return;
  }
  document.getElementById('resultsList').innerHTML = '<div class="no-results">Loading...</div>';
  try {
    const results = await api('GET', '/results/my');
    renderResults(results);
  } catch (e) {
    document.getElementById('resultsList').innerHTML = '<div class="no-results">Could not load results.</div>';
  }
}

function renderResults(results) {
  const listEl    = document.getElementById('resultsList');
  const summaryEl = document.getElementById('rpageSummary');
  if (!results || !results.length) {
    listEl.innerHTML    = '<div class="no-results">No results yet. Take your first quiz!</div>';
    summaryEl.innerHTML = '';
    return;
  }
  const avg    = results.reduce((a,r) => a + r.percentage, 0) / results.length;
  const best   = Math.max(...results.map(r => r.percentage));
  const passes = results.filter(r => r.percentage >= 50).length;

  summaryEl.innerHTML = `
    <div class="rs-card"><div class="rs-card-val">${results.length}</div><div class="rs-card-label">Quizzes Taken</div></div>
    <div class="rs-card"><div class="rs-card-val">${avg.toFixed(1)}%</div><div class="rs-card-label">Average Score</div></div>
    <div class="rs-card"><div class="rs-card-val">${best}%</div><div class="rs-card-label">Best Score</div></div>
    <div class="rs-card"><div class="rs-card-val">${passes}/${results.length}</div><div class="rs-card-label">Passed</div></div>`;

  listEl.innerHTML = results.map(r => `
    <div class="rt-row">
      <div class="rt-quiz">${esc(r.quizTitle)}</div>
      <div><span class="qc-badge badge-${r.category}">${r.category}</span></div>
      <div class="rt-score">${r.score}/${r.totalMarks} (${r.percentage}%)</div>
      <div class="rt-grade ${r.grade==='F'?'fail':''}">${r.grade}</div>
      <div class="rt-date">${fmtDate(r.submittedAt)}</div>
    </div>`).join('');
}

// ─── LEADERBOARD ──────────────────────────────────────────────
async function loadLeaderboard() {
  const podium = document.getElementById('lbPodium');
  const table  = document.getElementById('lbTable');
  if (!podium || !table) return;

  const mockPlayers = [
    { name:'Priyanshu S.', quizzes:12, best:98, avg:87 },
    { name:'Aryan K.',     quizzes:9,  best:95, avg:82 },
    { name:'Sneha R.',     quizzes:15, best:93, avg:79 },
    { name:'Rahul M.',     quizzes:7,  best:91, avg:76 },
    { name:'Nisha P.',     quizzes:11, best:88, avg:74 },
  ];
  const ranks = ['🥇','🥈','🥉'];
  const top3  = mockPlayers.slice(0,3);

  podium.innerHTML = [
    { player:top3[1], rank:2, h:160 },
    { player:top3[0], rank:1, h:200 },
    { player:top3[2], rank:3, h:140 }
  ].map(({player,rank,h}) => `
    <div class="lb-podium-card ${rank===1?'rank-1':''}" style="min-height:${h}px">
      <div class="lb-rank-badge">${ranks[rank-1]}</div>
      <div class="lb-avatar">${player.name[0]}</div>
      <div class="lb-name">${player.name}</div>
      <div class="lb-score">${player.quizzes} quizzes · ${player.best}% best</div>
    </div>`).join('');

  table.innerHTML = mockPlayers.map((p,i) => `
    <div class="lbt-row">
      <div class="lbt-rank ${i<3?'top':''}">${i<3?ranks[i]:'#'+(i+1)}</div>
      <div class="lbt-user">
        <div class="lbt-av">${p.name[0]}</div>
        <div class="lbt-uname">${p.name}</div>
      </div>
      <div class="lbt-val">${p.quizzes}</div>
      <div class="lbt-best">${p.best}%</div>
      <div class="lbt-val">${p.avg}%</div>
    </div>`).join('');
}

// ─── NOTES ────────────────────────────────────────────────────
function newNote() {
  const note = {
    id: Date.now().toString(), title:'Untitled Note', content:'',
    category:'GENERAL', createdAt:new Date().toISOString(), updatedAt:new Date().toISOString()
  };
  notes.unshift(note); saveNotes(); renderNotesList(); openNote(note.id);
}

function openNote(id) {
  activeNoteId = id;
  const note   = notes.find(n => n.id === id);
  if (!note) return;
  document.getElementById('neEmpty').style.display  = 'none';
  document.getElementById('neActive').style.display = '';
  document.getElementById('noteTitleInput').value   = note.title;
  document.getElementById('noteContentInput').value = note.content;
  document.getElementById('noteCatSelect').value    = note.category;
  updateWordCount();
  document.getElementById('noteLastSaved').textContent = 'Saved ' + fmtDate(note.updatedAt);
  renderNotesList();
}

function saveCurrentNote() {
  if (!activeNoteId) return;
  const note = notes.find(n => n.id === activeNoteId);
  if (!note) return;
  note.title    = document.getElementById('noteTitleInput').value || 'Untitled';
  note.content  = document.getElementById('noteContentInput').value;
  note.category = document.getElementById('noteCatSelect').value;
  note.updatedAt = new Date().toISOString();
  saveNotes(); renderNotesList();
  document.getElementById('noteLastSaved').textContent = 'Saved just now ✓';
  toast('Note saved!', 'success');
}

function deleteCurrentNote() {
  if (!activeNoteId || !confirm('Delete this note?')) return;
  notes = notes.filter(n => n.id !== activeNoteId);
  activeNoteId = null; saveNotes(); renderNotesList();
  document.getElementById('neEmpty').style.display  = '';
  document.getElementById('neActive').style.display = 'none';
  toast('Note deleted');
}

function saveNotes() { localStorage.setItem('qmNotes', JSON.stringify(notes)); }

function setNoteCat(cat, btn) {
  noteCatFilter = cat;
  document.querySelectorAll('.nf-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderNotesList();
}

function filterNotes() { renderNotesList(); }

function renderNotesList() {
  const search = (document.getElementById('noteSearch')?.value || '').toLowerCase();
  const listEl = document.getElementById('notesList');
  if (!listEl) return;
  const filtered = notes.filter(n => {
    const catOk    = noteCatFilter === 'ALL' || n.category === noteCatFilter;
    const searchOk = !search || n.title.toLowerCase().includes(search) || n.content.toLowerCase().includes(search);
    return catOk && searchOk;
  });
  if (!filtered.length) {
    listEl.innerHTML = '<div class="no-notes">No notes yet.<br/>Hit "+ New Note" to start.</div>';
    return;
  }
  listEl.innerHTML = filtered.map(n => `
    <div class="note-item ${n.id===activeNoteId?'active':''}" onclick="openNote('${n.id}')">
      <div class="ni-title">${esc(n.title)}</div>
      <div class="ni-preview">${esc(n.content.slice(0,60))||'Empty note...'}</div>
      <div class="ni-meta">
        <span class="ni-cat">${n.category}</span>
        <span class="ni-date">${fmtDate(n.updatedAt)}</span>
      </div>
    </div>`).join('');
}

function updateWordCount() {
  const ta = document.getElementById('noteContentInput');
  const wc = document.getElementById('noteWordCount');
  if (!ta || !wc) return;
  const words = ta.value.trim().split(/\s+/).filter(w=>w).length;
  wc.textContent = words + ' word' + (words!==1?'s':'');
}

document.addEventListener('input', e => {
  if (e.target.id === 'noteContentInput')  updateWordCount();
  if (e.target.id === 'subjectNoteInput') updateSubjectWordCount();
});

setInterval(() => {
  if (activeNoteId && document.getElementById('neActive')?.style.display !== 'none') {
    saveCurrentNote();
  }
}, 30000);

// ─── SUBJECT NOTES ────────────────────────────────────────────
function renderSubjectCovers() {
  const grid = document.getElementById('subjectGrid');
  if (!grid) return;
  const search = (document.getElementById('subjectSearch')?.value||'').toLowerCase();
  const subjects = CS_SUBJECTS.filter(s =>
    s.title.toLowerCase().includes(search) ||
    s.code.toLowerCase().includes(search)  ||
    s.summary.toLowerCase().includes(search)
  );
  document.getElementById('csNotesHome').style.display      = '';
  document.getElementById('subjectWorkspace').style.display = 'none';
  grid.innerHTML = subjects.map(subject => {
    const note    = subjectNotes[subject.id] || {};
    const hasText = !!(note.content||'').trim();
    const hasPdf  = !!note.pdfName;
    return `
      <button class="subject-cover" onclick="openSubject('${subject.id}')" style="--subject-color:${subject.color}">
        <div class="subject-cover-mark">${esc(subject.icon)}</div>
        <div class="subject-code">${esc(subject.code)}</div>
        <h3>${esc(subject.title)}</h3>
        <p>${esc(subject.summary)}</p>
        <div class="subject-status">
          <span class="${hasPdf?'ready':''}">${hasPdf?'PDF added':'No PDF'}</span>
          <span class="${hasText?'ready':''}">${hasText?'Notes written':'Empty notes'}</span>
        </div>
      </button>`;
  }).join('')||'<div class="empty-state"><span>🔍</span>No subjects found.</div>';
}

function showSubjectLibrary() { activeSubjectId = null; renderSubjectCovers(); }

async function openSubject(subjectId) {
  activeSubjectId = subjectId;
  const subject   = CS_SUBJECTS.find(s => s.id === subjectId);
  if (!subject) return;
  document.getElementById('csNotesHome').style.display      = 'none';
  document.getElementById('subjectWorkspace').style.display = '';
  document.getElementById('activeSubjectCode').textContent  = subject.code;
  document.getElementById('activeSubjectTitle').textContent = subject.title;
  document.getElementById('subjectNoteInput').value = subjectNotes[subjectId]?.content || '';
  document.getElementById('subjectLastSaved').textContent   =
    subjectNotes[subjectId]?.updatedAt
      ? 'Saved ' + fmtDate(subjectNotes[subjectId].updatedAt)
      : 'Not saved';
  renderSubjectMiniList();
  updateSubjectWordCount();
  await loadSubjectPdf(subjectId);
}

function renderSubjectMiniList() {
  const list = document.getElementById('subjectMiniList');
  if (!list) return;
  list.innerHTML = CS_SUBJECTS.map(s => `
    <button class="subject-mini ${s.id===activeSubjectId?'active':''}" onclick="openSubject('${s.id}')">
      <span style="--subject-color:${s.color}">${esc(s.code)}</span>
      ${esc(s.title)}
    </button>`).join('');
}

function ensureSubjectNote(subjectId) {
  if (!subjectNotes[subjectId]) subjectNotes[subjectId] = { content:'', pdfName:'', updatedAt:'' };
  return subjectNotes[subjectId];
}

function saveSubjectNote() {
  if (!activeSubjectId) return;
  const note     = ensureSubjectNote(activeSubjectId);
  note.content   = document.getElementById('subjectNoteInput').value;
  note.updatedAt = new Date().toISOString();
  localStorage.setItem('qmSubjectNotes', JSON.stringify(subjectNotes));
  document.getElementById('subjectLastSaved').textContent = 'Saved just now ✓';
  updateSubjectWordCount();
  toast('Subject notes saved!', 'success');
}

function updateSubjectWordCount() {
  const input = document.getElementById('subjectNoteInput');
  const count = document.getElementById('subjectWordCount');
  if (!input||!count) return;
  const words = input.value.trim().split(/\s+/).filter(Boolean).length;
  count.textContent = words + ' word' + (words!==1?'s':'');
}

function openPdfDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('qmSubjectPdfDb', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('pdfs');
    request.onsuccess = () => resolve(request.result);
    request.onerror   = () => reject(request.error);
  });
}

async function putSubjectPdf(subjectId, file) {
  const db = await openPdfDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pdfs','readwrite');
    tx.objectStore('pdfs').put(file, subjectId);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

async function getSubjectPdf(subjectId) {
  const db = await openPdfDb();
  return new Promise((resolve, reject) => {
    const tx      = db.transaction('pdfs','readonly');
    const request = tx.objectStore('pdfs').get(subjectId);
    request.onsuccess = () => resolve(request.result||null);
    request.onerror   = () => reject(request.error);
  });
}

async function deleteSubjectPdf(subjectId) {
  const db = await openPdfDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pdfs','readwrite');
    tx.objectStore('pdfs').delete(subjectId);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

async function uploadSubjectPdf(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!activeSubjectId||!file) return;
  if (file.type !== 'application/pdf') { toast('Please upload a PDF file.','error'); return; }
  try {
    await putSubjectPdf(activeSubjectId, file);
    const note = ensureSubjectNote(activeSubjectId);
    note.pdfName = file.name; note.updatedAt = new Date().toISOString();
    localStorage.setItem('qmSubjectNotes', JSON.stringify(subjectNotes));
    await loadSubjectPdf(activeSubjectId);
    renderSubjectMiniList();
    toast('PDF uploaded!','success');
  } catch(e) { toast('Could not save PDF: '+e.message,'error'); }
}

async function loadSubjectPdf(subjectId) {
  const viewer    = document.getElementById('pdfViewer');
  const empty     = document.getElementById('pdfEmpty');
  const removeBtn = document.getElementById('removePdfBtn');
  if (!viewer||!empty) return;
  if (viewer.dataset.url) URL.revokeObjectURL(viewer.dataset.url);
  viewer.removeAttribute('src'); viewer.dataset.url = '';
  try {
    const file = await getSubjectPdf(subjectId);
    if (!file) {
      empty.style.display=''; viewer.style.display='none'; removeBtn.style.display='none'; return;
    }
    const url = URL.createObjectURL(file);
    viewer.dataset.url = url; viewer.src = url;
    viewer.style.display=''; empty.style.display='none'; removeBtn.style.display='';
  } catch(e) {
    empty.style.display=''; viewer.style.display='none'; removeBtn.style.display='none';
  }
}

async function removeSubjectPdf() {
  if (!activeSubjectId||!confirm('Remove the uploaded PDF?')) return;
  await deleteSubjectPdf(activeSubjectId);
  const note = ensureSubjectNote(activeSubjectId);
  note.pdfName=''; note.updatedAt=new Date().toISOString();
  localStorage.setItem('qmSubjectNotes', JSON.stringify(subjectNotes));
  await loadSubjectPdf(activeSubjectId);
  toast('PDF removed.');
}

// ─── ADMIN ────────────────────────────────────────────────────
function switchAdminTab(tab, btn) {
  document.querySelectorAll('.adtab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.getElementById('adpanel-quizzes').style.display   = tab==='quizzes'   ? '' : 'none';
  document.getElementById('adpanel-questions').style.display = tab==='questions' ? '' : 'none';
  document.getElementById('adpanel-upload').style.display    = tab==='upload'    ? '' : 'none';
  if (tab==='questions') toggleQuestionTypeFields();
}

async function createQuiz() {
  const title            = document.getElementById('adminQuizTitle').value.trim();
  const category         = document.getElementById('adminQuizCategory').value;
  const timeLimitMinutes = parseInt(document.getElementById('adminQuizTime').value);
  const description      = document.getElementById('adminQuizDesc').value.trim();
  if (!title) { toast('Quiz title required','error'); return; }
  try {
    await api('POST','/quizzes/create',{title,category,timeLimitMinutes,description});
    toast('Quiz created!','success');
  } catch(e) { toast('Failed: '+e.message,'error'); }
  document.getElementById('adminQuizTitle').value = '';
  document.getElementById('adminQuizDesc').value  = '';
  await loadAllQuizzes(); loadAdminQuizList(); loadAdminQuizSelect(); loadHomeStats();
}

async function loadAdminQuizList() {
  const listEl = document.getElementById('adminQuizList');
  if (!listEl) return;
  await loadAllQuizzes();
  if (!allQuizzes.length) { listEl.innerHTML='<div class="no-results">No quizzes yet.</div>'; return; }
  listEl.innerHTML = allQuizzes.map(q => `
    <div class="ad-quiz-item">
      <div>
        <div class="adqi-title">${esc(q.title)}</div>
        <div class="adqi-meta">${q.category} · ${q.questionCount||0} questions · ${q.timeLimitMinutes}min</div>
      </div>
      <button class="btn-del" onclick="deleteQuiz(${q.id})">Delete</button>
    </div>`).join('');
}

async function loadAdminQuizSelect() {
  const sel = document.getElementById('adminQQuiz');
  if (!sel) return;
  await loadAllQuizzes();
  sel.innerHTML = '<option value="">— Select a quiz —</option>' +
    allQuizzes.map(q => `<option value="${q.id}">${esc(q.title)}</option>`).join('');
}

async function deleteQuiz(id) {
  if (!confirm('Delete this quiz and all its questions?')) return;
  try {
    await api('DELETE','/quizzes/delete/'+id);
    toast('Quiz deleted.','success');
    await loadAllQuizzes(); loadAdminQuizList(); loadAdminQuizSelect(); loadHomeStats();
  } catch(e) { toast(e.message,'error'); }
}

async function addQuestion() {
  const quizId       = document.getElementById('adminQQuiz').value;
  const type         = document.getElementById('adminQType').value;
  const questionText = document.getElementById('adminQText').value.trim();
  const marks        = parseInt(document.getElementById('adminQMarks').value)||1;
  const msgEl        = document.getElementById('adminQMsg');

  if (!quizId)       { setMsg(msgEl,'Select a quiz','error'); return; }
  if (!questionText) { setMsg(msgEl,'Question text is required','error'); return; }

  let payload;
  if (type==='CODING') {
    payload = {
      quizId:parseInt(quizId), type:'CODING', questionText,
      starterCode:    document.getElementById('adminStarterCode').value,
      sampleInput:    document.getElementById('adminSampleInput').value,
      expectedOutput: document.getElementById('adminExpectedOutput').value.trim(),
      explanation:    document.getElementById('adminCodingExplanation').value.trim(),
      marks
    };
  } else {
    const optionA = document.getElementById('adminQA').value.trim();
    const optionB = document.getElementById('adminQB').value.trim();
    const optionC = document.getElementById('adminQC').value.trim();
    const optionD = document.getElementById('adminQD').value.trim();
    if (!optionA||!optionB||!optionC||!optionD) {
      setMsg(msgEl,'All MCQ options are required','error'); return;
    }
    payload = {
      quizId:parseInt(quizId), type:'MCQ', questionText,
      optionA, optionB, optionC, optionD,
      correctAnswer: document.getElementById('adminQCorrect').value,
      marks
    };
  }

  try {
    await api('POST','/questions/add',payload);
    setMsg(msgEl,'✓ Question added!','success');
    clearQuestionForm();
    await loadAllQuizzes(); loadAdminQuizList();
  } catch(e) { setMsg(msgEl,'Failed: '+e.message,'error'); }
}

function toggleQuestionTypeFields() {
  const type = document.getElementById('adminQType')?.value||'MCQ';
  document.getElementById('mcqFields').style.display    = type==='MCQ'    ? '' : 'none';
  document.getElementById('codingFields').style.display = type==='CODING' ? '' : 'none';
}

function clearQuestionForm() {
  ['adminQText','adminQA','adminQB','adminQC','adminQD',
   'adminStarterCode','adminSampleInput','adminExpectedOutput','adminCodingExplanation']
    .forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
}

function uploadQuestionsJson(event) {
  const file = event.target.files?.[0];
  const msg  = document.getElementById('uploadQMsg');
  event.target.value = '';
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const items = JSON.parse(reader.result);
      if (!Array.isArray(items)) throw new Error('JSON must be an array.');
      let imported = 0;
      for (const item of items) {
        if (!item.quizId||!item.questionText) continue;
        const type    = (item.type||'MCQ').toUpperCase();
        const payload = {
          quizId:parseInt(item.quizId), type,
          questionText:item.questionText,
          marks:parseInt(item.marks)||1,
          ...(type==='CODING'
            ? { starterCode:item.starterCode||'', sampleInput:item.sampleInput||'',
                expectedOutput:item.expectedOutput||'', explanation:item.explanation||'' }
            : { optionA:item.optionA||'', optionB:item.optionB||'',
                optionC:item.optionC||'', optionD:item.optionD||'',
                correctAnswer:item.correctAnswer||'A' })
        };
        try { await api('POST','/questions/add',payload); imported++; }
        catch(e) { console.warn('Failed:',e.message); }
      }
      setMsg(msg,`Imported ${imported} questions.`,'success');
      await loadAllQuizzes(); loadAdminQuizList(); loadAdminQuizSelect(); loadHomeStats();
    } catch(e) { setMsg(msg,e.message,'error'); }
  };
  reader.readAsText(file);
}

// ─── TOAST ────────────────────────────────────────────────────
function toast(msg, type='') {
  const stack = document.getElementById('toastStack');
  const icons  = { success:'✅', error:'❌', '':'💬' };
  const el     = document.createElement('div');
  el.className = 'toast' + (type?' '+type:'');
  el.innerHTML = `<span class="toast-icon">${icons[type]||'💬'}</span><span>${msg}</span>`;
  stack.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, 3500);
}

// ─── UTILS ────────────────────────────────────────────────────
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
  } catch { return iso.slice(0,10); }
}

function setMsg(el, text, type) {
  if (!el) return;
  el.textContent = text;
  el.className   = 'auth-msg ' + type;
}

window.addEventListener('scroll', () => {
  document.getElementById('nav').style.boxShadow =
    window.scrollY > 20 ? '0 4px 40px rgba(114, 33, 33, 0.5)' : '';
});