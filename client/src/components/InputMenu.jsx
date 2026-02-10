import React, { useState, useEffect, useRef } from "react";
import { Player } from "../models/Player";
import Calendar from "./Calendar";
import "./style_datepicker.css";
import "./style_input.css";
import { ja } from "date-fns/locale";
import { insertMatch, getMatchById } from "../api";

export default function InputMenu(
  { allTeams, allPlayers, teams, setTeams, players, setPlayers, setView, setMatchId, isEditor, matchId}) {
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });   // sv-SEはYYYY-MM-DD形式
  const [date, setDate] = useState(today);
  const [selectedTeam, setSelectedTeam] = useState(0);
  const [disabled, setDisabled] = useState([true, false]);
  const [canSelectPlayers, setCanSelectPlayers] = useState(true);
  const [playerLocked, setPlayerLocked] = useState(true);

  // matchIdが値を持つ場合（既存の試合データから初期化）
  useEffect(() => {
    if (matchId) {
      console.log('InputMenu: matchIdがあります。matchId=', matchId);
      setCanSelectPlayers(false);
      const loadMatch = async () => {
        try {
          console.log('getMatchByIdを呼び出します。matchId=', matchId);
          const match = await getMatchById(matchId);
          console.log('getMatchByIdが成功しました。match=', match);
          setDate(match.date);
          
          // team0, team1からチームオブジェクトを取得
          const team0 = allTeams.find(t => t.id === match.team0);
          const team1 = allTeams.find(t => t.id === match.team1);
          setTeams([team0, team1]);
          
          // playerIds0/1 = DBに書き込まれたベンチ入り選手ID
          const playerIds0 = match.players0 ? String(match.players0).split(',').map(id => Number(id.trim())).filter(id => !isNaN(id)) : [];
          const playerIds1 = match.players1 ? String(match.players1).split(',').map(id => Number(id.trim())).filter(id => !isNaN(id)) : [];
          
          // 表示対象：全選手（DBでベンチ入りと登録されていた選手のみisOnBench=true）
          const playersForTeam0 = allPlayers
            .filter(p => p.teamId === match.team0)
            .map(p => new Player({ ...p, isOnBench: playerIds0.includes(p.id) }));
          const playersForTeam1 = allPlayers
            .filter(p => p.teamId === match.team1)
            .map(p => new Player({ ...p, isOnBench: playerIds1.includes(p.id) }));
          
          setPlayers([playersForTeam0, playersForTeam1]);
        } catch (error) {
          console.error('match データ取得エラー:', error);
        }
      };
      loadMatch();
    } else {
      setCanSelectPlayers(true);
    }
  }, [matchId, allTeams, allPlayers]);

  // players0/players1を更新（matchIdが空の場合、または新規作成時）
  useEffect(() => {
    if (!matchId && teams[0] && teams[1]) {
      setPlayers([
        allPlayers.filter(player => player.teamId === teams[0].id),
        allPlayers.filter(player => player.teamId === teams[1].id)
      ]);
    }
  }, [teams, allPlayers, matchId]);

  // playerLockedを管理（matchIdに基づいて初期化）
  useEffect(() => {
    if (matchId) {
      setPlayerLocked(true);
    } else {
      setPlayerLocked(false);
    }
  }, [matchId]);

  if (!teams[0] || !teams[1]) {
    return <div>Loading...</div>;
  }

  // チームオブジェクトからチーム名を取得（文字列のアレイ）
  const AllTeamNames = allTeams.map(t => t.teamname);

  // 選択されたチームの選手を取得（stateから）
  const getTeaPlayers = (teamName) => {
    if (teamName === teams[0].teamname) return players[0];
    if (teamName === teams[1].teamname) return players[1];
    return [];
  };

  // STARTボタンのクリックハンドラー
  const handleStartClick = async () => {
    try {
      // ベンチ入り選手のみにフィルター
      const benchPlayers0 = players[0].filter(p => p.isOnBench);
      const benchPlayers1 = players[1].filter(p => p.isOnBench);
      
      // 選手IDをコンマ区切り文字列に変換
      const players0 = benchPlayers0.map(p => p.id).join(',');
      const players1 = benchPlayers1.map(p => p.id).join(',');

      if (!matchId) {
        // matchIdがnullの場合のみDB新規追加
        const result = await insertMatch(date, teams[0].id, teams[1].id, players0, players1);
        console.log('新しいmatchを作成しました。DBのmatchテーブルのid:', result.matchId);
        setMatchId(result.matchId);
        setPlayers([benchPlayers0, benchPlayers1]);
      } else {
        // matchIdがある場合はアップデート
        const response = await fetch('/api/updateMatch', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: matchId,
            date: date,
            team0: teams[0].id,
            team1: teams[1].id,
            players0: players0,
            players1: players1
          })
        });

        if (!response.ok) {
          throw new Error('matchの更新に失敗しました');
        }
        console.log('matchを更新しました。id:', matchId);
      }
      
      // InputSheetへ移動
      setView("inputSheet");
    } catch (error) {
      console.error('STARTボタンのエラー:', error);
    }
  };

  // メンバーのisOnBenchをトグル
  const toggleMemberSelection = (teamIdx, index) => {
    setPlayers(prev => prev.map((plist, idx) =>
      idx === teamIdx
        ? plist.map((p, i) => i === index ? new Player({ ...p, isOnBench: !p.isOnBench }) : p)
        : plist
    ));
  };

  // カレンダー専用の読み取り専用入力コンポーネント（InputMenu内で定義）
  // キーボード入力を受け付けず、クリックでカレンダーを開けるようにする
  const ReadOnlyInput = React.forwardRef(({ value, onClick, placeholder }, ref) => (
    <input
      ref={ref}
      value={value}
      onClick={onClick}
      placeholder={placeholder}
      readOnly
      style={{ cursor: 'pointer' }}
    />
  ));

  // 今日に戻すハンドラー
  const handleTodayClick = () => {
    const todayStr = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
    setDate(todayStr);
  };

  const datePickerRef = useRef(null);

  const renderSelectTeams = () => {
    return (
      <div id="tab-area" className={`tab-area tab-area-${selectedTeam}`}>
        <div className="tabs">
          <button className={selectedTeam === 0 ? 'tab active' : 'tab'} onClick={() => setSelectedTeam(0)}>自チーム</button>
          <button className={selectedTeam === 1 ? 'tab active' : 'tab'} onClick={() => setSelectedTeam(1)}>対戦チーム</button>
        </div>
        <div className="tab-content">
          {renderTable(selectedTeam)}
        </div>
      </div>
    );
  }

  const renderTable = (teamIdx) => {
    const playersArr = players[teamIdx];
    const selectedCount = playersArr.filter(p => p.isOnBench).length;
    const teamName = teams[teamIdx].teamname;
    return (<>
      <select
        id={`teamName${selectedTeam}`}
        value={teamName}
        onChange={e => {
          const newTeams = [...teams];
          newTeams[selectedTeam] = allTeams.find(t => t.teamname === e.target.value);
          setTeams(newTeams);
        }}
        className="team-select team-area-item"
        disabled={selectedTeam === 0 || playerLocked}
      >
        {/* <option value="">-- 相手チームを選択してください --</option> */}
        {AllTeamNames.map((name, index) => (
          <option key={index} value={name}>{name}</option>
        ))}
      </select>
      <div className="selectedMember team-area-item">
        選択中: {selectedCount} / {playersArr.length}人
      </div>
      <div className="team-table-container">
        <table className="team-table">
          <thead>
            <tr>
              <th>背番号</th>
              <th>ポジション</th>
              <th>名前</th>
            </tr>
          </thead>
          <tbody>
            {playersArr.map((player, index) => (
              <tr
                key={index}
                onClick={() => playerLocked === false && toggleMemberSelection(teamIdx, index)}
                className={player.isOnBench ? 'on-bench' : 'off-bench'}
                style={{ cursor: playerLocked === false ? 'pointer' : 'default' }}
              >
                <td>{player.number}</td>
                <td>{player.position}</td>
                <td>{player.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>)
  }

  const content = (
    <div className="base">
    <div className="header row">
      <div className="header-title left">チーム・出場選手選択</div>
      <div className="header-title right" onClick={() => setView("title")}>🔙</div>
    </div>
    <div className="main">
      <div className="date-picker-wrapper">
        <Calendar value={date} onChange={setDate} />
      </div>
      <div 
        id="playerLocked"
        onClick={() => matchId && setPlayerLocked(!playerLocked)}
        style={{ cursor: matchId ? 'pointer' : 'default' }}
      >
        {playerLocked ? "🔒" : "🔓"}
      </div>
      {renderSelectTeams()}
    </div>
    <div className="footer">
    <div className="btnStart" onClick={handleStartClick}>START</div>
  </div>
  </div>
  )

  return content;
}
