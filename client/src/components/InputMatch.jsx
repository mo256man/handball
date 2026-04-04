import React, { useState, useEffect } from "react";
import { Player } from "../models/Player";
// import "./style_input.css";
import styles from "./InputMatch.module.css";
import { ja } from "date-fns/locale";
import { insertMatch, updateMatch, getMatchById, getRecordsByMatchId } from "../api";

export default function InputMatch(
  { allTeams, allPlayers, teams, setTeams, players, setPlayers, setView, setMatchId, setMatchDate, isEditor, matchId, matchDate, offenseTeam, setOffenseTeam, score1st, setScore1st, score2nd, setScore2nd, score, setScore}) {
  const [disabled, setDisabled] = useState([true, false]);
  const [canSelectPlayers, setCanSelectPlayers] = useState(true);
  const [playerLocked, setPlayerLocked] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  // matchIdが値を持つ場合（既存の試合データから初期化）
  useEffect(() => {
    if (matchId) {
      if (typeof setMatchId === 'function') setMatchId(matchId);
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

          // スコアを初期化（result="g"のレコード数をカウント）
          const records = await getRecordsByMatchId(matchId);
          const team0Goals = records.filter(r => r.teamId === match.team0 && r.result === 'g');
          const team1Goals = records.filter(r => r.teamId === match.team1 && r.result === 'g');
          
          const team0Goals1st = team0Goals.filter(r => r.half === '前半').length;
          const team0Goals2nd = team0Goals.filter(r => r.half === '後半').length;
          const team1Goals1st = team1Goals.filter(r => r.half === '前半').length;
          const team1Goals2nd = team1Goals.filter(r => r.half === '後半').length;
          
          setScore1st([team0Goals1st, team1Goals1st]);
          setScore2nd([team0Goals2nd, team1Goals2nd]);
        } catch (error) {
          console.error('match データ取得エラー:', error);
        }
      };
      loadMatch();
    } else {
      setCanSelectPlayers(true);
    }
  }, [matchId, allTeams, allPlayers]);

  // playerLockedを管理（matchIdに基づいて初期化）
  useEffect(() => {
    if (matchId) {
      setPlayerLocked(true);
    } else {
      setPlayerLocked(false);
    }
  }, [matchId]);

  if (!teams[0]) {
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
  const handleStartClick = async (targetView = "inputSheet") => {
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
        // スコアを初期化
        setScore1st([0, 0]);
        setScore2nd([0, 0]);
        setScore([0, 0]);
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
        if (typeof setMatchId === 'function') setMatchId(matchId);
      }

      // 指定のビューへ移動
      setView(targetView);
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

  const renderLockBtn = () => {
    if (!matchId) {
      return null;
    }
    
    return (
      <div 
        className={styles.lockBtnArea}
        id="playerLocked"
        onClick={() => {
          setPlayerLocked((prev) => !prev);
        }}
        style={{ cursor: 'pointer' }}
      >
        {playerLocked ? "🔒" : "🔓"}
      </div>
    );
  }

  const renderTeamTables = () => {
    return (
      <div className={styles.tablesContainer}>
        {teams.map((team, index) => (
          <div key={index} className={styles.teamWrapper}>
            <img src={teams[index]?.image}/>
            <div className={styles.teamTableWrapper}>
              <div style={{ textAlign: "center", fontSize: "x-large", fontWeight: "bold" }}>{index===0 ? "自チーム" : "相手チーム"}</div>
              {renderTable(index)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const renderTable = (teamIdx) => {
    const playersArr = !teams[teamIdx] ? [] : (players[teamIdx] || []); // teams[teamIdx]がnullの場合は空配列
    const selectedCount = playersArr.filter(p => p.isOnBench).length;
    const teamName = teams[teamIdx]?.teamname || ""; // team1が未選択の場合は空文字
    return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
        <select
          id={`team${teamIdx}`}
          value={teamName || ""} // 初期値を空文字に設定
          onChange={e => {
            const newTeams = [...teams];
            const selectedTeam = allTeams.find(t => t.teamname === e.target.value) || null;
            newTeams[teamIdx] = selectedTeam;
            setTeams(newTeams);
            
            // 選択されたチームに紐づく選手のみを更新
            if (selectedTeam) {
              const newPlayers = [...players];
              newPlayers[teamIdx] = allPlayers.filter(player => player.teamId === selectedTeam.id);
              setPlayers(newPlayers);
            }
          }}
          className={styles.teamSelect}
          disabled={teamIdx === 0 || (teamIdx === 1 && matchId)} // team0は常に無効化、team1はmatchId定義済み時に無効化
        >
          {teamIdx === 1 && !teams[teamIdx] && (
            <option value="">ーー　チームを選択してください　ーー</option>
          )}
          {AllTeamNames.map((name, index) => (
            <option key={index} value={name}>{name}</option>
          ))}
        </select>
      <div className={styles.selectedMemberCount}>
        選択中: {selectedCount} / {playersArr.length}人
      </div>
      <div className={styles.tableContainer}>
        <table className={styles.teamTable}>
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
                className={player.isOnBench ? styles['on-bench'] : styles['off-bench']}
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
    </div>
    );
  }

  const content0 = (
    <div className="base">
      <div className="header row">
        <div className="header-title left">
          <div id="matchDate">{matchDate}</div>
        </div>
        <div className="header-title right" style={{ display: "flex" }}>
          <div onClick={() => setView("inputMenu")} className="header-icon header-btn">🔙</div>
        </div>
      </div>
      <div className="main">
        <h1>チーム・出場選手選択</h1>
        {errorMessage && (
          <div style={{ color: 'red', padding: '10px', marginBottom: '10px', border: '1px solid red', borderRadius: '4px' }}>
            {errorMessage}
          </div>
        )}

        {renderTeamTables()}
      </div>
      <div className="footer">
        {/* <div className="btnStart" onClick={() => handleStartClick()}>START</div> */}
        <div className="btnStart" onClick={() => handleStartClick("inputTable")}>START</div>
      </div>
    </div>
  );

  const content = (
    <div className={styles.main}>
      <div onClick={() => setView("inputMenu")} className={styles.btnBack}>🔙</div>
      <div className={styles.titleArea}>
        {renderLockBtn()}
        <div className={styles.titleString}>チーム・選手選択</div>
      </div>
      {renderTeamTables()}
      <div className="footer">
        <div className={styles.btnStart} onClick={() => handleStartClick("inputTable")}>START</div>
      </div>
    </div>
  );

  return content;
}
