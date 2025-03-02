import React from "react";
import "./Profile.css";
import { useUser } from "../../contexts/userContext";

interface ProfileProps {
  isCollapsed: boolean;
}

const Profile: React.FC<ProfileProps> = ({ isCollapsed }) => {
  // Get everything from UserContext (which now includes cached profile data)
  const {
    displayName,
    photoURL,
    selectedRole,
    availableRoles,
    setSelectedRole
  } = useUser();

  // Handle role selection change
  const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRole(event.target.value);
  };

  return (
    <div className={`profile-section ${isCollapsed ? "collapsed" : ""}`}>
      <div className="profile-image">
        <img src={photoURL || ""} alt="Profile" />
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
                <div className="single-role">{selectedRole}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;