import React, { useState, useEffect } from "react";
import "./style_title.css";

export default function Title({allTeams, setView, teams, setTeams, titleMode, setTitleMode}) {
  const [showPopup, setShowPopup] = useState(false);        // チーム選択ポップアップ表示フラグ
  const [password, setPassword] = useState("");
  const [passError, setPassError] = useState("");
  const [username, setUsername] = useState("");

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
        style={{ marginBottom: '8px' }}
      />
      <input
        type="password"
        placeholder="パスワード"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <div className="btnConfirm" onClick={handlePassClick}>ログイン</div>
      {passError && <div style={{ color: "red" }}>{passError}</div>}
    </div>
  );

  const renderMenu = () => (
    // メニュー画面
    <div id="menu" className="titleArea">
      <div>ログインユーザー名：{username}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        <div className="btnTitle" onClick={() => setView('inputMenu')}>📝</div>
        <div className="btnTitle" onClick={() => setView('outputMenu')}>📊</div>
      </div>
      <div className="btnConfirm" onClick={() => { setTitleMode('pass'); setTeams([null, null]); }}>ログアウト</div>
    </div>
  );

  return (
    <div className="base">
      {showPopup && renderSelectTeams()}
      <div className="header">
        {/* {renderSettingBtn()} */}
        <div className="titleTitle">ハンド入力支援</div>
      </div>
      <div className="main">
        <img src={teams[0] ? teams[0].filename : "irasutoya.png"} className="backgroundImage" />
        <div className="align-bottom">
        {/* <div>我々は<span className="teamname-title">{team0?.teamname}</span></div>
        <div className="imgArea"><img id="title-img" src={team0?.filename} className="title-img"></img></div> */}
          {titleMode === 'pass' && renderNamePass()}
          {titleMode === 'menu' && renderMenu()}
        </div>
      </div>
    </div>
  );
}






// export default function Title({allTeams}) {
//   const [showPopup, setShowPopup] = useState(false);
//   const [team1, setTeam1] = useState(null);

//   useEffect(() => {
//     if (teams.length > 0) {
//       if (selectedTeam1 === null) {
//                 setTeam1(teams[0]);
//                 onSelectTeam1(teams[0]);
//             } else {
//                 setTeam1(selectedTeam1);
//             }
//         }
//     }, [teams, onSelectTeam1, selectedTeam1]);

//     const handlePassClick = () => {
//         setShowMenu(true);
//     };

//     const renderPass = () => (
//         <div id="pass" className="titleArea">
//             <input type="password" placeholder="パスワード"></input>
//             <div className="btnConfirm" onClick={handlePassClick}>ログイン</div>
//         </div>
//     );

//     const renderMenu = () => (
//         <div id="menu" className="titleArea">
//             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
//                 <div className="btnTitle" onClick={onShowMakeMatch}>📝</div>
//                 <div className="btnTitle" onClick={onShowAnalysisMenu}>📊</div>
//             </div>
//             <div className="btnConfirm" onClick={() => setShowMenu(false)}>ログアウト</div>
//         </div>
//     );

//     const renderSettingBtn = () => (
//         <div id="btnSetting" className="btnSetting" onClick={() => setShowPopup(!showPopup)}>≡</div>
//     );

//     const renderSelectTeams = () => (
//         <div id="popup" className="selectTeamPopup">
//             <div className="row">
//                 <div className="center">チーム選択</div>
//                 <div className="right" onClick={() => setShowPopup(false)}>❌</div>
//             </div>
//             <div className="selectTeamArea">
//                 {teams.map(team => (
//                     <div key={team.id} className="team-item" onClick={() => { setTeam1(team); onSelectTeam1(team); setShowPopup(false); }}>
//                         {team.shortname}<br />
//                         <img src={team.filename} className="team-logo"></img>
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );

//     return (
//         <>
//             {showPopup && renderSelectTeams()}
//             <div className="header">
//                 {renderSettingBtn()}
//                 <div className="titleTitle">ハンド入力支援</div>
//             </div>
//             <div className="main">
//                 <div>我々は<span className="teamname-title">{team1?.teamname}</span></div>
//                 <div className="imgArea"><img id="title-img" src={team1?.filename} className="title-img"></img></div>
//                 {!showMenu && renderPass()}
//                 {showMenu && renderMenu()}
//             </div>
//         </>
//     );
// }
