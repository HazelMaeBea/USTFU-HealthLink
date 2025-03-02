import React, { useState } from "react";
import "./Settings.css";

const Settings = () => {
	const [settings, setSettings] = useState({
		// User profile fields
		firstname: "John",
		lastname: "Doe",
		middlename: "A.",
		suffix: "",
		age: "30",
		term: "1st",
		year: "2023-2024",
		load: "Full",
		status: "Tenured",
		numberID: "12345",
		address: "123 Main St",
		dateHired: "2022-01-01",
		dateRetired: "",
		// Toggles
		notifications: true,
		autofill: true,
	});

	const handleFieldBlur = (
		field: string,
		e: React.FocusEvent<HTMLDivElement>
	) => {
		setSettings({ ...settings, [field]: e.currentTarget.innerText });
	};

	return (
		<div className="settings-container">
			<div className="settings-section">
				<h3>Notification Preferences</h3>
				<div className="toggle-group">
					<div className="toggle-row">
						<p>Email Notifications:</p>
						<div className="form-check">
							<label className="form-check-label form-check-toggle">
								<input
									className="form-check-input"
									type="checkbox"
									checked={settings.notifications}
									onChange={(e) =>
										setSettings({
											...settings,
											notifications: e.target.checked,
										})
									}
									aria-label="toggle notifications"
								/>
								<span></span>
							</label>
						</div>
					</div>
					<div className="toggle-row">
						<p>Auto-fill Information:</p>
						<div className="form-check">
							<label className="form-check-label form-check-toggle">
								<input
									className="form-check-input"
									type="checkbox"
									checked={settings.autofill}
									onChange={(e) =>
										setSettings({
											...settings,
											autofill: e.target.checked,
										})
									}
									aria-label="toggle autofill"
								/>
								<span></span>
							</label>
						</div>
					</div>
				</div>
			</div>

			<div className="settings-section">
				<h3>Personal Information</h3>
				{/* Replace the old fields-grid with the PendingRequests form-grid structure */}
				<div className="form-grid">
					<div className="form-group">
						<label>First Name</label>
						<div
							className="editable field-value"
							contentEditable
							suppressContentEditableWarning
							onBlur={(e) => handleFieldBlur("firstname", e)}
						>
							{settings.firstname}
						</div>
					</div>
					<div className="form-group">
						<label>Last Name</label>
						<div
							className="editable field-value"
							contentEditable
							suppressContentEditableWarning
							onBlur={(e) => handleFieldBlur("lastname", e)}
						>
							{settings.lastname}
						</div>
					</div>
					<div className="form-group">
						<label>Middle Name</label>
						<div
							className="editable field-value"
							contentEditable
							suppressContentEditableWarning
							onBlur={(e) => handleFieldBlur("middlename", e)}
						>
							{settings.middlename}
						</div>
					</div>
					<div className="form-group">
						<label>Suffix</label>
						<div
							className="editable field-value"
							contentEditable
							suppressContentEditableWarning
							onBlur={(e) => handleFieldBlur("suffix", e)}
						>
							{settings.suffix}
						</div>
					</div>
					<div className="form-group">
						<label>Age</label>
						<div
							className="editable field-value"
							contentEditable
							suppressContentEditableWarning
							onBlur={(e) => handleFieldBlur("age", e)}
						>
							{settings.age}
						</div>
					</div>
					<div className="form-group">
						<label>Term</label>
						<div
							className="editable field-value"
							contentEditable
							suppressContentEditableWarning
							onBlur={(e) => handleFieldBlur("term", e)}
						>
							{settings.term}
						</div>
					</div>
					<div className="form-group">
						<label>Year</label>
						<div
							className="editable field-value"
							contentEditable
							suppressContentEditableWarning
							onBlur={(e) => handleFieldBlur("year", e)}
						>
							{settings.year}
						</div>
					</div>
					<div className="form-group">
						<label>Load</label>
						<div
							className="editable field-value"
							contentEditable
							suppressContentEditableWarning
							onBlur={(e) => handleFieldBlur("load", e)}
						>
							{settings.load}
						</div>
					</div>
					<div className="form-group">
						<label>Status</label>
						<div
							className="editable field-value"
							contentEditable
							suppressContentEditableWarning
							onBlur={(e) => handleFieldBlur("status", e)}
						>
							{settings.status}
						</div>
					</div>
					<div className="form-group">
						<label>ID Number</label>
						<div
							className="editable field-value"
							contentEditable
							suppressContentEditableWarning
							onBlur={(e) => handleFieldBlur("numberID", e)}
						>
							{settings.numberID}
						</div>
					</div>
					<div className="form-group">
						<label>Address</label>
						<div
							className="editable field-value"
							contentEditable
							suppressContentEditableWarning
							onBlur={(e) => handleFieldBlur("address", e)}
						>
							{settings.address}
						</div>
					</div>
					<div className="form-group">
						<label>Date Hired</label>
						<div
							className="editable field-value"
							contentEditable
							suppressContentEditableWarning
							onBlur={(e) => handleFieldBlur("dateHired", e)}
						>
							{settings.dateHired}
						</div>
					</div>
					<div className="form-group">
						<label>Date Retired</label>
						<div
							className="editable field-value"
							contentEditable
							suppressContentEditableWarning
							onBlur={(e) => handleFieldBlur("dateRetired", e)}
						>
							{settings.dateRetired || "N/A"}
						</div>
					</div>
				</div>
				<div className="buttonDiv">
					<button
						onClick={() => console.log("Save settings", settings)}
						className="btn btn-submit"
					>
						Save Changes
					</button>
				</div>
			</div>
		</div>
	);
};

export default Settings;
