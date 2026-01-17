import React, { useState, useEffect } from "react";
import { Player } from "../models/Player";
import TeamSelection from "./TeamSelection";
import "./Teams.css";

export default function Teams({ onShowInput, onBackToTitle, initialData, teams: teamsData, players: allPlayers }) {
    // 今日の日付（JST）
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    
    const [teamName1, setTeamName1] = useState(initialData?.teamName1 || "");
    const [teamName2, setTeamName2] = useState(initialData?.teamName2 || "");
    const [date, setDate] = useState(initialData?.date || today);
    const [selectedMembers1, setSelectedMembers1] = useState(new Set());
    const [selectedMembers2, setSelectedMembers2] = useState(new Set());
    const [locked1, setLocked1] = useState(true);
    const [locked2, setLocked2] = useState(false);

    // 重複排除したチーム名の配列を取得（teamsテーブルから）
    const uniqueTeamNames = teamsData ? teamsData.map(t => t.team) : [];

    // 選択されたチームのメンバーを取得（playersテーブルから）
    const getTeamMembers = (teamName) => {
        return allPlayers ? allPlayers.filter(member => member.team === teamName) : [];
    };

    // teamsDataが読み込まれたら初期チーム名を設定
    useEffect(() => {
        console.log('uniqueTeamNames:', uniqueTeamNames);
        console.log('teamName1:', teamName1, 'teamName2:', teamName2);
        console.log('initialData:', initialData);
        
        if (uniqueTeamNames.length > 0) {
            if (!teamName1 && !initialData?.teamName1) {
                console.log('Setting teamName1 to:', uniqueTeamNames[0]);
                setTeamName1(uniqueTeamNames[0]);
            }
            if (!teamName2 && !initialData?.teamName2) {
                const team2 = uniqueTeamNames.length > 1 ? uniqueTeamNames[1] : uniqueTeamNames[0];
                console.log('Setting teamName2 to:', team2);
                setTeamName2(team2);
            }
        }
    }, [uniqueTeamNames.length, teamsData, allPlayers]);

    // チームが変更されたら全メンバーを選択状態にする
    useEffect(() => {
        if (allPlayers && teamName1) {
            const members1 = allPlayers.filter(member => member.team === teamName1);
            setSelectedMembers1(new Set(members1.map((_, index) => index)));
        }
    }, [teamName1, allPlayers]);

    useEffect(() => {
        if (allPlayers && teamName2) {
            const members2 = allPlayers.filter(member => member.team === teamName2);
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
        const team1info = teamsData.find(t => t.team === teamName1);
        const team2info = teamsData.find(t => t.team === teamName2);
        
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
                <div className="title">ベンチ入りメンバー 選択</div>
                <div><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
                <div className="team-column">
                    <TeamSelection 
                        teamNumber={1}
                        teamName={teamName1}
                        setTeamName={setTeamName1}
                        selectedMembers={selectedMembers1}
                        locked={locked1}
                        setLocked={setLocked1}
                        uniqueTeamNames={uniqueTeamNames}
                        getTeamMembers={getTeamMembers}
                        toggleMemberSelection={toggleMemberSelection}
                    />
                    <TeamSelection 
                        teamNumber={2}
                        teamName={teamName2}
                        setTeamName={setTeamName2}
                        selectedMembers={selectedMembers2}
                        locked={locked2}
                        setLocked={setLocked2}
                        uniqueTeamNames={uniqueTeamNames}
                        getTeamMembers={getTeamMembers}
                        toggleMemberSelection={toggleMemberSelection}
                    />
                </div>
            </div>
            <div className="teams-btnArea">
                <div className="btnStart" onClick={handleStartClick}>START</div>
            </div>
        </div>
    );
}