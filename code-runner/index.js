const express  = require('express');
const cors     = require('cors');
const { exec } = require('child_process');
const fs       = require('fs');
const crypto   = require('crypto');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/', (_, res) => res.json({ status: 'ok', message: 'QuizMaster Code Runner is live 🚀' }));

app.post('/api/execute', (req, res) => {
  const { language, code, input = '' } = req.body;
  if (!language || !code) {
    return res.status(400).json({ success: false, stderr: 'language and code are required.' });
  }

  const id     = crypto.randomBytes(8).toString('hex');
  const runDir = `/tmp/qm_${id}`;
  fs.mkdirSync(runDir, { recursive: true });

  let cmd;

  if (language === 'java') {
    const match     = code.match(/public\s+class\s+(\w+)/);
    const className = match ? match[1] : 'Main';
    const filePath  = `${runDir}/${className}.java`;
    fs.writeFileSync(filePath, code, 'utf8');
    cmd = `javac ${filePath} -d ${runDir} && java -cp ${runDir} ${className}`;

  } else if (language === 'python') {
    const filePath = `${runDir}/${id}.py`;
    fs.writeFileSync(filePath, code, 'utf8');
    cmd = `python3 ${filePath}`;

  } else if (language === 'cpp') {
    const filePath = `${runDir}/${id}.cpp`;
    fs.writeFileSync(filePath, code, 'utf8');
    cmd = `g++ ${filePath} -o ${runDir}/${id}_bin && ${runDir}/${id}_bin`;

  } else if (language === 'c') {
    const filePath = `${runDir}/${id}.c`;
    fs.writeFileSync(filePath, code, 'utf8');
    cmd = `gcc ${filePath} -o ${runDir}/${id}_bin && ${runDir}/${id}_bin`;

  } else if (language === 'go') {
    const filePath = `${runDir}/${id}.go`;
    fs.writeFileSync(filePath, code, 'utf8');
    cmd = `go run ${filePath}`;

  } else {
    fs.rm(runDir, { recursive: true, force: true }, () => {});
    return res.json({ success: false, stdout: '', stderr: `Language "${language}" not supported.` });
  }

  const child = exec(cmd, { timeout: 15000 }, (err, stdout, stderr) => {
    fs.rm(runDir, { recursive: true, force: true }, () => {});

    console.log(`[${language}] stdout: "${stdout}" stderr: "${stderr}" err: ${err?.message}`);

    if (err && err.killed) {
      return res.json({ success: false, stdout: '', stderr: 'Time limit exceeded (15s).' });
    }
    if (stderr && !stdout) {
      return res.json({ success: false, stdout: '', stderr: stderr.trim() });
    }
    res.json({ success: true, stdout: stdout.trim(), stderr: stderr.trim() });
  });

  if (input) child.stdin.write(input + '\n');
  child.stdin.end();
});

app.listen(PORT, () => {
  console.log(`Code runner on port ${PORT}`);
});
