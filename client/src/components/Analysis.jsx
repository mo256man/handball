import React, { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import "./Analysis.css";
import ShootAreaSVG from "./ShootAreaSVG";

export default function Analysis({ onBack, match, teams, players1, players2 }) {

    const { socketRef, isConnected } = useSocket();
    const [lastUpdate, setLastUpdate] = useState(null);
    const [updateCount, setUpdateCount] = useState(0);

    // チーム選択用state
    const [selectedTeam, setSelectedTeam] = useState(match?.team1 || "");
    const [selectedPlayer, setSelectedPlayer] = useState("");


    // チームごとの選手リストはpropsから直接受け取る
    const playerOptions = selectedTeam === match?.team1 ? players1 : players2;

    // デバッグ用
    console.log("[Analysis] match:", match);
    console.log("[Analysis] selectedTeam:", selectedTeam);
    console.log("[Analysis] playerOptions:", playerOptions);

    useEffect(() => {
        const socket = socketRef.current;
        if (!socket) return;

        // データ更新イベントをリスン
        socket.on('data-updated', (data) => {
            console.log('データ更新を受信:', data);
            setLastUpdate(data.timestamp);
            setUpdateCount(prev => prev + 1);
            // ここでデータを再取得する処理を追加できます
        });

        return () => {
            socket.off('data-updated');
        };
    }, [socketRef]);

    return (
        <div className="analysis-container">
            <button onClick={onBack} className="top-right">戻る</button>
            <h1>データ閲覧・分析</h1>
            <div className="analysis-content">
                {/* 旧UIコメントアウト部を復元 */}
                {/* <p>ここに試合データの閲覧・分析機能を実装します</p>
                <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
                    <h3>リアルタイム更新ステータス</h3>
                    <p>接続状態: {isConnected ? '✅ 接続中' : '❌ 未接続'}</p>
                    <p>更新回数: {updateCount}</p>
                    {lastUpdate && (
                        <p>最終更新: {new Date(lastUpdate).toLocaleString('ja-JP')}</p>
                    )}
                </div> */}
                <div style={{ marginBottom: 16 }}>
                    <label>チーム選択: </label>
                    <select
                        value={selectedTeam}
                        onChange={e => {
                            setSelectedTeam(e.target.value);
                            setSelectedPlayer("");
                        }}
                    >
                        <option value={match?.team1}>{match?.team1}</option>
                        <option value={match?.team2}>{match?.team2}</option>
                    </select>
                </div>
                <div style={{ marginBottom: 16 }}>
                    <label>選手選択: </label>
                    <select
                        value={selectedPlayer}
                        onChange={e => setSelectedPlayer(e.target.value)}
                    >
                        <option value="">選択してください</option>
                        {(playerOptions || []).map((p, i) => (
                            <option key={i} value={p}>{p}</option>
                        ))}
                    </select>
                </div>
                {/* ここに他の分析UIを追加 */}
            </div>
            <ShootAreaSVG/>
        </div>
    );
}
