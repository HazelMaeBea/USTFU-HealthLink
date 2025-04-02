import React, { useState } from "react";
import "./AuditLogsPopout.css";
import PageButtons from "../PageButtons/PageButtons";

interface AuditLogsPopoutProps {
	title: string;
	onClose: () => void;
	isOpen: boolean;
	children: React.ReactNode;
}

const AuditLogsPopout: React.FC<AuditLogsPopoutProps> = ({ title, onClose, isOpen, children }) => {
	const [currentPage, setCurrentPage] = useState(1);
	const logsPerPage = 7;

	if (!isOpen) return null;

	const childrenArray = React.Children.toArray(children);
	const indexOfLastLog = currentPage * logsPerPage;
	const indexOfFirstLog = indexOfLastLog - logsPerPage;
	const currentLogs = childrenArray.slice(indexOfFirstLog, indexOfLastLog);
	const totalPages = Math.ceil(childrenArray.length / logsPerPage);

	return (
		<div className="audit-logs-popout-overlay">
			<div className="audit-logs-popout">
				<div className="audit-logs-popout-header">
					<h2>{title}</h2>
					<button className="close-btn" onClick={onClose}>&times;</button>
				</div>
				<div className="audit-logs-popout-body">
					{currentLogs}
				</div>
				{totalPages > 1 && (
					<PageButtons
						currentPage={currentPage}
						totalPages={totalPages}
						onPageChange={(page) => setCurrentPage(page)}
					/>
				)}
			</div>
		</div>
	);
};

export default AuditLogsPopout;
