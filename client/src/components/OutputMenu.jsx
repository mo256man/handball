import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./style_datepicker.css";
import "./style_output.css";
import { ja } from "date-fns/locale";
import { getMatchDates, getMatches } from "../api";

export default function OutputMenu({ setView, allTeams }) {
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
  const [selectedDate, setSelectedDate] = useState(new Date(today));
  const [matchDates, setMatchDates] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);

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
        const dateStr = selectedDate.toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
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

  // matchDatesを Date オブジェクトの配列に変換
  const highlightedDates = matchDates.map(dateStr => new Date(dateStr));

  // ハイライト日付のスタイル
  const highlightDates = (date) => {
    return highlightedDates.some(
      d => d.toLocaleDateString("sv-SE") === date.toLocaleDateString("sv-SE")
    );
  };

  const renderDatePicker = () => {
    return (
      <div className="date-picker-section">
        <label>試合日付を選択：</label>
        {loadingDates ? (
          <div>読み込み中...</div>
        ) : (
          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            dateFormat="yyyy-MM-dd"
            locale={ja}
            filterDate={(date) => highlightDates(date)}
            calendarClassName="match-calendar"
            dayClassName={(date) =>
              highlightDates(date) ? "highlighted-date" : ""
            }
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
          <div key={match.id || index} className="match-item">
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
      <div className="header">
        <div className="titleTitle">分析メニュー</div>
        <div className="main" onClick={() => setView("title")}>戻る</div>
      </div>
      <div className="main output-menu-main">
        {renderDatePicker()}
        {renderMatches()}
      </div>
    </div>
  );
}
