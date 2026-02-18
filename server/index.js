const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { loadDatabase, closeDatabase, queryAll, queryRun, saveDatabase } = require('./database');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const PORT = 3001;

// ミドルウェア設定
app.use(cors());
app.use(express.json());

let db; // グローバルなデータベース接続

// データベース初期化
async function initDatabase() {
    try {
        db = await loadDatabase();
        console.log('データベースを初期化しました');
        
        // テーブル一覧を表示
        const tables = await queryAll(db, "SELECT name FROM sqlite_master WHERE type='table'");
        console.log('データベース内のテーブル:', tables);
    } catch (error) {
        console.error('データベース初期化エラー:', error);
        throw error;
    }
}

// APIエンドポイント: recordテーブルの日付一覧（重複なし）を取得
app.get('/api/available-dates', async (req, res) => {
    try {
        if (!db) {
            throw new Error('データベースが初期化されていません');
        }
        const rows = await queryAll(db, "SELECT DISTINCT date FROM record ORDER BY date ASC");
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
        if (!query) {
            return res.status(400).json({ error: 'クエリが指定されていません' });
        }
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
        if (!query) {
            return res.status(400).json({ error: 'クエリが指定されていません' });
        }
        const result = await queryRun(db, query, params);
        await saveDatabase(db); // 変更を保存
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
        if (!db) {
            throw new Error('データベースが初期化されていません');
        }
        const teams = await queryAll(db, "SELECT * FROM teams WHERE isAvailable = 1");
        console.log('チーム数:', teams.length);
        
        // imageカラムをBase64エンコードして返す
        const teamsWithImage = teams.map(team => {
            const result = {
                teamid: team.teamid,
                teamname: team.teamname,
                isAvailable: team.isAvailable,
                color: team.color,
                // その他のフィールドをコピー
                ...Object.keys(team).reduce((acc, key) => {
                    if (!['teamid', 'teamname', 'isAvailable', 'color', 'image'].includes(key)) {
                        acc[key] = team[key];
                    }
                    return acc;
                }, {})
            };
            
            // imageの処理
            if (team.image) {
                let imageBuffer = team.image;
                
                console.log(`[${team.teamname}] image type:`, typeof imageBuffer);
                console.log(`[${team.teamname}] image instanceof Uint8Array:`, imageBuffer instanceof Uint8Array);
                console.log(`[${team.teamname}] image length:`, imageBuffer?.length);
                
                // Uint8Arrayやオブジェクト型の場合、Bufferに変換
                if (imageBuffer instanceof Uint8Array) {
                    console.log(`[${team.teamname}] Converting Uint8Array to Buffer`);
                    imageBuffer = Buffer.from(imageBuffer);
                } else if (typeof imageBuffer === 'object' && imageBuffer !== null) {
                    console.log(`[${team.teamname}] Converting object to Buffer`);
                    const values = Object.values(imageBuffer);
                    imageBuffer = Buffer.from(values);
                    console.log(`[${team.teamname}] Buffer created, length:`, imageBuffer.length);
                }
                
                const base64String = imageBuffer.toString('base64');
                result.image = 'data:image/png;base64,' + base64String;
                
                console.log(`[${team.teamname}] Base64 assigned, type:`, typeof result.image);
                console.log(`[${team.teamname}] Base64 preview:`, result.image.substring(0, 50));
            } else {
                result.image = null;
            }
            
            return result;
        });
        
        // 返す前に確認
        console.log('=== 返すデータ確認 ===');
        console.log('teamsWithImage[0].image type:', typeof teamsWithImage[0]?.image);
        console.log('teamsWithImage[0].image preview:', teamsWithImage[0]?.image?.substring(0, 50));
        
        res.json({ success: true, teams: teamsWithImage });
    } catch (error) {
        console.error('チーム取得エラー:', error);
        res.status(500).json({ error: error.message });
    }
});

// APIエンドポイント: recordテーブルにデータを挿入
app.post('/api/insertRecord', async (req, res) => {
    try {
        const data = req.body;
        if (!data) {
            return res.status(400).json({ error: 'データが指定されていません' });
        }
        const query = `INSERT INTO record (date, team, half, situation, number, kind, result, gk, yellowcard, "2min", remarks, area, goal, player, team1, team2) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const params = [
            data.date,
            data.team,
            data.half,
            data.situation,
            data.number,
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
        await saveDatabase(db); // 変更を保存
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
        if (!date || !team) {
            return res.status(400).json({ error: 'dateとteamが指定されていません' });
        }
        const query = `SELECT COUNT(*) as count FROM result WHERE date = ? AND team = ?`;
        const params = [date, team];
        console.log('COUNTクエリ:', query, 'パラメータ:', params);
        const result = await queryAll(db, query, params);
        const count = result[0].count;
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
        const query = `INSERT INTO record (
            matchId, teamId, playerId, playeNumberr, playerPosition, playerName,
            half, situation, kind, result, gk, remarks, area, goal, setPlay, isGS, isGSO, isAtk, isSht, isFB
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const params = [
            data.matchId,
            data.teamId,
            data.playerId,
            data.playeNumberr,
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
            data.isGS || 0,
            data.isGSO || 0,
            data.isAtk || 0,
            data.isSht || 0,
            data.isFB || 0
        ];
        console.log('INSERT recordクエリ:', query);
        console.log('パラメータ:', params);
        const result = await queryRun(db, query, params);
        await saveDatabase(db);
        io.emit('data-updated', { 
            message: 'レコードが更新されました',
            timestamp: new Date().toISOString()
        });
        res.json({ success: true, changes: result.changes, recordId: result.lastID });
    } catch (error) {
        console.error('レコード挿入エラー:', error);
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
        const query = `INSERT INTO match (date, team0, team1, players0, players1) VALUES (?, ?, ?, ?, ?)`;
        const params = [date, team0, team1, players0 || '', players1 || ''];
        console.log('INSERT matchクエリ:', query, 'パラメータ:', params);
        const result = await queryRun(db, query, params);
        await saveDatabase(db); // 変更を保存
        io.emit('data-updated', { 
            message: '試合データが更新されました',
            timestamp: new Date().toISOString()
        });
        // 挿入されたレコードのIDを返す
        res.json({ success: true, changes: result.changes, matchId: result.lastID });
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
        const query = `SELECT * FROM match WHERE date = ?`;
        const params = [date];
        console.log('SELECT matchクエリ:', query, 'パラメータ:', params);
        const matches = await queryAll(db, query, params);
        res.json({ success: true, matches: matches });
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
        const query = `SELECT * FROM match WHERE id = ?`;
        const params = [id];
        console.log('SELECT match (by id) クエリ:', query, 'パラメータ:', params);
        
        // queryAllを使用し、パラメータを渡す
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

// APIエンドポイント: matchテーブルのレコードを更新
app.put('/api/updateMatch', async (req, res) => {
    try {
        const { id, date, team0, team1, players0, players1 } = req.body;
        if (!id) {
            return res.status(400).json({ error: 'idが指定されていません' });
        }
        const query = `UPDATE match SET date = ?, team0 = ?, team1 = ?, players0 = ?, players1 = ? WHERE id = ?`;
        const params = [date, team0, team1, players0, players1, id];
        console.log('UPDATE match クエリ:', query, 'パラメータ:', params);
        
        const result = await queryRun(db, query, params);
        console.log('query結果:', result);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'マッチが見つかりません' });
        }
        
        // データベースをファイルに保存
        await saveDatabase(db);
        
        res.json({ success: true, message: 'マッチを更新しました' });
    } catch (error) {
        console.error('マッチ更新エラー:', error);
        res.status(500).json({ error: error.message });
    }
});

// APIエンドポイント: matchテーブルの全ての日付を取得
app.get('/api/match-dates', async (req, res) => {
    try {
        if (!db) {
            throw new Error('データベースが初期化されていません');
        }
        const query = `SELECT DISTINCT date FROM match ORDER BY date ASC`;
        const rows = await queryAll(db, query);
        const dates = rows.map(row => row.date);
        res.json({ success: true, dates: dates });
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
        const query = `SELECT id, COUNT(*) as count FROM match WHERE date = ? AND team0 = ? AND team1 = ?`;
        const params = [date, team0, team1];
        console.log('重複チェッククエリ:', query, 'パラメータ:', params);
        const result = await queryAll(db, query, params);
        const count = result[0].count;
        const matchId = result[0].id || null;
        res.json({ success: true, isDuplicate: count > 0, matchId: matchId });
    } catch (error) {
        console.error('重複チェックエラー:', error);
        res.status(500).json({ error: error.message });
    }
});


// APIエンドポイント: 全選手を取得
app.get('/api/players', async (req, res) => {
    try {
        console.log('選手リクエストを受信');
        if (!db) {
            throw new Error('データベースが初期化されていません');
        }
        const players = await queryAll(db, "SELECT * FROM players WHERE isAvailable = 1");
        res.json({ success: true, players: players });
    } catch (error) {
        console.error('選手取得エラー:', error);
        res.status(500).json({ error: error.message });
    }
});

// APIエンドポイント: チームごとの選手を取得
app.get('/api/players/by-team', async (req, res) => {
    try {
        if (!db) throw new Error('データベースが初期化されていません');
        const { teamname } = req.query;
        if (!teamname) return res.status(400).json({ error: 'teamnameが指定されていません' });
        const players = await queryAll(db, "SELECT * FROM players WHERE teamname = ?", [teamname]);
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
        if (!db) {
            throw new Error('データベースが初期化されていません');
        }
        // userテーブルからチームIDを取得
        const query = "SELECT teamId FROM user WHERE userName = ? AND password = ?";
        const params = [username, password];
        const result = await queryAll(db, query, params);
        if (result.length > 0) {
            const teamId = result[0].teamId;
            console.log("ログイン成功 - teamId:", teamId);
            return res.json({ success: true, teamId: teamId });
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
        // データベースを初期化
        await initDatabase();
        
        // サーバーを起動 - 0.0.0.0でバインドしてLAN上の他デバイスからアクセス可能にする
        server.listen(PORT, '0.0.0.0', () => {
            // ローカルIPアドレスを取得して表示
            const os = require('os');
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
            console.log(`  ローカル: http://localhost:${PORT}`);
            addresses.forEach(addr => {
                console.log(`  ネットワーク: http://${addr}:${PORT}`);
            });
            console.log(`API エンドポイント:`);
            console.log(`  POST /api/query - SELECTクエリ実行`);
            console.log(`  POST /api/execute - INSERT/UPDATE/DELETE実行`);
            console.log(`  GET  /api/teams - 全チーム取得`);
        });
        
        // アプリケーション終了時にデータベースを閉じる
        process.on('SIGINT', () => {
            if (db) {
                closeDatabase(db);
            }
            process.exit(0);
        });
        
    } catch (error) {
        console.error('アプリケーション起動エラー:', error);
        if (db) {
            closeDatabase(db);
        }
        process.exit(1);
    }
}


// const path = require('path');
// app.use(express.static(path.join(__dirname, '../client/dist')));
// // Fallback to index.html for client-side routing (only for GET requests that accept HTML)
// app.use((req, res, next) => {
//     if (req.method !== 'GET') return next();
//     const accept = req.headers.accept || '';
//     if (accept.indexOf('text/html') === -1) return next();
//     res.sendFile(path.join(__dirname, '../client/dist/index.html'));
// });

startApp();
