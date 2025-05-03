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

	// Add file fields list to know which fields are file uploads
	const fileFields = [
		"eyeglassesReceipt",
		"applicantSignature",
		"docRequest",
		"hospitalInvoice",
		"labInvoice",
		"employeeID",
	];

	// Filter out any null messages to prevent rendering empty errors
	const filteredErrors = Object.entries(errors).filter(
		([_, error]) => error && error.message
	);

	const errorCount = filteredErrors.length;

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
					{filteredErrors.map(([field, error]) => {
						// Format field names with special handling for file fields
						let displayName = field;

						if (fileFields.includes(field)) {
							// Handle file field names specially
							switch (field) {
								case "eyeglassesReceipt":
									displayName = "Eyeglasses Receipt";
									break;
								case "applicantSignature":
									displayName = "Applicant Signature";
									break;
								case "docRequest":
									displayName = "Doctor's Request";
									break;
								case "hospitalInvoice":
									displayName = "Hospital Invoice";
									break;
								case "labInvoice":
									displayName = "Laboratory Invoice";
									break;
								case "employeeID":
									displayName = "Employee ID";
									break;
								default:
									displayName = field
										.replace(/([A-Z])/g, " $1")
										.replace(/^./, (str) => str.toUpperCase());
							}
						} else {
							// Normal field formatting
							displayName = field
								.replace(/([A-Z])/g, " $1")
								.replace(/^./, (str) => str.toUpperCase());
						}

						return (
							<li key={field}>
								<strong>{displayName}:</strong>{" "}
								{error?.message as string}
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
};

export default ValidationErrorDropdown;
