import React from 'react';

const createSectorPath = (centerX, centerY, radius, startAngle, endAngle) => {
  // 度数法からラジアンに変換
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;
  // 開始点の座標
  const startX = centerX + radius * Math.cos(startRad);
  const startY = centerY + radius * Math.sin(startRad);
  // 終了点の座標
  const endX = centerX + radius * Math.cos(endRad);
  const endY = centerY + radius * Math.sin(endRad);
  // 大きい弧かどうか（180度より大きいか）
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
  // パス文字列を生成
  return `M ${centerX} ${centerY} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
};

const DrawShootArea = ({ onClick, width = 200, height = 150 }) => {
  return (
    <svg width={width} height={height} viewBox="0 0 200 150">
      <path d={createSectorPath(85, 10, 130, 90, 135)} fill="lightyellow" onClick={() => onClick("area", "L9")} className="shootArea"/>
      <path d={createSectorPath(115, 10, 130, 45, 90)} fill="lightyellow" onClick={() => onClick("area", "R9")} className="shootArea" />
      <path d={createSectorPath(85, 10, 90, 90, 135)} fill="lightblue" onClick={() => onClick("area", "L6")} className="shootArea" />
      <path d={createSectorPath(115, 10, 90, 45, 90)} fill="lightblue" onClick={() => onClick("area", "R6")} className="shootArea" />
      <path d="M 0 10 L 85 10 L 0 95 Z" fill="lightgreen" onClick={() => onClick("area", "LW")} className="shootArea" />
      <path d="M 200 10 L 115 10 L 200 95 Z" fill="lightgreen" onClick={() => onClick("area", "RW")} className="shootArea" />
      <rect x="75" y="70" width="50" height="30" fill="lightblue" onClick={() => onClick("area", "M6")} className="shootArea" />
      <rect x="75" y="100" width="50" height="40" fill="lightyellow" onClick={() => onClick("area", "M9")} className="shootArea" />
      <path d="M 25 10 A 60 60 0 0 0 85 70 L 115 70 A 60 60 0 0 0 175 10 Z" fill="white" stroke="black" strokeWidth="1" />
      <path d="M 0 300 L 0 10 L 200 10 L 200 300" fill="none" stroke="black" strokeWidth="1" />
      <rect x="85" y="0" width="30" height="10" fill="white" stroke="black" strokeWidth="1" />
      <text x="15" y="40" className="shootAreaText">LW</text>
      <text x="185" y="40" className="shootAreaText">RW</text>
      <text x="50" y="80" className="shootAreaText">L6</text>
      <text x="150" y="80" className="shootAreaText">R6</text>
      <text x="40" y="115" className="shootAreaText">L9</text>
      <text x="160" y="115" className="shootAreaText">R9</text>
      <text x="100" y="85" className="shootAreaText">M6</text>
      <text x="100" y="120" className="shootAreaText">M9</text>
    </svg>
  );
};

export default DrawShootArea;