import "./AdminSettings.css";
import "./VerificationPage.css";
import { useState, useRef, useEffect } from "react";
import {
	MdOutlineKeyboardArrowLeft,
	MdOutlineKeyboardArrowRight,
	MdOutlineIndeterminateCheckBox,
} from "react-icons/md";
import Popout from "../Popout/Popout"; // added import for Popout

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
	const requestsPerPage = 6;

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

	// Pagination handlers
	const handlePrevPage = () => {
		if (currentPage > 1) setCurrentPage(currentPage - 1);
	};
	const handleNextPage = () => {
		if (currentPage < totalPages) setCurrentPage(currentPage + 1);
	};
	const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = Number(e.target.value);
		if (val >= 1 && val <= totalPages) setCurrentPage(val);
	};

	return (
		<div>
			<div>
				<table className="verification-table">
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
										className="item-select"
										value={request.role}
										onChange={(e) =>
											handleRoleChange(
												index,
												e.target.value
											)
										}
									>
										<option value="MEMBER">MEMBER</option>
										<option value="ADMIN">ADMIN</option>
										{/* Add more options as needed */}
									</select>
								</td>
								<td className="verfication-td">
									<div className="d-flex justify-content-center gap-3">
										<button
											className="verification-btn approve-btn"
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

			{/* Updated Pagination and Bulk Action Buttons */}
			<div className="d-flex justify-content-between align-items-center mt-4">
				<div className="d-flex align-items-center gap-2">
					<button onClick={handlePrevPage} className="as-page-item">
						<MdOutlineKeyboardArrowLeft size={24} />
					</button>
					<input
						type="number"
						min={1}
						max={totalPages}
						value={currentPage}
						onChange={handlePageInputChange}
						style={{
							width: "2rem",
							textAlign: "center",
							padding: "0.25rem",
						}}
					/>
					<button onClick={handleNextPage} className="as-page-item">
						<MdOutlineKeyboardArrowRight size={24} />
					</button>
				</div>

				<div className="d-flex gap-2">
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
