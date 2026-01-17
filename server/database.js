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
function queryAll(db, query, params = []) {
  try {
    const stmt = db.prepare(query);
    stmt.bind(params);
    
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    
    return rows;
  } catch (error) {
    console.error('クエリ実行エラー:', error.message);
    throw error;
  }
}

/**
 * クエリを実行する関数（INSERT/UPDATE/DELETE用）
 * @param {Object} db データベース接続オブジェクト
 * @param {string} query SQLクエリ
 * @param {Array} params パラメータ
 * @returns {Object} 実行結果
 */
function queryRun(db, query, params = []) {
  try {
    db.run(query, params);
    
    // 変更された行数を取得
    const changes = db.getRowsModified();
    
    return {
      changes: changes
    };
  } catch (error) {
    console.error('クエリ実行エラー:', error.message);
    throw error;
  }
}

/**
 * データベースをファイルに保存する関数
 * @param {Object} db データベース接続オブジェクト
 * @param {string} filePath 保存先のファイルパス（省略時は元のファイルに上書き）
 */
function saveDatabase(db, filePath = null) {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    const savePath = filePath || path.join(__dirname, 'handball.sqlite');
    fs.writeFileSync(savePath, buffer);
    console.log('データベースを保存しました:', savePath);
  } catch (error) {
    console.error('データベース保存エラー:', error.message);
    throw error;
  }
}

module.exports = {
  loadDatabase,
  closeDatabase,
  queryAll,
  queryRun,
  saveDatabase
};
