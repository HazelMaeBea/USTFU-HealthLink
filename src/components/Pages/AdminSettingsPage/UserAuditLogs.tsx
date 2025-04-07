import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../contexts/firebase"; // Updated to match UserManagement
import "./AuditLogsPopout.css";
import PageButtons from "../../Page Elements/PageButtons/PageButtons";

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
		const fetchAuditLogs = async () => {
			try {
				const querySnapshot = await getDocs(collection(db, "auditLogs"));
				const logs: AuditLog[] = querySnapshot.docs.map((doc) => {
					const data = doc.data();
					return {
						timestamp: data.Time.toDate().toLocaleString(), // Convert Firebase Timestamp to readable string
						name: data.Name,
						changes: data.Changes,
					};
				});
				// Sort logs by latest time change
				logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
				setAuditLogs(logs);
			} catch (error) {
				console.error("Error fetching audit logs:", error);
			}
		};

		fetchAuditLogs();
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
						<th>Time</th>
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
