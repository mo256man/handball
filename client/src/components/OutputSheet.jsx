import React, { useState, useEffect, useRef } from "react";
import DrawShootArea from "./DrawShootArea";
import DrawGoal from "./DrawGoal";
import "./style_output.css";
import "./style_input.css";
import { useSocket } from "../hooks/useSocket";
import { getRecordsByMatchId } from "../api";

export default function OutputSheet({ setView, allTeams, selectedMatch, allPlayers }) {
  const { socketRef } = useSocket();
  const [records, setRecords] = useState([]);

  // 入力用状態（InputSheet から必要な部分をコピー）
  const [selectedOppoGK, setSelectedOppoGK] = useState(["", ""]);
  const [selectedTeam, setSelectedTeam] = useState(0);
  const [oppoTeam, setOppoTeam] = useState(1);
  const [currentHalf, setCurrentHalf] = useState("前半");
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [keyboardType, setKeyboardType] = useState("");
  const [inputValues, setInputValues] = useState({ situation: "", player: "", kind: "", shootArea: "", goal: "", result: "" });
  const [showRatio, setShowRatio] = useState(false);

  // 親ページから遷移して selectedMatch がセットされたとき、初期表示として全員集計を表示する
  useEffect(() => {
    if (selectedMatch) {
      setInputValues(prev => {
        if (prev.player) return prev;
        return { ...prev, player: 'ALL' };
      });
      // selectedMatchからrecordsを初期化
      if (selectedMatch.records) {
        setRecords(selectedMatch.records);
      }
    }
  }, [selectedMatch]);

  // Socket.IO リスナー設定：recordが更新されたら、recordを再取得
  useEffect(() => {
    if (!socketRef.current || !selectedMatch || !selectedMatch.match) return;

    const handleDataUpdated = async () => {
      try {
        const updatedRecords = await getRecordsByMatchId(selectedMatch.match.id);
        setRecords(updatedRecords);
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
  }, [socketRef, selectedMatch]);

  const btns = [
    { label: '状況', id: "situation" },
    { label: '選手', id: "player" },
    { label: '種類', id: "kind" },
    { label: 'エリア', id: "shootArea" },
    { label: 'ゴール', id: "goal" },
    { label: '結果', id: "result" },
  ];

  // players をチームごとの配列に変換
  const playersByTeam = (() => {
    if (!allPlayers || !selectedMatch) return [[], []];
    const team0Id = selectedMatch.match.team0;
    const team1Id = selectedMatch.match.team1;
    const p0 = allPlayers.filter(p => p.teamId === team0Id);
    const p1 = allPlayers.filter(p => p.teamId === team1Id);
    return [p0, p1];
  })();

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
    const playerBtns = playersByTeam[selectedTeam].map((p) => ({ label: p.number + "<br>" + p.shortname, value: p.number }));
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

  const changeTeam = () => {
    setSelectedTeam(prev => (prev === 0 ? 1 : 0));
    setOppoTeam(prev => (prev === 0 ? 1 : 0));
    setInputValues({ situation: "", player: "", kind: "", shootArea: "", goal: "", result: "", remarks: "" });
  }

  const createLwrBtns = () => {
    

    // 各ボタンの値をinputValuesから取得
    const getValueByTeam = (id) => {
      return inputValues[id] || '';
    };
    
    return (
      <div className="btnsArea">
      <div className="grid">
        {btns.map((btn, index) => {
          // 空白セルの場合
          if (btn.empty) {
            return <div key={index}></div>;
          }

          // 通常のボタン
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
    const team = allTeams ? allTeams.find(t => t.id === teamId) : null;
    return team ? team.teamname : `Team ${teamId}`;
  };

  // 選択された選手の集計（DrawGoal / DrawShootArea 用）
  const computePlayerAggregates = () => {
    if (!selectedMatch || !records) return { goalCounts: [], shootCounts: [], denom: 0 };
    // 選択プレイヤーの識別: inputValues.player は選手番号
    const playerValue = inputValues.player;
    const allSelected = playerValue === 'ALL';
    const playerNumber = (!allSelected && playerValue) ? parseInt(playerValue) : null;
    let playerId = null;
    if (!allSelected && playerNumber && playersByTeam[selectedTeam]) {
      const pl = playersByTeam[selectedTeam].find(p => p.number === playerNumber);
      if (pl) playerId = pl.id;
    }

    const teamIdSelected = selectedTeam === 0 ? selectedMatch.match.team0 : selectedMatch.match.team1;

    const filteredRecords = records.filter(r => {
      if (allSelected) {
        if (r.teamId !== undefined) return r.teamId === teamIdSelected;
        if (r.team1 !== undefined) return r.team1 === teamIdSelected || r.team2 === teamIdSelected;
        if (r.team !== undefined) return r.team === teamIdSelected;
        return false;
      }
      if (!playerNumber && !playerId) return false;
      if (playerId && r.playerId !== undefined) return r.playerId === playerId;
      if (r.playeNumberr !== undefined) return Number(r.playeNumberr) === playerNumber;
      if (r.playerId !== undefined && playerId) return r.playerId === playerId;
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

  return (
    <div className="base">
      <div className="header">
        <div className="titleTitle">分析</div>
        <div className="main" onClick={() => setView("title")}>戻る</div>
      </div>
      <div className="row">
        <div>チーム：{selectedMatch ? getTeamName(selectedTeam === 0 ? selectedMatch.match.team0 : selectedMatch.match.team1) : ''}</div>
        <div style={{cursor: 'pointer'}} onClick={changeTeam}>チーム切り替え</div>
      </div>
      <div style={{ cursor: 'pointer' }} onClick={() => setShowRatio(prev => !prev)}>num ←→ ratio</div>
      <div>枠内シュート数（結果：g or s）＝{denom}</div>
      <div className="row">
        <DrawGoal showValue={Boolean(inputValues.player)} values={goalValues} />
        <DrawShootArea showValue={Boolean(inputValues.player)} values={shootValues} />
      </div>
      {renderKeyboard()}
      <div className="main output-menu-main">
        {selectedMatch ? (
          <div className="selected-match">
            <h3>試合詳細</h3>
            <div>{getTeamName(selectedMatch.match.team0)} vs {getTeamName(selectedMatch.match.team1)}</div>
            {selectedMatch.match.date && <div>日付: {selectedMatch.match.date}</div>}
            {createLwrBtns()}
          </div>
        ) : (
          <div>表示するマッチが選択されていません</div>
        )}
      </div>
    </div>
  );
}
