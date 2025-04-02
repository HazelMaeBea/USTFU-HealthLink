import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useFirebase } from "../../../contexts/firebaseContext";
import { db } from "../../../contexts/firebase";

const unreadAccomplished = () => {
	const { fullName } = useFirebase();
	const [unreadAccomplishedIds, setUnreadAccomplishedIds] = useState<
		string[]
	>([]);

	useEffect(() => {
		if (!fullName) return;

		// ✅ Firestore query for unread accomplished notifications
		const accomplishedQuery = query(
			collection(db, "notifyAccomplished_Revisions"),
			where("requester", "==", fullName),
			where("isRead", "==", false)
		);

		// ✅ Real-time listener
		const unsubscribe = onSnapshot(accomplishedQuery, (snapshot) => {
			const ids = snapshot.docs.map((doc) => doc.data().transactionId);
			setUnreadAccomplishedIds(ids);
		});

		// Cleanup the listener on unmount
		return () => unsubscribe();
	}, [fullName]);

	return { unreadAccomplishedIds, setUnreadAccomplishedIds };
};

export default unreadAccomplished;
