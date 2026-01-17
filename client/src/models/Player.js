/**
 * プレイヤークラス
 */
export class Player {
    constructor({ number = "", name = "", position = "", isOnBench = true } = {}) {
        this.number = number;
        this.name = name;
        this.position = position;
        this.isOnBench = isOnBench;
    }

    /**
     * データベースから取得したメンバー情報からPlayerインスタンスを作成
     * @param {Object} memberData データベースのメンバー情報
     * @param {boolean} isOnBench ベンチ入りしているか
     * @returns {Player}
     */
    static fromDatabase(memberData, isOnBench = true) {
        return new Player({
            number: memberData.number || "",
            name: memberData.name || "",
            position: memberData.position || "",
            isOnBench: isOnBench
        });
    }

    /**
     * JSON形式に変換
     * @returns {Object}
     */
    toJSON() {
        return {
            number: this.number,
            name: this.name,
            position: this.position,
            isOnBench: this.isOnBench
        };
    }
}
