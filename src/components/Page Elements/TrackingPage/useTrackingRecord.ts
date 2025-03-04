import { useState, useEffect } from "react";
import { db } from "../../../config/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { PendingRequest } from "../PendingRequests/types";

// Define the structure expected by RecordTable
interface Record {
	dateTime: string;
	transactionID: string;
	typeOfForm: string;
	status: string;
}

const useTrackingRecords = () => {
	const [pendingRecords, setPendingRecords] = useState<Record[]>([]);
	const [previousRecords, setPreviousRecords] = useState<Record[]>([]);

	useEffect(() => {
		// Reference Firestore collections
		const pendingRef = collection(db, "FormRequests");
		const previousRef = collection(db, "ApprovedForms");

		// Fetch and listen for pending requests
		const pendingQuery = query(pendingRef, orderBy("dateSubmitted", "desc"));
		const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
			const pendingData: Record[] = snapshot.docs.map((doc) => {
				const data = doc.data() as PendingRequest;
				return {
					dateTime: data.dateSubmitted,
					transactionID: data.transactionId,
					typeOfForm: data.formData.formType,
					status: "Pending",
				};
			});
			setPendingRecords(pendingData);
		});

		// Fetch and listen for previous records
		const previousQuery = query(previousRef, orderBy("dateSubmitted", "desc"));
		const unsubscribePrevious = onSnapshot(previousQuery, (snapshot) => {
			const previousData: Record[] = snapshot.docs.map((doc) => {
				const data = doc.data() as PendingRequest;
				return {
					dateTime: data.dateSubmitted,
					transactionID: data.transactionId,
					typeOfForm: data.formData.formType,
					status: data.status === "approved" ? "Approved" : "Rejected",
				};
			});
			setPreviousRecords(previousData);
		});

		// Cleanup listeners on unmount
		return () => {
			unsubscribePending();
			unsubscribePrevious();
		};
	}, []);

	return { pendingRecords, previousRecords };
};

export default useTrackingRecords;
