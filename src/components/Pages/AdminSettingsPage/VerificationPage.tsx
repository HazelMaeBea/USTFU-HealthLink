import "./AdminSettings.css";
import "./VerificationPage.css";
import { useState, useEffect, useRef } from "react";
import Popout from "../../Page Elements/Popout/Popout";
import PageButtons from "../../Page Elements/PageButtons/PageButtons";
import {
	collection,
	onSnapshot,
	updateDoc,
	query,
	where,
	getDocs,
} from "firebase/firestore";
import { db, auth } from "../../../contexts/firebase";
import { onAuthStateChanged } from "firebase/auth";

interface VerificationRequest {
	id: string;
	name: string;
	email: string;
	role: string;
	selected: boolean;
}

const VerificationPage = () => {
	const [requests, setRequests] = useState<VerificationRequest[]>([]);
	const [selectAll, setSelectAll] = useState(false);
	const [isIndeterminate, setIsIndeterminate] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const requestsPerPage = 7;

	const headerCheckboxRef = useRef<HTMLInputElement>(null);

	// State for popout confirmation
	const [popoutOpen, setPopoutOpen] = useState(false);
	const [popoutTitle, setPopoutTitle] = useState("");
	const [popoutMessage, setPopoutMessage] = useState("");
	const [pendingAction, setPendingAction] = useState<() => void>(() => {});

	useEffect(() => {
		const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
			if (currentUser) {
				const usersRef = collection(db, "users");
				const unverifiedUsersQuery = query(
					usersRef,
					where("verified", "==", false)
				);
				const unsubscribeUsers = onSnapshot(
					unverifiedUsersQuery,
					(snapshot) => {
						const filteredUsers = snapshot.docs
							.map((doc) => {
								const data = doc.data();
								const personalInfo = data.personalInfo || {};
								return {
									id: personalInfo.idNumber || "Unknown",
									name: data.fullName || "Unknown",
									email: data.email || "Unknown",
									role: data.role || "Member",
									selected: false,
									verified: data.verified || false,
								};
							})
							.sort((a, b) =>
								a.name.localeCompare(b.name)
							) as VerificationRequest[];
						setRequests(filteredUsers);
					}
				);
				return () => unsubscribeUsers();
			} else {
				setRequests([]);
			}
		});
		return () => unsubscribeAuth();
	}, []);

	// Update indeterminate state when requests change
	useEffect(() => {
		const selectedCount = requests.filter((req) => req.selected).length;

		if (selectedCount === 0) {
			setSelectAll(false);
			setIsIndeterminate(false);
		} else if (selectedCount === requests.length) {
			setSelectAll(true);
			setIsIndeterminate(false);
		} else {
			setSelectAll(false);
			setIsIndeterminate(true);
		}

		// Set indeterminate property on DOM element
		if (headerCheckboxRef.current) {
			headerCheckboxRef.current.indeterminate =
				selectedCount > 0 && selectedCount < requests.length;
		}
	}, [requests]);

	const handleSelectAll = () => {
		const newSelectAll = !selectAll || isIndeterminate;
		setSelectAll(newSelectAll);
		setIsIndeterminate(false);
		setRequests(
			requests.map((req) => ({ ...req, selected: newSelectAll }))
		);
	};

	const handleSelect = (index: number) => {
		const newRequests = [...requests];
		const actualIndex = (currentPage - 1) * requestsPerPage + index;
		newRequests[actualIndex].selected = !newRequests[actualIndex].selected;
		setRequests(newRequests);
	};

	// New handler for role change via dropdown
	const handleRoleChange = (index: number, newRole: string) => {
		const newRequests = [...requests];
		const actualIndex = (currentPage - 1) * requestsPerPage + index;
		newRequests[actualIndex].role = newRole;
		setRequests(newRequests);
	};

	const handleApprove = async (request: VerificationRequest) => {
		try {
			const userQuery = query(
				collection(db, "users"),
				where("fullName", "==", request.name)
			);

			const querySnapshot = await getDocs(userQuery);
			if (!querySnapshot.empty) {
				const userDoc = querySnapshot.docs[0].ref;

				await updateDoc(userDoc, {
					verified: true,
					role: request.role,
				});
				console.log("Approved:", request.name);
			} else {
				console.log(
					"No user found with the given fullName:",
					request.name
				);
			}
		} catch (error) {
			console.error("Error approving request:", error);
		}
	};

	const handleDeny = async (request: VerificationRequest) => {
		try {
			const userQuery = query(
				collection(db, "users"),
				where("fullName", "==", request.name)
			);

			const querySnapshot = await getDocs(userQuery);
			if (!querySnapshot.empty) {
				const userDoc = querySnapshot.docs[0].ref;

				//await deleteDoc(userDoc);
				console.log("To delete", userDoc);
				console.log("Denied:", request.name);
			} else {
				console.log(
					"No user found with the given fullName:",
					request.name
				);
			}
		} catch (error) {
			console.error("Error denying request:", error);
		}
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
		setPendingAction(() => async () => {
			const namesArray = target.map((req) => req.name); // Extract 'name' field from each item
			const rolesArray = target.reduce(
				(acc: { [key: string]: string }, req) => {
					acc[req.name] = req.role; // Set index as req.name and value as req.role
					return acc;
				},
				{}
			);
			const queryRef = query(
				collection(db, "users"),
				where("fullName", "in", namesArray)
			);
			const querySnapshot = await getDocs(queryRef);

			querySnapshot.forEach(async (doc) => {
				await updateDoc(doc.ref, {
					verified: true,
					role: rolesArray[doc.data().fullName],
				});
				// console.log(rolesArray[doc.data().fullName]);
			});
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
		setPendingAction(() => async () => {
			const namesArray = target.map((req) => req.name); // Extract 'name' field from each item
			const queryRef = query(
				collection(db, "users"),
				where("fullName", "in", namesArray)
			);
			const querySnapshot = await getDocs(queryRef);

			querySnapshot.forEach(async (doc) => {
				// await deleteDoc(doc.ref);
				console.log("Rejected the following docs", doc.data());
			});
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
								<label
									className="custom-checkbox"
									title={
										selectAll
											? "Deselect all"
											: "Select all"
									}
								>
									<input
										type="checkbox"
										checked={selectAll}
										ref={headerCheckboxRef}
										onChange={handleSelectAll}
									/>
									<span className="checkmark"></span>
								</label>
							</th>
							<th className="verification-header">UST ID</th>
							<th className="verification-header">Name</th>
							<th className="verification-header">
								Email Address
							</th>
							<th className="verification-header">Role</th>
							<th className="verification-header">Action</th>
						</tr>
					</thead>
					<tbody className="verfication-tbody">
						{currentRequests.map((request, index) => (
							<tr className="verification-tr" key={index}>
								<td className="first-column">
									<label className="custom-checkbox">
										<input
											type="checkbox"
											checked={request.selected}
											onChange={() => handleSelect(index)}
											aria-label="select this user"
										/>
										<span className="checkmark"></span>
									</label>
								</td>
								<td className="verfication-td">{request.id}</td>
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
										<option value="member">member</option>
										<option value="operations handler">
											operations handler
										</option>
										<option value="retiree">retiree</option>
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
												setPendingAction(
													() => () =>
														handleApprove(request)
												);
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
												setPendingAction(
													() => () =>
														handleDeny(request)
												);
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

			{/* Controls container - No changes needed */}
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
