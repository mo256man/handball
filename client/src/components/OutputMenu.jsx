import React, { useState, useEffect } from "react";
import Calendar from "./Calendar";
import "./style_datepicker.css";
import "./style_output.css";
// カレンダーは `Calendar` コンポーネントを使用
import { getMatchDates, getMatches, getRecordsByMatchId } from "../api";
import { useSocket } from "../hooks/useSocket";

export default function OutputMenu({ setView, allTeams, setSelectedMatch, isEditor }) {
  const { socketRef } = useSocket();
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
  const [selectedDate, setSelectedDate] = useState(today);
  const [matchDates, setMatchDates] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [currentSelectedMatch, setCurrentSelectedMatch] = useState(null);

  // チームIDからチーム名を取得
  const getTeamName = (teamId) => {
    const team = allTeams.find(t => t.id === teamId);
    return team ? team.teamname : `Team ${teamId}`;
  };

  // マッチテーブルの日付を取得
  useEffect(() => {
    const loadMatchDates = async () => {
      try {
        setLoadingDates(true);
        const dates = await getMatchDates();
        setMatchDates(dates);
        console.log('取得した試合日付:', dates);
      } catch (error) {
        console.error('試合日付の取得エラー:', error);
      } finally {
        setLoadingDates(false);
      }
    };
    loadMatchDates();
  }, []);

  // 選択日付が変わったときにマッチデータを取得
  useEffect(() => {
    const loadMatches = async () => {
      try {
        setLoadingMatches(true);
        const dateStr = typeof selectedDate === 'string' ? selectedDate : selectedDate.toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
        const matchData = await getMatches(dateStr);
        setMatches(matchData || []);
        console.log('取得したマッチデータ:', matchData);
      } catch (error) {
        console.error('マッチデータの取得エラー:', error);
      } finally {
        setLoadingMatches(false);
      }
    };
    loadMatches();
  }, [selectedDate]);

  // Socket.IO リスナー設定：recordが更新されたら、マッチと日付リストを再取得
  useEffect(() => {
    if (!socketRef.current) return;

    const handleDataUpdated = async () => {
      try {
        console.log('データ更新イベント受信。マッチ日付リストを再取得します');
        // 試合日付リストを再取得
        const dates = await getMatchDates();
        setMatchDates(dates);

        // 現在の選択日付のマッチデータを再取得
        const dateStr = typeof selectedDate === 'string' ? selectedDate : selectedDate.toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
        const matchData = await getMatches(dateStr);
        setMatches(matchData || []);
      } catch (error) {
        console.error('マッチデータ再取得エラー:', error);
      }
    };

    socketRef.current.on('data-updated', handleDataUpdated);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('data-updated', handleDataUpdated);
      }
    };
  }, [socketRef, selectedDate]);

  const renderDatePicker = () => {
    return (
      <div className="date-picker-section">
        <label>試合日付を選択</label>
        {loadingDates ? (
          <div>読み込み中...</div>
        ) : (
          <Calendar
            value={selectedDate}
            onChange={setSelectedDate}
            highlightedDates={matchDates}
            onlyHighlightSelectable={true}
            calendarClassName="match-calendar"
          />
        )}
      </div>
    );
  }

  const renderMatches = () => {
    if (loadingMatches) {
      return <div className="matches-loading">マッチデータ読み込み中...</div>;
    }

    if (matches.length === 0) {
      return <div className="matches-empty">この日付のマッチデータはありません</div>;
    }

    return (
      <div className="matches-container">
        {matches.map((match, index) => (
          <div
            key={match.id || index}
            className="match-item"
            onClick={async () => {
                try {
                  const records = await getRecordsByMatchId(match.id);
                  const selectedMatchData = { match, records };
                  setCurrentSelectedMatch(selectedMatchData);
                  if (setSelectedMatch) setSelectedMatch(selectedMatchData);
                  setView('outputSheet1');
                } catch (err) {
                  console.error('records取得エラー:', err);
                  const selectedMatchData = { match, records: [] };
                  setCurrentSelectedMatch(selectedMatchData);
                  if (setSelectedMatch) setSelectedMatch(selectedMatchData);
                  setView('outputSheet1');
                }
              }}
          >
            <div className="match-teams">
              {getTeamName(match.team0)} vs {getTeamName(match.team1)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="base">
      <div className="header row">
        <div className="header-title left">分析メニュー</div>
        <div className="header-title right" onClick={() => setView("title")}>🔙</div>
      </div>
      <div className="main">
        {renderDatePicker()}
        {renderMatches()}
      </div>
    </div>
  );
}
