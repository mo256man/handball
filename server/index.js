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
        const tables = queryAll(db, "SELECT name FROM sqlite_master WHERE type='table'");
        console.log('データベース内のテーブル:', tables);
    } catch (error) {
        console.error('データベース初期化エラー:', error);
        throw error;
    }
}

// APIエンドポイント: recordテーブルの日付一覧（重複なし）を取得
app.get('/api/available-dates', (req, res) => {
    try {
        if (!db) {
            throw new Error('データベースが初期化されていません');
        }
        // DISTINCTで日付一覧を取得
        const rows = queryAll(db, "SELECT DISTINCT date FROM record ORDER BY date ASC");
        // date列だけの配列に変換
        const dates = rows.map(row => row.date);
        res.json(dates);
    } catch (error) {
        console.error('available-dates取得エラー:', error);
        res.status(500).json({ error: error.message });
    }
});

// APIエンドポイント: SELECTクエリを実行
app.post('/api/query', (req, res) => {
    try {
        const { query, params = [] } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'クエリが指定されていません' });
        }
        
        // SELECTクエリのみ許可
        if (!query.trim().toLowerCase().startsWith('select')) {
            return res.status(400).json({ error: 'SELECTクエリのみ実行可能です' });
        }
        
        const results = queryAll(db, query, params);
        res.json({ success: true, data: results });
    } catch (error) {
        console.error('クエリ実行エラー:', error);
        res.status(500).json({ error: error.message });
    }
});

// APIエンドポイント: INSERT/UPDATE/DELETEクエリを実行
app.post('/api/execute', (req, res) => {
    try {
        const { query, params = [] } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'クエリが指定されていません' });
        }
        
        const result = queryRun(db, query, params);
        saveDatabase(db); // 変更を保存
        
        // データ更新を全クライアントに通知
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
app.get('/api/teams', (req, res) => {
    try {
        console.log('チーム取得リクエストを受信');
        if (!db) {
            throw new Error('データベースが初期化されていません');
        }
        const teams = queryAll(db, "SELECT * FROM teams");
        console.log('チーム数:', teams.length);
        res.json({ success: true, teams: teams });
    } catch (error) {
        console.error('チーム取得エラー:', error);
        res.status(500).json({ error: error.message });
    }
});

// APIエンドポイント: recordテーブルにデータを挿入
app.post('/api/insertRecord', (req, res) => {
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
        
        const result = queryRun(db, query, params);
        saveDatabase(db); // 変更を保存
        
        // データ更新を全クライアントに通知
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
app.get('/api/resultCount', (req, res) => {
    try {
        const { date, team } = req.query;
        
        if (!date || !team) {
            return res.status(400).json({ error: 'dateとteamが指定されていません' });
        }
        
        const query = `SELECT COUNT(*) as count FROM result WHERE date = ? AND team = ?`;
        const params = [date, team];
        
        console.log('COUNTクエリ:', query, 'パラメータ:', params);
        
        const result = queryAll(db, query, params);
        const count = result[0].count;
        
        res.json({ success: true, count: count });
    } catch (error) {
        console.error('カウント取得エラー:', error);
        res.status(500).json({ error: error.message });
    }
});

// APIエンドポイント: matchテーブルにデータを挿入
app.post('/api/insertMatch', (req, res) => {
    try {
        const { date, team1, team2 } = req.body;
        
        if (!date || !team1 || !team2) {
            return res.status(400).json({ error: 'date, team1, team2が必要です' });
        }
        
        const query = `INSERT INTO match (date, team1, team2) VALUES (?, ?, ?)`;
        const params = [date, team1, team2];
        
        console.log('INSERT matchクエリ:', query, 'パラメータ:', params);
        
        const result = queryRun(db, query, params);
        saveDatabase(db); // 変更を保存
        
        // データ更新を全クライアントに通知
        io.emit('data-updated', { 
            message: '試合データが更新されました',
            timestamp: new Date().toISOString()
        });
        
        res.json({ success: true, changes: result.changes });
    } catch (error) {
        console.error('試合データ挿入エラー:', error);
        res.status(500).json({ error: error.message });
    }
});

// APIエンドポイント: 指定日付の試合データを取得
app.get('/api/getMatches', (req, res) => {
    try {
        const { date } = req.query;
        
        if (!date) {
            return res.status(400).json({ error: 'dateが指定されていません' });
        }
        
        const query = `SELECT * FROM match WHERE date = ?`;
        const params = [date];
        
        console.log('SELECT matchクエリ:', query, 'パラメータ:', params);
        
        const matches = queryAll(db, query, params);
        
        res.json({ success: true, matches: matches });
    } catch (error) {
        console.error('試合データ取得エラー:', error);
        res.status(500).json({ error: error.message });
    }
});


// APIエンドポイント: 全選手を取得
app.get('/api/players', (req, res) => {
    try {
        console.log('選手リクエストを受信');
        if (!db) {
            throw new Error('データベースが初期化されていません');
        }
        const players = queryAll(db, "SELECT * FROM players");
        res.json({ success: true, players: players });
    } catch (error) {
        console.error('選手取得エラー:', error);
        res.status(500).json({ error: error.message });
    }
});

// APIエンドポイント: チームごとの選手を取得
app.get('/api/players/by-team', (req, res) => {
    try {
        if (!db) throw new Error('データベースが初期化されていません');
        const { teamname } = req.query;
        if (!teamname) return res.status(400).json({ error: 'teamnameが指定されていません' });
        const players = queryAll(db, "SELECT * FROM players WHERE teamname = ?", [teamname]);
        res.json(players);
    } catch (error) {
        console.error('チーム別選手取得エラー:', error);
        res.status(500).json({ error: error.message });
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

startApp();
