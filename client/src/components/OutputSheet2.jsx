import React, { useState, useEffect, useRef } from "react";
import DrawShootArea from "./DrawShootArea";
import DrawGoal from "./DrawGoal";
import "./style_output.css";
import "./style_input.css";
import OutputBtns from "./OutputBtns";
import OutputTeamBtns from "./OutputTeamBtns";
import { useSocket } from "../hooks/useSocket";
import { getRecordsByMatchId } from "../api";

export default function OutputSheet2({ teams, players, setView, matchId, matchDate, isEditor }) {
  const [selectedOppoGK, setSelectedOppoGK] = useState(["", ""]);
  const [selectedTeam, setSelectedTeam] = useState(0);
  const [oppoTeam, setOppoTeam] = useState(1);
  const [selectedOutputBtn, setSelectedOutputBtn] = useState(0);
  const [records, setRecords] = useState([]);
  const labelOptions0 = ["全体", "前半", "後半"];
  const labelOptions1 = ["全体", "セットプレイ", "速攻"];
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
    const needFirst = toggles[0] === "前半";
    const needSecond = toggles[0] === "後半";
    const needTotal = toggles[0] === "全体";
    records.forEach(r => {
      // isGS が 1 のレコードのみカウント
      if (r.isGS != 1) return;
      if (r.playerId == null) return;
      const pid = String(r.playerId);
      if (!countsByPlayer[pid]) countsByPlayer[pid] = { first: 0, second: 0, total: 0 };
      if (needTotal) {
        // 全体を表示する場合は単純に合計を増やす
        countsByPlayer[pid].total++;
      } else if (needFirst) {
        if (r.half === '前半') countsByPlayer[pid].first++;
      } else if (needSecond) {
        if (r.half === '後半') countsByPlayer[pid].second++;
      }
    });
    return (
      <div className="players-table-container">
        <table className="playersTable">
          <thead>
            <tr>
              <th>背番号</th>
              <th>ポジション</th>
              <th>氏名</th>
              <th>シュート数（{toggles[0]}）</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => {
              const pid = p.id;
              const c = countsByPlayer[pid] || { first: 0, second: 0, total: 0 };
              let showCount = c.total;
              if (toggles[0] === "前半") showCount = c.first;
              else if (toggles[0] === "後半") showCount = c.second;
              return (
                <tr key={p.id}>
                  <td>{p.number}</td>
                  <td>{p.position}</td>
                  <td>{p.shortname}</td>
                  <td>{showCount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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
      selectedBtn={selectedOutputBtn}
      onSelect={(idx) => setSelectedOutputBtn(idx)}
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
        <div className="header-title left">{matchDate ? matchDate : ""}&nbsp;&nbsp;&nbsp;{team0Short} vs {team1Short}</div>
        {isEditor && <div className="header-title right" onClick={() => setView("inputSheet")}>●</div>}
        <div className="header-title right" onClick={() => setView("title")}>🔙</div>
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
