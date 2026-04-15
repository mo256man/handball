const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

let nodeWifi = null;
try { nodeWifi = require('node-wifi'); } catch (e) {}

// ===== 引数解析 =====
const args = process.argv.slice(2);
const dbArg = args.find(a => a.startsWith('--db=') || a === '--db');
let dbMode = 'pg'; // デフォルト
if (dbArg) {
  dbMode = dbArg.startsWith('--db=') ? dbArg.split('=')[1] : args[args.indexOf('--db') + 1];
}
console.log(`DBモード: ${dbMode}`);

// ===== DB初期化 =====
let db = {};
let queryAll, queryRun, saveDatabase, closeDatabase, loadDatabase;

const dbModule = dbMode === 'sqlite' ? require('./sqlite') : require('./postgres');
loadDatabase   = dbModule.loadDatabase;
closeDatabase  = dbModule.closeDatabase;
queryAll       = dbModule.queryAll;
queryRun       = dbModule.queryRun;
saveDatabase   = dbModule.saveDatabase;

// ===== Express / Socket.IO =====
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// ===== DBセットアップ =====
async function initDatabase() {
  try {
    db = await loadDatabase();
    if (dbMode === 'sqlite') {
      const tables = await queryAll(db, "SELECT name FROM sqlite_master WHERE type='table'");
      console.log('テーブル:', tables);
    } else {
      const now = await queryAll(db, 'SELECT NOW() AS now');
      console.log('DB NOW():', now[0]?.now);
      const tables = await queryAll(db, "SELECT tablename AS name FROM pg_tables WHERE schemaname='public' ORDER BY tablename ASC");
      console.log('テーブル:', tables);
    }
    console.log('データベースを初期化しました');
  } catch (error) {
    console.error('データベース初期化エラー:', error);
    throw error;
  }
}

// ===== クエリヘルパー（プレースホルダ変換） =====
// SQLite は ? / pg は $1,$2,... なので、sqlite時はそのまま、pg時は変換不要（呼び出し側で使い分け）
// 両対応するため、共通関数でプレースホルダを吸収する
function buildQuery(sqliteQuery, pgQuery) {
  return dbMode === 'sqlite' ? sqliteQuery : pgQuery;
}

// ===== APIエンドポイント =====

app.get('/api/query', async (req, res) => {
  try {
    const { sql } = req.query;
    if (!sql) return res.status(400).json({ error: 'sqlが指定されていません' });
    const rows = await queryAll(db, sql);
    res.json({ success: true, data: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/execute', async (req, res) => {
  try {
    const { sql, params } = req.body;
    if (!sql) return res.status(400).json({ error: 'sqlが指定されていません' });
    const result = await queryRun(db, sql, params || []);
    if (dbMode === 'sqlite') await saveDatabase(db);
    res.json({ success: true, changes: result.changes });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/getRecordsByMatchId', async (req, res) => {
  try {
    const { matchId, session } = req.body;
    if (!matchId) return res.status(400).json({ error: 'matchIdが指定されていません' });
    if (!session || !session.userId) return res.status(401).json({ error: 'セッション情報が不正です' });
    
    const q = buildQuery(
      `SELECT * FROM record WHERE matchId = ? ORDER BY id ASC`,
      `SELECT * FROM "record" WHERE "matchId" = $1 ORDER BY id ASC`
    );
    const rows = await queryAll(db, q, [matchId]);
    res.json({ success: true, data: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/teams', async (req, res) => {
  try {
    const q = buildQuery(
      "SELECT * FROM team WHERE isAvailable = 1",
      'SELECT * FROM "team" WHERE "isAvailable" = 1'
    );
    const teams = await queryAll(db, q);
    const teamsWithImage = teams.map(team => {
      const result = {
        teamId: team.teamId,
        teamName: team.teamName,
        shortName: team.shortName,
        imgFileName: team.imgFileName,
        isAvailable: team.isAvailable,
        color: team.color,
        ...Object.keys(team).reduce((acc, key) => {
          if (!['teamId', 'teamName', 'shortName', 'imgFileName', 'isAvailable', 'color', 'image'].includes(key)) acc[key] = team[key];
          return acc;
        }, {})
      };
      if (team.image) {
        let buf = team.image;
        if (buf instanceof Uint8Array) buf = Buffer.from(buf);
        else if (typeof buf === 'object' && !Buffer.isBuffer(buf)) buf = Buffer.from(Object.values(buf));
        result.image = 'data:image/png;base64,' + Buffer.from(buf).toString('base64');
      } else {
        result.image = null;
      }
      return result;
    });
    res.json({ success: true, teams: teamsWithImage });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/record', async (req, res) => {
  try {
    const data = req.body;
    const q = buildQuery(
      `INSERT INTO record (matchId,teamId,playerId,playerNumber,playerPosition,playerName,half,situation,kind,result,gk,remarks,area,goal,setPlay,isGS,isGSO,isAtk,isSht,isFB) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      `INSERT INTO "record" ("matchId","teamId","playerId","playerNumber","playerPosition","playerName","half","situation","kind","result","gk","remarks","area","goal","setPlay","isGS","isGSO","isAtk","isSht","isFB") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) RETURNING id`
    );
    const params = [data.matchId,data.teamId,data.playerId,data.playerNumber,data.playerPosition,data.playerName,data.half,data.situation,data.kind,data.result,data.gk,data.remarks||'',data.area||'',data.goal||'',data.setPlay||'',data.isGS??0,data.isGSO??0,data.isAtk??0,data.isSht??0,data.isFB??0];
    const result = await queryRun(db, q, params);
    if (dbMode === 'sqlite') await saveDatabase(db);
    const recordId = dbMode === 'pg' ? result.rows?.[0]?.id : result.lastID;
    io.emit('data-updated', { message: 'レコードが更新されました', timestamp: new Date().toISOString() });
    res.json({ success: true, changes: result.changes, recordId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/record/:matchId/prev/:currentId', async (req, res) => {
  try {
    const { matchId, currentId } = req.params;
    const q = buildQuery(
      `SELECT * FROM record WHERE matchId = ? AND id < ? ORDER BY id DESC LIMIT 1`,
      `SELECT * FROM "record" WHERE "matchId" = $1 AND id < $2 ORDER BY id DESC LIMIT 1`
    );
    const rows = await queryAll(db, q, [matchId, currentId]);
    rows.length > 0 ? res.json(rows[0]) : res.status(404).json({ error: 'No previous record found' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/record/:matchId/next/:currentId', async (req, res) => {
  try {
    const { matchId, currentId } = req.params;
    const q = buildQuery(
      `SELECT * FROM record WHERE matchId = ? AND id > ? ORDER BY id ASC LIMIT 1`,
      `SELECT * FROM "record" WHERE "matchId" = $1 AND id > $2 ORDER BY id ASC LIMIT 1`
    );
    const rows = await queryAll(db, q, [matchId, currentId]);
    rows.length > 0 ? res.json(rows[0]) : res.status(404).json({ error: 'No next record found' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/record/:matchId/first', async (req, res) => {
  try {
    const { matchId } = req.params;
    const q = buildQuery(
      `SELECT * FROM record WHERE matchId = ? ORDER BY id ASC LIMIT 1`,
      `SELECT * FROM "record" WHERE "matchId" = $1 ORDER BY id ASC LIMIT 1`
    );
    const rows = await queryAll(db, q, [matchId]);
    rows.length > 0 ? res.json(rows[0]) : res.status(404).json({ error: 'No record found' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/available-dates', async (req, res) => {
  try {
    const q = buildQuery(
      `SELECT DISTINCT date FROM match ORDER BY date ASC`,
      `SELECT DISTINCT "date" FROM "match" ORDER BY "date" ASC`
    );
    const rows = await queryAll(db, q);
    res.json({ success: true, dates: rows.map(r => r.date) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/resultCount', async (req, res) => {
  try {
    const { matchId } = req.query;
    if (!matchId) return res.status(400).json({ error: 'matchIdが指定されていません' });
    const q = buildQuery(
      `SELECT COUNT(*) as count FROM record WHERE matchId = ?`,
      `SELECT COUNT(*)::int as count FROM "record" WHERE "matchId" = $1`
    );
    const result = await queryAll(db, q, [matchId]);
    res.json({ success: true, count: result[0]?.count ?? 0 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/insertRecord', async (req, res) => {
  try {
    const data = req.body;
    const q = buildQuery(
      `INSERT INTO record (matchId,teamId,playerId,playerNumber,playerPosition,playerName,half,situation,kind,result,gk,remarks,area,goal,setPlay,isGS,isGSO,isAtk,isSht,isFB) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      `INSERT INTO "record" ("matchId","teamId","playerId","playerNumber","playerPosition","playerName","half","situation","kind","result","gk","remarks","area","goal","setPlay","isGS","isGSO","isAtk","isSht","isFB") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) RETURNING id`
    );
    const params = [data.matchId,data.teamId,data.playerId,data.playerNumber,data.playerPosition,data.playerName,data.half,data.situation,data.kind,data.result,data.gk,data.remarks||'',data.area||'',data.goal||'',data.setPlay||'',data.isGS??0,data.isGSO??0,data.isAtk??0,data.isSht??0,data.isFB??0];
    const result = await queryRun(db, q, params);
    if (dbMode === 'sqlite') await saveDatabase(db);
    const recordId = dbMode === 'pg' ? result.rows?.[0]?.id : result.lastID;
    io.emit('data-updated', { message: 'レコードが更新されました', timestamp: new Date().toISOString() });
    res.json({ success: true, changes: result.changes, recordId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/insertMatch', async (req, res) => {
  try {
    const { date, team0, team1, players0, players1 } = req.body;
    if (!date || !team0 || !team1) return res.status(400).json({ error: 'date, team0, team1が必要です' });
    const q = buildQuery(
      `INSERT INTO match (date,team0,team1,players0,players1) VALUES (?,?,?,?,?)`,
      `INSERT INTO "match" ("date","team0","team1","players0","players1") VALUES ($1,$2,$3,$4,$5) RETURNING id`
    );
    const params = [date, team0, team1, players0||'', players1||''];
    const result = await queryRun(db, q, params);
    if (dbMode === 'sqlite') await saveDatabase(db);
    const matchId = dbMode === 'pg' ? result.rows?.[0]?.id : result.lastID;
    io.emit('data-updated', { message: '試合データが更新されました', timestamp: new Date().toISOString() });
    res.json({ success: true, changes: result.changes, matchId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/getMatches', async (req, res) => {
  try {
    const { date, session } = req.body;
    if (!date) return res.status(400).json({ error: 'dateが指定されていません' });
    if (!session || !session.userId) return res.status(401).json({ error: 'セッション情報が不正です' });
    
    const q = buildQuery(
      `SELECT * FROM match WHERE date = ?`,
      `SELECT * FROM "match" WHERE "date" = $1`
    );
    const matches = await queryAll(db, q, [date]);
    res.json({ success: true, matches });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/getMatch', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'idが指定されていません' });
    const q = buildQuery(
      `SELECT * FROM match WHERE id = ?`,
      `SELECT * FROM "match" WHERE id = $1`
    );
    const results = await queryAll(db, q, [id]);
    const match = results?.[0] ?? null;
    if (!match) return res.status(404).json({ error: 'マッチが見つかりません' });
    res.json(match);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/updateMatch', async (req, res) => {
  try {
    const { id, date, team0, team1, players0, players1 } = req.body;
    if (!id) return res.status(400).json({ error: 'idが指定されていません' });
    const q = buildQuery(
      `UPDATE match SET date=?,team0=?,team1=?,players0=?,players1=? WHERE id=?`,
      `UPDATE "match" SET "date"=$1,"team0"=$2,"team1"=$3,"players0"=$4,"players1"=$5 WHERE id=$6`
    );
    const result = await queryRun(db, q, [date, team0, team1, players0, players1, id]);
    if (dbMode === 'sqlite') await saveDatabase(db);
    if (result.changes === 0) return res.status(404).json({ error: 'マッチが見つかりません' });
    res.json({ success: true, message: 'マッチを更新しました' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/match-dates', async (req, res) => {
  try {
    const { session } = req.body;
    if (!session || !session.userId) return res.status(401).json({ error: 'セッション情報が不正です' });
    
    const q = buildQuery(
      `SELECT DISTINCT date FROM match ORDER BY date ASC`,
      `SELECT DISTINCT "date" FROM "match" ORDER BY "date" ASC`
    );
    const rows = await queryAll(db, q);
    res.json({ success: true, dates: rows.map(r => r.date) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/check-match-duplicate', async (req, res) => {
  try {
    const { date, team0, team1 } = req.body;
    if (!date || !team0 || !team1) return res.status(400).json({ error: 'date, team0, team1が必要です' });
    const q = buildQuery(
      `SELECT id, COUNT(*) as count FROM match WHERE date=? AND team0=? AND team1=?`,
      `SELECT MIN(id) AS id, COUNT(*)::int AS count FROM "match" WHERE "date"=$1 AND "team0"=$2 AND "team1"=$3`
    );
    const result = await queryAll(db, q, [date, team0, team1]);
    res.json({ success: true, isDuplicate: (result[0]?.count ?? 0) > 0, matchId: result[0]?.id ?? null });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/players', async (req, res) => {
  try {
    const q = buildQuery(
      "SELECT * FROM players WHERE isAvailable = 1",
      'SELECT * FROM "players" WHERE "isAvailable" = 1'
    );
    const players = await queryAll(db, q);
    res.json({ success: true, players });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/players/by-team', async (req, res) => {
  try {
    const { teamname } = req.query;
    if (!teamname) return res.status(400).json({ error: 'teamnameが指定されていません' });
    const q = buildQuery(
      "SELECT * FROM players WHERE teamName = ?",
      'SELECT * FROM "players" WHERE "teamName" = $1'
    );
    const players = await queryAll(db, q, [teamname]);
    res.json(players);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/checkpass', async (req, res) => {
  const { password, username } = req.body;
  if (password === undefined || username === undefined)
    return res.json({ success: false, error: '名前またはパスワード未入力' });
  try {
    const q = buildQuery(
      "SELECT userId, teamId FROM user WHERE userName = ? AND password = ?",
      `SELECT "userId", "teamId" FROM "user" WHERE "userName" = $1 AND "password" = $2`
    );
    const result = await queryAll(db, q, [username, password]);
    if (result.length > 0) {
      return res.json({ success: true, userId: result[0].userId, teamId: result[0].teamId });
    } else {
      return res.json({ success: false, error: '名前またはパスワードが違います' });
    }
  } catch (e) { return res.status(500).json({ success: false, error: 'サーバーエラー' }); }
});

app.post('/api/initialize', async (req, res) => {
  try {
    const { session } = req.body;
    if (!session || !session.teamId) {
      return res.status(401).json({ error: 'セッション情報が不正です' });
    }
    
    // チームを取得
    const teamsQuery = buildQuery(
      "SELECT * FROM team WHERE isAvailable = 1",
      'SELECT * FROM "team" WHERE "isAvailable" = 1'
    );
    const teams = await queryAll(db, teamsQuery);
    const teamsWithImage = teams.map(team => {
      const result = {
        teamId: team.teamId,
        teamName: team.teamName,
        shortName: team.shortName,
        imgFileName: team.imgFileName,
        isAvailable: team.isAvailable,
        color: team.color,
        ...Object.keys(team).reduce((acc, key) => {
          if (!['teamId', 'teamName', 'shortName', 'imgFileName', 'isAvailable', 'color', 'image'].includes(key)) acc[key] = team[key];
          return acc;
        }, {})
      };
      if (team.image) {
        let buf = team.image;
        if (buf instanceof Uint8Array) buf = Buffer.from(buf);
        else if (typeof buf === 'object' && !Buffer.isBuffer(buf)) buf = Buffer.from(Object.values(buf));
        result.image = 'data:image/png;base64,' + Buffer.from(buf).toString('base64');
      } else {
        result.image = null;
      }
      return result;
    });
    
    // 選手を取得
    const playersQuery = buildQuery(
      "SELECT * FROM players WHERE isAvailable = 1",
      'SELECT * FROM "players" WHERE "isAvailable" = 1'
    );
    const players = await queryAll(db, playersQuery);
    
    res.json({ success: true, teams: teamsWithImage, players });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'サーバーは正常に動作しています' }));

// ===== WiFi =====
app.get('/api/wifi', async (req, res) => {
  try {
    let mode = 'unknown', ssid = '';
    if (nodeWifi) {
      try {
        nodeWifi.init({ iface: null });
        const connections = await new Promise((resolve, reject) => {
          nodeWifi.getCurrentConnections((err, current) => err ? reject(err) : resolve(current || []));
        });
        if (connections.length > 0) { mode = 'wifi'; ssid = connections[0].ssid || ''; }
      } catch (e) { console.warn('node-wifi failed:', e?.message); }
    }
    if (mode === 'unknown') {
      const run = (cmd) => new Promise(resolve => {
        exec(cmd, { timeout: 2000 }, (err, stdout) => resolve({ ok: !err, out: String(stdout || '') }));
      });
      const platform = process.platform;
      if (platform === 'win32') {
        const r = await run('netsh wlan show interfaces');
        if (r.ok && /State\s*:\s*connected/i.test(r.out)) {
          mode = 'wifi'; const m = r.out.match(/SSID\s*:\s*(.+)/i); if (m) ssid = m[1].trim();
        } else {
          const h = await run('netsh wlan show hostednetwork');
          if (h.ok && /Status\s*:\s*Started/i.test(h.out)) {
            mode = 'ap'; const m = h.out.match(/SSID name\s*:\s*"?([^"\r\n]+)"?/i); if (m) ssid = m[1].trim();
          }
        }
      } else if (platform === 'linux') {
        const r = await run('iwgetid -r');
        if (r.ok && r.out.trim()) { mode = 'wifi'; ssid = r.out.trim(); }
        else {
          const h = await run('pgrep hostapd');
          if (h.ok && h.out.trim()) {
            mode = 'ap';
            const c = await run('grep -i "^ssid=" /etc/hostapd/hostapd.conf || true');
            const m = c.ok && c.out.match(/ssid\s*=\s*(.+)/i); if (m) ssid = m[1].trim();
          }
        }
      } else if (platform === 'darwin') {
        const r = await run('/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I');
        if (r.ok) { const m = r.out.match(/SSID:\s*([^\n]+)/); if (m) { mode = 'wifi'; ssid = m[1].trim(); } }
      }
    }
    const ips = [];
    Object.values(os.networkInterfaces()).forEach(ifaces => {
      ifaces.forEach(i => { if (i.family === 'IPv4' && !i.internal) ips.push(i.address); });
    });
    res.json({ success: true, mode, ssid, ips });
  } catch (e) { res.json({ success: false, mode: 'unknown', ssid: '' }); }
});

// ===== Socket.IO =====
io.on('connection', socket => {
  console.log('クライアントが接続しました:', socket.id);
  socket.on('disconnect', () => console.log('クライアントが切断されました:', socket.id));
});

// ===== 起動 =====
async function startApp() {
  try {
    await initDatabase();
    server.listen(PORT, '0.0.0.0', () => {
      const addresses = [];
      Object.values(os.networkInterfaces()).forEach(ifaces => {
        ifaces.forEach(i => { if (i.family === 'IPv4' && !i.internal) addresses.push(i.address); });
      });
      console.log(`サーバーが起動しました:`);
      console.log(`  ローカル: http://localhost:${PORT}`);
      addresses.forEach(addr => console.log(`  ネットワーク: http://${addr}:${PORT}`));
    });
    process.on('SIGINT', async () => {
      try { await closeDatabase(); } catch (_) {}
      process.exit(0);
    });
  } catch (e) {
    console.error('アプリケーション起動エラー:', e);
    try { await closeDatabase(); } catch (_) {}
    process.exit(1);
  }
}

startApp();