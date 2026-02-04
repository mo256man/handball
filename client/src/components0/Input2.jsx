import React, { useState, useEffect, useRef } from "react";
import "./Input.css";
import { insertRecord } from "../api";

import ShootAreaSVG from "./ShootAreaSVG";
import GoalSVG from "./GoalSVG";

export default function Main({ onBackToTitle, players }) {

  const btns = [
    { label: '状況', id: "situation" },
    { label: '選手', id: "player" },
    { label: '種類', id: "kind" },
    { label: 'エリア', id: "shootArea" },
    { label: 'ゴール', id: "goal" },
    { label: '結果', id: "result" },
    // { empty: true },
    { label: 'Remarks', id: "remarks", gridColumn: "span 3" },
  ];

  // クリックで書き込む表示用の状態
  const [player1Text, setPlayer1Text] = useState("");
  const [player2Text, setPlayer2Text] = useState("");
  const [situation1, setSituation1] = useState("");
  const [situation2, setSituation2] = useState("");
  const [currentTeam, setCurrentTeam] = useState(1); // 1 or 2
  const [kind1, setKind1] = useState("");
  const [kind2, setKind2] = useState("");
  const [result1, setResult1] = useState("");
  const [result2, setResult2] = useState("");
  const [y1, setY1] = useState("");
  const [y2, setY2] = useState("");
  const [min1, setMin1] = useState("");
  const [min2, setMin2] = useState("");
  const [area1, setArea1] = useState("");
  const [area2, setArea2] = useState("");
  const [goal1, setGoal1] = useState("");
  const [goal2, setGoal2] = useState("");
  const [gk1, setGk1] = useState("");
  const [gk2, setGk2] = useState("");
  const [remarks1, setRemarks1] = useState("");
  const [remarks2, setRemarks2] = useState("");
  const [an1, setAn1] = useState("");
  const [an2, setAn2] = useState("");
  const [currentHalf, setCurrentHalf] = useState("前半");
  const [showPopup, setShowPopup] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [keyboardType, setKeyboardType] = useState("");

  // 攻守チームの状態
  const [offendTeam, setOffendTeam] = useState(players.team1);
  const [defendTeam, setDefendTeam] = useState(players.team2);
  const [offendTeamInfo, setOffendTeamInfo] = useState(players.team1info);
  const [defendTeamInfo, setDefendTeamInfo] = useState(players.team2info);

  // ANの値を自動更新
  useEffect(() => {
    const currentKind = currentTeam === 1 ? kind1 : kind2;
    const currentResult = currentTeam === 1 ? result1 : result2;
    const newAnValue = (currentKind === '7' || currentResult === 'r' || currentResult === 'f') ? '1' : '';
    
    if (currentTeam === 1) {
      setAn1(newAnValue);
    } else {
      setAn2(newAnValue);
    }
  }, [kind1, kind2, result1, result2, currentTeam]);

  // 汎用的なクリックハンドラー
  const handleClick = (field, value) => {
    const setters = {
      player: [setPlayer1Text, setPlayer2Text],
      situation: [setSituation1, setSituation2],
      kind: [setKind1, setKind2],
      result: [setResult1, setResult2],
      area: [setArea1, setArea2],
      goal: [setGoal1, setGoal2]
    };
    
    if (setters[field]) {
      const setter = currentTeam === 1 ? setters[field][0] : setters[field][1];
      setter(value);
      
      // フラッシュアニメーション
      const tdId = `${field}${currentTeam}`;
      const tdElement = document.getElementById(tdId);
      if (tdElement) {
        tdElement.classList.remove('flash');
        void tdElement.offsetWidth; // リフロー強制
        tdElement.classList.add('flash');
      }
    }
  };

  // .heptagonクリックで team を判定し、対応する state を更新
  const handleHeptagonClick = (e) => {
    const el = e.target.closest(".heptagon");
    if (!el) return;

    const text = el.innerText.trim();
    handleClick("player", text);
  };

  const handleYChange = (value) => {
    if (currentTeam === 1) {
      setY1(value);
    } else {
      setY2(value);
    }
  };

  const handleMinChange = (value) => {
    if (currentTeam === 1) {
      setMin1(value);
    } else {
      setMin2(value);
    }
  };

  // 攻守交代ハンドラー
  const handleOffendDefendSwap = () => {
    setOffendTeam(defendTeam);
    setDefendTeam(offendTeam);
    setOffendTeamInfo(defendTeamInfo);
    setDefendTeamInfo(offendTeamInfo);
    setCurrentTeam(currentTeam === 1 ? 2 : 1);
  };

  const createBtns = () => {
    const remarksInputRef = useRef(null);
    const getValueByTeam = (id) => {
      const valueMap = {
        half: currentHalf,
        situation: currentTeam === 1 ? situation1 : situation2,
        no: currentTeam === 1 ? player1Text : player2Text,
        player: currentTeam === 1 ? player1Text : player2Text,
        kind: currentTeam === 1 ? kind1 : kind2,
        result: currentTeam === 1 ? result1 : result2,
        gk: currentTeam === 1 ? gk1 : gk2,
        yellowcard: currentTeam === 1 ? y1 : y2,
        '2min': currentTeam === 1 ? min1 : min2,
        an: currentTeam === 1 ? an1 : an2,
        remarks: currentTeam === 1 ? remarks1 : remarks2,
        shootArea: currentTeam === 1 ? area1 : area2,
        goal: currentTeam === 1 ? goal1 : goal2,
      };
      return valueMap[id] || '';
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
                    if (currentTeam === 1) {
                      setRemarks1(e.target.value);
                    } else {
                      setRemarks2(e.target.value);
                    }
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
              onClick={btn.id === 'an' ? undefined : () => showInputPopup(btn.id)}
              style={{ ...gridStyle, ...anStyle }}
            >
              <div>{btn.label}</div>
              <div className="inputedValue" id={`value_${btn.id}`}>{getValueByTeam(btn.id)}</div>
            </div>
          );
        })}
      </div>
      </div>
    );
  }

  const showInputPopup = (btnID) => {
    setKeyboardType(btnID);
    setShowKeyboard(true);
  }

  const closeKeyboard = () => {
    setShowKeyboard(false);
    setKeyboardType("");
  }

  const setKeyboardHalf = () => {
    const handler = (value) => {
      setCurrentHalf(value);
      closeKeyboard();
    };
    return {
      title: 'Half選択',
      component: (
        <div className="keyboard-keys">
          {[
            { label: '前半', value: '前半' },
            { label: '後半', value: '後半' },
            { label: '延長前半', value: '延長前半' },
            { label: '延長後半', value: '延長後半' },
          ].map((key, idx) => (
            <button
              key={idx}
              className="keyboard-key"
              onClick={() => handler(key.value)}
            >
              {key.label}
            </button>
          ))}
        </div>
      )
    };
  }

  const setKeyboardSituation = () => {
    const handler = (value) => {
      if (currentTeam === 1) {
        setSituation1(value);
      } else {
        setSituation2(value);
      }
      closeKeyboard();
    };
    return {
      title: 'Situation選択',
      component: (
        <div className="keyboard-keys">
          {[
            { label: '▲', value: '+' },
            { label: '７', value: '7' },
            { label: '▼', value: '-' },
            { label: '（消）', value: '' },
          ].map((key, idx) => (
            <button
              key={idx}
              className="keyboard-key"
              onClick={() => handler(key.value)}
            >
              {key.label}
            </button>
          ))}
        </div>
      )
    };
  }

  const setKeyboardPlayer = () => {
    const handler = (value) => {
      if (currentTeam === 1) {
        setPlayer1Text(value);
      } else {
        setPlayer2Text(value);
      }
      closeKeyboard();
    };
    return {
      title: '選手選択',
      component: (
        <div className="keyboard-keys">
          {(currentTeam === 1 ? players.team1 : players.team2).map((player, idx) => {
            const style = player.position === 'GK'
              ? { backgroundColor: "lightpink" }
              : { backgroundColor: "lightblue" };
            return (
              <button
                key={idx}
                className={"keyboard-key"}
                style={style}
                onClick={() => handler(player.number)}
              >
                {player.number}<br />{player.name}
              </button>
            );
          })}
        </div>
      )
    };
  }

  const setKeyboardKind = () => {
    const handler = (value) => {
      if (currentTeam === 1) {
        setKind1(value);
      } else {
        setKind2(value);
      }
      closeKeyboard();
    };
    return {
      title: 'Shoot Kind選択',
      component: (
        <div className="keyboard-keys">
          {[
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
            { label: 'クリア', value: '' },
          ].map((key, idx) => (
            <button
              key={idx}
              className="keyboard-key"
              onClick={() => handler(key.value)}
            >
              {key.label}
            </button>
          ))}
        </div>
      )
    };
  }

  const setKeyboardResult = () => {
    const handler = (value) => {
      if (currentTeam === 1) {
        setResult1(value);
      } else {
        setResult2(value);
      }
      closeKeyboard();
    };
    return {
      title: 'Result選択',
      component: (
        <div className="keyboard-keys">
          {[
            { label: 'g (ゴール)', value: 'g' },
            { label: 'm (ミス)', value: 'm' },
            { label: 's (セーブ)', value: 's' },
            { label: 'p (7mをとった)', value: 'p' },
            { label: 'f (ファールとられた)', value: 'f' },
            { label: 'r (わからない)', value: 'r' },
            { label: 'o (Out Goal)', value: 'o' },
          ].map((key, idx) => (
            <button
              key={idx}
              className="keyboard-key"
              onClick={() => handler(key.value)}
            >
              {key.label}
            </button>
          ))}
        </div>
      )
    };
  }

  const setKeyboardGk = () => {
    const handler = (value) => {
      if (currentTeam === 1) {
        setGk1(value);
      } else {
        setGk2(value);
      }
      closeKeyboard();
    };
    return {
      title: 'GK選択',
      component: (
        <div className="keyboard-keys">
          {(currentTeam === 1 ? players.team2 : players.team1).map((player, idx) => (
            <button
              key={idx}
              className="keyboard-key"
              onClick={() => handler(player.number)}
            >
              {player.number}
            </button>
          ))}
        </div>
      )
    };
  }

  const setKeyboardYellowcard = () => {
    const handler = (value) => {
      if (currentTeam === 1) {
        setY1(value);
      } else {
        setY2(value);
      }
      closeKeyboard();
    };
    return {
      title: 'Yellow Card選択',
      component: (
        <div className="keyboard-keys">
          {(currentTeam === 1 ? players.team1 : players.team2).map((player, idx) => (
            <button
              key={idx}
              className="keyboard-key"
              onClick={() => handler(player.number)}
            >
              {player.number}
            </button>
          ))}
        </div>
      )
    };
  }

  const setKeyboard2min = () => {
    const handler = (value) => {
      if (currentTeam === 1) {
        setMin1(value);
      } else {
        setMin2(value);
      }
      closeKeyboard();
    };
    return {
      title: '2min選択',
      component: (
        <div className="keyboard-keys">
          {(currentTeam === 1 ? players.team1 : players.team2).map((player, idx) => (
            <button
              key={idx}
              className="keyboard-key"
              onClick={() => handler(player.number)}
            >
              {player.number}
            </button>
          ))}
        </div>
      )
    };
  }

  const setKeyboardRemarks = () => {
    return {
      title: 'Remarks入力',
      component: (
        <div className="keyboard-keys">
          <input
            type="text"
            className="inputedValue"
            value={currentTeam === 1 ? remarks1 : remarks2}
            onChange={e => {
              if (currentTeam === 1) {
                setRemarks1(e.target.value);
              } else {
                setRemarks2(e.target.value);
              }
            }}
            autoFocus
          />
        </div>
      )
    };
  }

  const setKeyboardShootArea = () => {
    return {
      title: 'Shoot Area選択',
      component: <ShootAreaSVG onClick={(field, value) => {
        if (field === 'area') {
          if (currentTeam === 1) {
            setArea1(value);
          } else {
            setArea2(value);
          }
          closeKeyboard();
        }
      }} />
    };
  }

  const setKeyboardGoal = () => {
    // GoalSVGクリック時のハンドラ
    const handleGoalSVGClick = (type, value) => {
      if (type === 'goal' || (type === 'frame' && value === 'Post') || (type === 'background' && value === 'Out')) {
        let goalValue = value;
        // Post, Outはtypeで判定
        if (type === 'frame') goalValue = 'Post';
        if (type === 'background') goalValue = 'Out';
        if (currentTeam === 1) {
          setGoal1(goalValue);
        } else {
          setGoal2(goalValue);
        }
        closeKeyboard();
      }
    };
    return {
      title: 'Goal選択',
      component: (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'auto' }}>
          <GoalSVG drawOut={true} onClick={handleGoalSVGClick} style={{ width: '100%', height: 'auto', display: 'block' }} />
        </div>
      )
    };
  }

  const renderKeyboard = () => {
    if (!showKeyboard) return null;

    // headerの高さを動的に取得
    const headerElement = document.querySelector('.header');
    const headerHeight = headerElement ? headerElement.offsetHeight : 0;

    const keyboards = {
      half: setKeyboardHalf(),
      situation: setKeyboardSituation(),
      player: setKeyboardPlayer(),
      kind: setKeyboardKind(),
      result: setKeyboardResult(),
      gk: setKeyboardGk(),
      yellowcard: setKeyboardYellowcard(),
      '2min': setKeyboard2min(),
      remarks: setKeyboardRemarks(),
      shootArea: setKeyboardShootArea(),
      goal: setKeyboardGoal(),
    };

    const currentKeyboard = keyboards[keyboardType];
    if (!currentKeyboard) return null;

    return (
      <div className="keyboard-overlay" style={{ top: `${headerHeight}px` }} onClick={closeKeyboard}>
        <div className="keyboard-popup" onClick={(e) => e.stopPropagation()}>
          <div className="keyboard-header">
            <h3>{currentKeyboard.title}</h3>
            <button className="keyboard-close" onClick={closeKeyboard}>✕</button>
          </div>
          {currentKeyboard.component}
        </div>
      </div>
    );
  }


  // 登録ボタンのクリックハンドラー
  const handleConfirmClick = async () => {
    setShowPopup(true);
    
    try {
      const number = currentTeam === 1 ? player1Text : player2Text;
      const teamPlayers = currentTeam === 1 ? players.team1 : players.team2;
      const playerObj = number ? teamPlayers.find(p => p.number == number) : null;
      const playerName = playerObj ? playerObj.name : "";
      const selectedTeamName = currentTeam === 1 ? players.teamName1 : players.teamName2;
      
      const insertData = {
        date: players.date,
        team: selectedTeamName,
        half: currentHalf,
        situation: currentTeam === 1 ? situation1 : situation2,
        number: parseInt(number) || 0,
        kind: currentTeam === 1 ? kind1 : kind2,
        result: currentTeam === 1 ? result1 : result2,
        gk: "",
        yellowcard: currentTeam === 1 ? y1 : y2,
        twomin: currentTeam === 1 ? min1 : min2,
        remarks: "",
        area: currentTeam === 1 ? area1 : area2,
        goal: currentTeam === 1 ? goal1 : goal2,
        player: playerName,
        team1: players.teamName1,
        team2: players.teamName2
      };
      
      console.log('送信データ:', insertData);
      
      const result = await insertRecord(insertData);
      console.log('登録完了:', result);
    } catch (error) {
      console.error('登録エラー:', error);
    }
    
    setTimeout(() => {
      setShowPopup(false);
      // チームをトグル
      setCurrentTeam(currentTeam === 1 ? 2 : 1);
    }, 500);
  };

  // 各入力値のstateを空文字にリセットする
  const resetBtnValues = () => {
    setPlayer1Text("");
    setPlayer2Text("");
    setSituation1("");
    setSituation2("");
    setKind1("");
    setKind2("");
    setResult1("");
    setResult2("");
    setY1("");
    setY2("");
    setMin1("");
    setMin2("");
    setArea1("");
    setArea2("");
    setGoal1("");
    setGoal2("");
    setGk1("");
    setGk2("");
    setRemarks1("");
    setRemarks2("");
    setAn1("");
    setAn2("");
  };

  return (
    <div className="base">
      {showPopup && <div className="popup">登録中</div>}
      {renderKeyboard()}
      <button onClick={onBackToTitle} className="top-right">戻る</button>
      <div className="header">
        {/* <div className="changeTeam" onClick={handleOffendDefendSwap}>
          <img src={offendTeamInfo?.filename} alt="Offend Team" className="imgSmall"/>
          ＞
          <img src={defendTeamInfo?.filename} alt="Defend Team" className="imgSmall" />
        </div> */}
        <div className="row">
          {players.date}
          <div></div>
        </div>
        {/* <div>{players.teamName1} vs {players.teamName2}</div> */}
      </div>
      <div className="footer">
        <div id="btnReset" onClick={resetBtnValues}>reset</div>
        {createBtns()}
        <div className="btn btnConfirm" id="confirmButton" onClick={handleConfirmClick}>登録</div>
      </div>
    </div>
  );
}
