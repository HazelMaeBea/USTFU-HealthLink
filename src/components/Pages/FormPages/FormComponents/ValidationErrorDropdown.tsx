import React, { useState } from "react";
import { FieldErrors } from "react-hook-form";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

interface ValidationErrorDropdownProps {
	errors: FieldErrors<any>;
}

const ValidationErrorDropdown: React.FC<ValidationErrorDropdownProps> = ({
	errors,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const errorCount = Object.keys(errors).length;

	if (errorCount === 0) return null;

	return (
		<div className="validation-errors">
			<div className="error-summary" onClick={() => setIsOpen(!isOpen)}>
				<p className="note error-summary-text">
					Please fill out {errorCount} required field
					{errorCount > 1 ? "s" : ""}
					<button
						type="button"
						className="toggle-errors-btn"
						aria-label={
							isOpen ? "Hide error details" : "Show error details"
						}
					>
						{isOpen ? <FiChevronUp /> : <FiChevronDown />}
					</button>
				</p>
			</div>

			{isOpen && (
				<ul className="error-list">
					{Object.entries(errors).map(([field, error]) => (
						<li key={field}>
							<strong>
								{field
									.replace(/([A-Z])/g, " $1")
									.replace(/^./, (str) => str.toUpperCase())}
								:
							</strong>{" "}
							{error?.message as string}
						</li>
					))}
				</ul>
			)}
		</div>
	);
};

export default ValidationErrorDropdown;
