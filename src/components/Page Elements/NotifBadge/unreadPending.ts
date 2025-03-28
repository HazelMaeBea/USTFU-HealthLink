import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore"; 
import { useFirebase } from "../../../contexts/firebaseContext";
import { db } from "../../../config/firebase";

const unreadPending = () => {
  const [unreadTransactionIds, setUnreadTransactionIds] = useState<string[]>([]);
  const [isReadByList, setIsReadByList] = useState<Record<string, string[]>>({}); 
  const { uid } = useFirebase();  // Get current user's UID

  useEffect(() => {
    if (!uid) return;  // Ensure UID exists before querying

    const fetchUnreadNotifications = async () => {
      try {
        const snapshot = await getDocs(collection(db, "notifyPending"));

        const validTransactionIds = new Set<string>();
        const unreadIds: string[] = [];
        const readByMap: Record<string, string[]> = {};

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const { isReadBy = [], transactionId } = data;

          // ✅ Add to unread if current user hasn't read it
          if (transactionId) {
            validTransactionIds.add(transactionId);  // Track valid IDs

            if (!isReadBy.includes(uid)) {
              unreadIds.push(transactionId);
            }
            
            readByMap[transactionId] = isReadBy;
          }
        });

        setUnreadTransactionIds(unreadIds);
        setIsReadByList(readByMap);  // ✅ Store the isReadBy arrays
      } catch (error) {
        console.error("Error fetching unread notifications:", error);
      }
    };

    fetchUnreadNotifications();
  }, [uid]);

  // ✅ Return both unread IDs and isReadBy map
  return { unreadTransactionIds, isReadByList, setUnreadTransactionIds };
};

export default unreadPending;
