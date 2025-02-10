import React from 'react';
import { MdOutlineSaveAs } from "react-icons/md";
import { TbSearch } from "react-icons/tb";
import { RxHamburgerMenu } from "react-icons/rx";
import Popout from "./Popout/Popout";

interface User {
	displayName: string;
	email: string;
	college: string;
	role: string;
	status: string;
}

interface UserManagementProps {
	users: User[];
	currentUsers: User[];
	showPopout: boolean;
	handleEditClick: () => void;
	handleSaveConfirm: () => void;
	handleCancel: () => void;
	currentPage: number;
	usersPerPage: number;
	paginate: (pageNumber: number) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({
	users,
	currentUsers,
	showPopout,
	handleEditClick,
	handleSaveConfirm,
	handleCancel,
	currentPage,
	usersPerPage,
	paginate
}) => {
	return (
		<div>
			<div className="row align-items-center">
				<div className="col-md-6">
					{/* Search */}
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
								<MdOutlineSaveAs
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

export default UserManagement;
