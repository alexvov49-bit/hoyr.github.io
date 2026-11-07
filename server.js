const express = require('express');
const multer  = require('multer');
const fs      = require('fs');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR   = path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

fs.mkdirSync(DATA_DIR,   { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

if (!fs.existsSync(STATE_FILE)) {
  fs.writeFileSync(STATE_FILE, JSON.stringify({
    users: {}, posts: [], comments: []
  }, null, 2));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.static(PUBLIC_DIR));
app.use('/uploads', express.static(UPLOAD_DIR));

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '';
      cb(null, Date.now() + '_' + Math.random().toString(36).slice(2, 8) + ext);
    }
  }),
  limits: { fileSize: 30 * 1024 * 1024 }
});

app.get('/api/state', (req, res) => {
  try { res.json(JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))); }
  catch (e) { res.status(500).json({ error: 'read' }); }
});

app.post('/api/state', (req, res) => {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(req.body, null, 2));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'write' }); }
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no file' });
  res.json({ url: '/uploads/' + req.file.filename });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('✅ http://localhost:' + PORT);
});