import React, { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import { getMatches } from "../api";
import "./Analysis.css";

export default function AnalysisMenu({ onBackToTitle, teams, players }) {
    const { socketRef, isConnected } = useSocket();
    const [lastUpdate, setLastUpdate] = useState(null);
    const [updateCount, setUpdateCount] = useState(0);
    const [date, setDate] = useState(new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' }));
    const [matches, setMatches] = useState([]);

    // dateが変更されたら試合データを取得
    useEffect(() => {
        if (date) {
            fetchMatches();
        }
    }, [date]);

    const fetchMatches = async () => {
        try {
            const matchData = await getMatches(date);
            setMatches(matchData);
        } catch (error) {
            console.error('試合データ取得エラー:', error);
            setMatches([]);
        }
    };

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
            <button onClick={onBackToTitle} className="top-right">戻る</button>
            <h1>データ閲覧</h1>
            <div><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div className="analysis-content">
                <h2>{date} の試合</h2>
                {matches.length === 0 ? (
                    <p>試合データがありません</p>
                ) : (
                    <div className="matches-list">
                        {matches.map((match, index) => (
                            <div key={index} className="match-item">
                                {match.team1} vs {match.team2}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
