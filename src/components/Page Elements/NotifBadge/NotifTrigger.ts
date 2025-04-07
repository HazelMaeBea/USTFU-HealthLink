import { useEffect, useState } from "react";
import {
  onSnapshot,
  collection,
  query,
  where,
  doc,
  updateDoc,
  arrayUnion,
  addDoc,
  serverTimestamp,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../../contexts/firebase";
import { useFirebase } from "../../../contexts/firebaseContext";

interface UseNotificationsProps {
  uid: string | null;
  selectedRole: string;
}

export const useNotifications = ({
  uid,
  selectedRole,
}: UseNotificationsProps) => {
  const { fullName } = useFirebase();
  const [hasNewPendingRequest, setHasNewPendingRequest] = useState(false);
  const [hasNewAccomplishedRecord, setHasNewAccomplishedRecord] =
    useState(false);

  useEffect(() => {
    if (!uid) return;

    let unsubscribePending: () => void = () => {};
    let unsubscribeAccomplished: () => void = () => {};

    if (selectedRole === "operations handler" || selectedRole === "admin") {
      const pendingQuery = query(collection(db, "notifyPending"));

      unsubscribePending = onSnapshot(pendingQuery, async (snapshot) => {
        let hasUnread = false;

        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          const { isReadBy = [], transactionId } = data;

          if (transactionId === "no-delete") {
            console.log(
              `Skipping document with transactionId: ${transactionId}`
            );
            continue; // Skip this iteration and move to the next document
          }

          // Check if this transactionId still exists in FormRequests
          const formRequestsQuery = query(
            collection(db, "FormRequests"),
            where("transactionId", "==", transactionId)
          );
          const formRequestsSnapshot = await getDocs(formRequestsQuery);

          if (formRequestsSnapshot.empty) {
            // Remove orphaned notifyPending doc
            await deleteDoc(docSnap.ref);
          } else {
            // If this user hasn't read this pending request
            if (!isReadBy.includes(uid)) {
              hasUnread = true;
            }
          }
        }

        setHasNewPendingRequest(hasUnread);
      });
    }

    if (selectedRole === "member") {
      const accomplishedQuery = query(
        collection(db, "notifyAccomplished_Revisions"),
        where("requester", "==", fullName),
        where("isRead", "==", false)
      );

      unsubscribeAccomplished = onSnapshot(accomplishedQuery, (snapshot) => {
        setHasNewAccomplishedRecord(snapshot.docs.length > 0);
      });
    }

    return () => {
      unsubscribePending();
      unsubscribeAccomplished();
    };
  }, [uid, selectedRole]);

  useEffect(() => {
    console.log("Updated hasNewPendingRequest state:", hasNewPendingRequest);
  }, [hasNewPendingRequest]);

  // Functions to clear notifications

  // For operations handlers/admins: Mark as read by adding the UID to `isReadBy`
  const clearPendingNotifications = async (transactionId: string) => {
    if (!uid) return;

    try {
      // ✅ Query for notifications with the given `transactionId`
      const pendingQuery = query(
        collection(db, "notifyPending"),
        where("transactionId", "==", transactionId)
      );

      const snapshot = await getDocs(pendingQuery);

      // Initially set the flag to false (assume all notifications are read)
      let allNotificationsRead = true;

      // ✅ Loop through the query result (in case there are multiple documents with the same transactionId)
      for (const docSnap of snapshot.docs) {
        const docRef = doc(db, "notifyPending", docSnap.id);
        const data = docSnap.data();
        const { isReadBy = [] } = data;

        // ✅ Add `uid` to `isReadBy` only if it hasn't been added already
        if (!isReadBy.includes(uid)) {
          await updateDoc(docRef, {
            isReadBy: arrayUnion(uid),
          });
          console.log(
            `Notification for ${transactionId} marked as read by ${uid}`
          );
        }
      }

      // ✅ After updating the current `transactionId`, check if there are any notifications still unread by the user
      const allPendingQuery = query(collection(db, "notifyPending"));
      const allPendingSnapshot = await getDocs(allPendingQuery);

      // Loop through all notifications in `notifyPending`
      for (const docSnap of allPendingSnapshot.docs) {
        const { isReadBy = [] } = docSnap.data();

        // If the `uid` is missing in any notification's `isReadBy`, set the flag to false
        if (!isReadBy.includes(uid)) {
          allNotificationsRead = false;
          break; // Exit early if one unread notification is found
        }
      }

      // ✅ Only update `setHasNewPendingRequest` if all notifications have been read
      if (allNotificationsRead) {
        setHasNewPendingRequest(false);
        // Log the final state of `hasNewPendingRequest` to track the change
        console.log("Current hasNewPendingRequest:", hasNewPendingRequest);
        console.log(
          "All notifications marked as read. No new pending requests."
        );
      } else {
        console.log("Some notifications are still unread.");
      }
    } catch (error) {
      console.error("Error clearing specific pending notification:", error);
    }
  };

  // For members: Mark all notifications as read by updating `isRead` to true
  const clearAccomplishedNotifications = async (transactionId: string) => {
    if (!uid) return;

    try {
      const accomplishedQuery = query(
        collection(db, "notifyAccomplished_Revisions"),
        where("transactionId", "==", transactionId)
      );

      const snapshot = await getDocs(accomplishedQuery);

      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        const docRef = doc(db, "notifyAccomplished_Revisions", docSnap.id);

        // ✅ Mark the specific accomplished notification as read
        await updateDoc(docRef, { isRead: true });
        console.log(`Accomplished notification cleared: ${transactionId}`);
      }
    } catch (error) {
      console.error(
        "Error clearing specific accomplished notification:",
        error
      );
    }
  };

  return {
    hasNewPendingRequest,
    hasNewAccomplishedRecord,
    clearPendingNotifications,
    clearAccomplishedNotifications,
  };
};

export const pushPendingNotification = async (transactionId: string) => {
  try {
    await addDoc(collection(db, "notifyPending"), {
      transactionId,
      isReadBy: [], // No one has read it yet
      timestamp: serverTimestamp(),
    });
    console.log(`Pending notification added for transaction: ${transactionId}`);
  } catch (error) {
    console.error("Error adding pending notification:", error);
  }
};

export const pushAccomplishedNotification = async (
  transactionId: string,
  requester: string
) => {
  try {
    await addDoc(collection(db, "notifyAccomplished_Revisions"), {
      transactionId,
      requester,
      isRead: false, // Unread by default
      timestamp: serverTimestamp(),
    });
    console.log(`Accomplished notification added for requester: ${requester}`);
  } catch (error) {
    console.error("Error adding accomplished notification:", error);
  }
};

export default useNotifications;
