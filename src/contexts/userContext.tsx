import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useFirebase } from './firebaseContext';

interface UserContextType {
  // Role management
  selectedRole: string;
  setSelectedRole: (role: string) => void;
  availableRoles: string[];
  switchRole: (role: string) => void;
  loading: boolean;
  
  // Cached profile data from Firebase
  displayName: string | null;
  photoURL: string | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Role management state
  const [selectedRole, setSelectedRole] = useState<string>('member');
  const [availableRoles, setAvailableRoles] = useState<string[]>(['member']);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Cached profile data
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  
  // Get Firebase user info
  const { 
    uid, 
    isAuthenticated, 
    db, 
    displayName: firebaseDisplayName, 
    photoURL: firebasePhotoURL,
    userClaims // <-- Include userClaims to access role
  } = useFirebase();

  // Cache Firebase profile data locally when it changes
  useEffect(() => {
    setDisplayName(firebaseDisplayName);
    setPhotoURL(firebasePhotoURL);
  }, [firebaseDisplayName, firebasePhotoURL]);

  // First, set the role from user claims when they become available
  useEffect(() => {
    if (userClaims.role) {
      // Set the role from claims first
      setSelectedRole(userClaims.role);
      
      // Set initial available roles based on claim
      const initialRoles = userClaims.role === 'operations handler' 
        ? ['operations handler', 'member'] 
        : [userClaims.role];
      
      setAvailableRoles(initialRoles);
    }
  }, [userClaims.role]);

  // Then, fetch additional role data from Firestore when user is authenticated
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!uid) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const userDocRef = doc(db, 'users', uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          // Use Firestore role or fall back to claim role or default
          const userRole = data.role || userClaims.role || 'member';
          
          // Determine available roles based on the user's assigned role
          let roles: string[];
          if (userRole === 'operations handler') {
            roles = ['operations handler', 'member'];
          } else {
            roles = [userRole];
          }
          
          setAvailableRoles(roles);
          setSelectedRole(userRole);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && uid) {
      fetchUserRole();
    } else {
      // Reset to defaults when not authenticated
      setSelectedRole('member');
      setAvailableRoles(['member']);
      setLoading(false);
    }
  }, [uid, isAuthenticated, db, userClaims.role]);

  // Role switching function
  const switchRole = (role: string) => {
    if (availableRoles.includes(role)) {
      setSelectedRole(role);
    } else {
      console.warn(`Role ${role} is not available.`);
    }
  };

  return (
    <UserContext.Provider value={{ 
      selectedRole, 
      setSelectedRole, 
      availableRoles, 
      switchRole,
      loading,
      displayName,
      photoURL
    }}>
      {children}
    </UserContext.Provider>
  );
};

export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

