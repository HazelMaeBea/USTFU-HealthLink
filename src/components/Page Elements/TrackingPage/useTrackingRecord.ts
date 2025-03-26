import { useState, useEffect, useCallback } from "react";
import { db } from "../../../config/firebase";
import {
	collection,
	query,
	orderBy,
	onSnapshot,
	getDocs,
} from "firebase/firestore";
import { PendingRequest } from "../PendingRequests/types";
import { DocumentData } from "firebase/firestore";
import { Record } from "../PendingRequests/types";
import { useFirebase } from "../../../contexts/firebaseContext";

const useTrackingRecords = () => {
	const { fullName, uid } = useFirebase();
	const [pendingRecords, setPendingRecords] = useState<Record[]>([]);
	const [accomplishedRecords, setAccomplishedRecords] = useState<Record[]>([]);
	const [newAccomplishedCount, setNewAccomplishedCount] = useState(0);

	const ACCOMPLISHED_KEY = `lastAccomplishedCount_${uid}`;

	// ✅ Refactored to expose fetchAccomplishedRecords as a callback
	const fetchAccomplishedRecords = useCallback(async () => {
		if (!fullName) return;

		try {
			const accomplishedSnapshot = await getDocs(
				query(
					collection(db, "AccomplishedRequests"),
					orderBy("DateDecided", "desc")
				)
			);

			const accomplishedData: Record[] = accomplishedSnapshot.docs.map(
				(doc) => {
					const data = doc.data() as DocumentData;

					const dateDecided = data.DateDecided
						? data.DateDecided.toDate()
						: new Date(0);

					return {
						dateTime: dateDecided,
						transactionID: data.transactionId || "No ID",
						typeOfForm: data.formData?.formType || "Unknown",
						status:
							data.status?.toLowerCase() === "approved"
								? "Approved"
								: "Rejected",
						formData: data.formData, 
						dateSubmitted: data.dateSubmitted, 
						DateDecided: data.DateDecided, 
						requester: data.requester,
					};
				}
			);

			// Filter by current user
			const filteredAccomplishedData = accomplishedData.filter(
				(record) => record.requester === fullName
			);

			// ✅ Store current accomplished count in LocalStorage
			const currentAccomplishedCount = filteredAccomplishedData.length;

			// ✅ Compare with the previous count in LocalStorage
			const lastAccomplishedCount = Number(localStorage.getItem(ACCOMPLISHED_KEY)) || 0;

			// ✅ Calculate new accomplished count
			const newCount = Math.max(0, currentAccomplishedCount - lastAccomplishedCount);
			setNewAccomplishedCount(newCount);

			// ✅ Update LocalStorage with the current count
			localStorage.setItem(ACCOMPLISHED_KEY, currentAccomplishedCount.toString());

			setAccomplishedRecords(filteredAccomplishedData);
		} catch (error) {
			console.error("Error fetching accomplished requests:", error);
		}
	}, [fullName, uid]);

	useEffect(() => {
		if (!fullName) return;

		// ✅ Fetch and listen for pending requests
		const pendingRef = collection(db, "FormRequests");
		const pendingQuery = query(pendingRef, orderBy("dateSubmitted", "desc"));

		const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
			console.log("PendingRequests snapshot size:", snapshot.size);

			const pendingData: Record[] = snapshot.docs.map((doc) => {
				const data = doc.data() as PendingRequest;

				const dateTime = data.dateSubmitted
					? new Date(data.dateSubmitted)
					: new Date(0); // Handle null date

				return {
					dateTime: dateTime,
					transactionID: data.transactionId,
					typeOfForm: data.formData?.formType || "Unknown",
					status: "Pending",
					formData: data.formData, 
					dateSubmitted: data.dateSubmitted, 
					DateDecided: data.DateDecided, 
					requester: data.requester,
				};
			});

			// Filter by current user
			const filteredPendingData = pendingData.filter(
				(record) => record.requester === fullName
			);

			setPendingRecords(filteredPendingData);
		});

		// ✅ Initial fetch of accomplished records
		fetchAccomplishedRecords();

		// ✅ Cleanup listeners on unmount
		return () => {
			unsubscribePending();
		};
	}, [fullName, fetchAccomplishedRecords]);

	// ✅ Return the records and fetch function
	return { pendingRecords, accomplishedRecords, newAccomplishedCount, fetchAccomplishedRecords };
};

export default useTrackingRecords;
