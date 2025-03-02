import React, { useState, useEffect } from "react";
import "./AuditLogsPopout.css";
import PageButtons from "../PageButtons/PageButtons";

interface AuditLog {
	timestamp: string;
	name: string;
	changes: string;
}

const UserAuditLogs: React.FC = () => {
	const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const logsPerPage = 20;

	useEffect(() => {
		// Temporary static data including the "name" property.
		const logs: AuditLog[] = [
			{
				timestamp: "2023-10-01 10:00:00",
				name: "Alice Johnson",
				changes: "College from 'Engineering' to 'Science'"
			},
			{
				timestamp: "2023-10-02 14:30:00",
				name: "Bob Smith",
				changes: "Role from 'Member' to 'Operations Handler'"
			},
			{
				timestamp: "2023-10-03 09:15:00",
				name: "Charlie Brown",
				changes: "Status updated from 'ACTIVE' to 'INACTIVE'"
			},
			{
				timestamp: "2023-10-04 11:45:00",
				name: "Dana White",
				changes: "Leave dates updated"
			},
			{
				timestamp: "2023-10-05 16:00:00",
				name: "Evan Davis",
				changes: "Inactive Reason changed to 'on-leave'"
			},
			{
				timestamp: "2023-10-05 16:00:00",
				name: "Evan Davis",
				changes: "Inactive Reason changed to 'on-leave'"
			},
			{
				timestamp: "2023-10-05 16:00:00",
				name: "Evan Davis",
				changes: "Inactive Reason changed to 'on-leave'"
			},
			{
				timestamp: "2023-10-05 16:00:00",
				name: "Evan Davis",
				changes: "Inactive Reason changed to 'on-leave'"
			},
			{
				timestamp: "2023-10-05 16:00:00",
				name: "Evan Davis",
				changes: "Inactive Reason changed to 'on-leave'"
			},
			{
				timestamp: "2023-10-05 16:00:00",
				name: "Evan Davis",
				changes: "Inactive Reason changed to 'on-leave'"
			},
			{
				timestamp: "2023-10-05 16:00:00",
				name: "Evan Davis",
				changes: "Inactive Reason changed to 'on-leave'"
			},
			{
				timestamp: "2023-10-05 16:00:00",
				name: "Evan Davis",
				changes: "Inactive Reason changed to 'on-leave'"
			},
			{
				timestamp: "2023-10-05 16:00:00",
				name: "Evan Davis",
				changes: "Inactive Reason changed to 'on-leave'"
			},
			{
				timestamp: "2023-10-05 16:00:00",
				name: "Evan Davis",
				changes: "Inactive Reason changed to 'on-leave'"
			},
			{
				timestamp: "2023-10-05 16:00:00",
				name: "Evan Davis",
				changes: "Inactive Reason changed to 'on-leave'"
			},
			{
				timestamp: "2023-10-05 16:00:00",
				name: "Evan Davis",
				changes: "Inactive Reason changed to 'on-leave'"
			},
			{
				timestamp: "2023-10-05 16:00:00",
				name: "Evan Davis",
				changes: "Inactive Reason changed to 'on-leave'"
			},
			{
				timestamp: "2023-10-05 16:00:00",
				name: "Evan Davis",
				changes: "Inactive Reason changed to 'on-leave'"
			},
			{
				timestamp: "2023-10-05 16:00:00",
				name: "Evan Davis",
				changes: "Inactive Reason changed to 'on-leave'"
			},
			{
				timestamp: "2023-10-05 16:00:00",
				name: "Evan Davis",
				changes: "Inactive Reason changed to 'on-leave'"
			},
			{
				timestamp: "2023-10-05 16:00:00",
				name: "Evan Davis",
				changes: "Inactive Reason changed to 'on-leave'"
			},
			{
				timestamp: "2023-10-05 16:00:00",
				name: "Evan Davis",
				changes: "Inactive Reason changed to 'on-leave'"
			},
			{
				timestamp: "2023-10-05 16:00:00",
				name: "Evan Davis",
				changes: "Inactive Reason changed to 'on-leave'"
			},
			{
				timestamp: "2023-10-05 16:00:00",
				name: "Evan Davis",
				changes: "Inactive Reason changed to 'on-leave'"
			},
			{
				timestamp: "2023-10-05 16:00:00",
				name: "Evan Davis",
				changes: "Inactive Reason changed to 'on-leave'"
			},
			{
				timestamp: "2023-10-05 16:00:00",
				name: "Evan Davis",
				changes: "Inactive Reason changed to 'on-leave'"
			},
			// ...more logs if needed
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
						<th>Timestamp</th>
						<th>Name</th>
						<th>Changes</th>
					</tr>
				</thead>
				<tbody>
					{currentLogs.map((log, index) => (
						<tr key={index}>
							<td>{log.timestamp}</td>
							<td>{log.name}</td>
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
