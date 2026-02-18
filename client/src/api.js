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
 * matchId に紐づく record レコードを取得
 * @param {number|string} matchId
 * @returns {Promise<Array>} record の配列
 */
export async function getRecordsByMatchId(matchId) {
    try {
        const query = `SELECT * FROM record WHERE matchId = ?`;
        const data = await executeQuery(query, [matchId]);
        return data || [];
    } catch (error) {
        console.error('getRecordsByMatchId エラー:', error);
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
 * @param {string} team0 チーム0
 * @param {string} team1 チーム1
 * @param {string} players0 チーム0の選手ID（コンマ区切り）
 * @param {string} players1 チーム1の選手ID（コンマ区切り）
 * @returns {Promise<Object>} { success, changes, matchId } matchIdはDBのmatchテーブルのid列
 */
export async function insertMatch(date, team0, team1, players0 = '', players1 = '') {
    try {
        const response = await fetch(`${API_BASE_URL}/insertMatch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ date, team0, team1, players0, players1 }),
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
     * 既存の match レコードを更新
     * @param {number} id マッチのID
     * @param {string} date 日付
     * @param {string|number} team0
     * @param {string|number} team1
     * @param {string} players0
     * @param {string} players1
     * @returns {Promise<Object>} サーバの応答
     */
    export async function updateMatch(id, date, team0, team1, players0 = '', players1 = '') {
        try {
            const response = await fetch(`${API_BASE_URL}/updateMatch`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id, date, team0, team1, players0, players1 }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || '試合データの更新に失敗しました');
            }

            return result;
        } catch (error) {
            console.error('updateMatch エラー:', error);
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

/**
 * matchテーブルの全ての試合日付を取得
 * @returns {Promise<Array>} 日付の配列
 */
export async function getMatchDates() {
    try {
        const response = await fetch(`${API_BASE_URL}/match-dates`);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || '試合日付の取得に失敗しました');
        }
        
        return result.dates || [];
    } catch (error) {
        console.error('getMatchDates エラー:', error);
        throw error;
    }
}

/**
 * matchテーブルの重複チェック
 * @param {string} date 日付
 * @param {string} team0 チーム0
 * @param {string} team1 チーム1
 * @param {string} players0 チーム0の選手ID（コンマ区切り）
 * @param {string} players1 チーム1の選手ID（コンマ区切り）
 * @returns {Promise<Object>} { isDuplicate, matchId } matchIdはDBのmatchテーブルのid列
 */
export async function checkMatchDuplicate(date, team0, team1) {
    try {
        const response = await fetch(`${API_BASE_URL}/check-match-duplicate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ date, team0, team1 }),
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'チェックに失敗しました');
        }
        
        return {
            isDuplicate: result.isDuplicate || false,
            matchId: result.matchId || null
        };
    } catch (error) {
        console.error('checkMatchDuplicate エラー:', error);
        throw error;
    }
}

export async function getMatchById(matchId) {
    try {
        const response = await fetch(`${API_BASE_URL}/getMatch?id=${matchId}`);
        
        if (!response.ok) {
            throw new Error('マッチデータ取得に失敗しました');
        }
        
        return await response.json();
    } catch (error) {
        console.error('getMatchById エラー:', error);
        throw error;
    }
}
