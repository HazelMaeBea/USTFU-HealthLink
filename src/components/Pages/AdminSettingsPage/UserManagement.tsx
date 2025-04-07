import { useState, useEffect } from "react";
import {
	collection,
	onSnapshot,
	Timestamp,
	query,
	where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../../../contexts/firebase";
import PageButtons from "../../Page Elements/PageButtons/PageButtons";
import UserRow from "./UserRow";
import UserAuditLogs from "./UserAuditLogs";
import AuditLogsPopout from "./AuditLogsPopout";
import "./UserManagement.css"; 

interface UserManagementProps {
	searchQuery: string;
}

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
	remainingBenefits?: string;
}

const UserManagement = ({ searchQuery }: UserManagementProps) => {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);
	const usersPerPage = 7;
	const [showAuditLogsPopout, setShowAuditLogsPopout] = useState(false);
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const checkMobile = () => setIsMobile(window.innerWidth <= 768); //the width for mobile smthe
		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	useEffect(() => {
		const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
			if (currentUser) {
				const collectionRef = collection(db, "users");
				const queryCollection = query(collectionRef, where("verified", "==", true));
				const unsubscribeUsers = onSnapshot(queryCollection, (snapshot) => {
					const sortedUsers = snapshot.docs
						.map((doc) => {
							const data = doc.data();
							const personalInfo = data.personalInfo || {};
							return {
								id: personalInfo.idNumber || "Unknown",
								name: data.fullName || "Unknown",
								email: data.email || "Unknown",
								college: personalInfo.college || "UNAFFILIATED",
								birthdate: personalInfo.birthdate || "Unknown",
								phoneNumber: personalInfo.phoneNumber || "Unknown",
								role: data.role || "Member",
								status: data.status || "INACTIVE",
								document: doc.id,
								createdAt: data.createdAt,
								remainingBenefits: personalInfo.remainingBenefits?.toString() || "0", // Convert to string
							};
						})
						.sort((a, b) => a.name.localeCompare(b.name)) as User[];
					setUsers(sortedUsers);
					setLoading(false);
				});
				return () => unsubscribeUsers();
			} else {
				setLoading(false);
				setUsers([]);
			}
		});
		return () => unsubscribeAuth();
	}, []);

	const filteredUsers = users.filter((user) => {
		const queryLower = searchQuery.toLowerCase();
		return (
			user.name.toLowerCase().includes(queryLower) ||
			user.email.toLowerCase().includes(queryLower) ||
			user.college.toLowerCase().includes(queryLower) ||
			user.role.toLowerCase().includes(queryLower) ||
			user.status.toLowerCase().includes(queryLower)
		);
	});

	const indexOfLastUser = currentPage * usersPerPage;
	const indexOfFirstUser = indexOfLastUser - usersPerPage;
	const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
	const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

	const handleAuditLogsClick = () => {
		setShowAuditLogsPopout(true);
	};

	const handleAuditLogsClose = () => {
		setShowAuditLogsPopout(false);
	};

	if (loading) return <div>Loading...</div>;

	return (
		<div className="admin-settings-container">
			{isMobile ? (
				<div className="mobile-card-container">
						{currentUsers.map((user) => (
							<UserRow key={user.document} user={user} isMobile={true} />
						))}
				</div>
			) : (
				<div style={{ overflowX: "auto", width: "100%" }}>
					<table style={{ minWidth: "600px", borderCollapse: "collapse" }} className="user-mngmnt-table">
						<thead className="user-mngmnt-table-header">
							<tr>
								<th>ID</th>
								<th>Name</th>
								<th>Email Address</th>
								<th>College</th>
								<th>Birthdate</th>
								<th>Contact #</th>
								<th>Remaining Benefits</th>
								<th>Role</th>
								<th>Status</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{currentUsers.map((user) => (
								<UserRow key={user.document} user={user}/>
							))}
						</tbody>
					</table>
				</div>
			)}
			<div className="controls-container">
				<div className="pagination-container">
					<PageButtons currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => setCurrentPage(page)} />
				</div>
				<div className="action-buttons">
					<button className="btn primary-btn audit-logs-btn" onClick={handleAuditLogsClick}>
						VIEW USER AUDIT LOGS
					</button>
				</div>
			</div>
			{showAuditLogsPopout && (
				<AuditLogsPopout title="User Audit Logs" onClose={handleAuditLogsClose} isOpen={showAuditLogsPopout}>
					<UserAuditLogs />
				</AuditLogsPopout>
			)}
		</div>
	);
};

export default UserManagement;
