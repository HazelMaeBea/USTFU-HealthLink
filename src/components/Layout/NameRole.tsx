import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase'; // Adjust the path to your Firebase config
import { onAuthStateChanged } from 'firebase/auth';
import { useRole } from './RoleContext';
import Role from './Role';

const NameRole = () => {
    const { setSelectedRole, setAvailableRoles } = useRole();
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async (userId: string) => {
            try {
                const userDocRef = doc(db, 'users', userId);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    setName(userData.displayName);
                    const roles = userData.role === 'operations handler' ? ['operations handler', 'member'] : [userData.role];
                    setAvailableRoles(roles);
                    setSelectedRole(roles[0]); // Set the default role to 'operations handler' if available
                } else {
                    console.log('No such document!');
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                setLoading(false);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                fetchUserData(user.uid);
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [setAvailableRoles, setSelectedRole]);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="name-role">
            <h1 className="name">{name}</h1>
            <Role />
        </div>
    );
};

export default NameRole;