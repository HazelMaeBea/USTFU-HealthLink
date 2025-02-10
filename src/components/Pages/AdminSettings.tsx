import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../../config/firebase";
import "./AdminSettings.css";

import { FiEdit } from "react-icons/fi";
import Tabs from "../Page Elements/TrackingPage/Tabs";

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
					<Tabs>
						<div title="USER MANAGEMENT" className="Tabby">
							<section className="tab-content">
								{/* User Management Content */}
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
															typeof user.role ===
															"string"
																? user.role.toLowerCase()
																: ""
														}
														className="item-select rounded-select"
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
														defaultValue={
															user.status
														}
														className="item-select"
														aria-label="Select Status"
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
													<FiEdit
														className="edit-icon"
														size={20}
													/>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</section>
						</div>
						<div title="REGISTRATION VERIFICATION" className="Tabby">
							<section className="tab-content">
								{/* Registration Verification Content */}
							</section>
						</div>
					</Tabs>
				</div>
			</div>

			<hr className="ustfu-hr" />
		</div>
	);
};

export default AdminSettings;
