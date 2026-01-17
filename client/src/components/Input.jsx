import React, { useState } from "react";
import "./Input.css";
import { insertRecord } from "../api";

export default function Main({ onBackToTitle, players }) {
  // players全体の構造を確認
  console.log('players:', players);
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
  const [currentHalf, setCurrentHalf] = useState("regular_1st");
  const [showPopup, setShowPopup] = useState(false);

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
      <>
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
      </>
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

    const anValue = (i === 1 ? result1 : result2) === "r" || (i === 1 ? result1 : result2) === "f" || (i === 1 ? kind1 : kind2) === "7" ? "1" : "";

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
            <td id={`gk${i}`}></td>
            <td id={`y${i}`}>{createPlayerSelect(i === 1 ? y1 : y2, handleYChange)}</td>
            <td id={`2min${i}`}>{createPlayerSelect(i === 1 ? min1 : min2, handleMinChange)}</td>
            <td id={`an${i}`}>{anValue}</td>
            <td id={`remarks${i}`}></td>
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

  // 登録ボタンのクリックハンドラー
  const handleConfirmClick = async () => {
    setShowPopup(true);
    
    try {
      // resultテーブルにデータを挿入
      const baseUrl = import.meta.env.VITE_API_URL 
        ? import.meta.env.VITE_API_URL.replace(/\/api$/, '')
        : `http://${window.location.hostname}:3001`;
      
      const number = currentTeam === 1 ? no1Text : no2Text;
      const teamPlayers = currentTeam === 1 ? players.team1 : players.team2;
      const playerObj = number ? teamPlayers.find(p => p.number == number) : null;
      const playerName = playerObj ? playerObj.name : "";
      
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

  // チーム画像はteamsテーブルのfilename列の値をそのまま使う（拡張子も含む）
  let teamInfo = null;
  if (currentTeam === 1 && players.team1info) teamInfo = players.team1info;
  if (currentTeam === 2 && players.team2info) teamInfo = players.team2info;
  const selectedTeamName = currentTeam === 1 ? players.teamName1 : players.teamName2;
  let teamIconSrc = "";
  if (teamInfo && teamInfo.filename) {
    // ファイル名のみが入る前提なので、必ず'/'を付与
    teamIconSrc = `/${teamInfo.filename}`;
  }
  // チーム名・アイコンパス・teamInfo全体を出力
  console.log('selectedTeamName:', selectedTeamName, 'teamIconSrc:', teamIconSrc, 'teamInfo:', teamInfo);

  return (
    <div className="base">
      {showPopup && <div className="popup">登録中</div>}
      <button onClick={onBackToTitle} className="top-right">戻る</button>
      <div className="header-container">
        <img className="team-icon" src={teamIconSrc} alt={selectedTeamName} />
        <div className="header">
          <div>{players.date}&nbsp;&nbsp;&nbsp;{players.teamName1} vs {players.teamName2}</div>
        </div>
      </div>
      {markArea(
        selectedTeamName,
        currentTeam,
        currentTeam === 1 ? players.team1 : players.team2
      )}
      <div className="footer">
        <div className="btn btnConfirm" id="confirmButton" onClick={handleConfirmClick}>登録</div>
      </div>
    </div>
  );
} 
