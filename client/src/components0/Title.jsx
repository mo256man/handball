import React, { useState, useEffect } from "react";
import "./Title.css";

export default function Title({ onShowMakeMatch, onShowAnalysisMenu, showMenu, setShowMenu, teams, onSelectTeam1, selectedTeam1 }) {
    const [showPopup, setShowPopup] = useState(false);
    const [team1, setTeam1] = useState(null);

    useEffect(() => {
        if (teams.length > 0) {
            if (selectedTeam1 === null) {
                setTeam1(teams[0]);
                onSelectTeam1(teams[0]);
            } else {
                setTeam1(selectedTeam1);
            }
        }
    }, [teams, onSelectTeam1, selectedTeam1]);

    const handlePassClick = () => {
        setShowMenu(true);
    };

    const renderPass = () => (
        <div id="pass" className="titleArea">
            <input type="password" placeholder="パスワード"></input>
            <div className="btnConfirm" onClick={handlePassClick}>ログイン</div>
        </div>
    );

    const renderMenu = () => (
        <div id="menu" className="titleArea">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div className="btnTitle" onClick={onShowMakeMatch}>📝</div>
                <div className="btnTitle" onClick={onShowAnalysisMenu}>📊</div>
            </div>
            <div className="btnConfirm" onClick={() => setShowMenu(false)}>ログアウト</div>
        </div>
    );

    const renderSettingBtn = () => (
        <div id="btnSetting" className="btnSetting" onClick={() => setShowPopup(!showPopup)}>≡</div>
    );

    const renderSelectTeams = () => (
        <div id="popup" className="selectTeamPopup">
            <div className="row">
                <div className="center">チーム選択</div>
                <div className="right" onClick={() => setShowPopup(false)}>❌</div>
            </div>
            <div className="selectTeamArea">
                {teams.map(team => (
                    <div key={team.id} className="team-item" onClick={() => { setTeam1(team); onSelectTeam1(team); setShowPopup(false); }}>
                        {team.shortname}<br />
                        <img src={team.filename} className="team-logo"></img>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <>
            {showPopup && renderSelectTeams()}
            <div className="header">
                {renderSettingBtn()}
                <div className="titleTitle">ハンド入力支援</div>
            </div>
            <div className="main">
                <div>我々は<span className="teamname-title">{team1?.teamname}</span></div>
                <div className="imgArea"><img id="title-img" src={team1?.filename} className="title-img"></img></div>
                {!showMenu && renderPass()}
                {showMenu && renderMenu()}
            </div>
        </>
    );
}
