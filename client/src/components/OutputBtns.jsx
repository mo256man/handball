import React from "react";
import "./style_output.css";

export default function OutputBtns({
	ids = ["player", "team", "summary"],
	labels = ["個人", "チーム", "サマリ"],
	onOpenKeyboard = () => {},
	setView = null,
	selectedBtn = null,
	onSelect = null,
}) {
	const handleClick = (idx, id) => {
		if (typeof setView === "function") {
			setView(`outputSheet${idx + 1}`);
		} else {
			onOpenKeyboard(id);
		}
		if (typeof onSelect === "function") onSelect(idx, id);
	};

	return (
		<div className="outputPageBtnArea">
			{ids.map((id, idx) => (
				<button
					key={id}
					className={"outputBtn pageBtn" + (selectedBtn === idx ? " active" : "")}
					onClick={() => handleClick(idx, id)}
				>
					{labels[idx] || id}
				</button>
			))}
		</div>
	);
}

