import { useState } from "react";
import "./TrackingPage.css";
import Tabs from "./Tabs";
import RecordTable from "./RecordTable";
import PageButtons from "../PageButtons/PageButtons";
import StatusTracking from "./StatusTracking";

const TrackingPage = () => {
	// Tab state: 0 = Pending Requests, 1 = Previous Records
	const [activeTab, setActiveTab] = useState(0);

	// Separate pagination states for each tab
	const [pendingCurrentPage, setPendingCurrentPage] = useState(1);
	const [previousCurrentPage, setPreviousCurrentPage] = useState(1);

	// Store the selected record's transaction ID
	const [selectedRecord, setSelectedRecord] = useState<{
		transactionID: string;
		typeOfForm: string;
	} | null>(null);

	const handleDetailsClick = (transactionID: string, typeOfForm: string) => {
		setSelectedRecord({ transactionID, typeOfForm });
	};

	const recordsPerPage = 7;

	// Dummy data for testing pagination
	const pendingDummyRecords = Array.from({ length: 30 }, (_, index) => ({
		dateTime: `10/28/2024 - ${10 + index}:00 AM`,
		transactionID: `TRN-PENDING-${index + 1}`,
		typeOfForm: "In-Patient Form",
		status: "Pending",
	}));
	const previousDummyRecords = Array.from({ length: 15 }, (_, index) => ({
		dateTime: `10/27/2024 - ${9 + index}:00 AM`,
		transactionID: `TRN-PREVIOUS-${index + 1}`,
		typeOfForm: "Out-Patient Form",
		status: index % 2 === 0 ? "Approved" : "Rejected",
	}));
	const allRecords = [...pendingDummyRecords, ...previousDummyRecords];

	// Filter pending and previous records
	const pendingRecords = allRecords.filter(
		(record) => record.status === "Pending"
	);
	const previousRecords = allRecords.filter(
		(record) => record.status === "Approved" || record.status === "Rejected"
	);

	// Calculate total pages
	const pendingTotalPages = Math.ceil(pendingRecords.length / recordsPerPage);
	const previousTotalPages = Math.ceil(previousRecords.length / recordsPerPage);

	// Slice records based on pagination
	const pendingCurrentRecords = pendingRecords.slice(
		(pendingCurrentPage - 1) * recordsPerPage,
		pendingCurrentPage * recordsPerPage
	);
	const previousCurrentRecords = previousRecords.slice(
		(previousCurrentPage - 1) * recordsPerPage,
		previousCurrentPage * recordsPerPage
	);

	return (
		<section className="TrackingPage">
			<Tabs activeTab={activeTab} onTabChange={setActiveTab}>
				<div title="PENDING REQUESTS" className="Tabby">
					<section className="tab-content">
						<h3>PENDING REQUESTS</h3>
						{selectedRecord ? (
							<StatusTracking
								onBack={() => setSelectedRecord(null)}
								transactionID={selectedRecord.transactionID} // Pass correct transaction ID
								typeOfForm={selectedRecord.typeOfForm}
							/>
						) : (
							<>
								<RecordTable
									records={pendingCurrentRecords}
									onDetailsClick={handleDetailsClick}
									// Store clicked transaction ID
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
								transactionID={selectedRecord.transactionID} // Pass correct transaction ID
								typeOfForm={selectedRecord.typeOfForm}
							/>
						) : (
							<>
								<RecordTable
									records={previousCurrentRecords}
									onDetailsClick={handleDetailsClick} // Store clicked transaction ID
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
