import React, { useState, useEffect, useRef } from "react";
import "./Input.css";
import { insertRecord } from "../api";

export default function Main({ onBackToTitle, players }) {
  // クリックで書き込む表示用の状態
  const [no1Text, setNo1Text] = useState("");
  const [no2Text, setNo2Text] = useState("");
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
      no: [setNo1Text, setNo2Text],
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
    handleClick("no", text);
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

  const markArea = (teamLabel, i, players) => {
    return (
      <div className="MarkArea">
        {teamLabel}
        <div className="row">
          <div>
            <div className="row">
              <div 
                className={`btn halves regular ${currentHalf === "regular_1st" ? "halves_selected" : "white"}`}
                id="regular_1st"
                onClick={() => setCurrentHalf("regular_1st")}
              >前半</div>
              <div 
                className={`btn halves regular ${currentHalf === "regular_2nd" ? "halves_selected" : "white"}`}
                id="regular_2nd"
                onClick={() => setCurrentHalf("regular_2nd")}
              >後半</div>
            </div>
            <div className="row">
              <div 
                className={`btn halves extra ${currentHalf === "extra_1st" ? "halves_selected" : "white"}`}
                id="extra_1st"
                onClick={() => setCurrentHalf("extra_1st")}
              >延長前半</div>
              <div 
                className={`btn halves extra ${currentHalf === "extra_2nd" ? "halves_selected" : "white"}`}
                id="extra_2nd"
                onClick={() => setCurrentHalf("extra_2nd")}
              >延長後半</div>
            </div>
          </div>
          {inputTable(i, players)}
          <div>
            <div className="btn" onClick={() => setCurrentTeam(currentTeam === 1 ? 2 : 1)}>
              <div className="btnChangeTeam">change Team</div>
              <div className="btnChangeTeamIcon">🔁</div>
            </div>
          </div>
        </div>
        <div className="btnArea" style={{ backgroundColor: currentTeam === 1 ? 'lightpink' : 'lightblue' }}>
            <div className="btnArea_column">
                <div className="row">
                    <div className="group">
                        <div className="label">Situation</div>
                        <div className="container">
                            {situationBtns()}
                        </div>
                    </div>
                    <div className="group">
                        <div className="label">Player #</div>
                        <div className="container">
                            {playersTable(i, players)}
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="group">
                        <div className="label">ShotKind</div>
                        <div className="container row">
                            {shotKindTable()}
                            {shotKindBtns()}
                        </div>
                    </div>
                    <div className="btnArea_column">
                        <div className="group">
                            <div className="label">Result</div>
                            <div className="container">
                                {resultBtns()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="btnArea_column">
                <div className="group">
                    <div className="label">Shoot Area</div>
                    <div className="container">
                        {createShootAreaSVG()}
                    </div>
                </div>
                  <div className="group">
                    <div className="label">Goal</div>
                    <div className="container">
                        {createGoal()}
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  };

  const inputTable = (i, players) => {
    // i === 1 のとき no1Text、i === 2 のとき no2Text を表示
    const noText = i === 1 ? no1Text : no2Text;

    const createPlayerSelect = (value, onChange) => (
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', height: '100%', boxSizing: 'border-box', border: 'none', fontSize: 'small' }}
      >
        <option value=""> </option>
        {players.map((player, idx) => (
          <option key={idx} value={player.number}>{player.number}</option>
        ))}
      </select>
    );

    return (
      <table className="inputTable">
        <tbody>
          <tr>
            <th>Situation</th>
            <th>No.</th>
            <th>Shoot<br />Kind</th>
            <th>Result</th>
            <th>GK</th>
            <th>Y</th>
            <th>2min</th>
            <th>AN</th>
            <th>Remarks</th>
            <th>Shoot<br />Area</th>
            <th>Goal</th>
          </tr>
          <tr>
            <td id={`situation${i}`}>{i === 1 ? situation1 : situation2}</td>
            <td id={`no${i}`}>{noText}</td>
            <td id={`kind${i}`}>{i === 1 ? kind1 : kind2}</td>
            <td id={`result${i}`}>{i === 1 ? result1 : result2}</td>
            <td id={`gk${i}`}>{i === 1 ? gk1 : gk2}</td>
            <td id={`y${i}`}>{createPlayerSelect(i === 1 ? y1 : y2, handleYChange)}</td>
            <td id={`2min${i}`}>{createPlayerSelect(i === 1 ? min1 : min2, handleMinChange)}</td>
            <td id={`an${i}`}>{i === 1 ? an1 : an2}</td>
            <td id={`remarks${i}`}>{i === 1 ? remarks1 : remarks2}</td>
            <td id={`area${i}`}>{i === 1 ? area1 : area2}</td>
            <td id={`goal${i}`}>{i === 1 ? goal1 : goal2}</td>
          </tr>
        </tbody>
      </table>
    );
  };

  const playersTable = (team, players) => {
    return (
      <div className="area">
        <div className="grid16" onClick={handleHeptagonClick}>
            {players.map((player, i) => (
            <div
                className={`btn heptagon ${player.position ? 'color' + player.position : ''}`}
                id={`player_${team}_${i + 1}`}
                key={`player-${team}-${i + 1}`}
            >
                {player.number}
            </div>
            ))}
        </div>
      </div>
    );
  };

  const situationBtns = () => {
    return (
        <>
            <div className="btn btnRound" onClick={() => handleClick("situation", "+")}>▲</div>
            <div className="btn btnRound" onClick={() => handleClick("situation", "7")}>７</div>
            <div className="btn btnRound" onClick={() => handleClick("situation", "-")}>▼</div>
        </>
    )
  }

  const shotKindTable = () => {
    return (
        <table className="shotKindTable">
            <tr><td>6</td><td>6m shot</td></tr>
            <tr><td>B</td><td>Break Through</td></tr>
            <tr><td>P</td><td>Pivot</td></tr>
            <tr><td>W</td><td>Wing</td></tr>
            <tr><td>9</td><td>9m shot</td></tr>
            <tr><td>f</td><td>Fly</td></tr>
            <tr><td>f1</td><td>FB 1st wave</td></tr>
            <tr><td>f2</td><td>FB Flash</td></tr>
            <tr><td>f3</td><td>FB 3rd wave</td></tr>
            <tr><td>ag</td><td>FB After Goal</td></tr>
            <tr><td>7</td><td>7m shot</td></tr>
        </table>
    )
  }

  const shotKindBtns = () => {
    return (
        <div className="shotKindBtns">
            <div className="btnCol1">
                <div className="btn btnKind blue" onClick={() => handleClick("kind", "6")}>6</div>
                <div className="btn btnKind" style={{ visibility: 'hidden' }}></div>
                <div className="btn btnKind orange" onClick={() => handleClick("kind", "f")}>f</div>
                <div className="btn btnKind orange" onClick={() => handleClick("kind", "f3")}>f3</div>
                <div className="btn btnKind gray" onClick={() => handleClick("kind", "")}></div>
            </div>
            <div className="btnCol2">
                <div className="btn btnKind green" onClick={() => handleClick("kind", "B")}>B</div>
                <div className="btn btnKind green" onClick={() => handleClick("kind", "W")}>W</div>
                <div className="btn btnKind orange" onClick={() => handleClick("kind", "f1")}>f1</div>
                <div className="btn btnKind orange" onClick={() => handleClick("kind", "ag")}>ag</div>
            </div>
            <div className="btnCol3">
                <div className="btn btnKind green" onClick={() => handleClick("kind", "P")}>P</div>
                <div className="btn btnKind blue" onClick={() => handleClick("kind", "9")}>9</div>
                <div className="btn btnKind orange" onClick={() => handleClick("kind", "f2")}>f2</div>
                <div className="btn btnKind blue" onClick={() => handleClick("kind", "7")}>7</div>
            </div>
        </div>
    )
  }

  const resultBtns = () => {
    const letters = ["g", "m", "s", "p", "f", "r"]
    return (
        <div className="resultBtns">
            <div className="grid2x3">
                {letters.map(letter => (
                    <div key={letter} className="btn btnResult palegreen" onClick={() => handleClick("result", letter)}>{letter}</div>
                ))}
            </div>
            <div className="bottom">
                <table className="resultTable">
                    <tr><td>g</td><td>ゴール</td></tr>
                    <tr><td>s</td><td>セーブ</td></tr>
                    <tr><td>f</td><td>ファールとられた</td></tr>
                    <tr><td>m</td><td>ミス</td></tr>
                    <tr><td>p</td><td>7mをとった</td></tr>
                    <tr><td>r</td><td>わからないです</td></tr>
                </table>
                <div key="o" className="btn btnResult gray" style={{fontSize:"small"}} onClick={() => handleClick("result", "o")}>Out<br />Goal</div>
            </div>
        </div>
    )
  }

  const createSectorPath = (centerX, centerY, radius, startAngle, endAngle) => {
    // 度数法からラジアンに変換
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    // 開始点の座標
    const startX = centerX + radius * Math.cos(startRad);
    const startY = centerY + radius * Math.sin(startRad);
    // 終了点の座標
    const endX = centerX + radius * Math. cos(endRad);
    const endY = centerY + radius * Math.sin(endRad);
    // 大きい弧かどうか（180度より大きいか）
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    // パス文字列を生成
    return `M ${centerX} ${centerY} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
  };

  const createShootAreaSVG = () => {
    return (
      <svg width="200" height="150" viewBox="0 0 200 150">
        <path d={createSectorPath(85, 10, 130, 90, 135)} fill="lightyellow" onClick={() => handleClick("area", "L9")} className="shootArea"/>
        <path d={createSectorPath(115, 10, 130, 45, 90)} fill="lightyellow" onClick={() => handleClick("area", "R9")} className="shootArea" />
        <path d={createSectorPath(85, 10, 90, 90, 135)} fill="lightblue" onClick={() => handleClick("area", "L6")} className="shootArea" />
        <path d={createSectorPath(115, 10, 90, 45, 90)} fill="lightblue" onClick={() => handleClick("area", "R6")} className="shootArea" />
        <path d="M 0 10 L 85 10 L 0 95 Z" fill="lightgreen" onClick={() => handleClick("area", "LW")} className="shootArea" />
        <path d="M 200 10 L 115 10 L 200 95 Z" fill="lightgreen"  onClick={() => handleClick("area", "RW")} className="shootArea" />
        <rect x="75" y="70" width="50" height="30" fill="lightblue" onClick={() => handleClick("area", "M6")} className="shootArea" />
        <rect x="75" y="100" width="50" height="40" fill="lightyellow" onClick={() => handleClick("area", "M9")} className="shootArea" />
        <path d="M 25 10 A 60 60 0 0 0 85 70 L 115 70 A 60 60 0 0 0 175 10 Z" fill="white" stroke="black" strokeWidth="1" />
        <path d="M 0 300 L 0 10 L 200 10 L 200 300" fill="none" stroke="black" strokeWidth="1" />
        <rect x="85" y="0" width="30" height="10" fill="white" stroke="black" strokeWidth="1" />
        <text x="15" y="40" className="shootAreaText">LW</text>
        <text x="185" y="40" className="shootAreaText">RW</text>
        <text x="50" y="80" className="shootAreaText">L6</text>
        <text x="150" y="80" className="shootAreaText">R6</text>
        <text x="40" y="115" className="shootAreaText">L9</text>
        <text x="160" y="115" className="shootAreaText">R9</text>
        <text x="100" y="85" className="shootAreaText">M6</text>
        <text x="100" y="120" className="shootAreaText">M9</text>
      </svg>
    )
  }

  const createGoal = () => {
    const positions = ["左上", "上", "右上", "左中", "中", "右中", "左下", "下", "右下"];
    const getColorClass = (idx) => {
      if (idx < 3) return "green";
      if (idx < 6) return "blue";
      return "lightpink";
    };
    
    return (
      <div className="btn goalOuter" onClick={() => handleClick("goal", "Out")}>
        <div style={{ alignSelf: 'center' }}>Out</div>
        <div className="btn goalPost" onClick={(e) => { e.stopPropagation(); handleClick("goal", "Post"); }}>
          <div style={{ alignSelf: 'center' }}>Post</div>
          <div className="goalInner">
            {positions.map((pos, idx) => (
              <div key={idx} className={`btn goalPosition ${getColorClass(idx)}`} onClick={(e) => { e.stopPropagation(); handleClick("goal", pos); }}>
                {pos}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const createBtns = () => {
    const remarksInputRef = useRef(null);
    
    const btns = [
      { label: 'ハーフ', id:"half"},
      { label: '状況', id:"situation"},
      { label: '背番号', id:"no"},
      { label: '種類', id:"kind"},
      { label: '結果', id:"result"},
      { label: 'GK', id:"gk"},
      { label: 'イエロー', id:"yellowcard"},
      { label: '2分退場', id:"2min"},
      { label: 'AN', id:"an"},
      { label: 'エリア', id:"shootArea"},
      { label: 'ゴール', id:"goal"},
      { empty: true},
      { label: 'Remarks', id:"remarks", gridColumn:"span 4"},
    ];

    const getValueByTeam = (id) => {
      const valueMap = {
        half: currentHalf,
        situation: currentTeam === 1 ? situation1 : situation2,
        no: currentTeam === 1 ? no1Text : no2Text,
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
    return {
      title: 'Half選択',
      keys: [
        { label: '前半', value: '前半' },
        { label: '後半', value: '後半' },
        { label: '延長前半', value: '延長前半' },
        { label: '延長後半', value: '延長後半' },
      ],
      handler: (value) => {
        setCurrentHalf(value);
        closeKeyboard();
      }
    };
  }

  const setKeyboardSituation = () => {
    return {
      title: 'Situation選択',
      keys: [
        { label: '▲', value: '+' },
        { label: '７', value: '7' },
        { label: '▼', value: '-' },
        { label: '（消）', value: '' },
      ],
      handler: (value) => {
        if (currentTeam === 1) {
          setSituation1(value);
        } else {
          setSituation2(value);
        }
        closeKeyboard();
      }
    };
  }

  const setKeyboardNo = () => {
    return {
      title: 'Player # 選択',
      keys: (currentTeam === 1 ? players.team1 : players.team2).map(player => ({
        label: player.number,
        value: player.number,
        className: player.position ? `color${player.position}` : ''
      })),
      handler: (value) => {
        if (currentTeam === 1) {
          setNo1Text(value);
        } else {
          setNo2Text(value);
        }
        closeKeyboard();
      }
    };
  }

  const setKeyboardKind = () => {
    return {
      title: 'Shoot Kind選択',
      keys: [
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
      ],
      handler: (value) => {
        if (currentTeam === 1) {
          setKind1(value);
        } else {
          setKind2(value);
        }
        closeKeyboard();
      }
    };
  }

  const setKeyboardResult = () => {
    return {
      title: 'Result選択',
      keys: [
        { label: 'g (ゴール)', value: 'g' },
        { label: 'm (ミス)', value: 'm' },
        { label: 's (セーブ)', value: 's' },
        { label: 'p (7mをとった)', value: 'p' },
        { label: 'f (ファールとられた)', value: 'f' },
        { label: 'r (わからない)', value: 'r' },
        { label: 'o (Out Goal)', value: 'o' },
      ],
      handler: (value) => {
        if (currentTeam === 1) {
          setResult1(value);
        } else {
          setResult2(value);
        }
        closeKeyboard();
      }
    };
  }

  const setKeyboardGk = () => {
    return {
      title: 'GK選択',
      keys: (currentTeam === 1 ? players.team2 : players.team1).map(player => ({
        label: player.number,
        value: player.number,
      })),
      handler: (value) => {
        if (currentTeam === 1) {
          setGk1(value);
        } else {
          setGk2(value);
        }
        closeKeyboard();
      }
    };
  }

  const setKeyboardYellowcard = () => {
    return {
      title: 'Yellow Card選択',
      keys: (currentTeam === 1 ? players.team1 : players.team2).map(player => ({
        label: player.number,
        value: player.number,
      })),
      handler: (value) => {
        if (currentTeam === 1) {
          setY1(value);
        } else {
          setY2(value);
        }
        closeKeyboard();
      }
    };
  }

  const setKeyboard2min = () => {
    return {
      title: '2min選択',
      keys: (currentTeam === 1 ? players.team1 : players.team2).map(player => ({
        label: player.number,
        value: player.number,
      })),
      handler: (value) => {
        if (currentTeam === 1) {
          setMin1(value);
        } else {
          setMin2(value);
        }
        closeKeyboard();
      }
    };
  }

  const setKeyboardRemarks = () => {
    return {
      title: 'Remarks入力',
      keys: [
        '1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
        'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P',
        'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L',
        'Z', 'X', 'C', 'V', 'B', 'N', 'M',
        'あ', 'い', 'う', 'え', 'お',
        'か', 'き', 'く', 'け', 'こ',
        'さ', 'し', 'す', 'せ', 'そ',
        ' (Space)', 'Del', 'Clear'
      ].map(key => ({ label: key, value: key })),
      handler: (value) => {
        if (value === 'Clear') {
          if (currentTeam === 1) {
            setRemarks1('');
          } else {
            setRemarks2('');
          }
          closeKeyboard();
        } else if (value === 'Del') {
          if (currentTeam === 1) {
            setRemarks1(prev => prev.slice(0, -1));
          } else {
            setRemarks2(prev => prev.slice(0, -1));
          }
        } else if (value === ' (Space)') {
          if (currentTeam === 1) {
            setRemarks1(prev => prev + ' ');
          } else {
            setRemarks2(prev => prev + ' ');
          }
        } else {
          if (currentTeam === 1) {
            setRemarks1(prev => prev + value);
          } else {
            setRemarks2(prev => prev + value);
          }
        }
      }
    };
  }

  const setKeyboardShootArea = () => {
    return {
      title: 'Shoot Area選択',
      keys: [
        { label: 'LW', value: 'LW' },
        { label: 'L6', value: 'L6' },
        { label: 'L9', value: 'L9' },
        { label: 'M6', value: 'M6' },
        { label: 'M9', value: 'M9' },
        { label: 'R6', value: 'R6' },
        { label: 'R9', value: 'R9' },
        { label: 'RW', value: 'RW' },
      ],
      handler: (value) => {
        if (currentTeam === 1) {
          setArea1(value);
        } else {
          setArea2(value);
        }
        closeKeyboard();
      }
    };
  }

  const setKeyboardGoal = () => {
    return {
      title: 'Goal選択',
      keys: [
        { label: '左上', value: '左上' },
        { label: '上', value: '上' },
        { label: '右上', value: '右上' },
        { label: '左中', value: '左中' },
        { label: '中', value: '中' },
        { label: '右中', value: '右中' },
        { label: '左下', value: '左下' },
        { label: '下', value: '下' },
        { label: '右下', value: '右下' },
        { label: 'Post', value: 'Post' },
        { label: 'Out', value: 'Out' },
      ],
      handler: (value) => {
        if (currentTeam === 1) {
          setGoal1(value);
        } else {
          setGoal2(value);
        }
        closeKeyboard();
      }
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
      no: setKeyboardNo(),
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
          <div className="keyboard-keys">
            {currentKeyboard.keys.map((key, idx) => (
              <button
                key={idx}
                className={`keyboard-key ${key.className || ''}`}
                onClick={() => currentKeyboard.handler(key.value)}
              >
                {key.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }


  // 登録ボタンのクリックハンドラー
  const handleConfirmClick = async () => {
    setShowPopup(true);
    
    try {
      const number = currentTeam === 1 ? no1Text : no2Text;
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

  return (
    <div className="base">
      {showPopup && <div className="popup">登録中</div>}
      {renderKeyboard()}
      <button onClick={onBackToTitle} className="top-right">戻る</button>
      <div className="header">
        <div>{players.date}</div>
        <div>{players.teamName1} vs {players.teamName2}</div>
        {createBtns()}
      </div>
      {/* {markArea(
        currentTeam === 1 ? players.teamName1 : players.teamName2,
        currentTeam,
        currentTeam === 1 ? players.team1 : players.team2
      )} */}
      <div className="footer">
        <div className="btn btnConfirm" id="confirmButton" onClick={handleConfirmClick}>登録</div>
      </div>
    </div>
  );
}
