import React, { useState, useEffect, useRef } from "react";
import { Player } from "../models/Player";
import Calendar from "./Calendar";
import SearchMatch from "./SearchMatch";
import "./style_datepicker.css";
// import "./style_input.css";
import styles from "./InputMenu.module.css";
import { ja } from "date-fns/locale";
import { insertMatch, getMatchById } from "../api";

export default function InputMenu(
  { allTeams, allPlayers, teams, setTeams, players, setPlayers, setView, setMatchId, setMatchDate, isEditor, matchId, setSelectedMatch, session}) {

  const content = (
    <>
    <div className={styles.main}>
      <img src={teams[0]?.image} className={styles.backgroundImage} />
      <div className={styles.titleString}>試合選択</div>
      <SearchMatch setView={setView} allTeams={allTeams} setSelectedMatch={setSelectedMatch} isEditor={isEditor} setMatchId={setMatchId} setTeams={setTeams} teams={teams} allPlayers={allPlayers} setPlayers={setPlayers} session={session} />
    </div>
    </>
  );

  return (
    <>{content}</>
  );
}
