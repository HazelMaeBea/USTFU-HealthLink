import React from "react";
import styles from "./RecordTable.module.css";

interface Record {
	dateTime: string;
	transactionID: string;
	typeOfForm: string;
	status: string;
}

interface RecordTableProps {
	records: Record[];
	onDetailsClick: (transactionID: string, typeOfForm: string) => void; // Prop to notify parent
}

const RecordTable: React.FC<RecordTableProps> = ({
	records,
	onDetailsClick,
}) => {
	return (
		<div className={styles["table-component-container"]}>
			<div className={styles["records-container"]}>
				{records.map((record, index) => (
					<div
						key={index}
						className={`${styles["record-box"]} ${
							record.status === "Pending" ? styles.pending : ""
						} ${record.status === "Approved" ? styles.approved : ""} ${
							record.status === "Rejected" ? styles.rejected : ""
						}`}
					>
						<div className={styles["record-content"]}>
							<div className={styles["details-container"]}>
								<div className={styles["record-dateTime"]}>
									{record.dateTime}
								</div>
								<div className={styles["record-transactionID"]}>
									{record.transactionID}
								</div>
								<div className={styles["record-typeOfForm"]}>
									{record.typeOfForm}
								</div>
								<div className={styles["record-status"]}>{record.status}</div>
							</div>
							<div className={styles["button-container"]}>
								<button
									className={styles["details-button"]}
									onClick={() =>
										onDetailsClick(record.transactionID, record.typeOfForm)
									}
								>
									DETAILS
								</button>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default RecordTable;
