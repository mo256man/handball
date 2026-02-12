import React, { useState, useEffect } from "react";
import "./style_title.css";

export default function Title({allTeams, setView, teams, setTeams, titleMode, setTitleMode, setIsEditor, setMatchId}) {
  const [showPopup, setShowPopup] = useState(false);        // チーム選択ポップアップ表示フラグ
  const [password, setPassword] = useState("");
  const [passError, setPassError] = useState("");
  const [username, setUsername] = useState("");

  console.log(teams);
  // outlineデバッグ用のトグル
  const [outlineOn, setOutlineOn] = useState(false);
  useEffect(() => {
    const styleId = 'debug-outline';
    if (outlineOn) {
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = '* { outline: 1px solid red !important; }';
        document.head.appendChild(style);
      }
    } else {
      const style = document.getElementById(styleId);
      if (style) style.remove();
    }
  }, [outlineOn]);

  // 開発時に各要素に枠線を表示するボタン
  const drawFrameBtn = () => (
    <button
        style={{ position: 'absolute', right: 10, top: 10, zIndex: 10 }}
        onClick={() => setOutlineOn(v => !v)}
    >
      outline {outlineOn ? 'OFF' : 'ON'}
    </button>
  );

  const handlePassClick = async () => {
    // パスワード確認
    setPassError("");
    try {
      // 空文字もそのまま送信
      const response = await fetch("/api/checkpass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, username }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        // サーバーから返るteamレコードをteams[0]に格納
        if (result.team) {
          const newTeams = [...(teams || [null, null])];
          newTeams[0] = result.team;
          // teams[1]がnullなら仮の値としてallTeams[1]を設定
          if (!newTeams[1]) {
            newTeams[1] = allTeams[1];
          }
          setTeams(newTeams);
        }
        setTitleMode('menu');
      } else {
        setPassError(result.error || "パスワードが違います");
      }
    } catch (err) {
      setPassError("通信エラー");
    }
  };

  const renderNamePass = () => (
    // 名前とパスワード入力画面
    <div id="pass" className="titleArea">
      <input
        type="text"
        placeholder="名前"
        value={username}
        onChange={e => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="パスワード"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <div className="btnConfirm" onClick={handlePassClick}>ログイン</div>
      <div className="errorMessage">{passError}</div>
    </div>
  );

  const renderMenu = () => (
    // メニュー画面
    <div id="menu" className="titleArea">
      <div className="row">
        <div className="teamname-title center">{teams[0].teamname}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        <div className="btnTitle" onClick={() => { setView('inputMenu'); setIsEditor(true); }}>📝</div>
        <div className="btnTitle" onClick={() => { setView('outputMenu'); setIsEditor(false); }}>📊</div>
      </div>
      <div className="btnConfirm" onClick={() => { setTitleMode('pass'); setTeams([null, null]); setIsEditor(null); setMatchId(null); }}>ログアウト</div>
    </div>
  );

  return (
    <div className="base">
      {showPopup && renderSelectTeams()}
      <div className="header">
        {/* {renderSettingBtn()} */}
        <div className="header-title"></div>
        {drawFrameBtn()}
      </div>
      <div className="header row">
        <div className="header-title left">
          <div>ハンドスタッツ入力支援</div>
        </div>
        <div className="header-title right" style={{display: "flex"}}>
          <div className="header-icon header-btn">☰</div>
        </div>
      </div>
      <div className={teams[0] ? "main bgTeam0" : "main"}>
        <img src={teams[0] ? teams[0].filename : "irasutoya.png"} className="backgroundImage" />
        <div className="align-bottom">
          {titleMode === 'pass' && renderNamePass()}
          {titleMode === 'menu' && renderMenu()}
        </div>
      </div>
    </div>
  );
}
