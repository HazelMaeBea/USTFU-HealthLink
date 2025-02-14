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
		<div className="page-buttons">
			<button
				onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
				disabled={currentPage <= 1}
				aria-label="Previous"
			>
				<MdOutlineKeyboardArrowLeft />
			</button>
			<div className="page-input-container">
				<input
					type="text"
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
					placeholder={currentPage.toString()}
				/>
				<span> of {totalPages}</span>
			</div>
			<button
				onClick={() =>
					currentPage < totalPages && onPageChange(currentPage + 1)
				}
				disabled={currentPage >= totalPages}
				aria-label="Next"
			>
				<MdOutlineKeyboardArrowRight />
			</button>
		</div>
	);
};

export default PageButtons;
