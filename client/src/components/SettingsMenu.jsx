import React, { useState, useEffect } from "react";
import styles from "./Title.module.css";

export default function SettingsMenu({ setView, allTeams, user }) {
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [editedTeam, setEditedTeam] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (selectedTeam) {
      setEditedTeam({ ...selectedTeam });
    } else {
      setEditedTeam(null);
    }
  }, [selectedTeam]);

  const renderTeamsTable = () => {
    if (!allTeams || allTeams.length === 0) {
      return <div>チームデータがありません</div>;
    }

    return (
      <div style={{ padding: "10px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #ccc" }}>
          <thead>
            <tr style={{ backgroundColor: "#f0f0f0" }}>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>ID</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>チーム名</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>短縮名</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>画像</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>有効無効</th>
            </tr>
          </thead>
          <tbody>
            <tr
              onClick={() => setSelectedTeam({ teamId: null, teamName: "", shortName: "", image: "", isAvailable: 1 })}
              style={{ cursor: "pointer", backgroundColor: selectedTeam?.teamId === null && selectedTeam !== null ? "#e0e0ff" : "white" }}
            >
              <td style={{ border: "1px solid #ccc", padding: "8px" }} colSpan={5}>チーム名：新規追加</td>
            </tr>
            {allTeams.map((team, index) => (
              <tr 
                key={index}
                onClick={() => setSelectedTeam(team)}
                style={{ cursor: "pointer", backgroundColor: selectedTeam?.teamId === team.teamId ? "#e0e0ff" : "white" }}
              >
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{team.teamId}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{team.teamName}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{team.shortName}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}><img src={team.image} alt={team.teamName} style={{ width: "50px", height: "50px" }} /></td>
                <td style={{ border: "1px solid #ccc", padding: "8px", backgroundColor: team.isAvailable ? "white" : "gray" }}>
                  {team.isAvailable ? "有効" : "無効"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const renderTeamDetails = () => {
    if (!editedTeam) {
      return <div style={{ padding: "10px" }}>チームを選択してください</div>;
    }

    const handleSave = async () => {
      try {
        const isNew = editedTeam.teamId === null;
        const response = await fetch(isNew ? '/api/insertTeam' : '/api/updateTeam', {
          method: isNew ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...editedTeam, isAvailable: editedTeam.isAvailable ? 1 : 0 })
        });
        const result = await response.json();
        if (result.success) {
          setMessage({ type: 'success', text: isNew ? 'チームを新規登録しました' : 'チーム情報を保存しました' });
          setSelectedTeam(editedTeam);
          setTimeout(() => setMessage(null), 3000);
        } else {
          setMessage({ type: 'error', text: '保存に失敗しました: ' + result.error });
        }
      } catch (error) {
        console.error('保存エラー:', error);
        setMessage({ type: 'error', text: '通信エラーが発生しました' });
      }
    };

    return (
      <div style={{ padding: "10px", border: "1px solid #ccc", marginTop: "10px" }}>
        <h3>チーム詳細</h3>
        <div style={{ marginBottom: "10px" }}>
          <label><strong>チーム名:</strong></label>
          <input 
            type="text" 
            value={editedTeam.teamName} 
            onChange={(e) => setEditedTeam({ ...editedTeam, teamName: e.target.value })}
            style={{ width: "100%", padding: "5px", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label><strong>短縮名:</strong></label>
          <input 
            type="text" 
            value={editedTeam.shortName} 
            onChange={(e) => setEditedTeam({ ...editedTeam, shortName: e.target.value })}
            style={{ width: "100%", padding: "5px", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <strong>ステータス:</strong>{" "}
          <div
            onClick={() => setEditedTeam({ ...editedTeam, isAvailable: !editedTeam.isAvailable })}
            style={{
              display: "inline-block",
              padding: "4px 12px",
              cursor: "pointer",
              backgroundColor: editedTeam.isAvailable ? "#4CAF50" : "#f44336",
              color: "white",
              borderRadius: "4px",
              userSelect: "none"
            }}
          >
            {editedTeam.isAvailable ? "有効" : "無効"}
          </div>
        </div>

        {editedTeam.image && (
          <div style={{ marginBottom: "10px" }}>
            <img src={editedTeam.image} alt={editedTeam.teamName} style={{ width: "100px", height: "100px" }} />
          </div>
        )}

        {message && (
          <div style={{
            padding: "10px",
            marginBottom: "10px",
            backgroundColor: message.type === 'success' ? "#4CAF50" : "#f44336",
            color: "white",
            borderRadius: "4px"
          }}>
            {message.text}
          </div>
        )}

        <button 
          onClick={handleSave}
          style={{ 
            padding: "10px 20px", 
            backgroundColor: "#4CAF50", 
            color: "white", 
            border: "none", 
            borderRadius: "4px", 
            cursor: "pointer" 
          }}
        >
          保存
        </button>
      </div>
    );
  }

  const content = (
    <div className={styles.main}>
      <div className={styles.titleString}>設定</div>
      {renderTeamsTable()}
      {renderTeamDetails()}
      <div className={styles.footer}>
        <div className={styles.btnLogin} onClick={() => setView('title')}>
          戻る
        </div>
      </div>
    </div>

  );

  return (
    <>{content}</>
  );
}
