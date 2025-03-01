import React, { useState, useEffect } from "react";
import "./AdminSettings.css";
import PageButtons from "../PageButtons/PageButtons";

interface AuditLog {
	timestamp: string;
	changes: string;
}

const UserAuditLogs: React.FC = () => {
	const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const logsPerPage = 5;

	useEffect(() => {
		// Fetch audit logs from a data source or API
		// For now, we'll use a static example
		const logs: AuditLog[] = [
			{
				timestamp: "2023-10-01 10:00:00",
				changes: "College from 'Engineering' to 'Science'",
			},
			{
				timestamp: "2023-10-02 14:30:00",
				changes: "Role from 'Member' to 'Operations Handler'",
			},
			{
				timestamp: "2023-10-02 14:30:00",
				changes: "Role from 'Member' to 'Operations Handler'",
			},
			{
				timestamp: "2023-10-02 14:30:00",
				changes: "Role from 'Member' to 'Operations Handler'",
			},
			{
				timestamp: "2023-10-02 14:30:00",
				changes: "Role from 'Member' to 'Operations Handler'",
			},
			{
				timestamp: "2023-10-02 14:30:00",
				changes: "Role from 'Member' to 'Operations Handler'",
			},
			{
				timestamp: "2023-10-02 14:30:00",
				changes: "Role from 'Member' to 'Operations Handler'",
			},
			{
				timestamp: "2023-10-02 14:30:00",
				changes: "Role from 'Member' to 'Operations Handler'",
			},
			{
				timestamp: "2023-10-02 14:30:00",
				changes: "Role from 'Member' to 'Operations Handler'",
			},
			{
				timestamp: "2023-10-02 14:30:00",
				changes: "Role from 'Member' to 'Operations Handler'",
			}, 	
		];
		setAuditLogs(logs);
	}, []);

	const indexOfLastLog = currentPage * logsPerPage;
	const indexOfFirstLog = indexOfLastLog - logsPerPage;
	const currentLogs = auditLogs.slice(indexOfFirstLog, indexOfLastLog);
	const totalPages = Math.ceil(auditLogs.length / logsPerPage);

	return (
		<div className="audit-logs-container">
			<table className="audit-logs-table">
				<thead>
					<tr>
						<th>Date</th>
						<th>Changes</th>
					</tr>
				</thead>
				<tbody>
					{currentLogs.map((log, index) => (
						<tr key={index}>
							<td>{log.timestamp}</td>
							<td>{log.changes}</td>
						</tr>
					))}
				</tbody>
			</table>
			{totalPages > 1 && (
				<PageButtons
					currentPage={currentPage}
					totalPages={totalPages}
					onPageChange={(page) => setCurrentPage(page)}
				/>
			)}
		</div>
	);
};

export default UserAuditLogs;
