import React, { useEffect, useState } from "react";
import "./HistoryPopout.css";

interface HistoryPopoutProps {
	onClose: () => void;
	requester: string;
}

interface HistoryItem {
	date: string;
	description: string;
	amount: number;
}

const HistoryPopout: React.FC<HistoryPopoutProps> = ({
	onClose,
	requester,
}) => {
	const [history, setHistory] = useState<HistoryItem[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Fetch history data for the requester
		const fetchHistory = async () => {
			try {
				// In a real application, you would fetch data from your backend
				// For now, we'll simulate a delay and return mock data
				setLoading(true);

				// Simulate API call delay
				await new Promise((resolve) => setTimeout(resolve, 1000));

				// Example mock data based on requester
				const mockHistory: HistoryItem[] = [
					{
						date: "01/15/2024",
						description: "Health Claim - Hospital",
						amount: 5000,
					},
					{
						date: "11/02/2023",
						description: "Health Claim - Outpatient",
						amount: 2500,
					},
					{
						date: "09/17/2023",
						description: "Health Claim - Dental",
						amount: 1500,
					},
				];

				setHistory(mockHistory);
				setLoading(false);
			} catch (error) {
				console.error("Error fetching history:", error);
				setLoading(false);
			}
		};

		if (requester) {
			fetchHistory();
		}
	}, [requester]);

	return (
		<div className="history-popout-overlay">
			<div className="history-popout-content">
				<div className="history-popout-header">
					<h2>Benefit History</h2>
					<button className="close-button" onClick={onClose}>
						×
					</button>
				</div>
				<div className="history-popout-body">
					<div className="user-info">
						<h3>User: {requester}</h3>
					</div>

					{loading ? (
						<div className="loading-spinner">
							Loading history data...
						</div>
					) : (
						<>
							{history.length > 0 ? (
								<table className="history-table">
									<thead>
										<tr>
											<th>Date</th>
											<th>Description</th>
											<th>Amount (PHP)</th>
										</tr>
									</thead>
									<tbody>
										{history.map((item, index) => (
											<tr key={index}>
												<td>{item.date}</td>
												<td>{item.description}</td>
												<td className="amount-column">
													₱
													{item.amount.toLocaleString()}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							) : (
								<div className="no-history-message">
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
