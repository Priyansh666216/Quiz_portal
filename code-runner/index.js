// ============================================================
//  QuizMaster Pro — Code Execution Server
//  Deploy this as a separate Web Service on Render
// ============================================================

const express  = require('express');
const cors     = require('cors');
const { exec } = require('child_process');
const fs       = require('fs');
const crypto   = require('crypto');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// ── Language configs ──────────────────────────────────────────
// Each entry: file extension + a function that returns the shell command
const LANG_CONFIGS = {
  python: {
    ext: 'py',
    cmd: (dir, id) => `python3 ${dir}/${id}.py`,
  },
  java: {
    ext: 'java',
    // Java filename MUST match public class name
    cmd: (dir, id, className) => `javac ${dir}/${className}.java && java -cp ${dir} ${className}`,
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

// ── Health check ──────────────────────────────────────────────
app.get('/', (_, res) => res.json({ status: 'ok', message: 'QuizMaster Code Runner is live 🚀' }));

// ── Execute endpoint ──────────────────────────────────────────
app.post('/api/execute', (req, res) => {
  const { language, code, input = '' } = req.body;

  // Validate
  if (!language || !code) {
    return res.status(400).json({ success: false, stderr: 'language and code are required.' });
  }

  const config = LANG_CONFIGS[language];
  if (!config) {
    return res.json({
      success: false,
      stdout:  '',
      stderr:  `Language "${language}" is not supported. Supported: ${Object.keys(LANG_CONFIGS).join(', ')}`
    });
  }

  // Create a unique temp directory for this run (avoids collisions)
  const id     = crypto.randomBytes(8).toString('hex');
  const runDir = `/tmp/qm_${id}`;
  fs.mkdirSync(runDir, { recursive: true });

  // Determine filename (Java: must match class name)
  let filename  = id;
  let className = null;

  if (language === 'java') {
    const match = code.match(/public\s+class\s+(\w+)/);
    className = match ? match[1] : 'Main';
    filename  = className;
  }

  const filePath = `${runDir}/${filename}.${config.ext}`;
  fs.writeFileSync(filePath, code, 'utf8');

  const cmd = config.cmd(runDir, id, className);

  // Timeout: 10 seconds max per run
  const child = exec(cmd, { timeout: 10000 }, (err, stdout, stderr) => {
    // Cleanup temp dir regardless of outcome
    fs.rm(runDir, { recursive: true, force: true }, () => {});

    if (err && err.killed) {
      return res.json({
        success: false,
        stdout:  '',
        stderr:  '⏱ Time limit exceeded (10s). Check for infinite loops.'
      });
    }

    // Compile error or runtime exception
    if (stderr && !stdout) {
      return res.json({ success: false, stdout: '', stderr: stderr.trim() });
    }

    // Some languages write warnings to stderr but still produce output
    res.json({
      success: true,
      stdout:  stdout.trim(),
      stderr:  stderr.trim()
    });
  });

  // Feed stdin (sample input) to the process
  if (input) {
    child.stdin.write(input);
  }
  child.stdin.end();
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Code runner listening on port ${PORT}`);
  console.log(`   Supported languages: ${Object.keys(LANG_CONFIGS).join(', ')}`);
});