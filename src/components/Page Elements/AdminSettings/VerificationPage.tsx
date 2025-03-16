import "./AdminSettings.css";
import "./VerificationPage.css";
import { useState } from "react";
import { MdOutlineIndeterminateCheckBox } from "react-icons/md";
import Popout from "../Popout/Popout";
import PageButtons from "../PageButtons/PageButtons"; // Import PageButtons component

interface VerificationRequest {
	name: string;
	email: string;
	role: string;
	selected: boolean;
}

const VerificationPage = () => {
	// Generate sample data
	const generateSampleData = () => {
		return Array.from({ length: 25 }, (_, i) => ({
			name: `DOE, JANE JACQUXVIOUS ${i + 1}`,
			email: `JANEJACQUXVIOUS.DOE${i + 1}@UST.EDU.PH`,
			role: "MEMBER",
			selected: false,
		}));
	};

	const [requests, setRequests] = useState<VerificationRequest[]>(
		generateSampleData()
	);
	const [selectAll, setSelectAll] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const requestsPerPage = 7;

	// State for popout confirmation
	const [popoutOpen, setPopoutOpen] = useState(false);
	const [popoutTitle, setPopoutTitle] = useState("");
	const [popoutMessage, setPopoutMessage] = useState("");
	const [pendingAction, setPendingAction] = useState<() => void>(() => {});

	// Remove headerCheckboxRef; compute indeterminate directly:
	const isIndeterminate =
		requests.some((req) => req.selected) &&
		!requests.every((req) => req.selected);

	const handleSelectAll = () => {
		setSelectAll(!selectAll);
		setRequests(requests.map((req) => ({ ...req, selected: !selectAll })));
	};

	const handleSelect = (index: number) => {
		const newRequests = [...requests];
		const actualIndex = (currentPage - 1) * requestsPerPage + index;
		newRequests[actualIndex].selected = !newRequests[actualIndex].selected;
		setRequests(newRequests);
		setSelectAll(newRequests.every((req) => req.selected));
	};

	// New handler for role change via dropdown
	const handleRoleChange = (index: number, newRole: string) => {
		const newRequests = [...requests];
		const actualIndex = (currentPage - 1) * requestsPerPage + index;
		newRequests[actualIndex].role = newRole;
		setRequests(newRequests);
	};

	// Bulk Actions
	const handleBulkApprove = () => {
		const selectedRequests = requests.filter((req) => req.selected);
		const target =
			selectedRequests.length > 0 ? selectedRequests : requests;
		setPopoutTitle("Confirm Bulk Approval");
		setPopoutMessage(
			selectedRequests.length > 0
				? `Are you sure you want to approve ${selectedRequests.length} selected request(s)?`
				: `No requests are selected. Approve all (${requests.length}) requests?`
		);
		setPendingAction(() => () => {
			console.log("Approved bulk:", target);
		});
		setPopoutOpen(true);
	};

	const handleBulkDeny = () => {
		const selectedRequests = requests.filter((req) => req.selected);
		const target =
			selectedRequests.length > 0 ? selectedRequests : requests;
		setPopoutTitle("Confirm Bulk Denial");
		setPopoutMessage(
			selectedRequests.length > 0
				? `Are you sure you want to deny ${selectedRequests.length} selected request(s)?`
				: `No requests are selected. Deny all (${requests.length}) requests?`
		);
		setPendingAction(() => () => {
			console.log("Denied bulk:", target);
		});
		setPopoutOpen(true);
	};

	// Pagination logic
	const indexOfLastRequest = currentPage * requestsPerPage;
	const indexOfFirstRequest = indexOfLastRequest - requestsPerPage;
	const currentRequests = requests.slice(
		indexOfFirstRequest,
		indexOfLastRequest
	);
	const totalPages = Math.ceil(requests.length / requestsPerPage);

	return (
		<div className="verification-page-container">
			{/* Wrap the table in a responsive container */}
			<div style={{ overflowX: "auto", width: "100%" }}>
				<table
					style={{ minWidth: "600px", borderCollapse: "collapse" }}
					className="verification-table"
				>
					<thead className="verification-page-header">
						<tr className="verification-tr">
							<th className="first-column">
								<button
									onClick={handleSelectAll}
									className="custom-header-checkbox"
									style={{
										background: "none",
										border: "none",
										padding: 0,
										cursor: "pointer",
									}}
								>
									{isIndeterminate ? (
										<MdOutlineIndeterminateCheckBox
											size={24}
										/>
									) : (
										<input
											type="checkbox"
											checked={selectAll}
											readOnly
											style={{ pointerEvents: "none" }}
										/>
									)}
								</button>
							</th>
							<th className="verification-header">NAME</th>
							<th className="verification-header">
								EMAIL ADDRESS
							</th>
							<th className="verification-header">ROLE</th>
							<th className="verification-header">ACTION</th>
						</tr>
					</thead>
					<tbody className="verfication-tbody">
						{currentRequests.map((request, index) => (
							<tr className="verification-tr" key={index}>
								<td className="first-column">
									<input
										type="checkbox"
										checked={request.selected}
										onChange={() => handleSelect(index)}
										className="rounded border-gray-300"
										aria-label="select this user"
									/>
								</td>
								<td className="verfication-td">
									{request.name}
								</td>
								<td className="verfication-td">
									{request.email}
								</td>
								<td className="verfication-td">
									<select
										className="item-select verfication-role"
										value={request.role}
										onChange={(e) =>
											handleRoleChange(
												index,
												e.target.value
											)
										}
										aria-label="Select Role"
									>
										<option value="MEMBER">MEMBER</option>
										<option value="OPERATIONS HANDLER">
											OPERATIONS HANDLER
										</option>
										{/* Add more options as needed */}
									</select>
								</td>
								<td className="verfication-td">
									<div className="d-flex justify-content-center gap-3">
										<button
											className="verification-btn verification-approve-btn"
											onClick={() => {
												setPopoutTitle(
													"Confirm Approval"
												);
												setPopoutMessage(
													`Are you sure you want to approve ${request.name}?`
												);
												setPendingAction(() => () => {
													console.log(
														"Approve:",
														request.name
													);
												});
												setPopoutOpen(true);
											}}
										>
											APPROVE
										</button>

										<button
											className="verification-btn deny-btn"
											onClick={() => {
												setPopoutTitle(
													"Confirm Denial"
												);
												setPopoutMessage(
													`Are you sure you want to deny ${request.name}?`
												);
												setPendingAction(() => () => {
													console.log(
														"Deny:",
														request.name
													);
												});
												setPopoutOpen(true);
											}}
										>
											DENY
										</button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Updated controls container matching AdminSettings */}
			<div className="controls-container">
				<div className="pagination-container">
					<PageButtons
						currentPage={currentPage}
						totalPages={totalPages}
						onPageChange={(page) => setCurrentPage(page)}
					/>
				</div>
				<div className="action-buttons">
					<button
						className="bulk-btn bulk-approve"
						onClick={handleBulkApprove}
					>
						APPROVE ALL
					</button>
					<button
						className="bulk-btn bulk-deny"
						onClick={handleBulkDeny}
					>
						DENY ALL
					</button>
				</div>
			</div>

			{/* Popout Confirmation */}
			{popoutOpen && (
				<Popout
					title={popoutTitle}
					message={popoutMessage}
					onConfirm={() => {
						pendingAction();
						setPopoutOpen(false);
					}}
					onCancel={() => setPopoutOpen(false)}
					isOpen={popoutOpen}
				/>
			)}
		</div>
	);
};

export default VerificationPage;
