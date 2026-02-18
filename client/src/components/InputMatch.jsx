import React, { useState, useEffect } from "react";
import { Player } from "../models/Player";
import "./style_input.css";
import { ja } from "date-fns/locale";
import { insertMatch, updateMatch, getMatchById } from "../api";

export default function InputMatch(
  { allTeams, allPlayers, teams, setTeams, players, setPlayers, setView, setMatchId, setMatchDate, isEditor, matchId, matchDate, offenseTeam, setOffenseTeam}) {
  const [disabled, setDisabled] = useState([true, false]);
  const [canSelectPlayers, setCanSelectPlayers] = useState(true);
  const [playerLocked, setPlayerLocked] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

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
    setErrorMessage(null);
    
    try {
      // matchIdがnullの場合のみ新規登録
      if (!matchId) {
        // matchDateが設定されているか確認
        if (!matchDate) {
          setErrorMessage('試合日付が設定されていません');
          return;
        }

        // ベンチ入り選手のみにフィルター
        const benchPlayers0 = players[0].filter(p => p.isOnBench);
        const benchPlayers1 = players[1].filter(p => p.isOnBench);
        
        // 選手IDをコンマ区切り文字列に変換
        const players0 = benchPlayers0.map(p => p.id).join(',');
        const players1 = benchPlayers1.map(p => p.id).join(',');

        console.log('新規マッチを登録します。date:', matchDate, 'team0:', teams[0].id, 'team1:', teams[1].id);
        const result = await insertMatch(matchDate, teams[0].id, teams[1].id, players0, players1);
        console.log('新しいmatchを作成しました。DBのmatchテーブルのid:', result.matchId);
        
        if (!result || !result.matchId) {
          setErrorMessage('マッチの登録に失敗しました');
          return;
        }
        
        setMatchId(result.matchId);
        setMatchDate(matchDate);
        setPlayers([benchPlayers0, benchPlayers1]);
      }
      else {
        // 既存マッチを更新
        const benchPlayers0 = players[0].filter(p => p.isOnBench);
        const benchPlayers1 = players[1].filter(p => p.isOnBench);
        const players0 = benchPlayers0.map(p => p.id).join(',');
        const players1 = benchPlayers1.map(p => p.id).join(',');

        console.log('既存マッチを更新します。id:', matchId);
        const result = await updateMatch(matchId, matchDate, teams[0].id, teams[1].id, players0, players1);
        console.log('マッチ更新結果:', result);

        if (!result || !result.success) {
          setErrorMessage('マッチの更新に失敗しました');
          return;
        }

        setPlayers([benchPlayers0, benchPlayers1]);
      }
      
      // InputSheetへ移動
      setView("inputSheet");
    } catch (error) {
      console.error('STARTボタンのエラー:', error);
      setErrorMessage(`エラーが発生しました: ${error.message}`);
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



  const renderSelectTeams = () => {
    return (
      <div id="tab-area" className={`tab-area tab-area-${offenseTeam}`}>
        <div className="tabs">
          <button className="tab bgTeam0" onClick={() => setOffenseTeam(0)}>自チーム</button>
          <button className="tab bgTeam1" onClick={() => setOffenseTeam(1)}>対戦チーム</button>
        </div>
        <div className={ offenseTeam ? "tab-content bgTeam1" : "tab-content bgTeam0" }>
          {renderTable(offenseTeam)}
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
        id={`teamName${offenseTeam}`}
        value={teamName}
        onChange={e => {
          const newTeams = [...teams];
          newTeams[offenseTeam] = allTeams.find(t => t.teamname === e.target.value);
          setTeams(newTeams);
        }}
        className="team-select team-area-item"
        disabled={offenseTeam === 0 || playerLocked}
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
      <div className="header-title left">
        <div>チーム・出場選手選択</div>
      </div>
      <div className="header-title right" style={{display: "flex"}}>
        <div onClick={() => setView("inputMenu")} className="header-icon header-btn">🔙</div>
      </div>
    </div>
    <div className="main">
      <img src={teams[offenseTeam]?.image} className="backgroundImage" />
      <div id="matchDate">{matchDate}</div>
      {errorMessage && (
        <div style={{ color: 'red', padding: '10px', marginBottom: '10px', border: '1px solid red', borderRadius: '4px' }}>
          {errorMessage}
        </div>
      )}
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
