import React, { useEffect, useState } from "react";
import Analysis from "./Analysis";
import { useSocket } from "../hooks/useSocket";
import { getMatches } from "../api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { parseISO, format, isSameDay } from "date-fns";
import ja from "date-fns/locale/ja";
import "./Analysis.css";


export default function AnalysisMenu({ onBackToTitle, teams, players }) {
    const { socketRef, isConnected } = useSocket();
    const [lastUpdate, setLastUpdate] = useState(null);
    const [updateCount, setUpdateCount] = useState(0);

    // dateはDate型で管理
    const [date, setDate] = useState(new Date());
    const [matches, setMatches] = useState([]);
    // データがある日付の配列（例: ["2026-01-25", "2026-01-28"]）
    const [availableDates, setAvailableDates] = useState([]);
    // 選択中match用のplayers1, players2
    const [players1, setPlayers1] = useState([]);
    const [players2, setPlayers2] = useState([]);

    // デバッグ用: players1, players2の内容を出力
    console.log("[AnalysisMenu] players1:", players1);
    console.log("[AnalysisMenu] players2:", players2);

    // Analysis表示用state
    const [selectedMatch, setSelectedMatch] = useState(null);


    // dateが変更されたら試合データを取得
    useEffect(() => {
        if (date) {
            fetchMatches();
        }
    }, [date]);

    // 初回マウント時にavailableDatesを取得（API例: getAvailableDates）
    useEffect(() => {
        const fetchAvailableDates = async () => {
            try {
                // 仮API: getAvailableDatesを呼び出し
                // ここは実際のAPIに合わせて修正してください
                const res = await fetch("/api/available-dates");
                const data = await res.json(); // ["2026-01-25", "2026-01-28", ...]
                setAvailableDates(data);
            } catch (e) {
                setAvailableDates([]);
            }
        };
        fetchAvailableDates();
    }, []);


    const fetchMatches = async () => {
        try {
            // dateはDate型なので、APIに合わせてフォーマット
            const dateStr = format(date, 'yyyy-MM-dd');
            const matchData = await getMatches(dateStr);
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


    // availableDatesの日付だけをハイライト
    const highlightDates = availableDates.map(d => parseISO(d));
    console.log("highlightDates", highlightDates);

    // 試合クリック時のAnalysis生成ハンドラ（stateは後で指示とのことなので仮実装）

    // 選択したmatchのteam1, team2の選手リストを取得してAnalysisに渡す
    const handleMatchClick = async (match) => {
        // API例: /api/players?teamname=xxx
        const fetchPlayers = async (teamname) => {
            try {
                const res = await fetch(`/api/players/by-team?teamname=${encodeURIComponent(teamname)}`);
                if (!res.ok) return [];
                const data = await res.json();
                console.log(`[fetchPlayers] teamname: ${teamname}, data:`, data);
                // サーバーのby-team APIは配列を直接返す
                return Array.isArray(data) ? data.map(p => p.name || p.playername || p) : [];
            } catch (err) {
                console.error(`[fetchPlayers] fetch error for teamname: ${teamname}`, err);
                return [];
            }
        };
        const [p1, p2] = await Promise.all([
            fetchPlayers(match.team1),
            fetchPlayers(match.team2)
        ]);
        setPlayers1(p1);
        setPlayers2(p2);
        setSelectedMatch({
            ...match,
            players1: p1,
            players2: p2
        });
    };

    // Analysis画面から戻る
    const handleBackToMenu = () => {
        setSelectedMatch(null);
    };

    if (selectedMatch) {
        return (
            <Analysis
                match={selectedMatch}
                onBack={handleBackToMenu}
                teams={teams}
                players1={selectedMatch.players1}
                players2={selectedMatch.players2}
            />
        );
    }

    return (
        <div className="analysis-container">
            <button onClick={onBackToTitle} className="top-right">戻る</button>
            <h1>データ閲覧</h1>
            <div style={{ marginBottom: 16 }}>
                <DatePicker
                    selected={date}
                    onChange={setDate}
                    dateFormat="yyyy-MM-dd"
                    highlightDates={highlightDates}
                    placeholderText="日付を選択"
                    locale={ja}
                    inline={false}
                    isClearable={false}
                />
            </div>
            <div className="analysis-content">
                <h2>{format(date, 'yyyy-MM-dd')} の試合</h2>
                {matches.length === 0 ? (
                    <p>試合データがありません</p>
                ) : (
                    <div className="matches-list">
                        {matches.map((match, index) => (
                            <div
                                key={index}
                                className="match-item"
                                onClick={() => handleMatchClick(match)}
                                style={{ cursor: "pointer" }}
                            >
                                {match.team1} vs {match.team2}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
