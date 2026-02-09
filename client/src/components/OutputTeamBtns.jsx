import React from "react";
import "./style_output.css";

export default function OutputTeamBtns({ team0Short = "", team1Short = "", teamId0 = null, teamId1 = null, selectedTeam = null, onClickTeam = () => {} }) {
  return (
    <div className="outputTeamBtnArea" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
      <button className={"outputBtn teamBtn" + (selectedTeam === 0 ? " active" : "")} onClick={() => onClickTeam(0, teamId0)}>{team0Short}</button>
      <button className={"outputBtn teamBtn" + (selectedTeam === 1 ? " active" : "")} onClick={() => onClickTeam(1, teamId1)}>{team1Short}</button>
    </div>
  );
}

