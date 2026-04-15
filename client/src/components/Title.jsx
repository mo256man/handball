import React, { useState, useEffect } from "react";
// import "./style_title.css";
import styles from "./Title.module.css";

export default function Title({allTeams, setView, teams, setTeams, titleMode, setTitleMode, setIsEditor, setMatchId, isLoggedIn, onLogin, onLogout}) {
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
    // 名前またはパスワードが空の場合はエラーを表示して終了
    if (!username.trim() || !password.trim()) {
      setPassError("名前とパスワードを入力してください");
      return;
    }

    // パスワード確認
    setPassError("");
    try {
      const response = await fetch("/api/checkpass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, username }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        // ログインセッションを作成
        if (onLogin) {
          onLogin({ username, userId: result.userId, teamId: result.teamId });
        }
        // セッション作成後、App.jsx の useEffect で teams[0] が自動設定される
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
    <div id="pass">
      <input
        className={styles.passName}
        type="text"
        placeholder="名前"
        value={username}
        onChange={e => setUsername(e.target.value)}
      />
      <input
        className={styles.passName}
        type="password"
        placeholder="パスワード"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <div className={styles.btnLogin} onClick={handlePassClick}>ログイン</div>
      <div className={styles.errorMessage}>{passError}</div>
    </div>
  );

  const renderMenu = () => (
    // メニュー画面
    <div id="menu">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        <div className={styles.btnTitle} onClick={() => { setView('inputMenu'); setIsEditor(true); }}>
          <div className={styles.fontNormal}>記入</div>
          <div className={styles.fontLarge}>📝</div>
        </div>
        <div className={styles.btnTitle} onClick={() => { 
          console.log('「閲覧」ボタンクリック、setView(outputMenu)を呼び出し');
          setView('outputMenu'); 
          setIsEditor(false); 
        }}>
          <div className={styles.fontNormal}>閲覧</div>
          <div className={styles.fontLarge}>📊</div>
        </div>
        <div className={styles.btnTitle} onClick={() => { setView('settingsMenu'); setIsEditor(false); }}>
          <div className={styles.fontNormal}>設定</div>
          <div className={styles.fontLarge}>🔧</div>
        </div>
      </div>
      <div className={styles.btnLogin} onClick={() => { 
        if (onLogout) {
          onLogout();
        }
        setTitleMode('pass'); 
        setTeams([null, null]); 
        setIsEditor(null); 
        setMatchId(null); 
      }}>ログアウト</div>
    </div>
  );

  const content = (
    <>
    <div className={styles.main}>
      <img src={teams[0]?.image || "irasutoya.png"} className={styles.backgroundImage} />
      <div className={styles.titleString}>ハンドスタッツ入力支援</div>
      {teams[0] && (
        <div className={styles.teamname}>{teams[0].teamName}</div>
      )}
      <div className={teams[0] ? styles.footer + " " + styles.bgTeam0 : styles.footer}>
        {titleMode === 'pass' && renderNamePass()}
        {titleMode === 'menu' && renderMenu()}
      </div>
    </div>
    </>
  );
  
  return (
    <>{content}</>
  );
}
