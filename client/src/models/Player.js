/**
 * プレイヤークラス
 */
export class Player {
    constructor({ id = null, number = "", name = "", position = "", teamId = null, shortname = "", isOnBench = true, isPnalty = false, penaltyTime = 0 } = {}) {
        this.id = id;
        this.number = number;
        this.name = name;
        this.position = position;
        this.teamId = teamId;
        this.shortname = shortname;
        this.isOnBench = isOnBench;
        this.isPnalty = isPnalty;
        this.penaltyTime = penaltyTime;
    }

    /**
     * データベースから取得したメンバー情報からPlayerインスタンスを作成
     * @param {Object} memberData データベースのメンバー情報
     * @param {boolean} isOnBench ベンチ入りしているか
     * @returns {Player}
     */
    static fromDatabase(memberData, isOnBench = true) {
        return new Player({
            id: memberData.id ?? null,
            number: memberData.number || "",
            name: memberData.name || "",
            position: memberData.position || "",
            teamId: memberData.teamId ?? null,
            shortname: memberData.shortname || "",
            isOnBench: isOnBench,
            isPnalty: false,
            penaltyTime: memberData.penaltyTime ?? 0
        });
    }

    /**
     * JSON形式に変換
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this.id,
            number: this.number,
            name: this.name,
            position: this.position,
            teamId: this.teamId,
            shortname: this.shortname,
            isOnBench: this.isOnBench,
            isPnalty: this.isPnalty,
            penaltyTime: this.penaltyTime
        };
    }
}
