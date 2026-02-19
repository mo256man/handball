import React, { useState, useEffect, useRef } from "react";
import DrawShootArea from "./DrawShootArea";
import DrawGoal from "./DrawGoal";
import "./style_output.css";
import "./style_input.css";
import OutputBtns from "./OutputBtns";
import OutputTeamBtns from "./OutputTeamBtns";
import { useSocket } from "../hooks/useSocket";
import { getRecordsByMatchId } from "../api";

export default function OutputSheet1({ teams, players, setView, matchId, matchDate, isEditor, appSelectedOutputTab, setAppSelectedOutputTab }) {
  const { socketRef } = useSocket();
  const [records, setRecords] = useState([]);

  // 入力用状態（InputSheet から必要な部分をコピー）
  const [selectedOppoGK, setSelectedOppoGK] = useState(["", ""]);
  const [selectedTeam, setSelectedTeam] = useState(0);
  const [selectedOutputBtn, setSelectedOutputBtn] = useState(0);
  const [oppoTeam, setOppoTeam] = useState(1);
  const [currentHalf, setCurrentHalf] = useState("前半");
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [keyboardType, setKeyboardType] = useState("");
  const [inputValues, setInputValues] = useState({ situation: "", player: "", kind: "", shootArea: "", goal: "", result: "" });
  const [showRatio, setShowRatio] = useState(false);


  // 親ページから遷移して matchId がセットされたとき、初期表示として全員集計を表示し、recordsを取得する
  useEffect(() => {
    if (!matchId) return;
    setInputValues(prev => {
      if (prev.player) return prev;
      return { ...prev, player: 'ALL' };
    });

    const init = async () => {
      try {
        const recs = await getRecordsByMatchId(matchId);
        setRecords(recs || []);
      } catch (err) {
        console.error('records取得エラー:', err);
      }
    };
    init();
  }, [matchId, selectedTeam]);

  // Socket.IO リスナー設定：recordが更新されたら、recordを再取得
  useEffect(() => {
    if (!socketRef.current || !matchId) return;

    const handleDataUpdated = async () => {
      try {
        const updatedRecords = await getRecordsByMatchId(matchId);
        setRecords(updatedRecords || []);
        console.log('record更新イベント受信。新しいrecords:', updatedRecords);
      } catch (error) {
        console.error('record再取得エラー:', error);
      }
    };

    socketRef.current.on('data-updated', handleDataUpdated);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('data-updated', handleDataUpdated);
      }
    };
  }, [socketRef, matchId]);

  const btns = [
    { label: '状況', id: "situation" },
    { label: '選手', id: "player" },
    { label: '種類', id: "kind" },
    { label: 'エリア', id: "shootArea" },
    { label: 'ゴール', id: "goal" },
    { label: '結果', id: "result" },
  ];

  // `players` は InputSheet と同じ形式（[team0Players, team1Players]）を想定
  const playersByTeam = players || [[], []];

  const showInputPopup = (btnID) => {
    setKeyboardType(btnID);
    setShowKeyboard(true);
  }

  const closeKeyboard = () => {
    setShowKeyboard(false);
    setKeyboardType("");
  }

  const setKeyboardSituation = (handleKeyboardClick) => {
    const keyboardConfig = {
      title: "状況",
      btns: [
        { label: "▲", value: "+" },
        { label: "7", value: "7" },
        { label: "▼", value: "-" },
        { label: "（消）", value: "" },
      ],
      grid: "1fr"
    }
    const result = {
      title: keyboardConfig.title,
      component: (
      <div className="keyboard-body" style={{ display: 'grid', gridTemplateColumns: keyboardConfig.grid, gap: '10px', marginTop: '10px' }}>
        {keyboardConfig.btns.map((btn, idx) => (
          <button key={idx} className="keyboard-btn" onClick={() => handleKeyboardClick(btn.value)}
            dangerouslySetInnerHTML={{ __html: btn.label }} />
        ))}
      </div>)
    }
    return result
  }

  const setKeyboardPlayers = (handleKeyboardClick) => {
    const playerBtns = (playersByTeam[selectedTeam] || []).map((p) => ({
      label: "<div style='font-size: small;'>" + p.number + "</div>" + p.shortname,
      // InputSheet と同様に番号を値として扱う（プレイヤー選択は背番号ベース）
      value: p.number
    }));
    // 先頭に「全員」ボタンを追加（span 4）
    const btnsWithAll = [{ label: '全員', value: 'ALL', gridColumn: 'span 4' }, ...playerBtns];
    const keyboardConfig = {
      title: "選手",
      btns: btnsWithAll,
      grid: "repeat(4, 1fr)"
    };
    const result = {
      title: keyboardConfig.title,
      component: (
      <div className="keyboard-body" style={{ display: 'grid', gridTemplateColumns: keyboardConfig.grid, gap: '10px', marginTop: '10px' }}>
        {keyboardConfig.btns.map((btn, idx) => (
          <button
            key={idx}
            className="keyboard-btn"
            onClick={() => handleKeyboardClick(btn.value)}
            dangerouslySetInnerHTML={{ __html: btn.label }}
            style={btn.gridColumn ? { gridColumn: btn.gridColumn } : undefined}
          />
        ))}
      </div>)
    }
    return result
  }

  const setKeyboardKind = (handleKeyboardClick) => {
    const keyboardConfig = {
      title: "攻撃種類",
      btns: [
            { label: '6', value: '6' },
            { label: 'B', value: 'B' },
            { label: 'P', value: 'P' },
            { label: 'W', value: 'W' },
            { label: '9', value: '9' },
            { label: 'f', value: 'f' },
            { label: 'f1', value: 'f1' },
            { label: 'f2', value: 'f2' },
            { label: 'f3', value: 'f3' },
            { label: 'ag', value: 'ag' },
            { label: '7', value: '7' },
            { label: '（消）', value: '' },
      ],
      grid: "repeat(2, 1fr)"
    }
    const result = {
      title: keyboardConfig.title,
      component: (
      <div className="keyboard-body" style={{ display: 'grid', gridTemplateColumns: keyboardConfig.grid, gap: '10px', marginTop: '10px' }}>
        {keyboardConfig.btns.map((btn, idx) => (
          <button key={idx} className="keyboard-btn" onClick={() => handleKeyboardClick(btn.value)}
            dangerouslySetInnerHTML={{ __html: btn.label }} />
        ))}
      </div>)
    }
    return result
  }

  const setKeyboardResult = (handleKeyboardClick) => {
    const keyboardConfig = {
      title: "結果",
      btns: [
            { label: 'g (ゴール)', value: 'g' },
            { label: 'm (ミス)', value: 'm' },
            { label: 's (セーブ)', value: 's' },
            { label: 'p (7mをとった)', value: 'p' },
            { label: 'f (ファールとられた)', value: 'f' },
            { label: 'r (わからない)', value: 'r' },
            { label: 'o (Out Goal)', value: 'o' },
            { label: '（消）', value: '' },
      ],
      grid: "repeat(2, 1fr)"
    }
    const result = {
      title: keyboardConfig.title,
      component: (
      <div className="keyboard-body" style={{ display: 'grid', gridTemplateColumns: keyboardConfig.grid, gap: '10px', marginTop: '10px' }}>
        {keyboardConfig.btns.map((btn, idx) => (
          <button key={idx} className="keyboard-btn" onClick={() => handleKeyboardClick(btn.value)}
            dangerouslySetInnerHTML={{ __html: btn.label }} />
        ))}
      </div>)
    }
    return result
  }

  const setKeyboardShootArea = (handleKeyboardClick) => {
    const result = {
      title: "シュートエリア",
      component: (
        <DrawShootArea onClick={(type, value) => {
            if (type === "area") {
              handleKeyboardClick(value);
            }
          }}
          width="100%"
          height="auto"
        />
      )
    }
    return result;
  }

  const setKeyboardGoal = (handleKeyboardClick) => {
    const result = {
      title: "ゴール",
      component: (
        <DrawGoal
          drawOut={true}
          onClick={(_type, value) => {
            handleKeyboardClick(value);
          }}
          width="100%"
          height="auto"
        />
      )
    }
    return result;
  }

  const setKeyboardOppoGK = (handleKeyboardClick) => {
    // GKのみ抽出
    const gkPlayers = playersByTeam[oppoTeam].filter(p => p.position === "GK");
    const gridCols = `repeat(${gkPlayers.length || 1}, 1fr)`;
    return {
      title: "相手GK",
      component: (
        <div className="keyboard-body" style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '10px', marginTop: '10px' }}>
          {gkPlayers.map((p, idx) => (
            <button key={idx} className="keyboard-btn" onClick={() => {
              handleKeyboardClick(p.number);
              setSelectedOppoGK(prev => {
                const newArr = [...prev];
                newArr[oppoTeam] = p.number;
                return newArr;
              });
            }}>
              <div>{p.number}<br />{p.shortname}</div>
            </button>
          ))}
        </div>
      )
    };
  }

  const renderKeyboard = () => {
    if (!showKeyboard) return null;

    const handleKeyboardClick = (value) => {
      setInputValues(prev => ({ ...prev, [keyboardType]: value }));
      setShowKeyboard(false);
      setKeyboardType("");
    };

    const keyboards = {
      situation: setKeyboardSituation(handleKeyboardClick),
      player: setKeyboardPlayers(handleKeyboardClick),
      kind: setKeyboardKind(handleKeyboardClick),
      shootArea: setKeyboardShootArea(handleKeyboardClick),
      goal: setKeyboardGoal(handleKeyboardClick),
      result: setKeyboardResult(handleKeyboardClick),
      oppoGK: setKeyboardOppoGK(handleKeyboardClick),
    };

    const keyborad = keyboards[keyboardType];
    if (!keyborad) return null;

    return (
      <div className="keyboard-overlay" onClick={closeKeyboard}>
        <div className="keyboard-popup" onClick={(e) => e.stopPropagation()}>
          <div className="keyboard-header">
            <div>{keyborad.title}</div>
            <button className="keyboard-close" onClick={closeKeyboard}>✕</button>
          </div>
          {keyborad.component}
        </div>
      </div>
    );
  }

  const changeHalf = () => {
    setCurrentHalf(prev => prev === "前半" ? "後半" : "前半");
  }

  const clearValues = () => {
    setInputValues({ situation: "", player: "", kind: "", shootArea: "", goal: "", result: "", remarks: "" });
  }

  // トグル: showRatio を反転し、表示ラベルを切り替える
  const toggleNumRatio = () => {
    setShowRatio(prev => !prev);
  };
  const numRatioLabel = () => (showRatio ? "％" : "＃");

  const createLwrBtns = () => {
    // 各ボタンの値をinputValuesから取得
    const getValueByTeam = (id) => {
      return inputValues[id] || '';
    };
    
    return (
      <div className="btnsArea">
      <div className="grid">
        {btns.map((btn, index) => {
          const gridStyle = btn.gridColumn ? { gridColumn: btn.gridColumn } : {};
          const anStyle = btn.id === 'an' ? { cursor: 'default' } : {};
          return (
            <div 
              key={btn.id} 
              id={btn.id} 
              className="btnFunc"
              onClick={() => showInputPopup(btn.id)}
              style={{ ...gridStyle, ...anStyle }}
            >
              <div className="btnLabel">{btn.label}</div>
              <div className="inputedValue" id={`value_${btn.id}`}>{getValueByTeam(btn.id)}</div>
            </div>
          );
        })}
      </div>
      </div>
    );
  }

  const getTeamName = (teamId) => {
    if (!teams) return `Team ${teamId}`;
    const team = teams.find(t => t.id === teamId);
    return team ? team.teamname : `Team ${teamId}`;
  };

  // 選択された選手の集計（DrawGoal / DrawShootArea 用）
  const computePlayerAggregates = () => {
    if (!teams || !records) return { goalCounts: [], shootCounts: [], denom: 0 };
    // 選択プレイヤーの識別: inputValues.player は背番号（または 'ALL'）
    const playerValue = inputValues.player;
    const allSelected = playerValue === 'ALL';
    let playerId = null;
    let playerNumber = null;
    if (!allSelected && playerValue) {
      const pl = (playersByTeam[selectedTeam] || []).find(p => String(p.number) === String(playerValue) || String(p.id) === String(playerValue));
      if (pl) {
        playerId = pl.id;
        playerNumber = pl.number;
      } else if (!isNaN(Number(playerValue))) {
        playerNumber = Number(playerValue);
      }
    }

    const teamIdSelected = teams && teams[selectedTeam] ? teams[selectedTeam].id : null;

    const filteredRecords = records.filter(r => {
      if (allSelected) {
        if (teamIdSelected === null) return false;
        if (r.teamId !== undefined) return r.teamId === teamIdSelected;
        if (r.team1 !== undefined) return r.team1 === teamIdSelected || r.team2 === teamIdSelected;
        if (r.team !== undefined) return r.team === teamIdSelected;
        return false;
      }
      if (playerNumber === null && playerId === null) return false;
      if (playerId !== null && r.playerId !== undefined && r.playerId === playerId) return true;
      if (r.playeNumberr !== undefined && playerNumber !== null) return Number(r.playeNumberr) === Number(playerNumber);
      return false;
    });

    // 分母: 選択対象（チーム全体 or 選手）の isGS==1 の数
    const denom = filteredRecords.filter(r => r.isGS == 1).length;

    // DrawGoal の9エリア順（日本語ラベルに対応）
    const goalAreas = ['左上','上','右上','左','中央','右','左下','下','右下'];
    const goalCounts = goalAreas.map(area => filteredRecords.filter(r => r.goal === area).length || 0);

    // DrawShootArea のラベル順
    const shootAreas = ['LW','RW','L6','R6','L9','R9','M6','M9'];
    const shootCounts = shootAreas.map(area => filteredRecords.filter(r => r.area === area).length || 0);

    return { goalCounts, shootCounts, denom };
  };

  const { goalCounts, shootCounts, denom } = computePlayerAggregates();

  // フォーマット: showRatio が true のときは整数%（分母0なら0%）、そうでなければカウント（0は空表示）
  const formatCounts = (counts) => counts.map(c => {
    if (showRatio) {
      const pct = denom === 0 ? 0 : Math.round((c / denom) * 100);
      return `${pct}%`;
    }
    return String(c);
  });

  const goalValues = formatCounts(goalCounts || []);
  const shootValues = formatCounts(shootCounts || []);

  // チームの shortname と id を親で解決して子に渡す
  const team0Obj = teams && teams[0] ? teams[0] : null;
  const team1Obj = teams && teams[1] ? teams[1] : null;
  const team0Short = team0Obj ? team0Obj.shortname : (team0Obj && team0Obj.id ? `Team ${team0Obj.id}` : "");
  const team1Short = team1Obj ? team1Obj.shortname : (team1Obj && team1Obj.id ? `Team ${team1Obj.id}` : "");
  const teamId0 = team0Obj ? team0Obj.id : null;
  const teamId1 = team1Obj ? team1Obj.id : null;

  const renderOutputBtns = () => (
    <OutputBtns
      setView={setView}
      selectedBtn={typeof appSelectedOutputTab !== 'undefined' && appSelectedOutputTab !== null ? appSelectedOutputTab : selectedOutputBtn}
      onSelect={(idx) => {
        setSelectedOutputBtn(idx);
        if (typeof setAppSelectedOutputTab === 'function') setAppSelectedOutputTab(idx);
      }}
    />
  );

  const renderOutputTeamBtns = () => (
    <OutputTeamBtns
      team0Short={team0Short}
      team1Short={team1Short}
      teamId0={teamId0}
      teamId1={teamId1}
      selectedTeam={selectedTeam}
      onClickTeam={(teamIdx, teamId) => {
        if (selectedTeam !== teamIdx) {
          setSelectedTeam(teamIdx);
          setOppoTeam(teamIdx === 0 ? 1 : 0);
          clearValues();
        }
      }}
    />
  );

  const renderPlayerBtn = () => {
    const playerValue = inputValues.player;
    const players = playersByTeam[selectedTeam] || [];
    let playerLabel = "";
    if (playerValue === "ALL") {
      playerLabel = "全員";
    } else if (playerValue) {
      const pl = players.find(p => String(p.number) === String(playerValue) || String(p.id) === String(playerValue));
      playerLabel = pl ? (pl.name || pl.shortname || '') : '';
    }

    return (
      <div className="row">
          <div className="playerSelectBtn" onClick={() => showInputPopup('player')}>選手</div>
          <div className="left">{playerLabel}</div>
      </div>
    );
  };

  return (
    <div className="base">
      <div className="header row">
        <div className="header-title left">
          <div>{matchDate ? matchDate : ""}</div>
          <div>{team0Short} vs {team1Short}</div>
          <div id="matchId">{matchId ? `ID: ${matchId}` : ""}</div>
        </div>
        <div className="header-title right" style={{display: "flex"}}>
          {isEditor && <div onClick={() => setView("inputSheet")} className="header-icon header-btn">📋</div>}
          {! isEditor &&<div onClick={() => setView("outputMenu")} className="header-icon header-btn">🔙</div>}
        </div>
      </div>
      {renderOutputBtns()}
      {renderOutputTeamBtns()}
      {renderPlayerBtn()}
      <div className="row">
        <div className="center">枠内シュート数＝{denom}</div>
        <div className="right tglNumRatio" onClick={toggleNumRatio}>{numRatioLabel()}</div>
      </div>
      <div className="main">
        <div className="svgArea">
          <DrawGoal showValue={Boolean(inputValues.player)} values={goalValues} width="100%" height="auto" />
          <DrawShootArea showValue={Boolean(inputValues.player)} values={shootValues} width="100%" height="auto" drawOut={true} />
        </div>
      </div>
      {renderKeyboard()}
      <div className="footer">
        {createLwrBtns()}
      </div>
    </div>
  );
}
