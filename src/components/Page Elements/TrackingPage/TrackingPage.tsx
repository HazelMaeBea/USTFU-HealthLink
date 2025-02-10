import { useState } from "react";
import styles from "./TrackingPage.module.css";
import Tabs from "./Tabs";
import RecordTable from "./RecordTable";
// import PendingRequestsPage from "./PendingRequestsPage";

const TrackingPage = () => {
	const [records] = useState([
		{
			dateTime: "10/28/2024 - 11:11 AM",
			transactionID: "TRN20359211934",
			typeOfForm: "In-Patient Form",
			status: "Approved",
		},
		{
			dateTime: "10/21/2024 - 12:51 PM",
			transactionID: "TRN2069211934",
			typeOfForm: "Out-Patient Form",
			status: "Rejected",
		},
		{
			dateTime: "10/18/2024 - 5:55 PM",
			transactionID: "TRN2084923523",
			typeOfForm: "In-Patient Form",
			status: "Rejected",
		},
		{
			dateTime: "10/12/2024 - 9:27 PM",
			transactionID: "TRN2456245528",
			typeOfForm: "Glasses Reimbursement Form",
			status: "Approved",
		},
		{
			dateTime: "10/30/2024 - 10:00 AM",
			transactionID: "TRN2093847564",
			typeOfForm: "In-Patient Form",
			status: "Pending",
		},
		{
			dateTime: "10/29/2024 - 2:30 PM",
			transactionID: "TRN2093847565",
			typeOfForm: "Out-Patient Form",
			status: "Pending",
		},
		{
			dateTime: "10/28/2024 - 4:45 PM",
			transactionID: "TRN2093847566",
			typeOfForm: "Glasses Reimbursement Form",
			status: "Pending",
		},
	]);

	const pendingRecords = records.filter(
		(record) => record.status === "Pending"
	);
	const previousRecords = records.filter(
		(record) => record.status === "Approved" || record.status === "Rejected"
	);

	return (
		<section className={styles.TrackingPage}>
			<Tabs>
				<div title="PENDING REQUESTS" className={styles.Tabby}>
					<section className={styles["tab-content"]}>
						<h3>PENDING REQUESTS</h3>
						<RecordTable records={pendingRecords} />
					</section>
				</div>
				<div title="PREVIOUS RECORDS" className={styles.Tabby}>
					<section className={styles["tab-content"]}>
						<h3>PREVIOUS RECORDS</h3>
						<RecordTable records={previousRecords} />
					</section>
				</div>
			</Tabs>
		</section>
	);
};

export default TrackingPage;
