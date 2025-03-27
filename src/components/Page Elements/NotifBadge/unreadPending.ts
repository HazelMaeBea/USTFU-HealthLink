import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore"; // Import the Firebase context
import { useFirebase } from "../../../contexts/firebaseContext";
import { db } from "../../../config/firebase";

const unreadPending = () => {
  const [unreadTransactionIds, setUnreadTransactionIds] = useState<string[]>([]);
  const { uid } = useFirebase(); // Get current user's UID

  useEffect(() => {
    if (!uid) return; // Ensure UID exists before querying

    const fetchUnreadNotifications = async () => {
        try {
            const snapshot = await getDocs(collection(db, "notifyPending"));
    
            const unreadIds = snapshot.docs
              .filter((doc) => {
                const { isReadBy = [] } = doc.data();
                return !isReadBy.includes(uid);  // ✅ Manual filtering
              })
              .map((doc) => doc.data().transactionId);
    
            setUnreadTransactionIds(unreadIds);
          } catch (error) {
            console.error("Error fetching unread notifications:", error);
          }
        };

    fetchUnreadNotifications();
  }, [uid]);

  return {unreadTransactionIds};
};

export default unreadPending;