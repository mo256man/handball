// タイムアウト付きPromiseラッパー
function withTimeout(promise, ms = 3000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('タイムアウト')), ms))
  ]);
}
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

/**
 * 起動時にhandball.sqliteデータベースを読み込む関数
 * @returns {Promise<Object>} データベース接続オブジェクト
 */
async function loadDatabase() {
  try {
    // sql.jsを初期化
    const SQL = await initSqlJs();
    
    // データベースファイルのパス
    const dbPath = path.join(__dirname, 'handball.sqlite');
    
    // データベースファイルを読み込む
    const fileBuffer = fs.readFileSync(dbPath);
    
    // データベースを開く
    const db = new SQL.Database(fileBuffer);
    
    console.log('handball.sqliteデータベースに接続しました');
    return db;
  } catch (error) {
    console.error('データベース接続エラー:', error.message);
    throw error;
  }
}

/**
 * データベースを閉じる関数
 * @param {Object} db データベース接続オブジェクト
 */
function closeDatabase(db) {
  try {
    db.close();
    console.log('データベース接続を閉じました');
  } catch (error) {
    console.error('データベース切断エラー:', error.message);
    throw error;
  }
}

/**
 * クエリを実行する関数（SELECT用）
 * @param {Object} db データベース接続オブジェクト
 * @param {string} query SQLクエリ
 * @param {Array} params パラメータ
 * @returns {Array} クエリ結果
 */
async function queryAll(db, query, params = []) {
  return withTimeout(new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(query);
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      resolve(rows);
    } catch (error) {
      console.error('クエリ実行エラー:', error.message);
      reject(error);
    }
  }));
}

/**
 * クエリを実行する関数（INSERT/UPDATE/DELETE用）
 * @param {Object} db データベース接続オブジェクト
 * @param {string} query SQLクエリ
 * @param {Array} params パラメータ
 * @returns {Object} 実行結果 { changes, lastID }
 */
async function queryRun(db, query, params = []) {
  return withTimeout(new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(query);
      stmt.bind(params);
      stmt.step();
      stmt.free();
      const changes = db.getRowsModified();
      const lastID = db.exec("SELECT last_insert_rowid() as id")[0]?.values[0]?.[0] || null;
      resolve({ changes, lastID });
    } catch (error) {
      console.error('クエリ実行エラー:', error.message);
      reject(error);
    }
  }));
}

/**
 * データベースをファイルに保存する関数
 * @param {Object} db データベース接続オブジェクト
 * @param {string} filePath 保存先のファイルパス（省略時は元のファイルに上書き）
 */
async function saveDatabase(db, filePath = null) {
  return withTimeout(new Promise((resolve, reject) => {
    try {
      const data = db.export();
      const buffer = Buffer.from(data);
      const savePath = filePath || path.join(__dirname, 'handball.sqlite');
      fs.writeFileSync(savePath, buffer);
      console.log('データベースを保存しました:', savePath);
      resolve();
    } catch (error) {
      console.error('データベース保存エラー:', error.message);
      reject(error);
    }
  }));
}

module.exports = {
  loadDatabase,
  closeDatabase,
  queryAll,
  queryRun,
  saveDatabase
};
