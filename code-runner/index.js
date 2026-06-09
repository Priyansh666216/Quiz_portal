const express  = require('express');
const cors     = require('cors');
const { exec } = require('child_process');
const fs       = require('fs');
const crypto   = require('crypto');
const https    = require('https');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const LANG_CONFIGS = {
  python: {
    ext: 'py',
    cmd: (dir, id) => `python3 ${dir}/${id}.py`,
  },
  cpp: {
    ext: 'cpp',
    cmd: (dir, id) => `g++ ${dir}/${id}.cpp -o ${dir}/${id}_bin && ${dir}/${id}_bin`,
  },
  c: {
    ext: 'c',
    cmd: (dir, id) => `gcc ${dir}/${id}.c -o ${dir}/${id}_bin && ${dir}/${id}_bin`,
  },
  go: {
    ext: 'go',
    cmd: (dir, id) => `go run ${dir}/${id}.go`,
  },
};

// Judge0 language IDs
const JUDGE0_LANGS = {
  java:       62,
  javascript: 63,
  typescript: 74,
  csharp:     51,
  kotlin:     78,
  rust:       73,
  swift:      83,
  php:        68,
  ruby:       72,
};

app.get('/', (_, res) => res.json({ status: 'ok', message: 'QuizMaster Code Runner is live 🚀' }));

// ── Judge0 execution (Java + others) ─────────────────────────
async function runOnJudge0(language, code, input) {
  const langId = JUDGE0_LANGS[language];
  
  const body = JSON.stringify({
    source_code: Buffer.from(code).toString('base64'),
    language_id: langId,
    stdin:        Buffer.from(input || '').toString('base64'),
    base64_encoded: true,
  });

  return new Promise((resolve, reject) => {
    // Submit
    const submitReq = https.request({
      hostname: 'judge0-ce.p.rapidapi.com',
      path:     '/submissions?base64_encoded=true&wait=true',
      method:   'POST',
      headers: {
        'Content-Type':       'application/json',
        'X-RapidAPI-Key':     process.env.JUDGE0_API_KEY || '',
        'X-RapidAPI-Host':    'judge0-ce.p.rapidapi.com',
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          const stdout = result.stdout ? Buffer.from(result.stdout, 'base64').toString() : '';
          const stderr = result.stderr ? Buffer.from(result.stderr, 'base64').toString() : '';
          const compileErr = result.compile_output ? Buffer.from(result.compile_output, 'base64').toString() : '';
          const success = result.status?.id === 3; // 3 = Accepted
          resolve({
            success,
            stdout: stdout.trim(),
            stderr: (stderr || compileErr).trim()
          });
        } catch(e) {
          reject(e);
        }
      });
    });
    submitReq.on('error', reject);
    submitReq.write(body);
    submitReq.end();
  });
}

app.post('/api/execute', async (req, res) => {
  const { language, code, input = '' } = req.body;

  if (!language || !code) {
    return res.status(400).json({ success: false, stderr: 'language and code are required.' });
  }

  // Judge0 languages
  if (JUDGE0_LANGS[language]) {
    try {
      const result = await runOnJudge0(language, code, input);
      return res.json(result);
    } catch(err) {
      return res.json({ success: false, stdout: '', stderr: 'Execution failed: ' + err.message });
    }
  }

  // Local execution (Python, C, C++, Go)
  const config = LANG_CONFIGS[language];
  if (!config) {
    return res.json({
      success: false,
      stdout:  '',
      stderr:  `Language "${language}" not supported. Supported: ${[...Object.keys(LANG_CONFIGS), ...Object.keys(JUDGE0_LANGS)].join(', ')}`
    });
  }

  const id     = crypto.randomBytes(8).toString('hex');
  const runDir = `/tmp/qm_${id}`;
  fs.mkdirSync(runDir, { recursive: true });

  const filePath = `${runDir}/${id}.${config.ext}`;
  fs.writeFileSync(filePath, code, 'utf8');

  const cmd = config.cmd(runDir, id);

  const child = exec(cmd, { timeout: 15000 }, (err, stdout, stderr) => {
    fs.rm(runDir, { recursive: true, force: true }, () => {});

    if (err && err.killed) {
      return res.json({ success: false, stdout: '', stderr: 'Time limit exceeded (15s).' });
    }
    if (stderr && !stdout) {
      return res.json({ success: false, stdout: '', stderr: stderr.trim() });
    }
    res.json({ success: true, stdout: stdout.trim(), stderr: stderr.trim() });
  });

  if (input) child.stdin.write(input);
  child.stdin.end();
});

app.listen(PORT, () => {
  console.log(`Code runner on port ${PORT}`);
});
