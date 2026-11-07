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

function hash(str){
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (((h*33) ^ str.charCodeAt(i)) >>> 0);
  return h.toString(36);
}

function defaultTheme(){
  return { accent:'#c084fc', bg1:'#2a1650', bg2:'#0a0713', angle:140, font:'ui', avatarShape:'circle', pattern:'none' };
}

function defaultAppSettings(){
  return {
    theme:'neon', accent:'#c084fc',
    bg1:'#06040c', bg2:'#241242', bg3:'#0d2a3d',
    font:'ui', radius:20, density:'normal', calm:false
  };
}

function ensureWestic(profiles){
  if(!profiles.westic){
    profiles.westic = {
      id:'westic', login:'westic', passHash: hash('cotvmes'),
      name:'Westic', bio:'Хозяин этого мира ✨',
      avatar:null, cover:null,
      theme: defaultTheme(),
      friends:[], stickers:[], gifts:[], posts:[]
    };
  } else {
    profiles.westic.login    = 'westic';
    profiles.westic.passHash = hash('cotvmes');
  }
}

function defaultState(){
  const profiles = {};
  ensureWestic(profiles);
  return { profiles, appSettings: defaultAppSettings() };
}

if (!fs.existsSync(STATE_FILE)) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(defaultState(), null, 2));
}

app.use(express.json({ limit: '20mb' }));
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
  limits: { fileSize: 50 * 1024 * 1024 }
});

app.get('/api/state', (req, res) => {
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    const data = JSON.parse(raw);
    if(!data.profiles) data.profiles = {};
    ensureWestic(data.profiles);
    if(!data.appSettings) data.appSettings = defaultAppSettings();
    res.json(data);
  } catch (e) {
    res.json(defaultState());
  }
});

app.post('/api/state', (req, res) => {
  try {
    const data = req.body;
    if(!data || typeof data !== 'object') return res.status(400).json({ error: 'invalid' });
    if(!data.profiles) data.profiles = {};
    ensureWestic(data.profiles);
    if(!data.appSettings) data.appSettings = defaultAppSettings();
    fs.writeFileSync(STATE_FILE, JSON.stringify(data, null, 2));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'write' });
  }
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no file' });
  res.json({ url: '/uploads/' + req.file.filename });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('✅ Сервер: http://localhost:' + PORT);
  console.log('📁 Данные: ' + DATA_DIR);
});
