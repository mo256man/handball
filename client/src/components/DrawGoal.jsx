import { fi } from 'date-fns/locale';
import React from 'react';


const DrawGoal = ({ drawOut, onClick, width = 300, height = 200, showValue = false, values = [] }) => {
  // drawOutに応じて座標を調整
  const x0 = 30;
  const y0 = 30;
  const thickness = 30;

  // ゴールの多角形部分を描画する関数
  const renderGoalPolygon = (fill) => {
    const polyPoints = [
      [0 + x0, 0 + y0],
      [300 - x0, 0 + y0],
      [300 - x0, 200],
      [300 - thickness - x0, 200],
      [300 - thickness - x0, thickness + y0],
      [thickness + x0, thickness + y0],
      [thickness + x0, 200],
      [0 + x0, 200],
      [0 + x0, 0 + y0],
    ].map(([x, y]) => `${x},${y}`).join(' ');
    return (
      <polygon
        points={polyPoints}
        fill={fill}
        stroke="black"
        strokeWidth="2"
        onClick={onClick ? (e => { e.stopPropagation(); onClick("post", "Post"); }) : undefined}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
      />
    );
  };

  // 上・左・右の3辺を描画する関数（クリック対応、value付き）
  const renderFrameLines = () => {
    // 3本とも同じ値'frame'を送る
    const lines = [
      [thickness / 2 + x0, 200 - y0, thickness / 2 + x0, y0], // 左
      [300 - thickness / 2 - x0, 200 - y0, 300 - thickness / 2 - x0, y0], // 右
      [x0, thickness / 2 + y0, 300 - x0, thickness / 2 + y0], // 上
    ];
    return lines.map(([x1, y1, x2, y2], idx) => (
      <line
        key={`frame-line-${idx}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="red"
        strokeWidth={thickness}
        strokeDasharray="30,30"
        onClick={onClick ? (e => { e.stopPropagation(); onClick("post", "Post"); }) : undefined}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
      />
    ));
  };

  // 9個の四角形を内側エリアに描画する関数
  const renderInnerRects = () => {
    // 9個のエリア情報
    const areaDefs = [
      { id: 'LU', text: '左上' , value:"左上"},
      { id: 'CU', text: '上' , value:"上"},
      { id: 'RU', text: '右上' , value:"右上"},
      { id: 'LM', text: '左' , value:"左"},
      { id: 'CM', text: '中央' , value:"中央"},
      { id: 'RM', text: '右' , value:"右"},
      { id: 'LB', text: '左下' , value:"左下"},
      { id: 'CB', text: '下' , value:"下"},
      { id: 'RB', text: '右下' , value:"右下"},
    ];
    const rects = [];
    const left = thickness + x0;
    const top = thickness + y0;
    const right = 300 - thickness - x0;
    const bottom = 200;
    const cols = 3, rows = 3;
    const margin = 6; // 隙間(px)
    const width = (right - left) / cols - margin;
    const height = (bottom - top) / rows - margin;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        const area = areaDefs[idx];
        // x, yをmargin分ずらす
        const x = left + col * ((right - left) / cols) + margin / 2;
        const y = top + row * ((bottom - top) / rows) + margin / 2;
        rects.push(
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
            {
              // ラベル背景（showValue のときのみ表示）。値が "0" または "0%" の場合は灰色背景にする
              showValue && (() => {
                const labelWidth = width * 0.8;
                const labelHeight = Math.min(height * 0.45, 30);
                const labelX = x + (width - labelWidth) / 2;
                const labelY = y + (height - labelHeight) / 2;
                const rx = Math.min(labelWidth, labelHeight) * 0.12;
                const displayText = (values && values[idx] !== undefined) ? values[idx] : area.text;
                const isZero = String(displayText).trim() === '0' || String(displayText).trim() === '0%';
                return (
                  <rect
                    x={labelX}
                    y={labelY}
                    width={labelWidth}
                    height={labelHeight}
                    fill={isZero ? '#d3d3d3' : 'white'}
                    stroke="black"
                    strokeWidth={1}
                    rx={rx}
                    ry={rx}
                    onClick={onClick ? (e => { e.stopPropagation(); onClick('goal', area.value); }) : undefined}
                    style={{ cursor: onClick ? 'pointer' : 'default' }}
                  />
                );
              })()
            }
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
      }
    }
    return rects;
  };

  // 背景rect描画関数
  const renderBackgroundRect = () => {
    return (
      <rect
        x="0"
        y="0"
        width="300"
        height="200"
        fill="lightblue"
        stroke="black"
        strokeWidth="0"
        onClick={onClick ? (e => { e.stopPropagation(); onClick("goal", "Out"); }) : undefined}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
      />
    );
  };

  return (
    <svg width={width} height={height} viewBox="0 0 300 200" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
      {renderBackgroundRect()}
      {renderGoalPolygon("white")}
      {renderFrameLines()}
      {renderGoalPolygon("none")}
      {renderInnerRects()}
    </svg>
  );
};

export default DrawGoal;
