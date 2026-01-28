import React, { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import "./Analysis.css";

export default function Analysis({ onBackToTitle }) {
    const { socketRef, isConnected } = useSocket();
    const [lastUpdate, setLastUpdate] = useState(null);
    const [updateCount, setUpdateCount] = useState(0);

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
            <h1>データ閲覧・分析</h1>
            <div className="analysis-content">
                <p>ここに試合データの閲覧・分析機能を実装します</p>
                <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
                    <h3>リアルタイム更新ステータス</h3>
                    <p>接続状態: {isConnected ? '✅ 接続中' : '❌ 未接続'}</p>
                    <p>更新回数: {updateCount}</p>
                    {lastUpdate && (
                        <p>最終更新: {new Date(lastUpdate).toLocaleString('ja-JP')}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
