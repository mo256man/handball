import React from "react";
import "./Teams.css";

export default function TeamSelection({ 
    teamNumber, 
    teamName, 
    setTeamName, 
    selectedMembers, 
    teamNames,
    getTeamMembers,
    toggleMemberSelection,
    disabled = false
}) {
    return (
        <div className="team-area">
            <select 
                id={`teamName${teamNumber}`} 
                value={teamName} 
                onChange={(e) => setTeamName(e.target.value)} 
                className="team-select team-area-item"
                disabled={disabled}
            >
                {teamNames.length === 0 ? (
                    <option value={teamName}>{teamName}</option>
                ) : (
                    teamNames.map((name, index) => (
                        <option key={index} value={name}>{name}</option>
                    ))
                )}
            </select>
            <div className="selectedMember team-area-item">
                選択中: {selectedMembers.size} / 16人
            </div>
            <div className="team-table-area">
                <table className="team-table">
                    <thead>
                        <tr>
                            <th>背番号</th>
                            <th>ポジション</th>
                            <th>名前</th>
                        </tr>
                    </thead>
                    <tbody>
                        {getTeamMembers(teamName).map((member, index) => (
                            <tr 
                                key={index}
                                onClick={() => toggleMemberSelection(teamNumber, index)}
                                style={{ 
                                    cursor: 'pointer',
                                    backgroundColor: selectedMembers.has(index) ? '#e3f2fd' : '#f5f5f5',
                                    opacity: selectedMembers.has(index) ? 1 : 0.5
                                }}
                            >
                                <td>{member.number}</td>
                                <td>{member.position}</td>
                                <td>{member.name}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
