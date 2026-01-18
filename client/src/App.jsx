import React, { useState, useEffect } from 'react';
import './App.css'
import Input from "./components/Input"
import Input2 from "./components/Input2"
import Title from "./components/Title"
import Teams from "./components/Teams"
import Teams2 from "./components/Teams2"
import AnalysisMenu from "./components/AnalysisMenu";
import Analysis from "./components/Analysis";
import { getTeams, getPlayers } from "./api";
import { insertMatch } from "./api";

function App() {
  const [currentView, setCurrentView] = useState('title'); // 'title', 'teams', 'teams2', 'input', 'input2'
  const [players, setPlayers] = useState({ team1: [], team2: [], teamName1: "", teamName2: "", date: new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' }) });
  const [showMenu, setShowMenu] = useState(false);
  const [teams, setTeams] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recordDate, setRecordDate] = useState(null);
  const [recordTeam1, setRecordTeam1] = useState(null);
  const [recordTeam2, setRecordTeam2] = useState(null);
  const [selectedTeam1, setSelectedTeam1] = useState(null);

  // データベースからteamsとplayersを取得
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [teamsData, playersData] = await Promise.all([
          getTeams(),
          getPlayers()
        ]);
        setTeams(teamsData);
        setAllPlayers(playersData);
        console.log('取得したチーム:', teamsData);
        console.log('取得した選手:', playersData);
      } catch (error) {
        console.error('データ読み込みエラー:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleShowTeams = () => setCurrentView('teams');
  const handleShowTeams2 = () => setCurrentView('teams2');
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
    setPlayers(data);
    setCurrentView('input');
  };
  const handleShowInput2 = async (data) => {
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
    setPlayers(data);
    setCurrentView('input2');
  };
  function handleBackToTitle() {
    return setCurrentView('title');
  }
  const handleBackToTeams = () => setCurrentView('teams');
  const handleBackToTeams2 = () => setCurrentView('teams2');
  const showAnalysisMenu = () => {
    setCurrentView("analysisMenu");
  };
  const showAnalysis = () => {
    setCurrentView("analysis");
  };

  let content;
  if (currentView === "title") {
    content = <Title
      onShowTeams={handleShowTeams}
      onShowTeams2={handleShowTeams2}
      onShowAnalysisMenu={showAnalysisMenu}
      showMenu={showMenu}
      setShowMenu={setShowMenu}
      teams={teams}
      onSelectTeam1={setSelectedTeam1}
      selectedTeam1={selectedTeam1} />;
  } else if (currentView === "teams") {
    content = <Teams
      onShowInput={handleShowInput}
      onBackToTitle={handleBackToTitle}
      initialData={players}
      teams={teams}
      players={allPlayers}
      team1={selectedTeam1} />;
  } else if (currentView === "teams2") {
    content = <Teams2
      onShowInput={handleShowInput2}
      onBackToTitle={handleBackToTitle}
      initialData={players}
      teams={teams}
      players={allPlayers}
      team1={selectedTeam1} />;
  } else if (currentView === "input") {
      content = <Input
        onBackToTitle={handleBackToTeams}
        players={players} />;
  } else if (currentView === "input2") {
      content = <Input2
        onBackToTitle={handleBackToTeams2}
        players={players} />;
  } else if (currentView === "analysisMenu") {
      content = <AnalysisMenu onBackToTitle={handleBackToTitle} teams={teams} players={allPlayers} />;
  } else if (currentView === "analysis") {
      content = <Analysis onBackToTitle={handleBackToTitle} />;
  }

  return (
    <>
      <div>{content}</div>
    </>
  );
}

export default App
