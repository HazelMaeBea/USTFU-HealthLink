import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase'; // Adjust the path to your Firebase config
import { onAuthStateChanged } from 'firebase/auth';
import Role from './Role'; // Import the Role component

const NameRole = () => {
    const [name, setName] = useState('');
    const [roles, setRoles] = useState<string[]>([]);
    const [selectedRole, setSelectedRole] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async (userId: string) => {
            try {
                const userDocRef = doc(db, 'users', userId);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    setName(userData.displayName || 'Unknown User');
                    const userRoles = userData.role || []; 
                    setRoles(userRoles);

                    if (userRoles.length > 0) {
                        setSelectedRole(userRoles[0]);
                    }
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
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="name-role">
            <h1 className="name">{name}</h1>
            <h1>
                <Role roles={roles} selectedRole={selectedRole} setSelectedRole={setSelectedRole} />
            </h1>
        </div>
    );
};

export default NameRole;
