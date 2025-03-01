import React from "react";
import { useRole } from "./RoleContext";

const Role: React.FC = () => {
    const { selectedRole, setSelectedRole, availableRoles } = useRole();

    const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedRole(event.target.value);
    };

    return (
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
    );
};

export default Role;