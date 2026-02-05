import React, { useState, useEffect } from "react";
import TeamSelection from "./TeamSelection";
import { Player } from "../models/Player";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./style_datepicker.css";
import "./style_input.css";
import { ja } from "date-fns/locale";
import { insertMatch, checkMatchDuplicate } from "../api";

export default function InputMenu(
  { allTeams, allPlayers, teams, setTeams, players, setPlayers, setView, setPage, setMatchId}) {
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });   // sv-SEはYYYY-MM-DD形式
  const [date, setDate] = useState(today);
  const [selectedTeam, setSelectedTeam] = useState(0);
  const [disabled, setDisabled] = useState([true, false]);

  // players0/players1を更新
  useEffect(() => {
    if (!teams[0] || !teams[1]) return;
    setPlayers([
      allPlayers.filter(player => player.teamId === teams[0].id),
      allPlayers.filter(player => player.teamId === teams[1].id)
    ]);
  }, [teams, allPlayers]);

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
      
      // 重複チェック
      const duplicateCheck = await checkMatchDuplicate(date, teams[0].id, teams[1].id, players0, players1);
      if (duplicateCheck.isDuplicate) {
        console.log('重複するレコードが既に存在します。DBのmatchテーブルのid:', duplicateCheck.matchId);
        setMatchId(duplicateCheck.matchId);
      } else {
        // matchテーブルに書き込み（チームIDを記録）
        const result = await insertMatch(date, teams[0].id, teams[1].id, players0, players1);
        console.log('新しいmatchを作成しました。DBのmatchテーブルのid:', result.matchId);
        setMatchId(result.matchId);
      }
      
      // stateを更新
      setPlayers([benchPlayers0, benchPlayers1]);
      setPage("inputSheet");
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
        disabled={disabled[selectedTeam]}
      >
        <option value="">-- 相手チームを選択してください --</option>
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
                onClick={() => toggleMemberSelection(teamIdx, index)}
                style={{ 
                    cursor: 'pointer',
                    backgroundColor: player.isOnBench ? '#e3f2fd' : '#f5f5f5',
                    opacity: player.isOnBench ? 1 : 0.5
                }}
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
    <div className="header">
      <div className="titleTitle">チーム・出場選手選択</div>
      <div className="main" onClick={() => setView("title")}>戻る</div>
    </div>
    <div className="main">
      <div className="date-picker-wrapper">
        <DatePicker
          selected={new Date(date)}
          onChange={(selectedDate) => {
            const formattedDate = selectedDate.toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
            setDate(formattedDate);
          }}
          dateFormat="yyyy-MM-dd"
          locale={ja}
        />
      </div>
      <div className="team-btns">
        <div className={selectedTeam === 0 ? 'selected' : 'notSelected'} onClick={() => setSelectedTeam(0)}>{teams[0].teamname}</div>
        <div className={selectedTeam === 1 ? 'selected' : 'notSelected'} onClick={() => setSelectedTeam(1)}>{teams[1].teamname}</div>
      </div>
      {renderTable(selectedTeam)}
    </div>
    <div className="footer">
    <div className="btnStart" onClick={handleStartClick}>START</div>
  </div>
  </div>
  )

  return content;
}
