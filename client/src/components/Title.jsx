import React from "react";
import "./Title.css";

export default function Title({ onShowTeams, onShowTeams2, onShowAnalysisMenu, showMenu, setShowMenu }) {

    const handlePassClick = () => {
        setShowMenu(true);
    };

    const renderPass = () => (
        <div id="pass" className="titleArea">
            <input type="password" placeholder="パスワード"></input>
            <div className="btnPass" onClick={handlePassClick}>ログイン</div>
        </div>
    );

    const renderMenu = () => (
        <div id="menu" className="titleArea">
            <div className="row">
                <div className="btnTitle" onClick={onShowTeams}>入力（タブレット用）</div>
                <div className="btnTitle" onClick={onShowTeams2}>入力（縦長スマホ用）</div>
                <div className="btnTitle" onClick={onShowAnalysisMenu}>閲覧</div>
            </div>
            <div className="btnPass" onClick={() => setShowMenu(false)}>ログアウト</div>
        </div>
    );

    return (
        <>
            <h1>ハンド入力支援</h1>
            <div className="imgArea"><img src="./bravekings.png" className="title_img"></img></div>
            {!showMenu && renderPass()}

            {showMenu && renderMenu()}
        </>
    );
}
