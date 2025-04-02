import React from "react";
import styles from "./RecordTable.module.css";
import { Record } from "../../Pages/PendingRequestPage/types";
import { useFirebase } from "../../../contexts/firebaseContext";
import unreadAccomplished from "../NotifBadge/unreadAccomplished";
import useNotifications from "../NotifBadge/NotifTrigger";
// Import icons for form types - updated to match ServiceCards path pattern
import inpatientIcon from "../../../assets/inpatient.png";
import admissionIcon from "../../../assets/admission.png";
import outpatientIcon from "../../../assets/outpatient.png";
import eyeglassesIcon from "../../../assets/eyeglasses.png";

interface RecordTableProps {
	records: Record[];
	onDetailsClick: (
		transactionID: string,
		dateTime: Date,
		status: string
	) => void;
}

const RecordTable: React.FC<RecordTableProps> = ({
	records,
	onDetailsClick,
}) => {
	const { uid } = useFirebase();
	const { unreadAccomplishedIds, setUnreadAccomplishedIds } =
		unreadAccomplished();
	const { clearAccomplishedNotifications } = useNotifications({
		uid: uid,
		selectedRole: "member",
	});

	// Helper function to get form icon based on type - updated and simplified
	const getFormIcon = (formType: string, origFormType?: string) => {
		// Convert to lowercase for case-insensitive comparison
		const type = formType?.toLowerCase() || "";
		const origType = origFormType?.toLowerCase() || "";

		// Hospital type logic
		if (type === "hospital") {
			if (origType === "inpatient") return inpatientIcon;
			if (origType === "outpatient") return outpatientIcon;
			return inpatientIcon; // Default
		}

		// Direct type matching
		switch (type) {
			case "admission":
				return admissionIcon;
			case "eyeglasses":
				return eyeglassesIcon;
			case "inpatient":
				return inpatientIcon;
			case "outpatient":
				return outpatientIcon;
			default:
				return null;
		}
	};

	// Helper function for display name - updated
	const getFormTypeDisplay = (formType: string, origFormType?: string) => {
		const type = formType?.toLowerCase() || "";
		const origType = origFormType?.toLowerCase() || "";

		if (type === "hospital") {
			if (origType === "inpatient") return "Inpatient";
			if (origType === "outpatient") return "Outpatient";
			return "Hospital";
		}

		// Capitalize first letter
		return formType.charAt(0).toUpperCase() + formType.slice(1);
	};

	return (
		<div className={styles["table-component-container"]}>
			<div className={styles["records-container"]}>
				{records.map((record, index) => {
					const date = new Date(record.dateTime);
					const isValidDate = !isNaN(date.getTime());
					const isUnread = unreadAccomplishedIds.includes(
						record.transactionID
					);

					// Format the status for display and styling
					const status = record.status || "Pending";
					const statusClass = status.toLowerCase();

					// Get form type and icon
					const formType =
						record.formData?.origFormType || record.typeOfForm;
					const origFormType = record.formData?.origFormType;
					const formIcon = getFormIcon(
						record.typeOfForm,
						origFormType
					);
					const formTypeDisplay = getFormTypeDisplay(
						record.typeOfForm,
						origFormType
					);

					return (
						<div
							key={index}
							className={`${styles["record-box"]} 
								${styles[statusClass]} 
								${isUnread ? styles.highlight : ""}`}
						>
							<div className={styles["record-content"]}>
								<div className={styles["details-container"]}>
									{/* Date/Time Field with Label-Value Format */}
									<div className={styles["record-dateTime"]}>
										<span
											className={
												styles["record-dateTime-label"]
											}
										>
											Date
										</span>
										<span
											className={
												styles["record-dateTime-value"]
											}
										>
											{isValidDate
												? date.toLocaleDateString() +
												  " " +
												  date.toLocaleTimeString([], {
														hour: "2-digit",
														minute: "2-digit",
												  })
												: "Invalid Date"}
										</span>
									</div>

									{/* Transaction ID Field with Label-Value Format */}
									<div
										className={
											styles["record-transactionID"]
										}
									>
										<span
											className={
												styles[
													"record-transactionID-label"
												]
											}
										>
											Transaction ID
										</span>
										<span
											className={
												styles[
													"record-transactionID-value"
												]
											}
										>
											{record.transactionID}
										</span>
									</div>

									{/* Form Type Field with Label-Value Format - Updated with Icon */}
									<div
										className={styles["record-typeOfForm"]}
									>
										<span
											className={
												styles[
													"record-typeOfForm-label"
												]
											}
										>
											Form Type
										</span>
										<div
											className={
												styles[
													"record-typeOfForm-value-container"
												]
											}
										>
											{formIcon && (
												<img
													src={formIcon}
													alt={formTypeDisplay}
													className={
														styles["form-type-icon"]
													}
												/>
											)}
											<span
												className={
													styles[
														"record-typeOfForm-value"
													]
												}
											>
												{formTypeDisplay}
											</span>
										</div>
									</div>

									{/* Status Field with Badge Format */}
									<div className={styles["record-status"]}>
										<span
											className={
												styles["record-status-label"]
											}
										>
											Status
										</span>
										<span
											className={`${
												styles["status-badge"]
											} ${
												styles[`status-${statusClass}`]
											}`}
										>
											{status}
										</span>
									</div>
								</div>

								<div className={styles["button-container"]}>
									<button
										className={styles["details-button"]}
										onClick={async () => {
											if (isUnread) {
												await clearAccomplishedNotifications(
													record.transactionID
												);
												setUnreadAccomplishedIds(
													(prev: string[]) =>
														prev.filter(
															(id: string) =>
																id !==
																record.transactionID
														)
												);
											}
											onDetailsClick(
												record.transactionID,
												date,
												record.status
											);
										}}
									>
										DETAILS
									</button>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default RecordTable;
