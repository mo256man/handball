import React, { useState, useEffect, createContext } from 'react';
export const setCurrentViewContext = createContext(undefined);
import './App.css'
import Title from "./components/Title"
import InputMenu from './components/InputMenu';
import InputSheet from './components/InputSheet';
import OutputFlow from './components/OutputFlow';


// import MakeMatch from "./components/MakeMatch"
// import Input from "./components/Input"
// import Input2 from "./components/Input2"
// import AnalysisMenu from "./components/AnalysisMenu";
// import Analysis from "./components/Analysis";
import { getTeams, getPlayers } from "./api";
import { insertMatch } from "./api";
import { TeamData } from "./models/TeamData";
import { Player } from "./models/Player";

function App() {
  // 攻撃サイド（1 or 2）
  const [attackSide, setAttackSide] = useState(1);
  const [currentView, setCurrentView] = useState('title');
  const [teams, setTeams] = useState([null, null]);
  const [page, setPage] = useState('menu');
  const [currentSide, setCurrentSide] = useState(0);
  const [players, setPlayers] = useState([[], []]);
  const [allTeams, setAllTeams] = useState([]);
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
        attackSide: attackSide
      });
        }
    }, [allTeams, allPlayers, attackSide]);

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
    />;
  } else if (currentView === "inputMenu") {
    if (page === "menu") {
      content = <InputMenu
        allTeams={allTeams}
        allPlayers={allPlayers}
        teams={teams}
        setTeams={setTeams}
        players={players}
        setPlayers={setPlayers}
        setView={setCurrentView}
        setPage={setPage}
      />;
    } else {
      content = <InputSheet
        teams={teams}
        players={players}
        setPage={setPage}
      />;
    }
  } else if (currentView === "outputFlow") {
    content = <OutputFlow 
      allTeams={allTeams}
      allPlayers={allPlayers}
      setView={(page) => setCurrentView(page)}
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
