import React, { useState, useEffect, useRef } from "react";
import { Player } from "../models/Player";
import Calendar from "./Calendar";
import SearchMatch from "./SearchMatch";
import "./style_datepicker.css";
import "./style_input.css";
import { ja } from "date-fns/locale";
import { insertMatch, getMatchById } from "../api";

export default function InputMenu(
  { allTeams, allPlayers, teams, setTeams, players, setPlayers, setView, setMatchId, setMatchDate, isEditor, matchId, setSelectedMatch}) {

  return (
    <div className="base">
      <img src={teams[0]?.image} className="backgroundImage" />
      <div className="header row">
        <div className="header-title left">
          <div>試合選択</div>
        </div>
        <div className="header-title right" style={{display: "flex"}}>
          <div onClick={() => setView("title")} className="header-icon header-btn">🔙</div>
        </div>
      </div>
      <div className="main bgTeam0">
        <SearchMatch setView={setView} allTeams={allTeams} setSelectedMatch={setSelectedMatch} isEditor={isEditor} />
      </div>
    </div>
  );
}
