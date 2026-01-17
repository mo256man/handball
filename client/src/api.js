// 環境変数またはデフォルトで現在のホストを使用（localhost以外からもアクセス可能）
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * 全チームを取得
 * @returns {Promise<Array>} チームの配列
 */
export async function getTeams() {
    try {
        const response = await fetch(`${API_BASE_URL}/teams`);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'チームの取得に失敗しました');
        }
        
        return result.teams || result.data;
    } catch (error) {
        console.error('getTeams エラー:', error);
        throw error;
    }
}

/**
 * 全選手を取得
 * @returns {Promise<Array>} 選手の配列
 */
export async function getPlayers() {
    try {
        const response = await fetch(`${API_BASE_URL}/players`);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || '選手の取得に失敗しました');
        }
        
        return result.players || result.data;
    } catch (error) {
        console.error('getPlayers エラー:', error);
        throw error;
    }
}

/**
 * カスタムSELECTクエリを実行
 * @param {string} query SQLクエリ
 * @param {Array} params パラメータ
 * @returns {Promise<Array>} クエリ結果
 */
export async function executeQuery(query, params = []) {
    try {
        const response = await fetch(`${API_BASE_URL}/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query, params }),
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'クエリの実行に失敗しました');
        }
        
        return result.data;
    } catch (error) {
        console.error('executeQuery エラー:', error);
        throw error;
    }
}

/**
 * INSERT/UPDATE/DELETEクエリを実行
 * @param {string} query SQLクエリ
 * @param {Array} params パラメータ
 * @returns {Promise<Object>} 実行結果
 */
export async function executeUpdate(query, params = []) {
    try {
        const response = await fetch(`${API_BASE_URL}/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query, params }),
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'クエリの実行に失敗しました');
        }
        
        return result;
    } catch (error) {
        console.error('executeUpdate エラー:', error);
        throw error;
    }
}

/**
 * resultテーブルのカウントを取得
 * @param {string} date 日付
 * @param {string} team チーム名
 * @returns {Promise<number>} カウント数
 */
export async function getResultCount(date, team) {
    try {
        const response = await fetch(`${API_BASE_URL}/resultCount?date=${date}&team=${encodeURIComponent(team)}`);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'カウントの取得に失敗しました');
        }
        
        return result.count;
    } catch (error) {
        console.error('getResultCount エラー:', error);
        throw error;
    }
}

/**
 * recordテーブルにデータを挿入
 * @param {Object} data 挿入データ
 * @returns {Promise<Object>} 実行結果
 */
export async function insertRecord(data) {
    try {
        const response = await fetch(`${API_BASE_URL}/insertRecord`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'recordデータの挿入に失敗しました');
        }
        
        return result;
    } catch (error) {
        console.error('insertRecord エラー:', error);
        throw error;
    }
}

/**
 * matchテーブルにデータを挿入
 * @param {string} date 日付
 * @param {string} team1 チーム1
 * @param {string} team2 チーム2
 * @returns {Promise<Object>} 実行結果
 */
export async function insertMatch(date, team1, team2) {
    try {
        const response = await fetch(`${API_BASE_URL}/insertMatch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ date, team1, team2 }),
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || '試合データの挿入に失敗しました');
        }
        
        return result;
    } catch (error) {
        console.error('insertMatch エラー:', error);
        throw error;
    }
}

/**
 * 指定日付の試合データを取得
 * @param {string} date 日付
 * @returns {Promise<Array>} 試合データの配列
 */
export async function getMatches(date) {
    try {
        const response = await fetch(`${API_BASE_URL}/getMatches?date=${date}`);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || '試合データの取得に失敗しました');
        }
        
        return result.matches;
    } catch (error) {
        console.error('getMatches エラー:', error);
        throw error;
    }
}
