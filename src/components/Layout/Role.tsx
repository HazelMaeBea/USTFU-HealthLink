import React from 'react';

interface RoleProps {
    roles: string[];
    selectedRole: string;
    setSelectedRole: (role: string) => void;
}

const Role: React.FC<RoleProps> = ({ roles, selectedRole, setSelectedRole }) => {
    const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedRole(event.target.value);
    };

    return (
        <div className="role-container">
            {roles.length > 1 ? (
                <select
                    className="role-dropdown"
                    value={selectedRole}
                    onChange={handleRoleChange}
                >
                    {roles.map((role, index) => (
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
