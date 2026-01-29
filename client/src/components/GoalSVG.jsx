import React from 'react';


const GoalSVG = ({ drawOut }) => {
  // drawOutに応じて座標を調整
  const x0 = drawOut ? 30 : 0;
  const y0 = drawOut ? 30 : 0;

  const thickness = 30;

  // polygonの頂点座標をx0, y0, thicknessで計算
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
    <svg width="300" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
      {/* drawOutがtrueなら背面に大きな四角形 */}
      {drawOut && (
        <rect x="0" y="0" width="300" height="200" fill="lightblue" stroke="black" strokeWidth="0" />
      )}
      <polygon
        points={polyPoints}
        fill="white"
        stroke="black"
        strokeWidth="2"
      />
      {/* 上・左・右の3辺をmapで描画 */}
      {[
        // [x1, y1, x2, y2]
        [thickness / 2 + x0, 200 - y0, thickness / 2 + x0, thickness / 2 + y0], // 左
        [thickness / 2 + x0, thickness / 2 + y0, 300 - thickness / 2 - x0, thickness / 2 + y0], // 上
        [300 - thickness / 2 - x0, thickness / 2 + y0, 300 - thickness / 2 - x0, 200 - y0], // 右
      ].map(([x1, y1, x2, y2], idx) => (
        <line
          key={`frame-line-${idx}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="red"
          strokeWidth={thickness}
          strokeDasharray="30,30"
        />
      ))}
      {/* 9個の四角形を内側エリアに描画 */}
      {(() => {
        const rects = [];
        // polygonの内側エリアをthicknessに対応させて調整
        const left = thickness + x0;
        const top = thickness + y0;
        const right = 300 - thickness - x0;
        const bottom = 200;
        const cols = 3, rows = 3;
        const width = (right - left) / cols;
        const height = (bottom - top) / rows;
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            rects.push(
              <rect
                key={`rect-${row}-${col}`}
                x={left + col * width}
                y={top + row * height}
                width={width}
                height={height}
                fill="none"
                stroke="green"
                strokeWidth="3"
              />
            );
          }
        }
        return rects;
      })()}
    </svg>
  );
};

export default GoalSVG;