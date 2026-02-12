import React from "react";
import SearchMatch from "./SearchMatch";
import "./style_output.css";

export default function OutputMenu({ setView, allTeams, setSelectedMatch, isEditor }) {

  return (
    <div className="base">
      <div className="header row">
        <div className="header-title left">
          <div>分析メニュー</div>
        </div>
        <div className="header-title right" style={{display: "flex"}}>
          <div onClick={() => setView("title")} className="header-icon header-btn">🔙</div>
        </div>
      </div>
      <div className="main">
        <SearchMatch setView={setView} allTeams={allTeams} setSelectedMatch={setSelectedMatch} isEditor={isEditor} />
      </div>
    </div>
  );
}
