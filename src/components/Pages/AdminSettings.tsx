import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../../config/firebase";
import "./AdminSettings.css";

import { BsSaveFill } from "react-icons/bs";
import { TbSearch } from "react-icons/tb";
import { RxHamburgerMenu } from "react-icons/rx";
import Popout from "../Page Elements/Popout/Popout";

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
	const [currentPage, setCurrentPage] = useState(1);
	const usersPerPage = 5; /* Set how many users are displayed */

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

	const indexOfLastUser = currentPage * usersPerPage;
	const indexOfFirstUser = indexOfLastUser - usersPerPage;
	const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);

	const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

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
						onClick={() => setActiveTab("userManagement")}
					>
						USER MANAGEMENT
					</button>
					<button
						className={`ustfu-as-btn tab-btn ${
							activeTab === "registrationVerification"
								? "active-tab"
								: ""
						}`}
						onClick={() => setActiveTab("registrationVerification")}
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
						/>
						<TbSearch className="search-icon" />
					</div>
				</div>
			</div>

			<hr className="ustfu-hr" />

			{/* Table */}
			<table className="user-mngmnt-table">
				<thead className="user-mngmnt-table-header">
					<tr>
						<th>NAME</th>
						<th>EMAIL ADDRESS</th>
						<th>COLLEGE</th>
						<th>ROLE</th>
						<th>STATUS</th>
						<th>SAVE</th>
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
									<option value="member">MEMBER</option>
									<option value="operations handler">
										OPERATIONS HANDLER
									</option>
									<option value="retiree">RETIREE</option>
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
									<option value="ACTIVE">ACTIVE</option>
									<option value="INACTIVE">INACTIVE</option>
								</select>
							</td>
							<td>
								<BsSaveFill
									className="save-icon"
									size={25}
									onClick={handleEditClick}
								/>
							</td>
						</tr>
					))}
				</tbody>
			</table>
			{showPopout && (
				<Popout
					title="Save Changes?"
					message="Do you want to save changes to the user?"
					onConfirm={handleSaveConfirm}
					onCancel={handleCancel}
					isOpen={showPopout}
				/>
			)}
			{/* Pagination */}
			<div className="pagination">
				{Array.from(
					{ length: Math.ceil(users.length / usersPerPage) },
					(_, i) => (
						<button
							key={i + 1}
							onClick={() => paginate(i + 1)}
							className={`page-item ${
								currentPage === i + 1 ? "active" : ""
							}`}
						>
							{i + 1}
						</button>
					)
				)}
			</div>
		</div>
	);
};

export default AdminSettings;
