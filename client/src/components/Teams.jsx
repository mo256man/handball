import React, { useState, useEffect } from "react";
import { Player } from "../models/Player";
import TeamSelection from "./TeamSelection";
import "./Teams.css";

export default function Teams({ onShowInput, onShowInput2, onBackToTitle, initialData, teams: teamsData, players: allPlayers, team1 }) {
    // 今日の日付（JST）
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    const [teamName1, setTeamName1] = useState(initialData?.teamName1 || "");
    const [teamName2, setTeamName2] = useState(initialData?.teamName2 || "");
    const [date, setDate] = useState(initialData?.date || today);
    const [selectedMembers1, setSelectedMembers1] = useState(new Set());
    const [selectedMembers2, setSelectedMembers2] = useState(new Set());
    const [selectedTeam, setSelectedTeam] = useState(1);
    const [isOvertime, setIsOvertime] = useState(false);

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
        if (teamName2 === "") return; // team2が空白なら何もしない

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
            team2info,
            isOvertime
        });
    };

    // START2ボタンのクリックハンドラー
    const handleStartClick2 = () => {
        if (teamName2 === "") return; // team2が空白なら何もしない

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
        
        onShowInput2({ 
            team1: team1Players, 
            team2: team2Players, 
            teamName1, 
            teamName2, 
            date,
            team1info,
            team2info,
            isOvertime
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width:'auto' ,maxWidth:'600px', margin: '0 auto' }}>
            <div className="header">
                <div className="title">出場選手 選択</div>
            </div>
            <div className="teams-main">
                <button onClick={onBackToTitle} className="top-right">戻る</button>
                <div className="row center">
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    <div className="extension-buttons">
                        <button className={`extension-btn ${!isOvertime ? 'selected' : ''}`} onClick={() => setIsOvertime(false)}>延長なし</button>
                        <button className={`extension-btn ${isOvertime ? 'selected' : ''}`} onClick={() => setIsOvertime(true)}>延長あり</button>
                    </div>
                </div>
                <div className="teams-info">
                    <div id="btnTeam1" className={selectedTeam === 1 ? 'teamname teamnameSelected' : 'teamname teamnameNotSelected'} onClick={() => setSelectedTeam(1)}>{teamName1}</div>
                    <div id="btnTeam2" className={selectedTeam === 2 ? 'teamname teamnameSelected' : 'teamname teamnameNotSelected'} onClick={() => setSelectedTeam(2)}>相手チーム 選択　▼</div>
                </div>
                <div className="team-column">
                    {selectedTeam === 1 && (
                        <TeamSelection 
                            teamNumber={1}
                            teamName={teamName1}
                            setTeamName={setTeamName1}
                            selectedMembers={selectedMembers1}
                            teamNames={teamNames}
                            getTeamMembers={getTeamMembers}
                            toggleMemberSelection={toggleMemberSelection}
                            disabled={true}
                        />
                    )}
                    {selectedTeam === 2 && (
                        <TeamSelection 
                            teamNumber={2}
                            teamName={teamName2}
                            setTeamName={setTeamName2}
                            selectedMembers={selectedMembers2}
                            teamNames={teamNames}
                            getTeamMembers={getTeamMembers}
                            toggleMemberSelection={toggleMemberSelection}
                            disabled={false}
                        />
                    )}
                </div>
            </div>
            <div className="footer">
                <div className={`btnConfirm ${teamName2 === "" ? "teamnameNotSelected" : ""}`} id="btnStart" onClick={handleStartClick}>試合開始</div>
                <div className={`btnConfirm ${teamName2 === "" ? "teamnameNotSelected" : ""}`} id="btnStart2" onClick={handleStartClick2}>試合開始2</div>
            </div>
        </div>
    );
}
