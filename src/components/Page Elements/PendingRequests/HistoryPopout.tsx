import React, { useState } from "react";
import PageButtons from "../PageButtons/PageButtons";
import "./HistoryPopout.css";
import type { Archive } from "./types";
import { usePendingRequests } from "../PendingRequests/PendingRequestBackend";

interface HistoryPopoutProps {
	onClose: () => void;
}

const recordsPerPage = 7;

const HistoryPopout: React.FC<HistoryPopoutProps> = ({ onClose }) => {
	const [currentPage, setCurrentPage] = useState(1);
	const pendingRequests = usePendingRequests();

	const formatTableData = (request: Archive) => {
		const { formData, dateSubmitted } = request;

		return {
			formType: formData.formType,
			dateApproved: dateSubmitted || "-",
			natureOfIllness:
				formData.formType === "hospital" ? formData.illness || "-" : "-",
			physician:
				formData.formType === "hospital" ? formData.physician || "-" : "-",
			procedures:
				formData.formType === "hospital" ? formData.procedures || "-" : "-",
			remainingBenefits: "-",
		};
	};

	const tableData = pendingRequests.map(formatTableData);

	const sortedData = [...tableData].sort((a, b) => {
		const dateA =
			a.dateApproved !== "-" ? new Date(a.dateApproved).getTime() : 0;
		const dateB =
			b.dateApproved !== "-" ? new Date(b.dateApproved).getTime() : 0;
		return dateB - dateA; // Descending order (latest date first)
	});

	// Compute total pages
	const totalPages = Math.ceil(sortedData.length / recordsPerPage);

	const currentRecords = sortedData.slice(
		(currentPage - 1) * recordsPerPage,
		currentPage * recordsPerPage
	);

	return (
		<div className="history-popout">
			<div className="history-popout-content">
				<button className="close-button" onClick={onClose}>
					&times;
				</button>
				<h2>Laufey Lin</h2>
				<table className="history-table">
					<thead>
						<tr>
							<th>Form Type</th>
							<th>Date Approved</th>
							<th>Nature of Illness</th>
							<th>Physician</th>
							<th>Procedures</th>
							<th>Remaining Benefits</th>
						</tr>
					</thead>
					<tbody>
						{currentRecords.length > 0 ? (
							currentRecords.map((row, index) => (
								<tr key={index}>
									<td>{row.formType}</td>
									<td>{row.dateApproved}</td>
									<td>{row.natureOfIllness}</td>
									<td>{row.physician}</td>
									<td>{row.procedures}</td>
									<td>{row.remainingBenefits}</td>
								</tr>
							))
						) : (
							<tr>
								<td colSpan={13} style={{ textAlign: "center" }}>
									No records available
								</td>
							</tr>
						)}
					</tbody>
				</table>
				{totalPages > 1 && (
					<PageButtons
						currentPage={currentPage}
						totalPages={totalPages}
						onPageChange={setCurrentPage}
					/>
				)}
			</div>
		</div>
	);
};

export default HistoryPopout;
