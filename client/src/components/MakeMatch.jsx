import React, { useState, useEffect } from "react";

const DEV_MODE = true; // 開発時のみtrueに
import { Player } from "../models/Player";
import TeamSelection from "./TeamSelection";
import "./MakeMatch.css";

export default function MakeMatch(
        { teams, teamplayers, allTeams, allPlayers, onShowInput, onBackToTitle}) {
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    const [teamName0, setTeamName0] = useState(teams[0].teamname);
    const [teamName1, setTeamName1] = useState(teams[1].teamname);
    const [date, setDate] = useState(today);
    const [selecterPlayers0, setSelecterPlayers0] = useState(new Set());
    const [selecterPlayers1, setSelecterPlayers1] = useState(new Set());
    const [selectedTeam, setSelectedTeam] = useState(0);
    const [locked0, setLocked0] = useState(true);
    const [locked1, setLocked1] = useState(false);

    // チームオブジェクトからチーム名を取得（文字列のアレイ）
    const AllTeamNames = allTeams.map(t => t.teamname);

    // 選択されたチームの選手を取得（オブジェクトのアレイ）
    const getTeamMembers = (teamName) => {
        return allPlayers.filter(member => member.teamname === teamName);
    };

    // チームが変更されたら全メンバーを選択状態にする
    useEffect(() => {
        if (allPlayers && teamName0) {
            const members0 = allPlayers.filter(member => member.teamname === teamName0);
            setSelecterPlayers0(new Set(members0.map((_, index) => index)));
        }
    }, [teamName0]);

    useEffect(() => {
        if (allPlayers && teamName1) {
            const members1 = allPlayers.filter(member => member.teamname === teamName1);
            setSelecterPlayers1(new Set(members1.map((_, index) => index)));
        }
    }, [teamName1]);

    // メンバーの選択をトグル
    const toggleMemberSelection = (teamSide, index) => {
        if (teamSide === 1) {
            setSelecterPlayers1(prev => {
                const newSet = new Set(prev);
                if (newSet.has(index)) {
                    newSet.delete(index);
                } else {
                    newSet.add(index);
                }
                return newSet;
            });
        } else {
            setSelecterPlayers0(prev => {
                const newSet = new Set(prev);
                if (newSet.has(index)) {
                    newSet.delete(index);
                } else {
                    newSet.add(index);
                }
                return newSet;
            });
        }
    };

    // STARTボタンのクリックハンドラー
    const handleStartClick = () => {
        const members0 = getTeamMembers(teamName0);
        const members1 = getTeamMembers(teamName1);
        
        // ベンチ入りメンバーを抽出し、16人分のデータを作成
        const selectedPlayers0 = members0
            .filter((_, index) => selecterPlayers0.has(index))
            .slice(0, 16);
        const selectedPlayers1 = members1
            .filter((_, index) => selecterPlayers1.has(index))
            .slice(0, 16);
        
        // 16人に満たない場合は空のプレイヤーで埋める
        const team1Players = Array.from({ length: 16 }, (_, i) => 
            selectedPlayers0[i] 
                ? Player.fromDatabase(selectedPlayers0[i], true)
                : new Player({ number: "", name: "", position: "", isOnBench: true })
        );
        const team2Players = Array.from({ length: 16 }, (_, i) => 
            selectedPlayers1[i] 
                ? Player.fromDatabase(selectedPlayers1[i], true)
                : new Player({ number: "", name: "", position: "", isOnBench: true })
        );
        
        // match変数に関する部分は削除
        onShowInput({ 
            team1: team1Players, 
            team2: team2Players, 
            teamName0, 
            teamName1, 
            date
        });
    };

    return (
        <div className="teams-container">
            <div className="header">試合設定</div>
            <div className="teams-main">
                <button onClick={onBackToTitle} className="top-right">戻る</button>
                <b>試合設定</b>
                <div><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
                <div className="teams-info">
                    <div id="btnTeam0" className={selectedTeam === 0 ? 'team selected' : 'team notSelected'} onClick={() => setSelectedTeam(0)}>{teamName0}</div>
                    <div id="btnTeam1" className={selectedTeam === 1 ? 'team selected' : 'team notSelected'} onClick={() => setSelectedTeam(1)}>{teamName1}</div>
                </div>
                <div className="team-column">
                    {selectedTeam === 0 && (
                        <TeamSelection 
                            teamSide={0}
                            teamName={teamName0}
                            setTeamName={setTeamName0}
                            // selecterPlayers={selecterPlayers0}
                            locked={locked0}
                            setLocked={setLocked0}
                            teamNames={AllTeamNames}
                            getTeamMembers={getTeamMembers}
                            toggleMemberSelection={toggleMemberSelection}
                        />
                    )}
                    {selectedTeam === 1 && (
                        <TeamSelection 
                            teamSide={1}
                            teamName={teamName1}
                            setTeamName={setTeamName1}
                            // selecterPlayers={selecterPlayers1}
                            locked={locked1}
                            setLocked={setLocked1}
                            teamNames={AllTeamNames}
                            getTeamMembers={getTeamMembers}
                            toggleMemberSelection={toggleMemberSelection}
                        />
                    )}
                </div>
            </div>
            <div className="footer">
                <div className="btnStart" onClick={handleStartClick}>START</div>
            </div>
        </div>
    );
}
