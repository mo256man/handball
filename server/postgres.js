const { Pool } = require('pg');

const SUPABASE_DB_URL =
  'postgresql://postgres.cmvyhbywdofxaovhbxdg:nbDplZhBWsklf1yH@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

let pool = null;

/**
 * PostgreSQLプールを初期化する関数
 * @returns {Promise<Object>} 空のオブジェクト（インターフェース統一用）
 */
async function loadDatabase() {
  try {
    pool = new Pool({
      connectionString: SUPABASE_DB_URL,
      ssl: { rejectUnauthorized: false }
    });
    console.log('Supabase PostgreSQLに接続しました');
    return {};
  } catch (error) {
    console.error('PostgreSQL接続エラー:', error.message);
    throw error;
  }
}

/**
 * PostgreSQLコネクションを切断する関数
 */
async function closeDatabase() {
  try {
    if (pool) {
      await pool.end();
      console.log('PostgreSQL接続を閉じました');
    }
  } catch (error) {
    console.error('PostgreSQL切断エラー:', error.message);
    throw error;
  }
}

/**
 * クエリを実行する関数（SELECT用）
 * @param {Object} db データベース接続オブジェクト（未使用、インターフェース統一用）
 * @param {string} query SQLクエリ
 * @param {Array} params パラメータ
 * @returns {Promise<Array>} クエリ結果
 */
async function queryAll(db, query, params = []) {
  try {
    const res = await pool.query(query, params);
    return res.rows;
  } catch (error) {
    console.error('クエリ実行エラー:', error.message);
    throw error;
  }
}

/**
 * クエリを実行する関数（INSERT/UPDATE/DELETE用）
 * @param {Object} db データベース接続オブジェクト（未使用、インターフェース統一用）
 * @param {string} query SQLクエリ
 * @param {Array} params パラメータ
 * @returns {Promise<Object>} 実行結果 { changes, rows }
 */
async function queryRun(db, query, params = []) {
  try {
    const res = await pool.query(query, params);
    return { changes: res.rowCount, rows: res.rows };
  } catch (error) {
    console.error('クエリ実行エラー:', error.message);
    throw error;
  }
}

/**
 * データベースを保存する関数（PostgreSQL用は何もしない）
 */
async function saveDatabase() {
  // PostgreSQLは自動的に保存されるため、何もしない
}

module.exports = {
  loadDatabase,
  closeDatabase,
  queryAll,
  queryRun,
  saveDatabase
};
