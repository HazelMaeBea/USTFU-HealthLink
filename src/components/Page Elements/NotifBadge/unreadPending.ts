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


/* future implementation

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

        const unreadIds: string[] = [];
        const readByMap: Record<string, string[]> = {};

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const { isReadBy = [], transactionId } = data;

          // ✅ Add to unread if current user hasn't read it
          if (!isReadBy.includes(uid)) {
            unreadIds.push(transactionId);
          }

          // ✅ Add isReadBy array to the map with transactionId as the key
          readByMap[transactionId] = isReadBy;
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
*/

/* pending request list update 

const currentUid = uid ?? "";  // Fallback to an empty string if null

<div
	className={`${styles["request-header"]} ${
		expandedId === request.transactionId ? styles.expanded : ""
	} ${
		!isReadByList[request.transactionId]?.includes(currentUid) ? styles.highlight : ""
	}`}
	onClick={async () => {
		setExpandedId(
			expandedId === request.transactionId ? null : request.transactionId
		);
		setEditBenefits(getBenefits);
		setCurrentUser(request.requester);

		// ✅ Locally remove highlight
		setUnreadTransactionIds((prev) =>
			prev.filter((id) => id !== request.transactionId)
		);
	}}
>
*/
