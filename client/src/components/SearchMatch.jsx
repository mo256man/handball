import React, { useState, useEffect } from "react";
import Calendar from "./Calendar";
import "./style_datepicker.css";
import "./style_output.css";
import { useSocket } from "../hooks/useSocket";

export default function SearchMatch({ setView, allTeams, setSelectedMatch, isEditor, setMatchId, setTeams, teams, allPlayers, setPlayers, session }) {
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
    const team = allTeams.find(t => t.teamId === teamId);
    return team ? team.teamName : `Team ${teamId}`;
  };

  // マッチテーブルの日付を取得
  useEffect(() => {
    const loadMatchDates = async () => {
      try {
        setLoadingDates(true);
        const response = await fetch("/api/match-dates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session })
        });
        const result = await response.json();
        if (result.success) {
          setMatchDates(result.dates || []);
        } else {
          console.error('試合日付取得エラー:', result.error);
        }
      } catch (error) {
        console.error('試合日付の取得エラー:', error);
      } finally {
        setLoadingDates(false);
      }
    };
    if (session) loadMatchDates();
  }, [session]);

  // 選択日付が変わったときにマッチデータを取得
  useEffect(() => {
    const loadMatches = async () => {
      try {
        setLoadingMatches(true);
        const dateStr = typeof selectedDate === 'string' ? selectedDate : selectedDate.toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
        const response = await fetch("/api/getMatches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session, date: dateStr })
        });
        const result = await response.json();
        if (result.success) {
          setMatches(result.matches || []);
        } else {
          console.error('マッチデータ取得エラー:', result.error);
        }
      } catch (error) {
        console.error('マッチデータの取得エラー:', error);
      } finally {
        setLoadingMatches(false);
      }
    };
    if (session) loadMatches();
  }, [selectedDate, session]);

  // Socket.IO リスナー設定：recordが更新されたら、マッチと日付リストを再取得
  useEffect(() => {
    if (!socketRef.current || !session) return;

    const handleDataUpdated = async () => {
      try {
        console.log('データ更新イベント受信。マッチ日付リストを再取得します');
        // 試合日付リストを再取得
        const dateResponse = await fetch("/api/match-dates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session })
        });
        const dateResult = await dateResponse.json();
        if (dateResult.success) {
          setMatchDates(dateResult.dates || []);
        }

        // 現在の選択日付のマッチデータを再取得
        const dateStr = typeof selectedDate === 'string' ? selectedDate : selectedDate.toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
        const matchResponse = await fetch("/api/getMatches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session, date: dateStr })
        });
        const matchResult = await matchResponse.json();
        if (matchResult.success) {
          setMatches(matchResult.matches || []);
        }
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
  }, [socketRef, selectedDate, session]);

  const renderDatePicker = () => {
    return (
      <div className="date-picker-section">
        <label>試合日</label>
        {loadingDates ? (
          <div>読み込み中...</div>
        ) : (
          <Calendar
            value={selectedDate}
            onChange={setSelectedDate}
            highlightedDates={matchDates}
            onlyHighlightSelectable={false}
            calendarClassName="match-calendar"
          />
        )}
      </div>
    );
  }

  // 既存マッチを選択する場合の処理（クリックで即遷移）
  const handleSelectMatch = async (match) => {
    try {
      const response = await fetch("/api/getRecordsByMatchId", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session, matchId: match.id })
      });
      const result = await response.json();
      const records = result.success ? (result.data || []) : [];
      const selectedMatchData = { match, records };
      setCurrentSelectedMatch(selectedMatchData);
      if (setSelectedMatch) setSelectedMatch({ matchDate: selectedDate, matchId: match.id, match, records });

      // isEditorの値で遷移先を変更
      if (isEditor) {
        setView('inputMatch');
      } else {
        setView('outputSheet1');
      }
    } catch (err) {
      console.error('records取得エラー:', err);
      const selectedMatchData = { match, records: [] };
      setCurrentSelectedMatch(selectedMatchData);
      if (setSelectedMatch) setSelectedMatch({ matchDate: selectedDate, matchId: match.id, match, records: [] });

      if (isEditor) {
        setView('inputMatch');
      } else {
        setView('outputSheet1');
      }
    }
  };

  // 新規試合登録の処理
  const handleCreateNewMatch = () => {
    // matchIdをnullに設定
    if (setMatchId) setMatchId(null);
    // teams[1]をnullに設定
    if (setTeams) setTeams([teams[0], null]);
    // team0のplayersを初期化
    if (setPlayers && teams[0]) {
      const playersForTeam0 = allPlayers.filter(player => player.teamId === teams[0].id);
      setPlayers([playersForTeam0, []]);
    }
    // 選択した日付を含むデータをsetSelectedMatchで保存
    if (setSelectedMatch) setSelectedMatch({ matchDate: selectedDate, matchId: null });
    // 新規試合登録画面へ遷移
    setView("inputMatch");
  };

  const renderMatches = () => {
    if (loadingMatches) {
      return <div className="matches-loading">マッチデータ読み込み中...</div>;
    }

    return (
      <div className="matches-container">
        {/* isEditor=falseで検索結果0件の場合のメッセージ */}
        {!isEditor && matches.length === 0 && (
          <div className="matches-empty">この日付のマッチデータはありません</div>
        )}

        {/* 既存のマッチ一覧 */}
        {matches.map((match, index) => (
          <div
            key={match.id || index}
            className="match-item"
            onClick={() => handleSelectMatch(match)}
          >
            <div className="match-teams">
              {getTeamName(match.team0)} vs {getTeamName(match.team1)}
            </div>
          </div>
        ))}

        {/* isEditor=trueの場合は常に「新規試合登録」ボタンを表示 */}
        {isEditor && (
          <div
            className="match-item new-match-button"
            onClick={handleCreateNewMatch}
          >
            <div className="match-teams">+ 新規試合登録</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {renderDatePicker()}
      {renderMatches()}
    </div>
  );
}
