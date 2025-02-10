import { createContext, useContext, useState, ReactNode } from 'react';

interface RoleContextType {
    selectedRole: string;
    setSelectedRole: (role: string) => void;
}

// Create Context
const RoleContext = createContext<RoleContextType | undefined>(undefined);

// Provider Component
export const RoleProvider = ({ children }: { children: ReactNode }) => {
    const [selectedRole, setSelectedRole] = useState('');

    return (
        <RoleContext.Provider value={{ selectedRole, setSelectedRole }}>
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
