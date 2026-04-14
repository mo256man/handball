import React from 'react';

const DrawGoal = ({ drawOut, onClick, width = 400, height = 300, showValue = false, values = [] }) => {
  const svgWidth = 400, svgHeight = 300;
  const goalWidth = 300, goalHeight = 200;
  const thickness = 20;

  const x0 = (svgWidth - goalWidth) / 2;
  const y0 = 250;

  const renderBackground = () => {
    return (
      <>
        {/* 地面 */}
        <rect x="0" y={y0} width={svgWidth} height={svgHeight - y0} fill="wheat" />
        {/* 空 */}
        <rect
          x="0"
          y="0"
          width={svgWidth}
          height={y0}
          fill="skyblue"
          onClick={onClick ? (e => { e.stopPropagation(); onClick("goal", "Out"); }) : undefined}
          style={{ cursor: onClick ? 'pointer' : 'default' }}
        />
        {/* 地面と空の境界線 */}
        <line
          x1="0"
          y1={y0}
          x2={svgWidth}
          y2={y0}
          stroke="black"
          strokeWidth="1"
        />
      </>
    );
  };

  const renderGoal = () => {
    const points = [
      [x0, y0],
      [x0, y0 - goalHeight],
      [x0 + goalWidth, y0 - goalHeight],
      [x0 + goalWidth, y0],
      [x0 + goalWidth + thickness, y0],
      [x0 + goalWidth + thickness, y0 - goalHeight - thickness],
      [x0 - thickness, y0 - goalHeight - thickness],
      [x0 - thickness, y0],
      [x0, y0],
    ].map(([x, y]) => `${x},${y}`).join(' ');

    return (
      <>
        {/* ゴール内 */}
        <rect x={x0} y={y0 - goalHeight} width={goalWidth} height={goalHeight} fill="lightgray" />
        {/* ゴール枠 */}
        <polygon
          points={points}
          fill="white"
          stroke="black"
          strokeWidth="1"
          onClick={onClick ? (e => { e.stopPropagation(); onClick("post", "Post"); }) : undefined}
          style={{ cursor: onClick ? 'pointer' : 'default' }}
        />
        {/* 角の黒四角 */}
        { [
          [x0 - thickness, y0 - goalHeight - thickness],
          [x0 + goalWidth, y0 - goalHeight - thickness],
        ].map(([x, y], idx) => (
          <rect
            key={`corner-${idx}`}
            x={x}
            y={y}
            width={thickness}
            height={thickness}
            fill="red"
            onClick={onClick ? (e => { e.stopPropagation(); onClick("post", "Post"); }) : undefined}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
          />
        ))}
        {/* 点線の縦線 */}
        { [
          x0 - thickness / 2,
          x0 + goalWidth + thickness / 2,
        ].map((x, idx) => (
          <line
            key={`dashed-line-vertical-${idx}`}
            x1={x}
            y1={y0}
            x2={x}
            y2={y0 - goalHeight}
            stroke="red"
            strokeWidth={thickness}
            strokeDasharray="20 20"
            strokeDashoffset="20"
            onClick={onClick ? (e => { e.stopPropagation(); onClick("post", "Post"); }) : undefined}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
          />
        ))}
        {/* 点線の横線 */}
        <line
          x1={x0}
          y1={y0 - goalHeight - thickness / 2}
          x2={x0 + goalWidth}
          y2={y0 - goalHeight - thickness / 2}
          stroke="red"
          strokeWidth={thickness}
          strokeDasharray="20 20"
          onClick={onClick ? (e => { e.stopPropagation(); onClick("post", "Post"); }) : undefined}
          style={{ cursor: onClick ? 'pointer' : 'default' }}
        />
      </>
    );
  };

  const renderInnerRects = () => {
    const areaDefs = [
      { id: 'LU', text: '左上', value: '左上' },
      { id: 'CU', text: '上', value: '上' },
      { id: 'RU', text: '右上', value: '右上' },
      { id: 'LM', text: '左', value: '左' },
      { id: 'CM', text: '中央', value: '中央' },
      { id: 'RM', text: '右', value: '右' },
      { id: 'LB', text: '左下', value: '左下' },
      { id: 'CB', text: '下', value: '下' },
      { id: 'RB', text: '右下', value: '右下' },
    ];
    const margin = 10;
    const left = x0 + margin/2;
    const top = y0 - goalHeight + margin/2;
    const right = x0 + goalWidth - margin/2;
    const bottom = y0;
    const cols = 3, rows = 3;
    const width = (right - left) / cols - margin;
    const height = (bottom - top) / rows - margin;

    return areaDefs.map((area, idx) => {
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      const x = left + col * ((right - left) / cols) + margin / 2;
      const y = top + row * ((bottom - top) / rows) + margin / 2;

      return (
        <g key={`rect-group-${area.id}`}>
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill="lightgreen"
            stroke="green"
            strokeWidth="3"
            rx={Math.min(width, height) * 0.2}
            ry={Math.min(width, height) * 0.2}
            onClick={onClick ? (e => { e.stopPropagation(); onClick('goal', area.value); }) : undefined}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
          />
          <text
            x={x + width / 2}
            y={y + height / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={Math.min(width, height) / 2.5}
            fill="black"
            onClick={onClick ? (e => { e.stopPropagation(); onClick('goal', area.value); }) : undefined}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
          >
            {showValue ? (values && values[idx] !== undefined ? values[idx] : area.text) : area.text}
          </text>
        </g>
      );
    });
  };

  return (
    <svg width={width} height={height} viewBox={`0 0 ${svgWidth} ${svgHeight}`} xmlns="http://www.w3.org/2000/svg">
      {renderBackground()}
      {renderGoal()}
      {renderInnerRects()}
    </svg>
  );
};

export default DrawGoal;
