import { useState } from "react";
import "./TrackingPage.css";
import Tabs from "./Tabs";
import RecordTable from "./RecordTable";
import PageButtons from "../PageButtons/PageButtons";
import StatusTracking from "./StatusTracking";
import useTrackingRecords from "./useTrackingRecord";
import { Record } from "../PendingRequests/types";

const TrackingPage = () => {
	const [activeTab, setActiveTab] = useState(0);
	const [pendingCurrentPage, setPendingCurrentPage] = useState(1);
	const [previousCurrentPage, setPreviousCurrentPage] = useState(1);

	const [selectedRecord, setSelectedRecord] = useState<{
		transactionID: string;
		dateTime: Date;
		status: string;
	} | null>(null);

	const { pendingRecords, accomplishedRecords } = useTrackingRecords();
	const recordsPerPage = 7;

	const pendingTotalPages = Math.ceil(pendingRecords.length / recordsPerPage);
	const previousTotalPages = Math.ceil(
		accomplishedRecords.length / recordsPerPage
	);

	const pendingCurrentRecords: Record[] = pendingRecords.slice(
		// Use the shared type
		(pendingCurrentPage - 1) * recordsPerPage,
		pendingCurrentPage * recordsPerPage
	);
	const previousCurrentRecords: Record[] = accomplishedRecords.slice(
		// Use the shared type
		(previousCurrentPage - 1) * recordsPerPage,
		previousCurrentPage * recordsPerPage
	);

	const handleDetailsClick = (
		transactionID: string,
		dateTime: Date,
		status: string
	) => {
		console.log("Details Clicked:", { transactionID, dateTime, status });
		setSelectedRecord({ transactionID, dateTime, status });
		console.log("Selected Record State:", selectedRecord);
	};

	return (
		<section className="TrackingPage">
			<Tabs
				activeTab={activeTab}
				onTabChange={(tabIndex) => {
					setActiveTab(tabIndex);
					setSelectedRecord(null);
				}}
			>
				<div title="PENDING REQUESTS" className="Tabby">
					<section className="tab-content">
						<h3>PENDING REQUESTS</h3>
						{selectedRecord ? (
							<StatusTracking
								onBack={() => setSelectedRecord(null)}
								transactionID={selectedRecord.transactionID}
								status={selectedRecord.status}
								dateTime={selectedRecord.dateTime} // Pass the Date object
							/>
						) : (
							<>
								<RecordTable
									records={pendingCurrentRecords}
									onDetailsClick={handleDetailsClick}
								/>
								<div
									className="page-buttons-container"
									style={{
										width: "100%",
										display: "flex",
										justifyContent: "center",
										marginTop: "1rem",
									}}
								>
									<div style={{ display: "inline-block" }}>
										<PageButtons
											currentPage={pendingCurrentPage}
											totalPages={pendingTotalPages}
											onPageChange={setPendingCurrentPage}
										/>
									</div>
								</div>
							</>
						)}
					</section>
				</div>
				<div title="PREVIOUS RECORDS" className="Tabby">
					<section className="tab-content">
						<h3>PREVIOUS RECORDS</h3>
						{selectedRecord ? (
							<StatusTracking
								onBack={() => setSelectedRecord(null)}
								transactionID={selectedRecord.transactionID}
								status={selectedRecord.status}
								dateTime={selectedRecord.dateTime} // Pass the Date object
							/>
						) : (
							<>
								<RecordTable
									records={previousCurrentRecords}
									onDetailsClick={handleDetailsClick}
								/>
								<div
									className="page-buttons-container"
									style={{
										width: "100%",
										display: "flex",
										justifyContent: "center",
										marginTop: "1rem",
									}}
								>
									<div style={{ display: "inline-block" }}>
										<PageButtons
											currentPage={previousCurrentPage}
											totalPages={previousTotalPages}
											onPageChange={
												setPreviousCurrentPage
											}
										/>
									</div>
								</div>
							</>
						)}
					</section>
				</div>
			</Tabs>
		</section>
	);
};

export default TrackingPage;
