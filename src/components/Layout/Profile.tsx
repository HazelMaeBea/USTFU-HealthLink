import React, { useEffect, useState } from "react";
import "./Profile.css";
import NameRole from "./NameRole";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../config/firebase"; // Adjust the path to your Firebase config

interface ProfileProps {
	isCollapsed: boolean;
}

const Profile: React.FC<ProfileProps> = ({ isCollapsed }) => {
	const [profileImageUrl, setProfileImageUrl] = useState("");
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (user) {
				setProfileImageUrl(user.photoURL || "");
			}
			setLoading(false);
		});

		return () => unsubscribe();
	}, []);

	if (loading) {
		return <div>Loading...</div>;
	}

	return (
		<div className={`profile-section ${isCollapsed ? "collapsed" : ""}`}>
			<div className="profile-image">
				<img src={profileImageUrl} alt="Profile" />
			</div>
			{!isCollapsed && (
				<div className="profile-name">
					<NameRole />
				</div>
			)}
		</div>
	);
};

export default Profile;
