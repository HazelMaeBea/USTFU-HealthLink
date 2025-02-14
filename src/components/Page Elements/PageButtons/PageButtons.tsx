import React, { useState, useEffect } from "react";
import "./PageButtons.css";

import {
	MdOutlineKeyboardArrowLeft,
	MdOutlineKeyboardArrowRight,
} from "react-icons/md";

interface PageButtonsProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
}

const PageButtons: React.FC<PageButtonsProps> = ({
	currentPage,
	totalPages,
	onPageChange,
}) => {
	const [inputValue, setInputValue] = useState<string>(
		currentPage.toString()
	);

	/* Update local input when currentPage changes */
	useEffect(() => {
		setInputValue(currentPage.toString());
	}, [currentPage]);

	/* Debounce input and trigger page change after user stops typing */
	useEffect(() => {
		if (inputValue === "") return; // skip if empty so that it doesn't reset immediately
		const timeout = setTimeout(() => {
			const parsed = parseInt(inputValue, 10);
			if (isNaN(parsed) || parsed < 1 || parsed > totalPages) {
				// reverts back if invalid or out-of-range
				setInputValue(currentPage.toString());
			} else if (parsed !== currentPage) {
				onPageChange(parsed);
			}
		}, 500);
		return () => clearTimeout(timeout);
	}, [inputValue, currentPage, totalPages, onPageChange]);

	return (
		<div className="page-buttons-wrapper">
			{" "}
			{/* new wrapper container */}
			<div className="page-buttons">
				<button
					className="prev-button"
					onClick={() =>
						currentPage > 1 && onPageChange(currentPage - 1)
					}
					disabled={currentPage <= 1}
					aria-label="Previous"
				>
					<MdOutlineKeyboardArrowLeft color="black" size={20} />
				</button>
				<div className="page-input-container">
					<input
						className="current-page-input"
						type="text"
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						onBlur={() => {
							if (inputValue === "") {
								setInputValue(currentPage.toString());
							}
						}}
						placeholder={currentPage.toString()}
					/>
					<span className="page-input-suffix"> of {totalPages}</span>
				</div>
				<button
					className="next-button"
					onClick={() =>
						currentPage < totalPages &&
						onPageChange(currentPage + 1)
					}
					disabled={currentPage >= totalPages}
					aria-label="Next"
				>
					<MdOutlineKeyboardArrowRight color="white" size={20} />
				</button>
			</div>
		</div>
	);
};

export default PageButtons;
