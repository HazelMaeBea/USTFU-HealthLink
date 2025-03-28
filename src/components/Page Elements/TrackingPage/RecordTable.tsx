import React from "react";
import styles from "./RecordTable.module.css";
import { Record } from "../PendingRequests/types";
import { useFirebase } from "../../../contexts/firebaseContext";
import unreadAccomplished from "../NotifBadge/unreadAccomplished";
import useNotifications from "../NotifBadge/NotifTrigger";

interface RecordTableProps {
	records: Record[];
	onDetailsClick: (
		transactionID: string,
		dateTime: Date, // Pass a Date object
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

	return (
		<div className={styles["table-component-container"]}>
			<div className={styles["records-container"]}>
				{records.map((record, index) => {
					const date = new Date(record.dateTime);
					const isValidDate = !isNaN(date.getTime());

					const isUnread = unreadAccomplishedIds.includes(record.transactionID);

					return (
						<div
							key={index}
							className={`${styles["record-box"]} 
								${record.status === "Pending" ? styles.pending : ""} 
								${record.status === "Approved" ? styles.approved : ""} 
								${record.status === "Rejected" ? styles.rejected : ""} 
								${isUnread ? styles.highlight : ""} // ✅ Add highlight for unread
							`}
						>
							<div className={styles["record-content"]}>
								<div className={styles["details-container"]}>
									<div className={styles["record-dateTime"]}>
										{isValidDate ? date.toLocaleString() : "Invalid Date"}
									</div>
									<div className={styles["record-transactionID"]}>
										{record.transactionID}
									</div>
									<div className={styles["record-typeOfForm"]}>
										{record.formData.origFormType}
									</div>
									<div className={styles["record-status"]}>{record.status}</div>
								</div>
								<div className={styles["button-container"]}>
									<button
										className={styles["details-button"]}
										onClick={async () => {
											// ✅ Clear the notification when clicked
											if (isUnread) {
												await clearAccomplishedNotifications(
													record.transactionID
												);

												// ✅ Instantly remove highlight locally
												setUnreadAccomplishedIds((prev: string[]) =>
													prev.filter(
														(id: string) => id !== record.transactionID
													)
												);
											}

											// ✅ Trigger details click
											onDetailsClick(record.transactionID, date, record.status);
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
