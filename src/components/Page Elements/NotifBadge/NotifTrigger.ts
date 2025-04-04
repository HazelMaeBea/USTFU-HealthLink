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
	const [pendingRequestType, setPendingRequestType] =
		useState<string>("hospital");

	useEffect(() => {
		if (!uid) return;

		let unsubscribePending: () => void = () => {};
		let unsubscribeAccomplished: () => void = () => {};

		// Real-time listener for `notifyPending` (for operations handlers/admins)
		if (selectedRole === "operations handler" || selectedRole === "admin") {
			const pendingQuery = query(collection(db, "notifyPending"));

			unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
				let newPending = false;

				snapshot.docs.forEach(async (docSnap) => {
					const data = docSnap.data();
					const { isReadBy = [] } = data;

					// If current user hasn't read it, trigger notification
					if (!isReadBy.includes(uid)) {
						newPending = true;
					}
				});

				setHasNewPendingRequest(newPending);
			});
		}

		// Real-time listener for `notifyAccomplished_Revision` (for members)
		if (selectedRole === "member") {
			const accomplishedQuery = query(
				collection(db, "notifyAccomplished_Revisions"),
				where("requester", "==", fullName),
				where("isRead", "==", false)
			);

			unsubscribeAccomplished = onSnapshot(
				accomplishedQuery,
				(snapshot) => {
					setHasNewAccomplishedRecord(snapshot.docs.length > 0);
				}
			);
		}

		return () => {
			unsubscribePending();
			unsubscribeAccomplished();
		};
	}, [uid, selectedRole]);

	// Functions to clear notifications

	// For operations handlers/admins: Mark as read by adding the UID to `isReadBy`
	const clearPendingNotifications = async (transactionId: string) => {
		if (!uid) return;

		try {
			// ✅ Query only the specific `transactionId`
			const pendingQuery = query(
				collection(db, "notifyPending"),
				where("transactionId", "==", transactionId)
			);

			const snapshot = await getDocs(pendingQuery);

			if (!snapshot.empty) {
				const docSnap = snapshot.docs[0]; // Since transactionId is unique, there's only one doc
				const docRef = doc(db, "notifyPending", docSnap.id);
				const data = docSnap.data();
				const { isReadBy = [] } = data;

				// ✅ Add `uid` only if it hasn't been added already
				if (!isReadBy.includes(uid)) {
					await updateDoc(docRef, {
						isReadBy: arrayUnion(uid),
					});
					console.log(
						`Notification for ${transactionId} marked as read by ${uid}`
					);
				}
			}

			// ✅ Instantly update the local state
			setHasNewPendingRequest(false);
			console.log(
				`Cleared notification for transaction: ${transactionId}`
			);
		} catch (error) {
			console.error(
				"Error clearing specific pending notification:",
				error
			);
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
				const docRef = doc(
					db,
					"notifyAccomplished_Revisions",
					docSnap.id
				);

				// ✅ Mark the specific accomplished notification as read
				await updateDoc(docRef, { isRead: true });
				console.log(
					`Accomplished notification cleared: ${transactionId}`
				);
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
		pendingRequestType,
	};
};

export const pushPendingNotification = async (transactionId: string) => {
	try {
		await addDoc(collection(db, "notifyPending"), {
			transactionId,
			isReadBy: [], // No one has read it yet
			timestamp: serverTimestamp(),
		});
		console.log(
			`Pending notification added for transaction: ${transactionId}`
		);
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
		console.log(
			`Accomplished notification added for requester: ${requester}`
		);
	} catch (error) {
		console.error("Error adding accomplished notification:", error);
	}
};


export default useNotifications