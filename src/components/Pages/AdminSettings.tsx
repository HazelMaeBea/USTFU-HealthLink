import "../Page Elements/AdminSettings/AdminSettings.css";

import { useState, useEffect } from "react";
import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../../config/firebase";
// import { BsCheckAll } from "react-icons/bs";
import { TbSearch } from "react-icons/tb";
import { RxHamburgerMenu } from "react-icons/rx";

import Popout from "../Page Elements/Popout/Popout";
import VerificationPage from "../Page Elements/AdminSettings/VerificationPage";
import PageButtons from "../Page Elements/PageButtons/PageButtons";
import UserRow from "../Page Elements/AdminSettings/UserRow";

interface User {
	id: number
	name: string
	email: string
	college: string
	birthdate: string
	phoneNumber: string
	role: string
	status: string
	deactivationDate?: string
	inactiveReason?: "indefinite" | "on-leave"
	leaveReason?: string
	leaveStartDate?: string
	leaveEndDate?: string
	document: string
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
	// Empty values for proper null value assignment
	const emptyRoles: any[] = [];
	// useStates for saving values to be edited in the user document
	const [editCollege, setEditCollege] = useState("");
	const [editRole, setEditRole] = useState(emptyRoles);
	const [editStatus, setEditStatus] = useState("");
	const [editDeactivationDate, setEditDeactivationDate] = useState("");
	const [editInactiveReason, setEditInactiveReason] = useState("");
	const [editLeaveReason, setEditLeaveReason] = useState("");
	const [editLeaveStartDate, setEditLeaveStartDate] = useState("");
	const [editLeaveEndDate, setEditLeaveEndDate] = useState("");
	const [editDocument, setEditDocument] = useState("");

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
									id: data.idNumber || "Unknown",
									name: data.displayName || "Unknown",
									email: data.email || "Unknown",
									college: data.college || "UNAFFILIATED",
									birthdate: data.birthdate || "Unknown",
									phoneNumber: data.phoneNumber || "Unknown",
									role: data.role || "Member",
									status: data.status || "INACTIVE",
									document: doc.id,
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

	const emptyUseStates = () => {
		setEditDeactivationDate("");
		setEditInactiveReason("");
		setEditLeaveReason("");
		setEditLeaveStartDate("");
		setEditLeaveEndDate("");
		setEditCollege("");
		setEditRole(emptyRoles);
		setEditStatus("");
		setEditDocument("");
		// console.log("emptyUseStates function called");
	}

	const handleSaveConfirm = async () => {
		try {
			// await setDoc(doc(db, 'users', editDocument), {
			// 	college: editCollege,
			// 	role: editRole,
			// 	status: editStatus.toUpperCase(),
			// 	deactivationDate: editDeactivationDate,
			// 	inactiveReason: editInactiveReason,
			// 	leaveReason: editLeaveReason,
			// 	leaveStartDate: editLeaveStartDate,
			// 	leaveEndDate: editLeaveEndDate,
			// }), {merge: true}
			console.log([editRole]);
			console.log("Saving changes...");
			// console.log(editUser);
			// setEditUser();
			setShowPopout(false);
		}
		catch(e) {
			return console.error(e);
		}
		console.log(editCollege + [editRole] + editStatus + editDocument + editDeactivationDate + editInactiveReason + editLeaveReason + editLeaveStartDate + editLeaveEndDate);
		emptyUseStates();
	};

	const handleCancel = () => {
		setShowPopout(false);
		emptyUseStates();
	};

	const handleSave = (updatedUser: User) => {
		emptyUseStates();
		if (updatedUser.deactivationDate !== undefined) {
			const deactDate = updatedUser.deactivationDate;
			setEditDeactivationDate(deactDate);
		}
		if (updatedUser.inactiveReason !== undefined) {
			const inactiveReason = updatedUser.inactiveReason;
			setEditInactiveReason(inactiveReason);
		}
		if (updatedUser.leaveReason !== undefined) {
			const leaveReason = updatedUser.leaveReason;
			setEditLeaveReason(leaveReason);
		}
		if (updatedUser.leaveStartDate !== undefined) {
			const leaveStartDate = updatedUser.leaveStartDate;
			setEditLeaveStartDate(leaveStartDate);
		}
		if (updatedUser.leaveEndDate !== undefined) {
			const leaveEndDate = updatedUser.leaveEndDate;
			setEditLeaveEndDate(leaveEndDate);
		}
		
		setShowPopout(true);
		setEditCollege(updatedUser.college);
		setEditRole([updatedUser.role]);
		setEditStatus(updatedUser.status);
		setEditDocument(updatedUser.document);
		console.log(updatedUser);
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
								<th>ID Number</th>
								<th>Name</th>
								<th>Email Address</th>
								<th>College</th>
								<th>Birthdate</th>
								<th>Phone Number</th>
								<th>Role</th>
								<th>Status</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{currentUsers.map((user, i) => (
								<UserRow key={i} user={user} onSave={handleSave} />
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
		</div>
	);
};

export default AdminSettings;
