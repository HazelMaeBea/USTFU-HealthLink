import "../Page Elements/AdminSettings/AdminSettings.css";

import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../../config/firebase";
import { BsCheckAll } from "react-icons/bs";
import { TbSearch } from "react-icons/tb";
import { RxHamburgerMenu } from "react-icons/rx";
import {
	MdOutlineKeyboardArrowLeft,
	MdOutlineKeyboardArrowRight,
} from "react-icons/md";

import Popout from "../Page Elements/Popout/Popout";
import VerificationPage from "../Page Elements/AdminSettings/VerificationPage";

interface User {
	displayName: string;
	email: string;
	college: string;
	role: string;
	status: string;
}

const AdminSettings = () => {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState("userManagement");
	const [showPopout, setShowPopout] = useState(false);
	// Added state for search query
	const [searchQuery, setSearchQuery] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const usersPerPage = 7; /* Set how many users are displayed */

	useEffect(() => {
		const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
			if (currentUser) {
				const unsubscribeUsers = onSnapshot(
					collection(db, "users"),
					(snapshot) => {
						const sortedUsers = snapshot.docs
							.map((doc) => {
								const data = doc.data();
								return {
									displayName: data.displayName || "Unknown",
									email: data.email || "Unknown",
									status: data.status || "INACTIVE",
									college: data.college || "UNAFFILIATED",
									role: data.role || "member",
								};
							})
							.sort((a, b) =>
								a.displayName.localeCompare(b.displayName)
							) as User[];
						setUsers(sortedUsers);
						setLoading(false);
					}
				);
				return () => unsubscribeUsers();
			} else {
				setLoading(false);
				setUsers([]);
			}
		});
		return () => unsubscribeAuth();
	}, []);

	const handleEditClick = () => {
		setShowPopout(true);
	};

	const handleSaveConfirm = () => {
		console.log("Saving changes...");
		setShowPopout(false);
	};

	const handleCancel = () => {
		setShowPopout(false);
	};

	// Filter users based on search query (for userManagement)
	const filteredUsers = users.filter((user) => {
		const query = searchQuery.toLowerCase();
		return (
			user.displayName.toLowerCase().includes(query) ||
			user.email.toLowerCase().includes(query) ||
			user.college.toLowerCase().includes(query) ||
			user.role.toLowerCase().includes(query) ||
			user.status.toLowerCase().includes(query)
		);
	});

	// Pagination for userManagement tab
	const indexOfLastUser = currentPage * usersPerPage;
	const indexOfFirstUser = indexOfLastUser - usersPerPage;
	const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
	const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
	if (loading) return <div>Loading...</div>;

	return (
		<div className="admin-settings-container">
			{/* Tabs & Search */}
			<div className="row align-items-center">
				<div className="col-md-6">
					<button
						className={`ustfu-as-btn tab-btn ${
							activeTab === "userManagement" ? "active-tab" : ""
						}`}
						onClick={() => {
							setActiveTab("userManagement");
							setCurrentPage(1);
						}}
					>
						USER MANAGEMENT
					</button>
					<button
						className={`ustfu-as-btn tab-btn ${
							activeTab === "registrationVerification"
								? "active-tab"
								: ""
						}`}
						onClick={() => {
							setActiveTab("registrationVerification");
							setCurrentPage(1);
						}}
					>
						REGISTRATION VERIFICATION
					</button>
				</div>
				<div className="col-md-6">
					<div className="search-container">
						<RxHamburgerMenu className="burger-icon" />
						<input
							type="search"
							placeholder="Search"
							className="ustfu-form-control search-input"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
						<TbSearch className="admin-search-icon" />
					</div>
				</div>
			</div>

			<hr className="ustfu-hr" />

			{activeTab === "userManagement" && (
				<>
					{/* Table for User Management */}
					<table className="user-mngmnt-table">
						<thead className="user-mngmnt-table-header">
							<tr>
								<th>NAME</th>
								<th>EMAIL ADDRESS</th>
								<th>COLLEGE</th>
								<th>ROLE</th>
								<th>STATUS</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{currentUsers.map((user, i) => (
								<tr key={i}>
									<td>{user.displayName}</td>
									<td>{user.email}</td>
									<td>{user.college}</td>
									<td>
										<select
											value={
												typeof user.role === "string"
													? user.role.toLowerCase()
													: ""
											}
											className="item-select"
											aria-label="Select Role"
										>
											<option value="member">
												MEMBER
											</option>
											<option value="operations handler">
												OPERATIONS HANDLER
											</option>
											<option value="retiree">
												RETIREE
											</option>
										</select>
									</td>
									<td>
										<select
											value={user.status}
											className="item-select"
											aria-label="Select Status"
											style={{
												backgroundColor:
													"ACTIVE" === user.status
														? "hsl(134, 61%, 85%)"
														: "hsl(354, 70%, 85%)",
											}}
										>
											<option value="ACTIVE">
												ACTIVE
											</option>
											<option value="INACTIVE">
												INACTIVE
											</option>
										</select>
									</td>
									<td>
										<button
											className="save-btn"
											onClick={handleEditClick}
										>
											<BsCheckAll
												className="save-icon"
												size={20}
											/>{" "}
											SAVE
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
					{/* Updated Pagination for User Management */}
					<div className="pagination">
						<div className="d-flex align-items-center gap-2">
							<button
								onClick={() =>
									currentPage > 1 &&
									setCurrentPage(currentPage - 1)
								}
								className="as-page-item"
								aria-label="Previous Page"
							>
								<MdOutlineKeyboardArrowLeft size={24} />
							</button>
							<input
								type="number"
								min={1}
								max={totalPages}
								value={currentPage}
								onChange={(e) => {
									const val = Number(e.target.value);
									if (val >= 1 && val <= totalPages)
										setCurrentPage(val);
								}}
								style={{
									width: "2rem",
									textAlign: "center",
									padding: "0.25rem",
								}}
								aria-label="Current Page"
							/>
							<button
								onClick={() =>
									currentPage < totalPages &&
									setCurrentPage(currentPage + 1)
								}
								className="as-page-item"
								aria-label="Next Page"
							>
								<MdOutlineKeyboardArrowRight size={24} />
							</button>
						</div>
					</div>
				</>
			)}

			{activeTab === "registrationVerification" && (
				// Registration Verification content placeholder
				<div className="registration-verification-container">
					<VerificationPage />
				</div>
			)}

			{showPopout && (
				<Popout
					title="Save Changes?"
					message="Do you want to save changes to the user?"
					onConfirm={handleSaveConfirm}
					onCancel={handleCancel}
					isOpen={showPopout}
				/>
			)}
		</div>
	);
};

export default AdminSettings;
