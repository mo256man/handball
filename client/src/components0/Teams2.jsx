import React, { useState, useEffect } from "react";

const DEV_MODE = true; // 開発時のみtrueに
import { Player } from "../models/Player";
import TeamSelection from "./TeamSelection";
import "./Teams.css";

export default function Teams2({ onShowInput, onBackToTitle, initialData, teams: teamsData, players: allPlayers, team1 }) {
    // 今日の日付（JST）
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    
    const [teamName1, setTeamName1] = useState(initialData?.teamName1 || "");
    const [teamName2, setTeamName2] = useState(initialData?.teamName2 || "");
    const [date, setDate] = useState(initialData?.date || today);
    const [selectedMembers1, setSelectedMembers1] = useState(new Set());
    const [selectedMembers2, setSelectedMembers2] = useState(new Set());
    const [selectedTeam, setSelectedTeam] = useState(1);
    const [locked1, setLocked1] = useState(true);
    const [locked2, setLocked2] = useState(false);

    // 重複排除したチーム名の配列を取得（teamsテーブルから）
    const teamNames = teamsData ? teamsData.map(t => t.teamname) : [];

    // 選択されたチームのメンバーを取得（playersテーブルから）
    const getTeamMembers = (teamName) => {
        return allPlayers ? allPlayers.filter(member => member.teamname === teamName) : [];
    };

    // teamsDataが読み込まれたら初期チーム名を設定
    useEffect(() => {
        if (team1) {
            setTeamName1(team1.teamname);
        } else if (teamNames.length > 0) {
            if (!teamName1 && !initialData?.teamName1) {
                setTeamName1(teamNames[0]);
            }
        }
        if (!teamName2 && !initialData?.teamName2) {
            if (DEV_MODE && teamNames.length > 2) {
                setTeamName2(teamNames[2]);
            } else {
                setTeamName2("");
            }
        }
    }, [teamNames.length, teamsData, allPlayers, team1]);

    // チームが変更されたら全メンバーを選択状態にする
    useEffect(() => {
        if (allPlayers && teamName1) {
            const members1 = allPlayers.filter(member => member.teamname === teamName1);
            setSelectedMembers1(new Set(members1.map((_, index) => index)));
        }
    }, [teamName1, allPlayers]);

    useEffect(() => {
        if (allPlayers && teamName2) {
            const members2 = allPlayers.filter(member => member.teamname === teamName2);
            setSelectedMembers2(new Set(members2.map((_, index) => index)));
        }
    }, [teamName2, allPlayers]);

    // メンバーの選択をトグル
    const toggleMemberSelection = (teamNumber, index) => {
        if (teamNumber === 1) {
            setSelectedMembers1(prev => {
                const newSet = new Set(prev);
                if (newSet.has(index)) {
                    newSet.delete(index);
                } else {
                    newSet.add(index);
                }
                return newSet;
            });
        } else {
            setSelectedMembers2(prev => {
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
        const members1 = getTeamMembers(teamName1);
        const members2 = getTeamMembers(teamName2);
        
        // ベンチ入りメンバーを抽出し、16人分のデータを作成
        const selectedPlayers1 = members1
            .filter((_, index) => selectedMembers1.has(index))
            .slice(0, 16);
        const selectedPlayers2 = members2
            .filter((_, index) => selectedMembers2.has(index))
            .slice(0, 16);
        
        // 16人に満たない場合は空のプレイヤーで埋める
        const team1Players = Array.from({ length: 16 }, (_, i) => 
            selectedPlayers1[i] 
                ? Player.fromDatabase(selectedPlayers1[i], true)
                : new Player({ number: "", name: "", position: "", isOnBench: true })
        );
        const team2Players = Array.from({ length: 16 }, (_, i) => 
            selectedPlayers2[i] 
                ? Player.fromDatabase(selectedPlayers2[i], true)
                : new Player({ number: "", name: "", position: "", isOnBench: true })
        );
        
        // チーム情報を取得
        const team1info = teamsData.find(t => t.teamname === teamName1);
        const team2info = teamsData.find(t => t.teamname === teamName2);
        
        onShowInput({ 
            team1: team1Players, 
            team2: team2Players, 
            teamName1, 
            teamName2, 
            date,
            team1info,
            team2info
        });
    };

    return (
        <div className="teams-container">
            <div className="teams-main">
                <button onClick={onBackToTitle} className="top-right">戻る</button>
                <b>試合設定（縦長スマホ用）</b>
                <div><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
                <div className="teams-info">
                    <div id="btnTeam1" className={selectedTeam === 1 ? 'team selected' : 'team notSelected'} onClick={() => setSelectedTeam(1)}>{teamName1}</div>
                    <div id="btnTeam2" className={selectedTeam === 2 ? 'team selected' : 'team notSelected'} onClick={() => setSelectedTeam(2)}>{teamName2}</div>
                </div>
                <div className="team-column">
                    {selectedTeam === 1 && (
                        <TeamSelection 
                            teamNumber={1}
                            teamName={teamName1}
                            setTeamName={setTeamName1}
                            selectedMembers={selectedMembers1}
                            locked={locked1}
                            setLocked={setLocked1}
                            teamNames={teamNames}
                            getTeamMembers={getTeamMembers}
                            toggleMemberSelection={toggleMemberSelection}
                        />
                    )}
                    {selectedTeam === 2 && (
                        <TeamSelection 
                            teamNumber={2}
                            teamName={teamName2}
                            setTeamName={setTeamName2}
                            selectedMembers={selectedMembers2}
                            locked={locked2}
                            setLocked={setLocked2}
                            teamNames={teamNames}
                            getTeamMembers={getTeamMembers}
                            toggleMemberSelection={toggleMemberSelection}
                        />
                    )}
                </div>
            </div>
            <div className="teams-btnArea">
                <div className="btnStart" onClick={handleStartClick}>START</div>
            </div>
        </div>
    );
}
