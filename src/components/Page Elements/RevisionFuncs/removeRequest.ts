import { db } from "../../../contexts/firebase"; // adjust path as needed
import { doc, deleteDoc } from "firebase/firestore";

// Hook to remove the request with the given transactionId
export const useRemoveRequest = () => {
  const removeRequest = async (transactionId: string) => {
    try {
      const requestDocRef = doc(db, "RevisionsRequests", transactionId);
      await deleteDoc(requestDocRef);
      console.log(`Request with transactionId ${transactionId} removed.`);
    } catch (error) {
      console.error("Error removing request: ", error);
    }
  };

  return { removeRequest };
};
