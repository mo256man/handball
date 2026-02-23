import React, { useState, useRef, useEffect } from "react";
import DrawShootArea from "./DrawShootArea";
import DrawGoal from "./DrawGoal";
import "./style_input.css";

export default function InputSheet({ teams, players, setView, matchId, isEditor, matchDate, offenseTeam, setOffenseTeam, appOutputSheet, setAppOutputSheet }) {

  // 相手GK選択値
  const [selectedOppoGK, setSelectedOppoGK] = useState(["", ""]);
  const [oppoTeam, setOppoTeam] = useState(1);
  const [currentHalf, setCurrentHalf] = useState("前半");
  const [showPopup, setShowPopup] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [keyboardType, setKeyboardType] = useState("");
  // 各ボタンの値を管理するstate
  const [inputValues, setInputValues] = useState({ situation: "", player: "", kind: "", shootArea: "", goal: "", result: "", remarks: "" });
  const [isConfirmAvailable, setIsConfirmAvailable] = useState(false);
  const remarksInputRef = useRef(null);

  const [items, setItems] = useState([]);
  const [setPlayStr, setSetPlayStr] = useState("");



  // 必須項目のチェック
  useEffect(() => {
    const isComplete = inputValues.player && inputValues.kind && inputValues.shootArea && inputValues.goal && inputValues.result;
    setIsConfirmAvailable(!!isComplete);
  }, [inputValues]);
  
  const btns = [
    { label: '状況', id: "situation" },
    { label: '選手', id: "player" },
    { label: '種類', id: "kind" },
    { label: 'エリア', id: "shootArea" },
    { label: 'ゴール', id: "goal" },
    { label: '結果', id: "result" },
    { label: 'Remarks', id: "remarks", gridColumn: "span 3" },
  ];

  if (!teams) {
    return <div>Loading...</div>;
  }

  const showInputPopup = (btnID) => {
    setKeyboardType(btnID);
    setShowKeyboard(true);
  }

  const closeKeyboard = () => {
    setShowKeyboard(false);
    setKeyboardType("");
  }

  // ランダム入力関数群
  const getRandomSituation = () => {
    const btns = [
      { label: "▲", value: "+" },
      { label: "7", value: "7" },
      { label: "▼", value: "-" },
      { label: "（消）", value: "" },
    ];
    return btns[Math.floor(Math.random() * btns.length)].value;
  }

  const getRandomPlayer = () => {
    const playerBtns = players[offenseTeam].map((p) => ({ label: p.number + "<br>" + p.shortname, value: p.number }));
    return playerBtns[Math.floor(Math.random() * playerBtns.length)].value;
  }

  const getRandomKind = () => {
    const btns = [
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
    ];
    return btns[Math.floor(Math.random() * btns.length)].value;
  }

  const getRandomResult = () => {
    const btns = [
      { label: 'g (ゴール)', value: 'g' },
      { label: 'm (ミス)', value: 'm' },
      { label: 's (セーブ)', value: 's' },
      { label: 'p (7mをとった)', value: 'p' },
      { label: 'f (ファールとられた)', value: 'f' },
      { label: 'r (わからない)', value: 'r' },
      { label: 'o (Out Goal)', value: 'o' },
      { label: '（消）', value: '' },
    ];
    return btns[Math.floor(Math.random() * btns.length)].value;
  }

  const getRandomOppoGK = () => {
    const gkPlayers = players[oppoTeam].filter(p => p.position === "GK");
    if (gkPlayers.length === 0) return "";
    return gkPlayers[Math.floor(Math.random() * gkPlayers.length)].number;
  }

  const getRandomShootArea = () => {
    const areas = ['LW', 'RW', 'L6', 'R6', 'L9', 'R9', 'M6', 'M9'];
    return areas[Math.floor(Math.random() * areas.length)];
  }

  const getRandomGoal = () => {
    const goals = ['左上', '上', '右上', '左', '中央', '右', '左下', '下', '右下', 'Post', 'Out'];
    return goals[Math.floor(Math.random() * goals.length)];
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
    const keyboardConfig = {
      title: "選手",
      btns: players[offenseTeam].map((p) => ({ label: p.number + "<br>" + p.shortname, value: p.number })),
      grid: "repeat(4, 1fr)"
    };
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

  // setKeyboardPlayers を変更せずコピーして、常時表示用の選手ボタンを生成する関数
  const setPersistentPlayers = () => {
    const keyboardConfig = {
      title: "選手（常時表示）",
      btns: players[offenseTeam].map((p) => ({ label: p.number + "<br>" + p.shortname, value: p.number })),
      grid: "repeat(8, 1fr)" // 8列固定
    };

    return (
      <div className="keyboard-body" style={{ display: 'grid', gridTemplateColumns: keyboardConfig.grid, gridTemplateRows: 'repeat(2, auto)', gap: '10px', marginTop: '10px' }}>
        {keyboardConfig.btns.map((btn, idx) => (
          <button key={idx} className="keyboard-btn" onClick={() => {
              setInputValues(prev => ({ ...prev, player: btn.value }));
              append(String(btn.value));
            }}
            dangerouslySetInnerHTML={{ __html: btn.label }} />
        ))}
      </div>
    );
  }

  // setKeyboardSituation をコピーして、常時表示用のSituationボタンを生成する関数
  const setPersistentSituation = () => {
    const keyboardConfig = {
      title: "状況（常時表示）",
      btns: [
        { label: "▲", value: "+" },
        { label: "7", value: "7" },
        { label: "▼", value: "-" },
        { label: "（消）", value: "" },
      ],
      grid: "1fr"
    };

    return (
      <div className="keyboard-body" style={{ display: 'grid', gridTemplateColumns: keyboardConfig.grid, gap: '10px', marginTop: '10px' }}>
        {keyboardConfig.btns.map((btn, idx) => (
          <button key={idx} className="keyboard-btn" onClick={() => {
              setInputValues(prev => ({ ...prev, situation: btn.value }));
            }}
            dangerouslySetInnerHTML={{ __html: btn.label }} />
        ))}
      </div>
    );
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

  // setKeyboardKind を変更せずコピーして、常時表示用のKindボタンを生成する関数
  const setPersistentKind = () => {
    const keyboardConfig = {
      title: "攻撃種類（常時表示）",
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
    return (
      <div className="keyboard-body" style={{ display: 'grid', gridTemplateColumns: keyboardConfig.grid, gap: '10px', marginTop: '10px' }}>
        {keyboardConfig.btns.map((btn, idx) => (
          <button key={idx} className="keyboard-btn" onClick={() => setInputValues(prev => ({ ...prev, kind: btn.value }))}
            dangerouslySetInnerHTML={{ __html: btn.label }} />
        ))}
      </div>
    )
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

  const setPersistentGoal = () => {
    return (
      <div className="keyboard-body" style={{ marginTop: '10px' }}>
        <DrawGoal
          drawOut={true}
          onClick={(_type, value) => {
            setInputValues(prev => ({ ...prev, goal: value }));
          }}
          width="100%"
          height="auto"
        />
      </div>
    );
  }

  // 結果用の常時表示キーボード（setKeyboardResult を変更せずにコピー）
  const setPersistentResult = () => {
    const keyboardConfig = {
      title: "結果（常時表示）",
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
    return (
      <div className="keyboard-body" style={{ display: 'grid', gridTemplateColumns: keyboardConfig.grid, gap: '10px', marginTop: '10px' }}>
        {keyboardConfig.btns.map((btn, idx) => (
          <button key={idx} className="keyboard-btn" onClick={() => setInputValues(prev => ({ ...prev, result: btn.value }))}
            dangerouslySetInnerHTML={{ __html: btn.label }} />
        ))}
      </div>
    )
  }

  const setKeyboardOppoGK = (handleKeyboardClick) => {
    // GKのみ抽出
    const gkPlayers = players[oppoTeam].filter(p => p.position === "GK");
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

    // キーボードボタン押下時の値セット処理
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
    setOffenseTeam(prev => (prev === 0 ? 1 : 0));
    setOppoTeam(prev => (prev === 0 ? 1 : 0));
  }

  const autoFill = () => {
    setInputValues({
      situation: getRandomSituation(),
      player: getRandomPlayer(),
      kind: getRandomKind(),
      result: getRandomResult(),
      shootArea: getRandomShootArea(),
      goal: getRandomGoal(),
      remarks: ""
    });
    const randomGK = getRandomOppoGK();
    if (randomGK) {
      setSelectedOppoGK(prev => {
        const newArr = [...prev];
        newArr[oppoTeam] = randomGK;
        return newArr;
      });
    }
  }

  const handleSubmit = async () => {
    if (!isConfirmAvailable) {
      return;
    }
    try {
      // 選手情報を取得
      const player = players[offenseTeam].find(p => p.number === parseInt(inputValues.player));
      if (!player) {
        alert("選手を選択してください");
        return;
      }

      // isGS: resultが"g"もしくは"s"ならば1、それ以外ならば0
      const isGS = ["g", "s"].includes(inputValues.result) ? 1 : 0;

      // isGSO: resultが"g", "s", "o"のいずれかならば1、それ以外ならば0
      const isGSO = ["g", "s", "o"].includes(inputValues.result) ? 1 : 0;

      // isAtk: resultが g, s, o, m のいずれか => isAtk=1 さもなくば0
      const isAtk = ["g", "s", "o", "m"].includes(inputValues.result) ? 1 : 0;
      // isSht: resultが g, s, o のいずれか => isSht=1 さもなくば0
      const isSht = ["g", "s", "o"].includes(inputValues.result) ? 1 : 0;

      // isFB: kindが f1, f2, f3, ag のいずれか => isFB=1 さもなくば0
      const isFB = ["f1", "f2", "f3", "ag"].includes(inputValues.kind) ? 1 : 0;


      // 登録データを作成
      const recordData = {
        matchId: matchId,
        teamId: teams[offenseTeam].id,
        playerId: player.id,
        playeNumberr: player.number,
        playerPosition: player.position,
        playerName: player.name,
        half: currentHalf,
        situation: inputValues.situation,
        kind: inputValues.kind,
        result: inputValues.result,
        gk: selectedOppoGK[oppoTeam],
        remarks: inputValues.remarks,
        area: inputValues.shootArea,
        goal: inputValues.goal,
        setPlay: setPlayStr,
        isGS: isGS,
        isGSO: isGSO,
        isAtk: isAtk,
        isSht: isSht,
        isFB: isFB,
      };

      // サーバーに送信
      console.log('送信 recordData:', recordData, 'prop matchId:', matchId);
      const response = await fetch("/api/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recordData),
      });

      if (response.ok) {
        const result = await response.json();
        // alert("登録しました");
        // 入力値をリセット
        setInputValues({ situation: "", player: "", kind: "", shootArea: "", goal: "", result: "", remarks: "" });
        setIsConfirmAvailable(false);
        // チームを反転
        changeTeam();
      } else {
        const error = await response.json();
        alert("登録に失敗しました: " + (error.error || "不明なエラー"));
      }
    } catch (err) {
      alert("通信エラー: " + err.message);
    }
  }

  const createUprBtns = () => {
    return (
      <div className="btnsArea upperBtns">
        <button className="btnHalf" onClick={changeHalf}>
          {currentHalf}
        </button>
        <button className="btnGk span2" id="oppoGK" onClick={() => showInputPopup('oppoGK')}>
          <div className="labelSmall">{teams[oppoTeam].shortname}のGK</div>
          <div className="btnLabel">{selectedOppoGK[oppoTeam]}</div>
        </button>
        <button className="btnFunc span3" onClick={changeTeam}><div className="btnLabel">{teams[offenseTeam].shortname}の攻撃</div></button>
      </div>
    );
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

          // Remarksボタンの場合は標準inputを使用
          if (btn.id === 'remarks') {
            return (
              <div 
                key={btn.id} 
                id={btn.id} 
                className="btnFunc"
                style={{ ...gridStyle}}
                onClick={() => remarksInputRef.current?.focus()}
              >
                <div>{btn.label}</div>
                <input 
                  className="inputedValue"
                  ref={remarksInputRef}
                  type="text" 
                  value={getValueByTeam(btn.id)}
                  onChange={(e) => {
                    setInputValues(prev => ({ ...prev, remarks: e.target.value }));
                  }}
                />
              </div>
            );
          }
          
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
  
  const append = (char) => {
    setItems(prev => {
      const newItems = [...prev, char];
      setSetPlayStr(newItems.join(','));
      return newItems;
    });
  };

  const backspace = () => {
    setItems(prev => {
      const newItems = prev.slice(0, -1);
      setSetPlayStr(newItems.join(','));
      return newItems;
    });
  };

  const clear = () => {
    setItems([]);
    setSetPlayStr("");
  };
  
  // setPlay の表示を返す関数（JSX内に関数を置かないために抽出）
  const renderSetPlay = () => {
    return (
      <>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <span key={index}>
              {index !== 0 && <span>→</span>}
              {isLast ? (
                <span className="last">{item}</span>
              ) : (
                item
              )}
            </span>
          );
        })}
      </>
    );
  }
  
  const renderContent = () => {
    const content = (
      <div className="base">
      {renderKeyboard()}
      <div className="header row">
        <div className="header-title left">
          <div>{teams[0].shortname} vs {teams[1].shortname}</div>
          <div>{matchDate}</div>
          <div id="matchId">{matchId ? `ID: ${matchId}` : ""}</div>
        </div>
        <div className="header-title right" style={{display: "flex"}}>
          <div onClick={() => setView(appOutputSheet)} className="header-icon header-btn">📋</div>
          <div onClick={() => setView("inputMatch")} className="header-icon header-btn">🔙</div>
        </div>
      </div>
      <div className={ offenseTeam ? "main bgTeam1" : "main bgTeam0" }>
        <img src={teams[offenseTeam]?.image || ""} className="backgroundImage"/>
        {createUprBtns()}
        <div className="align-bottom">
            <div>セットプレイ</div>
          <div id="setPlay">{renderSetPlay()}</div>
          <div id="areaSitu">{setPersistentSituation()}</div>
          <div id="btnPlayers">{setPersistentPlayers()}</div>
            <div className="row"><div onClick={autoFill}>ランダム生成</div></div>
            {createLwrBtns()}
        </div>
      </div>

      <div>
        <button onClick={backspace}>Backspace</button>
        <button onClick={clear}>Clear</button>
      </div>

      <div className="footer">
        <div className="btnStartContainer">
          <div className="btnStart" onClick={handleSubmit}>登録</div>
        </div>
      </div>
    </div>);
    return content;
  }

  // const content =  renderContent();

  const renderTablet = () => {
    const content = (
      <div className="base">
      <div className="header row">
        <div className="header-title left">
          <div>{teams[0].shortname} vs {teams[1].shortname}</div>
          <div>{matchDate}</div>
          <div id="matchId">{matchId ? `ID: ${matchId}` : ""}</div>
        </div>
        <div className="header-title right" style={{display: "flex"}}>
          <div onClick={() => setView(appOutputSheet)} className="header-icon header-btn">📋</div>
          <div onClick={() => setView("inputMatch")} className="header-icon header-btn">🔙</div>
        </div>
      </div>
      <div className={ offenseTeam ? "main bgTeam1" : "main bgTeam0" }>
        <img src={teams[offenseTeam]?.image || ""} className="backgroundImage"/>
        <div className="row">
          <table id="inputedValues" style={{border: "1px solid red", margin: "10px", backgroundColor: "rgba(255, 255, 255, 0.8)", width:"100%"}}>
            <thead>
              <tr>
                <th>Situation</th>
                <th>Player</th>
                <th>Kind</th>
                <th>Result</th>
                <th>Shoot Area</th>
                <th>Goal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td id="value_situ">{inputValues.situation}</td>
                <td id="value_player">{inputValues.player}</td>
                <td id="value_kind">{inputValues.kind}</td>
                <td id="value_result">{inputValues.result}</td>
                <td id="value_shoot_area">{inputValues.shootArea}</td>
                <td id="value_goal">{inputValues.goal}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="row">
          <div style={{border: "1px solid red", padding: "10px", borderRadius: "4px", margin: "10px", backgroundColor: "rgba(255, 255, 255, 0.8)", width:"100%", height:"100%"}}>
            <div className="row">
              <div id="areaSitu" style={{border: "1px solid red"}}>{setPersistentSituation()}</div>
              <div id="areaNumber" style={{border: "1px solid red"}}>{setPersistentPlayers()}</div>
              <div id="areaArea" style={{ width: '100%' }}>
                  <div style={{ display: 'inline-block' }}>
                  <DrawShootArea
                    width="100%"
                    height="auto"
                    onClick={(type, value) => {
                      if (type === "area") {
                        setInputValues(prev => ({ ...prev, shootArea: value }));
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="row" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <div id="areaKindWrapper" style={{ position: 'relative', width: '100%', minHeight: '320px' }}>
                  <div id="areaKindBack" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 0, pointerEvents: 'none' }}>
                    <div style={{ transform: 'rotate(-90deg)', transformOrigin: 'center center', width: '90%', height: '90%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <DrawShootArea width="100%" height="100%" showText={false} />
                    </div>
                  </div>
                  <div id="areaKind" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1 }}>
                    {setPersistentKind()}
                  </div>
                </div>
              </div>
              <div id="areaResult">{setPersistentResult()}</div>
              <div id="areaGoal" style={{border: "1px solid red"}}>{setPersistentGoal()}</div>
            </div>
        </div>
        </div>
      </div>
      <div className="footer">
        <div className="btnStartContainer">
          <div className="btnStart" onClick={handleSubmit}>登録</div>
        </div>
      </div>
    </div>);
    return content;
  }

  const content = renderTablet();


  return (
    content
  );
}
