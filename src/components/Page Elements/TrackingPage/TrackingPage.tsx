import { useState } from "react";
import "./TrackingPage.css";
import Tabs from "./Tabs";
import RecordTable from "./RecordTable";
import PageButtons from "../PageButtons/PageButtons";
import StatusTracking from "./StatusTracking";
import useTrackingRecords from "./useTrackingRecord";

const TrackingPage = () => {
	// Tab state: 0 = Pending Requests, 1 = Previous Records
	const [activeTab, setActiveTab] = useState(0);

	// Separate pagination states for each tab
	const [pendingCurrentPage, setPendingCurrentPage] = useState(1);
	const [previousCurrentPage, setPreviousCurrentPage] = useState(1);

	// Store the selected record's transaction ID, typeOfForm, and status
	const [selectedRecord, setSelectedRecord] = useState<{
		transactionID: string;
		dateTime: string;
		status: string;
	} | null>(null);

	// Fetch records from Firestore
	const { pendingRecords, previousRecords } = useTrackingRecords();

	const recordsPerPage = 7;

	// Calculate total pages
	const pendingTotalPages = Math.ceil(pendingRecords.length / recordsPerPage);
	const previousTotalPages = Math.ceil(
		previousRecords.length / recordsPerPage
	);

	// Slice records based on pagination
	const pendingCurrentRecords = pendingRecords.slice(
		(pendingCurrentPage - 1) * recordsPerPage,
		pendingCurrentPage * recordsPerPage
	);
	const previousCurrentRecords = previousRecords.slice(
		(previousCurrentPage - 1) * recordsPerPage,
		previousCurrentPage * recordsPerPage
	);

	const handleDetailsClick = (
		transactionID: string,
		dateTime: string,
		status: string
	) => {
		setSelectedRecord({ transactionID, dateTime, status });
	};

	return (
		<section className="TrackingPage">
			<Tabs
				activeTab={activeTab}
				onTabChange={(tabIndex) => {
					setActiveTab(tabIndex);
					setSelectedRecord(null); // Reset selectedRecord when switching tabs
				}}
			>
				<div title="PENDING REQUESTS" className="Tabby">
					<section className="tab-content">
						<h3>PENDING REQUESTS</h3>
						{selectedRecord ? (
							<StatusTracking
								onBack={() => setSelectedRecord(null)}
								transactionID={selectedRecord.transactionID}
								status={selectedRecord.status} // Pass status here
								dateTime={selectedRecord.dateTime}
							/>
						) : (
							<>
								<RecordTable
									records={pendingCurrentRecords}
									onDetailsClick={handleDetailsClick}
								/>
								<PageButtons
									currentPage={pendingCurrentPage}
									totalPages={pendingTotalPages}
									onPageChange={setPendingCurrentPage}
								/>
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
								status={selectedRecord.status} // Pass status here
								dateTime={selectedRecord.dateTime}
							/>
						) : (
							<>
								<RecordTable
									records={previousCurrentRecords}
									onDetailsClick={handleDetailsClick}
								/>
								<PageButtons
									currentPage={previousCurrentPage}
									totalPages={previousTotalPages}
									onPageChange={setPreviousCurrentPage}
								/>
							</>
						)}
					</section>
				</div>
			</Tabs>
		</section>
	);
};

export default TrackingPage;
