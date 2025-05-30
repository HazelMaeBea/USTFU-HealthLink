import React, { useEffect, useState } from "react";
import styles from "./HistoryPopout.module.css";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import PageButtons from "../../Page Elements/PageButtons/PageButtons"; // new import

interface HistoryPopoutProps {
	onClose: () => void;
	requester: string;
}

interface HistoryItem {
	date: string;
	description: string;
	amount: number;
}

const HistoryPopout: React.FC<HistoryPopoutProps> = ({ onClose, requester }) => {
	const [history, setHistory] = useState<HistoryItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);
	const recordsPerPage = 5; // show 5 records per page

	useEffect(() => {
		let isMounted = true; // cancellation flag

		const fetchHistory = async () => {
			try {
				setLoading(true);

				// Query Firestore for history records for the requester
				const db = getFirestore();
				const accomplishedRef = collection(db, "AccomplishedRequests");
				const accomplishedQuery = query(accomplishedRef, where("requester", "==", requester));
				const querySnapshot = await getDocs(accomplishedQuery);
				const fetchedHistory: HistoryItem[] = [];
				querySnapshot.forEach((doc) => {
					const data = doc.data();
					// Check that benefitHistory exists and has a date property before using it
					if (data.benefitHistory && data.benefitHistory.date) {
						fetchedHistory.push({
							date: data.benefitHistory.date.toDate().toLocaleDateString(), // convert timestamp from Firestore
							description: `${data.benefitHistory.formType} ${data.benefitHistory.transactionId}`,
							amount: data.benefitHistory.remainingBenefit,
						});
					} else {
						console.warn(`Skipped doc ${doc.id}: missing benefitHistory or date field.`);
					}
				});

				// Sort history in descending order by date
				fetchedHistory.sort(
					(a, b) => new Date(b.date).valueOf() - new Date(a.date).valueOf()
				);

				if (isMounted) {
					setHistory(fetchedHistory);
					setLoading(false);
				}
			} catch (error) {
				console.error("Error fetching history:", error);
				if (isMounted) {
					setLoading(false);
				}
			}
		};

		if (requester) {
			fetchHistory();
		}

		return () => {
			isMounted = false;
		};
	}, [requester]);

	// Calculate pagination variables
	const totalPages = Math.ceil(history.length / recordsPerPage);
	const indexOfLastRecord = currentPage * recordsPerPage;
	const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
	const paginatedHistory = history.slice(indexOfFirstRecord, indexOfLastRecord);

	return (
		<div className={styles["history-popout-overlay"]}>
			<div className={styles["history-popout-content"]}>
				<button className={styles["close-button"]} onClick={onClose}>
					&times;
				</button>
				<div className={styles["history-popout-header"]}>
					<h2>Benefit History</h2>
				</div>
				<div className={styles["history-popout-body"]}>
					<div className={styles["user-info"]}>
						<h3>User: {requester}</h3>
					</div>
					{loading ? (
						<div className={styles["loading-container"]}>
							<div className={styles["loading-spinner"]}></div>
							<div className={styles["loading-text"]}>
								Loading history data...
							</div>
						</div>
					) : (
						<>
							{history.length > 0 ? (
								<>
									<table className={styles["history-table"]}>
										<thead>
											<tr>
												<th>Date</th>
												<th>Transaction</th>
												<th>Remaining Benefits</th>
											</tr>
										</thead>
										<tbody>
											{paginatedHistory.map((item, index) => (
												<tr key={index}>
													<td>{item.date}</td>
													<td>{item.description}</td>
													<td className={styles["amount-column"]}>
														₱{item.amount.toLocaleString()}
													</td>
												</tr>
											))}
										</tbody>
									</table>
									{/* Pagination layout copied from PendingRequestsList */}
									<div className={styles.paginationContainer}>
										<div className={styles.recordInfo}>
											Showing {indexOfFirstRecord + 1} to{" "}
											{Math.min(indexOfLastRecord, history.length)} of {history.length} results
										</div>
										<div className={styles.pageButtonsContainer}>
											<PageButtons
												currentPage={currentPage}
												totalPages={totalPages}
												onPageChange={(page: number) => setCurrentPage(page)}
											/>
										</div>
									</div>
								</>
							) : (
								<div className={styles["no-history-message"]}>
									No history records found for this user.
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
};

export default HistoryPopout;
