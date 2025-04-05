import { useState, useEffect } from "react";
import {
	collection,
	onSnapshot,
	doc,
	setDoc,
	Timestamp,
	query,
	where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../../../contexts/firebase";
import { TbSearch } from "react-icons/tb";
import { RxHamburgerMenu } from "react-icons/rx";

import Popout from "../../Page Elements/Popout/Popout";
import VerificationPage from "./VerificationPage";
import PageButtons from "../../Page Elements/PageButtons/PageButtons";
import UserRow from "./UserRow";
import UserAuditLogs from "./UserAuditLogs";
import AuditLogsPopout from "./AuditLogsPopout";

interface User {
	id: string;
	name: string;
	email: string;
	college: string;
	birthdate: string;
	phoneNumber: string;
	role: string;
	status: string;
	retirementDate?: string;
	deactivationDate?: string;
	inactiveReason?: "indefinite" | "on-leave";
	leaveReason?: string;
	leaveStartDate?: string;
	leaveEndDate?: string;
	document: string;
	createdAt: Timestamp;
}

const AdminSettings = () => {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState("userManagement");
	const [showPopout, setShowPopout] = useState(false);
	const [showAuditLogsPopout, setShowAuditLogsPopout] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const usersPerPage = 7; /* Set how many users are displayed */
	// HookState for user and user fields
	const [editUser, setEditUser] = useState<User>();
	const [editDocument, setEditDocument] = useState("");
	const [editCreatedAt, setEditCreatedAt] = useState<Date>();
	const [editOption, setEditOption] = useState<
		"college" | "role" | "status" | null
	>(null);

	useEffect(() => {
		const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
			if (currentUser) {
				const collectionRef = collection(db, "users");
				const queryCollection = query(
					collectionRef,
					where("verified", "==", true)
				);
				const unsubscribeUsers = onSnapshot(
					queryCollection,
					(snapshot) => {
						const sortedUsers = snapshot.docs
							.map((doc) => {
								const data = doc.data();
								const personalInfo = data.personalInfo || {};
								return {
									id: personalInfo.idNumber || "Unknown",
									name: data.fullName || "Unknown",
									email: data.email || "Unknown",
									college:
										personalInfo.college || "UNAFFILIATED",
									birthdate:
										personalInfo.birthdate || "Unknown",
									phoneNumber:
										personalInfo.phoneNumber || "Unknown",
									role: data.role || "Member",
									status: data.status || "INACTIVE",
									document: doc.id,
									createdAt: data.createdAt,
								};
							})
							.sort((a, b) =>
								a.name.localeCompare(b.name)
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

	const handleSaveConfirm = async () => {
		if (!editUser) {
			alert("No user data to save.");
			return;
		}
		console.log("Saving changes...");
		console.log(editUser);
		setShowPopout(false);
		try {
			if (editOption === "college") {
				await setDoc(
					doc(db, "users", editDocument),
					{
						personalInfo: { college: editUser.college },
						createdAt: editCreatedAt,
					},
					{ merge: true }
				);
			} else {
				await setDoc(
					doc(db, "users", editDocument),
					{
						...editUser,
						createdAt: editCreatedAt,
					},
					{ merge: true }
				);
			}
			alert("Changes saved successfully!");
		} catch (error) {
			console.log(error);
			alert("Failed to save changes.");
		}
	};

	const handleCancel = () => {
		setShowPopout(false);
		setEditOption(null);
	};

	const handleSave = (
		updatedUser: User,
		option: "college" | "role" | "status"
	) => {
		console.log("User updated:", updatedUser);
		setEditUser(updatedUser);
		setEditDocument(updatedUser.document);
		setEditCreatedAt(new Date(updatedUser.createdAt.toDate().toString()));
		setEditOption(option);
		setShowPopout(true);
	};

	const handleAuditLogsClick = () => {
		setShowAuditLogsPopout(true);
	};

	const handleAuditLogsClose = () => {
		setShowAuditLogsPopout(false);
	};

	// Filter users based on search query (for userManagement)
	const filteredUsers = users.filter((user) => {
		const query = searchQuery.toLowerCase();
		return (
			user.name.toLowerCase().includes(query) ||
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
	if (loading)
		return (
			<div className="admin-settings-container">
				<div className="admin-loading-container">
					{/* Skeleton for tabs and search */}
					<div className="row align-items-center">
						<div className="tab-cont col-md-6">
							<div className="admin-loading-tabs">
								<div className="admin-loading-tab admin-skeleton"></div>
								<div className="admin-loading-tab admin-skeleton"></div>
							</div>
						</div>
						<div className="col-md-6">
							<div className="admin-loading-search admin-skeleton"></div>
						</div>
					</div>

					<div className="admin-loading-hr admin-skeleton"></div>

					{/* Skeleton for table */}
					<div className="admin-loading-table">
						<div className="admin-loading-thead admin-skeleton"></div>
						<div className="admin-loading-tbody">
							{[...Array(7)].map((_, index) => (
								<div key={index} className="admin-loading-tr">
									<div className="admin-loading-td admin-loading-col-xs admin-skeleton"></div>
									<div className="admin-loading-td admin-loading-col-md admin-skeleton"></div>
									<div className="admin-loading-td admin-loading-col-lg admin-skeleton"></div>
									<div className="admin-loading-td admin-loading-col-lg admin-skeleton"></div>
									<div className="admin-loading-td admin-loading-col-sm admin-skeleton"></div>
									<div className="admin-loading-td admin-loading-col-sm admin-skeleton"></div>
									<div className="admin-loading-td admin-loading-col-xs admin-skeleton"></div>
									<div className="admin-loading-td admin-loading-col-xs admin-skeleton"></div>
									<div className="admin-loading-td admin-loading-col-xs admin-skeleton"></div>
								</div>
							))}
						</div>
					</div>

					{/* Skeleton for pagination */}
					<div className="admin-loading-controls">
						<div className="admin-loading-pagination">
							{[...Array(3)].map((_, index) => (
								<div
									key={index}
									className="admin-loading-page admin-skeleton"
								></div>
							))}
						</div>
						<div className="admin-loading-button admin-skeleton"></div>
					</div>
				</div>
			</div>
		);

	return (
		<div className="admin-settings-container">
			{/* Tabs & Search */}
			<div className="row align-items-center">
				<div className="tab-cont col-md-6">
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
					<div style={{ overflowX: "auto", width: "100%" }}>
						<table
							style={{
								minWidth: "600px",
								borderCollapse: "collapse",
							}}
							className="user-mngmnt-table"
						>
							<thead className="user-mngmnt-table-header">
								<tr>
									<th>ID</th>
									<th>Name</th>
									<th>Email Address</th>
									<th>College</th>
									<th>Birthdate</th>
									<th>Contact #</th>
									<th>Role</th>
									<th>Status</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{currentUsers.map((user) => (
									<UserRow
										key={user.document}
										user={user}
										onSave={handleSave}
									/>
								))}
							</tbody>
						</table>
					</div>

					{/* New layout for buttons */}
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
								className="btn primary-btn audit-logs-btn"
								onClick={handleAuditLogsClick}
							>
								VIEW USER AUDIT LOGS
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
					message={`Do you want to save changes to the user's ${editOption}?`}
					onConfirm={handleSaveConfirm}
					onCancel={handleCancel}
					isOpen={showPopout}
				/>
			)}

			{showAuditLogsPopout && (
				<AuditLogsPopout
					title="User Audit Logs"
					onClose={handleAuditLogsClose}
					isOpen={showAuditLogsPopout}
				>
					<UserAuditLogs />
				</AuditLogsPopout>
			)}
		</div>
	);
};

export default AdminSettings;
