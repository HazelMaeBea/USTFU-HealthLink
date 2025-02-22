import "../Page Elements/AdminSettings/AdminSettings.css";

import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../../config/firebase";
import { BsCheckAll } from "react-icons/bs";
import { TbSearch } from "react-icons/tb";
import { RxHamburgerMenu } from "react-icons/rx";

import Popout from "../Page Elements/Popout/Popout";
import VerificationPage from "../Page Elements/AdminSettings/VerificationPage";
import PageButtons from "../Page Elements/PageButtons/PageButtons";

interface User {
	displayName: string;
	email: string;
	college: string;
	role: string;
	status: string;
	id: string;
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
	// useStates to determine which document to edit
	const [editUserID, setEditUserID] = useState("");
	const [editUserEmail, setEditUserEmail] = useState("");
	const [editUserStatus, setEditUserStatus] = useState("");
	let initialRoles:string[] = [];
	const [editUserRole, setEditUserRole] = useState(initialRoles);
	const [emptyPopout, setEmptyPopout] = useState(false)

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
									id: doc.id,
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

	const handleEditClick = (id: string, email:string, status:string, role:string[]) => {
		setShowPopout(true);
		console.log(id + " " + email + " " + status + " " + role);
		setEditUserEmail(email);
		setEditUserID(id);
		setEditUserStatus(status);
		setEditUserRole(role);
	};

	const handleSaveConfirm = () => {
		console.log("Saving changes to " + editUserEmail + " " + editUserID + " " + editUserStatus + " " + editUserRole);
		setShowPopout(false);
	};

	const handleCancel = () => {
		setEditUserEmail("");
		setEditUserID("");
		setEditUserStatus("");
		setEditUserRole([]);
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
			user.status.toLowerCase().includes(query) ||
			user.id.includes(query)
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
											defaultValue={
												typeof user.role === "string"
													? user.role.toLowerCase()
													: ""
											}
											className="item-select"
											aria-label="Select Role"
											onChange={(e) => {[user.role] = [e.target.value]}}
										>
											<option value={["member"]}>
												MEMBER
											</option>
											<option value={["member", "operations handler"]}>
												OPERATIONS HANDLER
											</option>
											<option value={["member", "operations handler", "retiree"]}>
												RETIREE
											</option>
										</select>
									</td>
									<td>
										<select
											defaultValue={user.status}
											className="item-select"
											aria-label="Select Status"
											style={{
												backgroundColor:
													"ACTIVE" === user.status
														? "hsl(134, 61%, 85%)"
														: "hsl(354, 70%, 85%)",
											}}
											onChange={(e) => {user.status = e.target.value; setEmptyPopout(!emptyPopout)}}
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
											onClick={() => {handleEditClick(user.id, user.email, user.status, [user.role])}}
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
					{/* Replace inline pagination with global PageButtons */}
					<PageButtons
						currentPage={currentPage}
						totalPages={totalPages}
						onPageChange={(page) => setCurrentPage(page)}
					/>
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

			{emptyPopout && (
				<Popout
					title=""
					message=""
					onConfirm={()=>{}}
					onCancel={()=>{}}
					isOpen={false}
				/>
			)}
		</div>
	);
};

export default AdminSettings;
