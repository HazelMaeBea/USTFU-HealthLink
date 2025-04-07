import { db } from "../../../contexts/firebase";
import {
  doc,
  deleteDoc,
  query,
  collection,
  where,
  getDocs,
} from "firebase/firestore";

// Hook to remove the request with the given transactionId
export const useRemoveRequest = () => {
  const removeRequest = async (transactionId: string) => {
    try {
      // Helper to delete from a collection by transactionId field
      const deleteFromCollection = async (collectionName: string) => {
        const q = query(
          collection(db, collectionName),
          where("transactionId", "==", transactionId)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          console.warn(
            `No document found in ${collectionName} for transactionId: ${transactionId}`
          );
          return;
        }

        // Delete all matching docs just to be safe (in case of duplicates)
        for (const docSnap of snapshot.docs) {
          await deleteDoc(doc(db, collectionName, docSnap.id));
          console.log(`Deleted ${docSnap.id} from ${collectionName}`);
        }
      };

      // Delete from both collections
      await deleteFromCollection("RevisionsRequests");
      await deleteFromCollection("notifyAccomplished_Revisions");

      console.log(
        `Finished removing transactionId: ${transactionId} from both collections.`
      );
    } catch (error) {
      console.error("Error during deletion:", error);
    }
  };

  return { removeRequest };
};
