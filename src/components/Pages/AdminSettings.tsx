import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../../config/firebase";
import "./AdminSettingsYza.css";

import Tabsies from "../Page Elements/Tabsies"; // Import Tabsies
import UserManagement from "../Page Elements/UserManagement"; // Import UserManagement

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
			<Tabsies>
				<div className="Tabitha" title="USER MANAGEMENT">
					<UserManagement
						users={users}
						currentUsers={currentUsers}
						showPopout={showPopout}
						handleEditClick={handleEditClick}
						handleSaveConfirm={handleSaveConfirm}
						handleCancel={handleCancel}
						currentPage={currentPage}
						usersPerPage={usersPerPage}
						paginate={paginate}
					/>
				</div>
				<div className="Tabitha" title="REGISTRATION VERIFICATION">
					{/* Registration Verification Content */}
					<p>Registration Verification Content goes here.</p>
				</div>
			</Tabsies>
		</div>
	);
};

export default AdminSettings;
