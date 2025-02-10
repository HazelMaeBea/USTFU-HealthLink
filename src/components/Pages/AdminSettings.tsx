import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../../config/firebase";
import "./AdminSettings.css";

import { FiEdit } from "react-icons/fi";
import { TbSearch } from "react-icons/tb";
import { RxHamburgerMenu } from "react-icons/rx";

interface User {
	displayName: string;
	email: string;
	college: string;
	role: string;
	status: "ACTIVE" | "INACTIVE";
}

const AdminSettings = () => {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState("userManagement");

	useEffect(() => {
		const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
			if (currentUser) {
				const unsubscribeUsers = onSnapshot(
					collection(db, "users"),
					(snapshot) => {
						setUsers(
							snapshot.docs.map((doc) => {
								const data = doc.data();
								return {
									...data,
									status: data.status || "INACTIVE",
									college: data.college || "UNAFFILIATED",
								};
							}) as User[]
						);
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
						<th>EDIT</th>
					</tr>
				</thead>
				<tbody>
					{users.map((user, i) => (
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
									className="item-select rounded-select"
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
									defaultValue={user.status}
									className="item-select"
									aria-label="Select Status"
								>
									<option value="ACTIVE">ACTIVE</option>
									<option value="INACTIVE">INACTIVE</option>
								</select>
							</td>
							<td>
								<FiEdit className="edit-icon" size={20} />
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default AdminSettings;
