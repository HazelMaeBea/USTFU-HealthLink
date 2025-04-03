import React, { useEffect, useState } from "react";
import "./Profile.css";
import { useUser } from "../../../contexts/userContext";
import blankprofile from "../../../assets/blankprofile.png";
interface ProfileProps {
	isCollapsed: boolean;
	onRoleChange: (newRole: string) => void;
	currentRole: string;
}

const Profile: React.FC<ProfileProps> = ({
	isCollapsed,
	onRoleChange,
	currentRole,
}) => {
	// Get everything from UserContext (which now includes cached profile data)
	const { displayName, photoURL, availableRoles } = useUser();

	const [selectedRole, setSelectedRole] = useState<string>(currentRole);

	// Ensure the selected role syncs with currentRole prop
	useEffect(() => {
		setSelectedRole(currentRole);
	}, [currentRole]);

	// Handle role selection change
	const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const newRole = event.target.value;
		setSelectedRole(newRole);
		onRoleChange(newRole);
	};

	return (
		<div className={`profile-section ${isCollapsed ? "collapsed" : ""}`}>
			<div className="profile-image">
				<img src={photoURL || blankprofile} alt="Profile" />
			</div>
			{!isCollapsed && (
				<div className="profile-name">
					<div className="name-role">
						<h1 className="name">{displayName}</h1>
						<div className="role-container">
							{availableRoles.length > 1 ? (
								<select
									className="role-dropdown"
									value={selectedRole}
									onChange={handleRoleChange}
									aria-label="Select role"
								>
									{availableRoles.map((role, index) => (
										<option key={index} value={role}>
											{role}
										</option>
									))}
								</select>
							) : (
								<div className="single-role">
									{selectedRole}
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default Profile;
