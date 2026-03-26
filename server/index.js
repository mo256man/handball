// index.js (Supabase Postgres版)
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');
const { Pool } = require('pg');

// try to load node-wifi for cross-platform WiFi info if available
let nodeWifi = null;
try {
  nodeWifi = require('node-wifi');
} catch (e) {
  nodeWifi = null;
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = 3001;

// Supabase の接続文字列を直接埋め込む
// ※ render.com に載せるときは、ここを環境変数に戻せばよい
const SUPABASE_DB_URL =
  'postgresql://postgres.cmvyhbywdofxaovhbxdg:nbDplZhBWsklf1yH@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

const pool = new Pool({
  connectionString: SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});


// ===== DBユーティリティ (sqliteの queryAll/queryRun 相当) =====
async function queryAll(_unusedDb, query, params = []) {
  const res = await pool.query(query, params);
  return res.rows;
}

async function queryRun(_unusedDb, query, params = []) {
  const res = await pool.query(query, params);
  return {
    changes: res.rowCount,
    rows: res.rows
  };
}

async function closeDatabase() {
  await pool.end();
}

let db = {}; // 既存コード互換用（中身は使わない）

// ミドルウェア設定
app.use(cors());
app.use(express.json());

// 静的ファイルを配信（サーバーディレクトリ内）
app.use(express.static(path.join(__dirname)));

// ルートアクセス時は server/index.html を返す
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// データベース初期化
async function initDatabase() {
  try {
    console.log('データベースを初期化しました');

    // 接続確認
    const now = await queryAll(db, 'SELECT NOW() AS now');
    console.log('DB NOW():', now && now[0] ? now[0].now : now);

    // テーブル一覧
    const tables = await queryAll(
      db,
      "SELECT tablename AS name FROM pg_tables WHERE schemaname='public' ORDER BY tablename ASC"
    );
    console.log('データベース内のテーブル:', tables);
  } catch (error) {
    console.error('データベース初期化エラー:', error);
    throw error;
  }
}

// APIエンドポイント: recordテーブルの日付一覧（重複なし）を取得
app.get('/api/available-dates', async (req, res) => {
  try {
    const rows = await queryAll(db, 'SELECT DISTINCT "date" FROM "record" ORDER BY "date" ASC');
    const dates = rows.map(row => row.date);
    res.json(dates);
  } catch (error) {
    console.error('available-dates取得エラー:', error);
    res.status(500).json({ error: error.message });
  }
});

// APIエンドポイント: SELECTクエリを実行
app.post('/api/query', async (req, res) => {
  try {
    const { query, params = [] } = req.body;
    if (!query) return res.status(400).json({ error: 'クエリが指定されていません' });
    if (!query.trim().toLowerCase().startsWith('select')) {
      return res.status(400).json({ error: 'SELECTクエリのみ実行可能です' });
    }
    const results = await queryAll(db, query, params);
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('クエリ実行エラー:', error);
    res.status(500).json({ error: error.message });
  }
});

// APIエンドポイント: INSERT/UPDATE/DELETEクエリを実行
app.post('/api/execute', async (req, res) => {
  try {
    const { query, params = [] } = req.body;
    if (!query) return res.status(400).json({ error: 'クエリが指定されていません' });

    const result = await queryRun(db, query, params);

    io.emit('data-updated', {
      message: 'データが更新されました',
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, changes: result.changes });
  } catch (error) {
    console.error('クエリ実行エラー:', error);
    res.status(500).json({ error: error.message });
  }
});

// APIエンドポイント: 全チームを取得
app.get('/api/teams', async (req, res) => {
  try {
    console.log('チーム取得リクエストを受信');

    const teams = await queryAll(db, 'SELECT * FROM "teams" WHERE "isAvailable" = 1');
    console.log('チーム数:', teams.length);

    // imageカラムをBase64エンコードして返す
    const teamsWithImage = teams.map(team => {
      const result = {
        teamid: team.teamid,
        teamname: team.teamname,
        isAvailable: team.isAvailable,
        color: team.color,
        ...Object.keys(team).reduce((acc, key) => {
          if (!['teamid', 'teamname', 'isAvailable', 'color', 'image'].includes(key)) {
            acc[key] = team[key];
          }
          return acc;
        }, {})
      };

      if (team.image) {
        let imageBuffer = team.image;

        console.log(`[${team.teamname}] image type:`, typeof imageBuffer);
        console.log(`[${team.teamname}] image instanceof Uint8Array:`, imageBuffer instanceof Uint8Array);
        console.log(`[${team.teamname}] image length:`, imageBuffer?.length);

        // node-postgres は bytea を Buffer で返すことが多いが、念のため元処理を維持
        if (imageBuffer instanceof Uint8Array) {
          console.log(`[${team.teamname}] Converting Uint8Array to Buffer`);
          imageBuffer = Buffer.from(imageBuffer);
        } else if (typeof imageBuffer === 'object' && imageBuffer !== null && !Buffer.isBuffer(imageBuffer)) {
          console.log(`[${team.teamname}] Converting object to Buffer`);
          const values = Object.values(imageBuffer);
          imageBuffer = Buffer.from(values);
          console.log(`[${team.teamname}] Buffer created, length:`, imageBuffer.length);
        }

        const base64String = Buffer.from(imageBuffer).toString('base64');
        result.image = 'data:image/png;base64,' + base64String;

        console.log(`[${team.teamname}] Base64 assigned, type:`, typeof result.image);
        console.log(`[${team.teamname}] Base64 preview:`, result.image.substring(0, 50));
      } else {
        result.image = null;
      }
      return result;
    });

    console.log('=== 返すデータ確認 ===');
    console.log('teamsWithImage[0].image type:', typeof teamsWithImage[0]?.image);
    console.log('teamsWithImage[0].image preview:', teamsWithImage[0]?.image?.substring(0, 50));

    res.json({ success: true, teams: teamsWithImage });
  } catch (error) {
    console.error('チーム取得エラー:', error);
    res.status(500).json({ error: error.message });
  }
});

// APIエンドポイント: recordテーブルにデータを挿入（旧フォーマット）
app.post('/api/insertRecord', async (req, res) => {
  try {
    const data = req.body;
    if (!data) return res.status(400).json({ error: 'データが指定されていません' });

    const query = `
      INSERT INTO "record"
      ("date", "team", "half", "situation", "playerNumber", "kind", "result", "gk", "yellowcard", "2min",
       "remarks", "area", "goal", "player", "team1", "team2")
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
    `;
    const params = [
      data.date,
      data.team,
      data.half,
      data.situation,
      data.playerNumber,
      data.kind,
      data.result,
      data.gk,
      data.yellowcard,
      data.twomin,
      data.remarks,
      data.area,
      data.goal,
      data.player,
      data.team1,
      data.team2
    ];

    console.log('INSERT recordクエリ:', query);
    console.log('パラメータ:', params);

    const result = await queryRun(db, query, params);

    io.emit('data-updated', {
      message: 'データが更新されました',
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, changes: result.changes });
  } catch (error) {
    console.error('データ挿入エラー:', error);
    res.status(500).json({ error: error.message });
  }
});

// APIエンドポイント: resultテーブルのカウントを取得
app.get('/api/resultCount', async (req, res) => {
  try {
    const { date, team } = req.query;
    if (!date || !team) return res.status(400).json({ error: 'dateとteamが指定されていません' });

    const query = `SELECT COUNT(*)::int as count FROM "result" WHERE "date" = $1 AND "team" = $2`;
    const params = [date, team];

    console.log('COUNTクエリ:', query, 'パラメータ:', params);

    const result = await queryAll(db, query, params);
    const count = result[0]?.count ?? 0;

    res.json({ success: true, count: count });
  } catch (error) {
    console.error('カウント取得エラー:', error);
    res.status(500).json({ error: error.message });
  }
});

// APIエンドポイント: recordテーブルにデータを挿入（新フォーマット）
app.post('/api/record', async (req, res) => {
  try {
    const data = req.body;

    const query = `
      INSERT INTO "record" (
        "matchId", "teamId", "playerId", "playerNumber", "playerPosition", "playerName",
        "half", "situation", "kind", "result", "gk", "remarks", "area", "goal", "setPlay",
        "isGS", "isGSO", "isAtk", "isSht", "isFB"
      ) VALUES (
        $1,$2,$3,$4,$5,$6,
        $7,$8,$9,$10,$11,$12,$13,$14,$15,
        $16,$17,$18,$19,$20
      )
      RETURNING id
    `;

    const params = [
      data.matchId,
      data.teamId,
      data.playerId,
      data.playerNumber,
      data.playerPosition,
      data.playerName,
      data.half,
      data.situation,
      data.kind,
      data.result,
      data.gk,
      data.remarks || '',
      data.area || '',
      data.goal || '',
      data.setPlay || '',
      data.isGS ?? 0,
      data.isGSO ?? 0,
      data.isAtk ?? 0,
      data.isSht ?? 0,
      data.isFB ?? 0
    ];

    console.log('INSERT recordクエリ:', query);
    console.log('パラメータ:', params);

    const result = await queryRun(db, query, params);
    const recordId = result.rows && result.rows[0] ? result.rows[0].id : null;

    io.emit('data-updated', {
      message: 'レコードが更新されました',
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, changes: result.changes, recordId });
  } catch (error) {
    console.error('レコード挿入エラー:', error);
    res.status(500).json({ error: error.message });
  }
});

// APIエンドポイント: 前のrecord取得（matchId内で現在のidより小さい最大のid）
app.get('/api/record/:matchId/prev/:currentId', async (req, res) => {
  try {
    const { matchId, currentId } = req.params;
    const query = `SELECT * FROM "record" WHERE "matchId" = $1 AND id < $2 ORDER BY id DESC LIMIT 1`;
    const rows = await queryAll(db, query, [matchId, currentId]);

    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: 'No previous record found' });
    }
  } catch (error) {
    console.error('前のレコード取得エラー:', error);
    res.status(500).json({ error: error.message });
  }
});

// APIエンドポイント: 次のrecord取得（matchId内で現在のidより大きい最小のid）
app.get('/api/record/:matchId/next/:currentId', async (req, res) => {
  try {
    const { matchId, currentId } = req.params;
    const query = `SELECT * FROM "record" WHERE "matchId" = $1 AND id > $2 ORDER BY id ASC LIMIT 1`;
    const rows = await queryAll(db, query, [matchId, currentId]);

    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: 'No next record found' });
    }
  } catch (error) {
    console.error('次のレコード取得エラー:', error);
    res.status(500).json({ error: error.message });
  }
});

// APIエンドポイント: 最初のrecord取得（matchId内の最小id）
app.get('/api/record/:matchId/first', async (req, res) => {
  try {
    const { matchId } = req.params;
    const query = `SELECT * FROM "record" WHERE "matchId" = $1 ORDER BY id ASC LIMIT 1`;
    const rows = await queryAll(db, query, [matchId]);

    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: 'No record found' });
    }
  } catch (error) {
    console.error('最初のレコード取得エラー:', error);
    res.status(500).json({ error: error.message });
  }
});

// APIエンドポイント: matchテーブルにデータを挿入
app.post('/api/insertMatch', async (req, res) => {
  try {
    const { date, team0, team1, players0, players1 } = req.body;
    if (!date || !team0 || !team1) {
      return res.status(400).json({ error: 'date, team0, team1が必要です' });
    }

    const query = `
      INSERT INTO "match" ("date", "team0", "team1", "players0", "players1")
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;
    const params = [date, team0, team1, players0 || '', players1 || ''];

    console.log('INSERT matchクエリ:', query, 'パラメータ:', params);

    const result = await queryRun(db, query, params);
    const matchId = result.rows && result.rows[0] ? result.rows[0].id : null;

    io.emit('data-updated', {
      message: '試合データが更新されました',
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, changes: result.changes, matchId });
  } catch (error) {
    console.error('試合データ挿入エラー:', error);
    res.status(500).json({ error: error.message });
  }
});

// APIエンドポイント: 指定日付の試合データを取得
app.get('/api/getMatches', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'dateが指定されていません' });
    }

    const query = `SELECT * FROM "match" WHERE "date" = $1`;
    const params = [date];

    console.log('SELECT matchクエリ:', query, 'パラメータ:', params);

    const matches = await queryAll(db, query, params);
    res.json({ success: true, matches });
  } catch (error) {
    console.error('試合データ取得エラー:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/getMatch', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'idが指定されていません' });
    }

    const query = `SELECT * FROM "match" WHERE id = $1`;
    const params = [id];

    console.log('SELECT match (by id) クエリ:', query, 'パラメータ:', params);

    const results = await queryAll(db, query, params);
    const match = results && results.length > 0 ? results[0] : null;

    console.log('query結果:', match);

    if (!match) {
      return res.status(404).json({ error: 'マッチが見つかりません' });
    }

    res.json(match);
  } catch (error) {
    console.error('マッチデータ取得エラー:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: WiFi / AP モードと SSID を返す（最良推定）
app.get('/api/wifi', async (req, res) => {
  try {
    let mode = 'unknown';
    let ssid = '';

    if (nodeWifi) {
      try {
        nodeWifi.init({ iface: null });
        const connections = await new Promise((resolve, reject) => {
          nodeWifi.getCurrentConnections((err, current) => {
            if (err) return reject(err);
            resolve(current || []);
          });
        });
        if (connections && connections.length > 0) {
          mode = 'wifi';
          ssid = connections[0].ssid || '';
        }
      } catch (e) {
        console.warn('node-wifi lookup failed, falling back to platform commands:', e && e.message);
      }
    }

    if (mode === 'unknown') {
      const platform = process.platform;
      const run = (cmd) => new Promise((resolve) => {
        exec(cmd, { timeout: 2000 }, (err, stdout) => {
          if (err) return resolve({ ok: false, out: '' });
          resolve({ ok: true, out: String(stdout || '') });
        });
      });

      if (platform === 'win32') {
        const r = await run('netsh wlan show interfaces');
        if (r.ok && /State\s*:\s*connected/i.test(r.out)) {
          mode = 'wifi';
          const m = r.out.match(/SSID\s*:\s*(.+)/i);
          if (m) ssid = m[1].trim();
        } else {
          const h = await run('netsh wlan show hostednetwork');
          if (h.ok && /Status\s*:\s*Started/i.test(h.out)) {
            mode = 'ap';
            const m2 = h.out.match(/SSID name\s*:\s*"?([^"\r\n]+)"?/i);
            if (m2) ssid = m2[1].trim();
          }
        }
      } else if (platform === 'linux') {
        const r = await run('iwgetid -r');
        if (r.ok && r.out.trim()) {
          mode = 'wifi';
          ssid = r.out.trim();
        } else {
          const h = await run('pgrep hostapd');
          if (h.ok && h.out.trim()) {
            mode = 'ap';
            const c = await run('grep -i "^ssid=" /etc/hostapd/hostapd.conf || true');
            const m = c.ok && c.out.match(/ssid\s*=\s*(.+)/i);
            if (m) ssid = m[1].trim();
          }
        }
      } else if (platform === 'darwin') {
        const r = await run('/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I');
        if (r.ok && /SSID:\s*([^\n]+)/.test(r.out)) {
          mode = 'wifi';
          const m = r.out.match(/SSID:\s*([^\n]+)/);
          if (m) ssid = m[1].trim();
        }
      }
    }

    const networkInterfaces = os.networkInterfaces();
    const ips = [];
    Object.keys(networkInterfaces).forEach((name) => {
      networkInterfaces[name].forEach((iface) => {
        if (iface.family === 'IPv4' && !iface.internal) ips.push(iface.address);
      });
    });

    res.json({ success: true, mode, ssid, ips });
  } catch (error) {
    console.error('wifi info error:', error);
    res.json({ success: false, mode: 'unknown', ssid: '' });
  }
});

// APIエンドポイント: matchテーブルのレコードを更新
app.put('/api/updateMatch', async (req, res) => {
  try {
    const { id, date, team0, team1, players0, players1 } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'idが指定されていません' });
    }

    const query = `
      UPDATE "match"
      SET "date" = $1, "team0" = $2, "team1" = $3, "players0" = $4, "players1" = $5
      WHERE id = $6
    `;
    const params = [date, team0, team1, players0, players1, id];

    console.log('UPDATE match クエリ:', query, 'パラメータ:', params);

    const result = await queryRun(db, query, params);
    console.log('query結果:', result);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'マッチが見つかりません' });
    }

    res.json({ success: true, message: 'マッチを更新しました' });
  } catch (error) {
    console.error('マッチ更新エラー:', error);
    res.status(500).json({ error: error.message });
  }
});

// APIエンドポイント: matchテーブルの全ての日付を取得
app.get('/api/match-dates', async (req, res) => {
  try {
    const query = `SELECT DISTINCT "date" FROM "match" ORDER BY "date" ASC`;
    const rows = await queryAll(db, query);
    const dates = rows.map(row => row.date);
    res.json({ success: true, dates });
  } catch (error) {
    console.error('matchテーブルの日付取得エラー:', error);
    res.status(500).json({ error: error.message });
  }
});

// APIエンドポイント: matchテーブルの重複チェック
app.post('/api/check-match-duplicate', async (req, res) => {
  try {
    const { date, team0, team1 } = req.body;
    if (!date || !team0 || !team1) {
      return res.status(400).json({ error: 'date, team0, team1が必要です' });
    }

    const query = `
      SELECT MIN(id) AS id, COUNT(*)::int AS count
      FROM "match"
      WHERE "date" = $1 AND "team0" = $2 AND "team1" = $3
    `;
    const params = [date, team0, team1];

    console.log('重複チェッククエリ:', query, 'パラメータ:', params);

    const result = await queryAll(db, query, params);
    const count = result[0]?.count ?? 0;
    const matchId = result[0]?.id ?? null;

    res.json({ success: true, isDuplicate: count > 0, matchId });
  } catch (error) {
    console.error('重複チェックエラー:', error);
    res.status(500).json({ error: error.message });
  }
});

// APIエンドポイント: 全選手を取得
app.get('/api/players', async (req, res) => {
  try {
    console.log('選手リクエストを受信');
    const players = await queryAll(db, 'SELECT * FROM "players" WHERE "isAvailable" = 1');
    res.json({ success: true, players });
  } catch (error) {
    console.error('選手取得エラー:', error);
    res.status(500).json({ error: error.message });
  }
});

// APIエンドポイント: チームごとの選手を取得
app.get('/api/players/by-team', async (req, res) => {
  try {
    const { teamname } = req.query;
    if (!teamname) {
      return res.status(400).json({ error: 'teamnameが指定されていません' });
    }
    const players = await queryAll(db, 'SELECT * FROM "players" WHERE teamname = $1', [teamname]);
    res.json(players);
  } catch (error) {
    console.error('チーム別選手取得エラー:', error);
    res.status(500).json({ error: error.message });
  }
});

// APIエンドポイント: パスワード認証（POST対応）
app.post('/api/checkpass', async (req, res) => {
  let { password, username } = req.body;
  console.log("受信値 username:", username, ", password:", password);

  if (password === undefined || username === undefined) {
    return res.json({ success: false, error: "名前またはパスワード未入力" });
  }

  try {
    const query = `SELECT "teamId" FROM "user" WHERE "userName" = $1 AND "password" = $2`;
    const params = [username, password];

    const result = await queryAll(db, query, params);

    if (result.length > 0) {
      const teamId = result[0].teamId;
      console.log("ログイン成功 - teamId:", teamId);
      return res.json({ success: true, teamId });
    } else {
      return res.json({ success: false, error: "名前またはパスワードが違います" });
    }
  } catch (err) {
    console.error('checkpassエラー:', err);
    return res.status(500).json({ success: false, error: "サーバーエラー" });
  }
});

// ヘルスチェックエンドポイント
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'サーバーは正常に動作しています' });
});

// Socket.IO接続処理
io.on('connection', (socket) => {
  console.log('クライアントが接続しました:', socket.id);
  socket.on('disconnect', () => {
    console.log('クライアントが切断されました:', socket.id);
  });
});

// アプリケーション起動
async function startApp() {
  try {
    await initDatabase();

    server.listen(PORT, '0.0.0.0', () => {
      const networkInterfaces = os.networkInterfaces();
      const addresses = [];
      Object.keys(networkInterfaces).forEach(interfaceName => {
        networkInterfaces[interfaceName].forEach(iface => {
          if (iface.family === 'IPv4' && !iface.internal) {
            addresses.push(iface.address);
          }
        });
      });

      console.log(`サーバーが起動しました:`);
      console.log(` ローカル: http://localhost:${PORT}`);
      addresses.forEach(addr => {
        console.log(` ネットワーク: http://${addr}:${PORT}`);
      });
      console.log(`API エンドポイント:`);
      console.log(` POST /api/query - SELECTクエリ実行`);
      console.log(` POST /api/execute - INSERT/UPDATE/DELETE実行`);
      console.log(` GET /api/teams - 全チーム取得`);
    });

    process.on('SIGINT', async () => {
      try { await closeDatabase(); } catch (_) {}
      process.exit(0);
    });
  } catch (error) {
    console.error('アプリケーション起動エラー:', error);
    try { await closeDatabase(); } catch (_) {}
    process.exit(1);
  }
}

startApp();
