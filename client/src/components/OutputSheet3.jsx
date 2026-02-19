import React, { useState, useEffect, useRef } from "react";
import DrawShootArea from "./DrawShootArea";
import DrawGoal from "./DrawGoal";
import "./style_output.css";
import "./style_input.css";
import OutputBtns from "./OutputBtns";
import OutputTeamBtns from "./OutputTeamBtns";
import { useSocket } from "../hooks/useSocket";
import { getRecordsByMatchId } from "../api";

export default function OutputSheet3({ teams, players, setView, matchId, matchDate, isEditor, appSelectedOutputTab, setAppSelectedOutputTab }) {
  const [selectedOppoGK, setSelectedOppoGK] = useState(["", ""]);
  const [selectedTeam, setSelectedTeam] = useState(0);
  const [oppoTeam, setOppoTeam] = useState(1);
  const [selectedOutputBtn, setSelectedOutputBtn] = useState(0);
  const [records, setRecords] = useState([]);
  const labelOptions0 = ["全体", "前半", "後半"];
  const labelOptions1 = ["全体", "セット攻撃", "速攻"];
  const labelOptions2 = ["Ｎ", "％"];
  const [toggles, setToggles] = useState([labelOptions0[0], labelOptions1[0], labelOptions2[0]]);

  // players は [team0Players, team1Players] 形式を期待
  const playersByTeam = players || [[], []];

  // チームの shortname と id を親で解決して子に渡す
  const team0Obj = teams && teams[0] ? teams[0] : null;
  const team1Obj = teams && teams[1] ? teams[1] : null;
  const team0Short = team0Obj ? team0Obj.shortname : (team0Obj && team0Obj.id ? `Team ${team0Obj.id}` : "");
  const team1Short = team1Obj ? team1Obj.shortname : (team1Obj && team1Obj.id ? `Team ${team1Obj.id}` : "");
  const teamId0 = team0Obj ? team0Obj.id : null;
  const teamId1 = team1Obj ? team1Obj.id : null;

  const clearValues = () => {
    // 今は特にリセットすべき項目がないためダミー
  };

  const renderPlayersTable = () => {
    const list = playersByTeam[selectedTeam] || [];
    const countsByPlayer = {};
    const needFirst = toggles[0] === labelOptions0[1];
    const needSecond = toggles[0] === labelOptions0[2];
    const needTotal = toggles[0] === labelOptions0[0];
    // toggles[1] による追加フィルタ: 全体 / セット攻撃 / 速攻
    const needFBAll = toggles[1] === labelOptions1[0];
    const needFastBreak = toggles[1] === labelOptions1[2];
    const needSetPlay = toggles[1] === labelOptions1[1];

    // 出力カウンタを初期化（他はとりあえず0）
    let cntAtk0 = 0, cntAtk1 = 0;
    let cntGoal0 = 0, cntGoal1 = 0;
    let cntShoot0 = 0, cntShoot1 = 0;
    let cntFoul0 = 0, cntFoul1 = 0;
    let cnt7mShoot0 = 0, cnt7mShoot1 = 0;
    let cntMiss0 = 0, cntMiss1 = 0;

    // レコードは全て走査する（各カウンタは必要条件を個別に適用）
    records.forEach(r => {
      if (!r) return;

      // teamId が無いレコードは無視
      if (r.teamId == null) return;

      // cntAtk は isAtk==1 のレコードのみカウント（かつ toggles[0] による半期フィルタ適用）
      if (r.isAtk === 1) {
        if ((needTotal || (needFirst && r.half === labelOptions0[1]) || (needSecond && r.half === labelOptions0[2])) &&
            (needFBAll || (needFastBreak && r.isFB === 1) || (needSetPlay && r.isFB === 0))) {
          if (r.teamId == teamId0) cntAtk0++;
          else if (r.teamId == teamId1) cntAtk1++;
        }
      }

      // cntGoal: result === 'g' のレコードをチーム・半期条件でカウント
      if (r.result === 'g') {
        if ((needTotal || (needFirst && r.half === labelOptions0[1]) || (needSecond && r.half === labelOptions0[2])) &&
            (needFBAll || (needFastBreak && r.isFB === 1) || (needSetPlay && r.isFB === 0))) {
          if (r.teamId == teamId0) cntGoal0++;
          else if (r.teamId == teamId1) cntGoal1++;
        }
      }
      // cntShoot: isSht === 1 のレコードをチーム・半期条件でカウント
      if (r.isSht === 1) {
        if ((needTotal || (needFirst && r.half === labelOptions0[1]) || (needSecond && r.half === labelOptions0[2])) &&
            (needFBAll || (needFastBreak && r.isFB === 1) || (needSetPlay && r.isFB === 0))) {
          if (r.teamId == teamId0) cntShoot0++;
          else if (r.teamId == teamId1) cntShoot1++;
        }
      }
      // cntFoul: result === 'f' のレコードをチーム・半期条件でカウント
      if (r.result === 'f') {
        if ((needTotal || (needFirst && r.half === labelOptions0[1]) || (needSecond && r.half === labelOptions0[2])) &&
            (needFBAll || (needFastBreak && r.isFB === 1) || (needSetPlay && r.isFB === 0))) {
          if (r.teamId == teamId0) cntFoul0++;
          else if (r.teamId == teamId1) cntFoul1++;
        }
      }
      // cnt7mShoot: result === '7' のレコードをチーム・半期条件でカウント
      if (r.result === '7') {
        if ((needTotal || (needFirst && r.half === labelOptions0[1]) || (needSecond && r.half === labelOptions0[2])) &&
            (needFBAll || (needFastBreak && r.isFB === 1) || (needSetPlay && r.isFB === 0))) {
          if (r.teamId == teamId0) cnt7mShoot0++;
          else if (r.teamId == teamId1) cnt7mShoot1++;
        }
      }
      // cntMiss: result === 'm' のレコードをチーム・半期条件でカウント
      if (r.result === 'm') {
        if ((needTotal || (needFirst && r.half === labelOptions0[1]) || (needSecond && r.half === labelOptions0[2])) &&
            (needFBAll || (needFastBreak && r.isFB === 1) || (needSetPlay && r.isFB === 0))) {
          if (r.teamId == teamId0) cntMiss0++;
          else if (r.teamId == teamId1) cntMiss1++;
        }
      }
    });

    // 表示モードが％の場合は各値を割合に変換して表示用変数に格納
    let atk0Display = cntAtk0;
    let atk1Display = cntAtk1;
    let goal0Display = cntGoal0;
    let goal1Display = cntGoal1;
    let shoot0Display = cntShoot0;
    let shoot1Display = cntShoot1;
    let foul0Display = cntFoul0;
    let foul1Display = cntFoul1;
    let miss0Display = cntMiss0;
    let miss1Display = cntMiss1;
    let cnt7mShoot0Display = cnt7mShoot0;
    let cnt7mShoot1Display = cnt7mShoot1;
    let goalPerShoot0Display;
    let goalPerShoot1Display;

    if (toggles[2] === labelOptions2[1]) {
      const fmtPct = (num, denom) => {
        if (!denom || denom === 0) return "0.0%";
        return `${((num / denom) * 100).toFixed(1)}%`;
      };

      goal0Display = fmtPct(cntGoal0, cntAtk0);
      goal1Display = fmtPct(cntGoal1, cntAtk1);
      shoot0Display = fmtPct(cntShoot0, cntAtk0);
      shoot1Display = fmtPct(cntShoot1, cntAtk1);
      foul0Display = fmtPct(cntFoul0, cntAtk0);
      foul1Display = fmtPct(cntFoul1, cntAtk1);
      miss0Display = fmtPct(cntMiss0, cntAtk0);
      miss1Display = fmtPct(cntMiss1, cntAtk1);
      cnt7mShoot0Display = fmtPct(cnt7mShoot0, cntAtk0);
      cnt7mShoot1Display = fmtPct(cnt7mShoot1, cntAtk1);
      goalPerShoot0Display = fmtPct(cntGoal0, cntShoot0);
      goalPerShoot1Display = fmtPct(cntGoal1, cntShoot1);

      atk0Display = "";
      atk1Display = "";
    }
    return (
      <table>
        <thead>
          <tr>
            <th></th>
            <th>{team0Short}</th>
            <th>{team1Short}</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>攻撃数</td><td>{atk0Display}</td><td>{atk1Display}</td></tr>
          {toggles[2] === labelOptions2[0] ? 
            <>
              <tr>
                <td>ゴール数</td>
                <td>{goal0Display}</td>
                <td>{goal1Display}</td>
              </tr>
              <tr></tr>
            </> :
            <>
              <tr><td>ゴール%/攻撃</td><td>{goal0Display}</td><td>{goal1Display}</td></tr>
              <tr><td>ゴール%/シュート</td><td>{goalPerShoot0Display}</td><td>{goalPerShoot1Display}</td></tr>
            </> }
          <tr><td>シュート</td><td>{shoot0Display}</td><td>{shoot1Display}</td></tr>
          <tr><td>ﾌｧｳﾙ取られた</td><td>{foul0Display}</td><td>{foul1Display}</td></tr>
          <tr><td>7mｼｭｰﾄ取った</td><td>{cnt7mShoot0Display}</td><td>{cnt7mShoot1Display}</td></tr>
          <tr><td>ミス数</td><td>{miss0Display}</td><td>{miss1Display}</td></tr>
        </tbody>
      </table>
    );
  };

  // matchId が変わったら records を取得
  useEffect(() => {
    const load = async () => {
      if (!matchId) {
        setRecords([]);
        return;
      }
      const recs = await getRecordsByMatchId(matchId);
      setRecords(recs || []);
    };
    load();
  }, [matchId]);

  const renderOutputBtns = () => (
    <OutputBtns
      setView={setView}
      selectedBtn={typeof appSelectedOutputTab !== 'undefined' && appSelectedOutputTab !== null ? appSelectedOutputTab : selectedOutputBtn}
      onSelect={(idx) => {
        setSelectedOutputBtn(idx);
        if (typeof setAppSelectedOutputTab === 'function') setAppSelectedOutputTab(idx);
      }}
    />
  );

  const renderOutputTeamBtns = () => (
    <OutputTeamBtns
      team0Short={team0Short}
      team1Short={team1Short}
      teamId0={teamId0}
      teamId1={teamId1}
      selectedTeam={selectedTeam}
      onClickTeam={(teamIdx, teamId) => {
        if (selectedTeam !== teamIdx) {
          setSelectedTeam(teamIdx);
          setOppoTeam(teamIdx === 0 ? 1 : 0);
          clearValues();
        }
      }}
    />
  );

  const renderToggles = () => {
    const optionArrays = [labelOptions0, labelOptions1, labelOptions2];

    const handleToggle = (idx) => {
      const next = [...toggles];
      const opts = optionArrays[idx];
      const cur = opts.indexOf(next[idx]);
      const nextIdx = (cur + 1) % opts.length;
      next[idx] = opts[nextIdx];
      setToggles(next);
    };

    const labels = [toggles[0], toggles[1], toggles[2]];

    return (
      <div className="outputToggleArea" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", margin: "8px 0" }}>
        {labels.map((lab, idx) => (
          <button
            key={idx}
            className={"outputBtn"}
            onClick={() => handleToggle(idx)}
          >
            {lab}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="base">
      <div className="header row">
        <div className="header-title left">
          <div>{matchDate ? matchDate : ""}</div>
          <div>{team0Short} vs {team1Short}</div>
          <div id="matchId">{matchId ? `ID: ${matchId}` : ""}</div>
        </div>
        <div className="header-title right" style={{display: "flex"}}>
          {isEditor && <div onClick={() => setView("inputSheet")} className="header-icon header-btn">📋</div>}
          <div onClick={() => setView("title")} className="header-icon header-btn">🔙</div>
        </div>
      </div>
      {renderOutputBtns()}
      {renderOutputTeamBtns()}
      {renderToggles()}
      <div className="main">
        {renderPlayersTable()}
      </div>
      <div className="footer">
      </div>
    </div>
  );
}
