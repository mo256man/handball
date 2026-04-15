import React, { useState, useEffect, createContext } from 'react';
export const setCurrentViewContext = createContext(undefined);
export const SessionContext = createContext(undefined);
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
import InputTable from './components/InputTable';

function App() {
  // ログイン状態・セッション管理
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [session, setSession] = useState(null);
  
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
  const [score1st, setScore1st] = useState([0, 0]);
  const [score2nd, setScore2nd] = useState([0, 0]);
  const [score, setScore] = useState([0, 0]);

  // データベースからteamsとplayersを取得（ログイン後、セッション情報を送信）
  useEffect(() => {
    if (!session) return;
    
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          console.error('Server Error:', response.status, result);
          throw new Error(result.error || 'データ初期化に失敗しました');
        }
        
        if (result.success) {
          setAllTeams(result.teams);
          // Playerクラスのインスタンス配列に変換
          const playerInstances = result.players.map(p => new Player(p));
          setAllPlayers(playerInstances);
        } else {
          throw new Error(result.error || 'データ取得に失敗しました');
        }
      } catch (error) {
        console.error('データ読み込みエラー:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [session]);

  // allTeams が更新されたら teams[0] を設定
  useEffect(() => {
    console.log('useEffect teams update:', { session, allTeams, allTeamsLength: allTeams.length });
    
    if (!session || !session.teamId || allTeams.length === 0) {
      console.log('Conditions not met:', { hasSession: !!session, hasTeamId: !!session?.teamId, allTeamsEmpty: allTeams.length === 0 });
      return;
    }
    
    const selectedTeam = allTeams.find(team => {
      console.log('Checking team:', { teamId: team.teamId, sessionTeamId: session.teamId, match: team.teamId === session.teamId });
      return team.teamId === session.teamId;
    });
    
    console.log('Selected team:', selectedTeam);
    
    if (selectedTeam) {
      const newTeams = [selectedTeam, teams[1] || (allTeams[1] || null)];
      console.log('Setting teams:', newTeams);
      setTeams(newTeams);
    } else {
      console.log('No team found for teamId:', session.teamId);
    }
  }, [allTeams, session]);

  // currentView が outputSheetX に移動したら appOutputSheet を同期する
  useEffect(() => {
    if (currentView && currentView.startsWith && currentView.startsWith('outputSheet')) {
      setAppOutputSheet(currentView);
    }
  }, [currentView]);

  // score = score1st + score2nd
  useEffect(() => {
    setScore([score1st[0] + score2nd[0], score1st[1] + score2nd[1]]);
  }, [score1st, score2nd]);

  // チェッカーボード背景の画像を SVG で生成
  useEffect(() => {
    const root = document.getElementById('root');
    const styles = getComputedStyle(root);
    const tileSizeStr = styles.getPropertyValue('--size').trim();
    const tileSize = parseFloat(tileSizeStr);
    const stepSize = tileSize * 2;
    const width = 1376;
    const height = 942;
    const imagePath = !teams[0] ? 'irasutoya.png' : teams[0].image;
    
    // CSS の background-position: center と同じオフセット
    const offsetX = (width % stepSize) / 2;
    const offsetY = (height % stepSize) / 2;
    
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.style.position = 'absolute';
    svg.style.inset = '0';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '0';
    svg.style.opacity = '0.5';
    
    const defs = document.createElementNS(svgNS, 'defs');
    const pattern = document.createElementNS(svgNS, 'pattern');
    pattern.setAttribute('id', 'bgPattern');
    pattern.setAttribute('x', offsetX);
    pattern.setAttribute('y', offsetY);
    pattern.setAttribute('width', stepSize);
    pattern.setAttribute('height', stepSize);
    pattern.setAttribute('patternUnits', 'userSpaceOnUse');
    
    const image1 = document.createElementNS(svgNS, 'image');
    image1.setAttribute('href', imagePath);
    image1.setAttribute('x', '0');
    image1.setAttribute('y', '0');
    image1.setAttribute('width', tileSize);
    image1.setAttribute('height', tileSize);
    image1.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    
    const image2 = document.createElementNS(svgNS, 'image');
    image2.setAttribute('href', imagePath);
    image2.setAttribute('x', tileSize);
    image2.setAttribute('y', tileSize);
    image2.setAttribute('width', tileSize);
    image2.setAttribute('height', tileSize);
    image2.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    
    pattern.appendChild(image1);
    pattern.appendChild(image2);
    defs.appendChild(pattern);
    svg.appendChild(defs);
    
    const rect = document.createElementNS(svgNS, 'rect');
    rect.setAttribute('width', width);
    rect.setAttribute('height', height);
    rect.setAttribute('fill', 'url(#bgPattern)');
    svg.appendChild(rect);
    
    const existing = root.querySelector('svg[style*="position: absolute"]');
    if (existing) existing.remove();
    
    root.appendChild(svg);
  }, [teams]);

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

  const handleBackToTitle = () => setCurrentView('title');

  const handleLogin = (userData) => {
    // セッションを作成
    const newSession = {
      userId: userData.userId,
      teamId: userData.teamId,
      username: userData.username,
      createdAt: new Date(),
      token: Math.random().toString(36).substring(7), // 簡易的なトークン
    };
    console.log('設定するセッション:', newSession);
    setSession(newSession);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setSession(null);
    setCurrentView('title');
    setAllTeams([]);
    setAllPlayers([]);
  };

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
  console.log('現在のcurrentView:', currentView);
  
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
      isLoggedIn={isLoggedIn}
      onLogin={handleLogin}
      onLogout={handleLogout}
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
      session={session}
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
      score1st={score1st}
      setScore1st={setScore1st}
      score2nd={score2nd}
      setScore2nd={setScore2nd}
      score={score}
      setScore={setScore}
      session={session}
    />;
  } else if (currentView === "inputSheet") {
    content = <InputSheet
      teams={teams}
      players={players}
      matchId={selectedMatch?.matchId ?? matchId}
      matchDate={selectedMatch?.matchDate ?? matchDate}
      setView={setCurrentView}
      offenseTeam={offenseTeam}
      setOffenseTeam={setOffenseTeam}
      appOutputSheet={appOutputSheet}
      setAppOutputSheet={setAppOutputSheet}
      isEditor={isEditor}
      score1st={score1st}
      setScore1st={setScore1st}
      score2nd={score2nd}
      setScore2nd={setScore2nd}
      score={score}
      setScore={setScore}
    />;
  } else if (currentView === "inputTable") {
    content = <InputTable
      teams={teams}
      players={players}
      matchId={selectedMatch?.matchId ?? matchId}
      matchDate={selectedMatch?.matchDate ?? matchDate}
      setView={setCurrentView}
      offenseTeam={offenseTeam}
      setOffenseTeam={setOffenseTeam}
      appOutputSheet={appOutputSheet}
      setAppOutputSheet={setAppOutputSheet}
      isEditor={isEditor}
      score1st={score1st}
      setScore1st={setScore1st}
      score2nd={score2nd}
      setScore2nd={setScore2nd}
      score={score}
      setScore={setScore}
      session={session}
    />;
  } else if (currentView === "outputMenu") {
    console.log('OutputMenu レンダリング時のsession:', session);
    content = <OutputMenu 
      allTeams={allTeams}
      allPlayers={allPlayers}
      setView={setCurrentView}
      setSelectedMatch={setSelectedMatch}
      isEditor={isEditor}
      setMatchId={setMatchId}
      setTeams={setTeams}
      teams={teams}
      setPlayers={setPlayers}
      session={session}
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
    <SessionContext.Provider value={{ isLoggedIn, session }}>
      {content}
    </SessionContext.Provider>
  );
}

export default App
