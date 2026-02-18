import React, { useState, useEffect, createContext } from 'react';
export const setCurrentViewContext = createContext(undefined);
import "./components/style_common.css"
import Title from "./components/Title"
import InputMenu from './components/InputMenu';
import InputSheet from './components/InputSheet';
import OutputMenu from './components/OutputMenu';
import OutputSheet1 from './components/OutputSheet1';
import OutputSheet2 from './components/OutputSheet2';
import OutputSheet3 from './components/OutputSheet3';

import { getTeams, getPlayers } from "./api";
import { insertMatch } from "./api";
import { TeamData } from "./models/TeamData";
import { Player } from "./models/Player";
import InputMatch from './components/InputMatch';

function App() {
  // 攻撃サイド（1 or 2）
  const [currentView, setCurrentView] = useState('title');
  const [titleMode, setTitleMode] = useState('pass');
  const [isEditor, setIsEditor] = useState(null);
  const [teams, setTeams] = useState([null, null]);
  const [currentSide, setCurrentSide] = useState(0);
  const [players, setPlayers] = useState([[], []]);
  const [allTeams, setAllTeams] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recordDate, setRecordDate] = useState(null);
  const [recordTeam1, setRecordTeam1] = useState(null);
  const [recordTeam2, setRecordTeam2] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(0);
  const [appOutputSheet, setAppOutputSheet] = useState('outputSheet1');
  const [offenseTeam, setOffenseTeam] = useState(0);
  const [matchId, setMatchId] = useState(null);
  const [matchDate, setMatchDate] = useState(null);
  const [outputSelectedTab, setOutputSelectedTab] = useState(0);
  const [selectedMatch, setSelectedMatch] = useState(null);

  // データベースからteamsとplayersを取得
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [teamsData, playersData] = await Promise.all([
          getTeams(),
          getPlayers()
        ]);
        setAllTeams(teamsData);
        // Playerクラスのインスタンス配列に変換
        const playerInstances = playersData.map(p => new Player(p));
        setAllPlayers(playerInstances);
      } catch (error) {
        console.error('データ読み込みエラー:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // currentView が outputSheetX に移動したら appOutputSheet を同期する
  useEffect(() => {
    if (currentView && currentView.startsWith && currentView.startsWith('outputSheet')) {
      setAppOutputSheet(currentView);
    }
  }, [currentView]);


    const [match, setMatch] = useState({
      team1: null,
      team2: null,
      players1: [],
      players2: [],
      date: undefined,
    });


    // allTeams/allPlayersが更新されたらmatchの初期値をセット
    useEffect(() => {
        if (allTeams.length >= 2 && allPlayers.length > 0) {
          const team1 = allTeams[0];
          const team2 = allTeams[1];
          const players1 = allPlayers.filter(p => p.teamId === team1.id);
          const players2 = allPlayers.filter(p => p.teamId === team2.id);
          const teamData1 = new TeamData(team1, players1);
          const teamData2 = new TeamData(team2, players2);
      setMatch({
        teamData1,
        teamData2,
        date: new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' }),
      });
        }
    }, [allTeams, allPlayers]);

  // const handleShowMakeMatch = () => setCurrentView('makeMatch');
  // const onShowInputFlow = () => setCurrentView('inputFlow');
  // const onShowOutputFlow = () => setCurrentView('outputFlow');
  const handleBackToTitle = () => setCurrentView('title');

  const handleShowInput = async (data) => {
    // 同じ試合が既に登録されていないかチェック
    if (data.date !== recordDate || data.teamName1 !== recordTeam1 || data.teamName2 !== recordTeam2) {
      try {
        await insertMatch(data.date, data.teamName1, data.teamName2);
        setRecordDate(data.date);
        setRecordTeam1(data.teamName1);
        setRecordTeam2(data.teamName2);
      } catch (error) {
        console.error('試合データ挿入エラー:', error);
      }
    }
  };

  let content;
  if (currentView === "title") {
    content = <Title
      allTeams={allTeams}
      setView={(page) => setCurrentView(page)}
      teams={teams}
      setTeams={setTeams}
      titleMode={titleMode}
      setTitleMode={setTitleMode}
      setIsEditor={setIsEditor}
      setMatchId={setMatchId}
    />;
  } else if (currentView === "inputMenu") {
    content = <InputMenu
      allTeams={allTeams}
      allPlayers={allPlayers}
      teams={teams}
      setTeams={setTeams}
      players={players}
      setPlayers={setPlayers}
      setView={setCurrentView}
      setMatchId={setMatchId}
      setMatchDate={setMatchDate}
      isEditor={isEditor}
      matchId={matchId}
      setSelectedMatch={setSelectedMatch}
    />;
  } else if (currentView === "inputMatch") {
    content = <InputMatch
      allTeams={allTeams}
      allPlayers={allPlayers}
      teams={teams}
      setTeams={setTeams}
      players={players}
      setPlayers={setPlayers}
      setView={setCurrentView}
      setMatchId={setMatchId}
      setMatchDate={setMatchDate}
      offenseTeam={offenseTeam}
      setOffenseTeam={setOffenseTeam}
      isEditor={isEditor}
      matchId={selectedMatch?.matchId ?? matchId}
      matchDate={selectedMatch?.matchDate}
    />;
  } else if (currentView === "inputSheet") {
    content = <InputSheet
      teams={teams}
      players={players}
      matchId={matchId}
      matchDate={matchDate}
      setView={setCurrentView}
      offenseTeam={offenseTeam}
      setOffenseTeam={setOffenseTeam}
      appOutputSheet={appOutputSheet}
      setAppOutputSheet={setAppOutputSheet}
      isEditor={isEditor}
    />;
  } else if (currentView === "outputMenu") {
    content = <OutputMenu 
      allTeams={allTeams}
      allPlayers={allPlayers}
      setView={setCurrentView}
      setSelectedMatch={setSelectedMatch}
      isEditor={isEditor}
     />;
  }
  else if (currentView === "outputSheet1") {
    // players for OutputSheet1 are derived from selectedMatch.match.players0/players1
    let playersForOutput = players;
    let matchIdForOutput = matchId;
    if (selectedMatch && selectedMatch.match) {
      matchIdForOutput = selectedMatch.match.id;
      const parsePlayersField = (str) => {
        if (!str) return [];
        return String(str).split(',').map(s => Number(s)).filter(n => !isNaN(n)).map(id => allPlayers.find(p => Number(p.id) === id)).filter(Boolean);
      };
      playersForOutput = [
        parsePlayersField(selectedMatch.match.players0),
        parsePlayersField(selectedMatch.match.players1),
      ];
    }

    content = <OutputSheet1
      teams={teams}
      players={playersForOutput}
      setView={setCurrentView}
      matchId={matchIdForOutput}
      matchDate={selectedMatch && selectedMatch.match ? selectedMatch.match.date : undefined}
      appSelectedOutputTab={outputSelectedTab}
      setAppSelectedOutputTab={setOutputSelectedTab}
      isEditor={isEditor}
      appOffenseTeam={offenseTeam}
      appOutputSheet={appOutputSheet}
      setAppOutputSheet={setAppOutputSheet}
    />;
  }
  else if (currentView === "outputSheet2") {
    // players for OutputSheet2 are derived from selectedMatch.match.players0/players1 similar to OutputSheet1
    let playersForOutput2 = players;
    let matchIdForOutput2 = matchId;
    if (selectedMatch && selectedMatch.match) {
      matchIdForOutput2 = selectedMatch.match.id;
      const parsePlayersField = (str) => {
        if (!str) return [];
        return String(str).split(',').map(s => Number(s)).filter(n => !isNaN(n)).map(id => allPlayers.find(p => Number(p.id) === id)).filter(Boolean);
      };
      playersForOutput2 = [
        parsePlayersField(selectedMatch.match.players0),
        parsePlayersField(selectedMatch.match.players1),
      ];
    }

    content = <OutputSheet2
      teams={teams}
      players={playersForOutput2}
      setView={setCurrentView}
      matchId={matchIdForOutput2}
      matchDate={selectedMatch && selectedMatch.match ? selectedMatch.match.date : undefined}
      appSelectedOutputTab={outputSelectedTab}
      setAppSelectedOutputTab={setOutputSelectedTab}
      isEditor={isEditor}
      appOffenseTeam={offenseTeam}
      appOutputSheet={appOutputSheet}
      setAppOutputSheet={setAppOutputSheet}
    />;
  }
  else if (currentView === "outputSheet3") {
    // prepare players and matchId similar to OutputSheet2
    let playersForOutput3 = players;
    let matchIdForOutput3 = matchId;
    if (selectedMatch && selectedMatch.match) {
      matchIdForOutput3 = selectedMatch.match.id;
      const parsePlayersField = (str) => {
        if (!str) return [];
        return String(str).split(',').map(s => Number(s)).filter(n => !isNaN(n)).map(id => allPlayers.find(p => Number(p.id) === id)).filter(Boolean);
      };
      playersForOutput3 = [
        parsePlayersField(selectedMatch.match.players0),
        parsePlayersField(selectedMatch.match.players1),
      ];
    }

    content = <OutputSheet3
      teams={teams}
      players={playersForOutput3}
      setView={setCurrentView}
      matchId={matchIdForOutput3}
      matchDate={selectedMatch && selectedMatch.match ? selectedMatch.match.date : undefined}
      appSelectedOutputTab={outputSelectedTab}
      setAppSelectedOutputTab={setOutputSelectedTab}
      isEditor={isEditor}
      appOffenseTeam={offenseTeam}
      appOutputSheet={appOutputSheet}
      setAppOutputSheet={setAppOutputSheet}
    />;
  }
  // } else if (currentView === "input") {
  //   content = <Input
  //     onBackToTitle={handleBackToTeams}
  //     players={players} />;
  // } else if (currentView === "input2") {
  //   content = <Input2
  //     onBackToTitle={handleBackToTeams2}
  //     players={players} />;
  // } else if (currentView === "analysisMenu") {
  //   content = <AnalysisMenu onBackToTitle={handleBackToTitle} teams={teams} players={allPlayers} />;
  // } else if (currentView === "analysis") {
  //   content = <Analysis onBackToTitle={handleBackToTitle} />;
  // }

  return (
    <div>{content}</div>
  );
}

export default App
