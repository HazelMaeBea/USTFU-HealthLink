"use client";
import { useState, useEffect } from "react";
import { collection, onSnapshot, doc, setDoc, query, where, Timestamp } from "firebase/firestore";
import { db, auth } from "../../../contexts/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { FaEdit } from "react-icons/fa";
import PageButtons from "../../Page Elements/PageButtons/PageButtons";
import UserRow from "./UserRow";
import "./UserManagement.css";

export interface User {
	id: string;
	name: string;
	email: string;
	college: string;
	birthdate: string;
	phoneNumber: string;
	role: string;
	status: string;
	document: string;
	createdAt: Timestamp;
}

const collegeOptions = [
	"College of Accountancy",
	"College of Architecture",
	"Faculty of Arts and Letters",
	"Faculty of Civil Law",
	"College of Commerce and Business Administration",
	"College of Education",
	"Faculty of Engineering",
	"College of Fine Arts and Design",
	"Graduate School",
	"Graduate School of Law",
	"College of Information and Computing Sciences",
	"Faculty of Medicine and Surgery",
	"Conservatory of Music",
	"College of Nursing",
	"Faculty of Pharmacy",
	"Institute of Physical Education and Athletics",
	"College of Rehabilitation Sciences",
	"College of Science",
	"College of Tourism and Hospitality Management",
];

const UserManagement = () => {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [editUser, setEditUser] = useState<User | undefined>();
	const [editDocument, setEditDocument] = useState("");
	const [editCreatedAt, setEditCreatedAt] = useState<Date>();
	const [editOption, setEditOption] = useState<"college" | "role" | "status" | null>(null);
	const [isMobile, setIsMobile] = useState(false);
	const usersPerPage = 7;

	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth <= 768);
		};
		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	useEffect(() => {
		const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
			if (currentUser) {
				const collectionRef = collection(db, "users");
				const q = query(collectionRef, where("verified", "==", true));
				const unsubscribeUsers = onSnapshot(q, (snapshot) => {
					const fetchedUsers = snapshot.docs.map((doc) => {
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
						} as User;
					}).sort((a, b) => a.name.localeCompare(b.name));
					setUsers(fetchedUsers);
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

	const handleSaveConfirm = async () => {
		try {
			await setDoc(doc(db, "users", editDocument), {
				...editUser,
				createdAt: editCreatedAt,
			}, { merge: true });
			alert("Changes saved successfully!");
		} catch (error) {
			alert("Failed to save changes.");
		}
	};

	const handleCancel = () => {
		setEditUser(undefined);
		setEditOption(null);
	};

	const handleSave = (updatedUser: User, option: "college" | "role" | "status") => {
		setEditUser(updatedUser);
		setEditDocument(updatedUser.document);
		setEditCreatedAt(new Date(updatedUser.createdAt.toDate().toString()));
		setEditOption(option);
	};

	const handleInlineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const { name, value } = e.target;
		if (editUser) {
			setEditUser({ ...editUser, [name]: value });
		}
	};

	const filteredUsers = users.filter(user =>
		user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
		user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
		user.college.toLowerCase().includes(searchQuery.toLowerCase()) ||
		user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
		user.status.toLowerCase().includes(searchQuery.toLowerCase())
	);
	const indexOfLast = currentPage * usersPerPage;
	const indexOfFirst = indexOfLast - usersPerPage;
	const currentUsers = filteredUsers.slice(indexOfFirst, indexOfLast);
	const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

	if (loading)
		return <div className="admin-loading-container">...existing loading skeleton...</div>;

	return (
		<div className="user-management-container">
			{isMobile ? (
				<div className="mobile-card-container">
					{users.map(user => (
						<div key={user.document} className="mobile-card">
							<div className="mobile-card-header">
								<div>
									<h3 className="mobile-card-title">{user.name}</h3>
									<p className="mobile-card-email">{user.email}</p>
								</div>
								<div id="mobile-card-edit">
									<button id="mobile-edit-button"
										onClick={() => {
											if(editUser?.document === user.document){
												setEditUser(undefined);
												setEditOption(null);
											} else {
												setEditUser(user);
												setEditOption(null);
											}
										}}>
										<FaEdit color="hsl(45, 100%, 51%)" />
									</button>
									{editUser && editUser.document === user.document && !editOption && (
										<div className="edit-options-menu">
											<button onClick={() => setEditOption("college")}>Edit College</button>
											<button onClick={() => setEditOption("role")}>Edit Role</button>
											<button onClick={() => setEditOption("status")}>Edit Status</button>
										</div>
									)}
								</div>
							</div>
							<div className="mobile-card-body">
								<div className="mobile-card-row">
									<span className="mobile-card-label">ID</span>
									<span className="mobile-card-value">{user.id}</span>
								</div>
								<div className="mobile-card-row">
									<span className="mobile-card-label">College</span>
									<span className="mobile-card-value" title={user.college}>
										{user.college}
									</span>
								</div>
								<div className="mobile-card-row">
									<span className="mobile-card-label">Birthdate</span>
									<span className="mobile-card-value">{user.birthdate}</span>
								</div>
								<div className="mobile-card-row">
									<span className="mobile-card-label">Contact #</span>
									<span className="mobile-card-value">{user.phoneNumber}</span>
								</div>
								<div className="mobile-card-row">
									<span className="mobile-card-label">Role</span>
									<span className="mobile-card-value">{user.role}</span>
								</div>
								<div className="mobile-card-row">
									<span className="mobile-card-label">Status</span>
									{user.status === "ACTIVE" ? (
										<span className="badge bg-success">Active</span>
									) : user.status === "INACTIVE" ? (
										<span className="badge bg-danger">Inactive</span>
									) : (
										<span className="badge bg-secondary">On-Leave</span>
									)}
								</div>
							</div>
							{editUser && editUser.document === user.document && editOption && (
								<div className="mobile-card-edit">
									{editOption === "college" && (
										<div>
											<label>College</label>
											<select name="college"
												value={editUser.college}
												onChange={handleInlineChange}>
												{collegeOptions.map(option => (
													<option key={option} value={option}>
														{option}
													</option>
												))}
											</select>
										</div>
									)}
									{editOption === "role" && (
										<div>
											<label>Role</label>
											<select name="role"
												value={editUser.role}
												onChange={handleInlineChange}>
												<option value="member">Member</option>
												<option value="operations handler">Operations Handler</option>
												<option value="retiree">Retiree</option>
											</select>
										</div>
									)}
									{editOption === "status" && (
										<div>
											<label>Status</label>
											<select name="status"
												value={editUser.status}
												onChange={handleInlineChange}>
												<option value="ACTIVE">ACTIVE</option>
												<option value="INACTIVE">INACTIVE</option>
												<option value="ON-LEAVE">ON-LEAVE</option>
											</select>
										</div>
									)}
									<button onClick={handleSaveConfirm}>Save</button>
									<button onClick={handleCancel}>Cancel</button>
								</div>
							)}
						</div>
					))}
				</div>
			) : (
				<>
					<div className="user-mngmnt-table-container">
						<table className="user-mngmnt-table">
							<thead className="user-mngmnt-table-header">
								<tr className="tr">
									<th className="th">ID</th>
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
								{currentUsers.map(user => (
									<UserRow key={user.document} user={user} onSave={handleSave} />
								))}
							</tbody>
						</table>
					</div>
					<div className="controls-container">
						<div className="pagination-container">
							<PageButtons
								currentPage={currentPage}
								totalPages={totalPages}
								onPageChange={(page: number) => setCurrentPage(page)}
							/>
						</div>
						<div className="action-buttons">
							<button className="btn primary-btn audit-logs-btn">VIEW USER AUDIT LOGS</button>
						</div>
					</div>
				</>
			)}
		</div>
	);
};

export default UserManagement;