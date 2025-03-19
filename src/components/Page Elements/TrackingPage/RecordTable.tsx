import React from "react";
import styles from "./RecordTable.module.css";
import { Record } from "../PendingRequests/types";

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
	return (
		<div className={styles["table-component-container"]}>
			<div className={styles["records-container"]}>
				{records.map((record, index) => {
					const date = new Date(record.dateTime);
					const isValidDate = !isNaN(date.getTime());

					return (
						<div
							key={index}
							className={`${styles["record-box"]} ${
								record.status === "Pending"
									? styles.pending
									: ""
							} ${
								record.status === "Approved"
									? styles.approved
									: ""
							} ${
								record.status === "Rejected"
									? styles.rejected
									: ""
							}`}
						>
							<div className={styles["record-content"]}>
								<div className={styles["details-container"]}>
									<div className={styles["record-dateTime"]}>
										{isValidDate
											? date.toLocaleString()
											: "Invalid Date"}
									</div>
									<div
										className={
											styles["record-transactionID"]
										}
									>
										{record.transactionID}
									</div>
									<div
										className={styles["record-typeOfForm"]}
									>
										{record.formData.origFormType}
									</div>
									<div className={styles["record-status"]}>
										{record.status}
									</div>
								</div>
								<div className={styles["button-container"]}>
									<button
										className={styles["details-button"]}
										onClick={() =>
											onDetailsClick(
												record.transactionID,
												date, // Pass the Date object
												record.status
											)
										}
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
