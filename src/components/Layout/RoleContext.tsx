import { createContext, useContext, useState, ReactNode } from 'react';

interface RoleContextType {
    selectedRole: string;
    setSelectedRole: (role: string) => void;
    availableRoles: string[];
    setAvailableRoles: (roles: string[]) => void;
    switchRole: (role: string) => void;
}

// Create Context
const RoleContext = createContext<RoleContextType | undefined>(undefined);

// Provider Component
export const RoleProvider = ({ children }: { children: ReactNode }) => {
    const [selectedRole, setSelectedRole] = useState('member');
    const [availableRoles, setAvailableRoles] = useState<string[]>([]);

    const switchRole = (role: string) => {
        if (availableRoles.includes(role)) {
            setSelectedRole(role);
        } else {
            console.warn(`Role ${role} is not available.`);
        }
    };

    return (
        <RoleContext.Provider value={{ selectedRole, setSelectedRole, availableRoles, setAvailableRoles, switchRole }}>
            {children}
        </RoleContext.Provider>
    );
};

// Custom Hook to Use Context
export const useRole = () => {
    const context = useContext(RoleContext);
    if (!context) {
        throw new Error('useRole must be used within a RoleProvider');
    }
    return context;
};