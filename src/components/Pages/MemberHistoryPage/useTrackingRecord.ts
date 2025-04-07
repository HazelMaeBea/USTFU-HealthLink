import { useState, useEffect } from "react";
import { db } from "../../../contexts/firebase";
import {
	collection,
	query,
	orderBy,
	onSnapshot,
	getDocs,
} from "firebase/firestore";
import { PendingRequest } from "../../Pages/PendingRequestPage/types";
import { DocumentData } from "firebase/firestore";
import { Record } from "../../Pages/PendingRequestPage/types";
import { useFirebase } from "../../../contexts/firebaseContext";

const useTrackingRecords = () => {
	const { fullName } = useFirebase();
	const [pendingRecords, setPendingRecords] = useState<Record[]>([]);
	const [accomplishedRecords, setAccomplishedRecords] = useState<Record[]>(
		[]
	);
	const [revisionRecords, setRevisionRecords] = useState<Record[]>([]);

	useEffect(() => {
		if (!fullName) return;
		// Reference Firestore collections
		const pendingRef = collection(db, "FormRequests");
		const pendingQuery = query(
			pendingRef,
			orderBy("dateSubmitted", "desc")
		);

		// Fetch and listen for pending requests
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
					formData: data.formData, // Include formData
					dateSubmitted: data.dateSubmitted, // Include dateSubmitted
					requester: data.requester,
				};
			});
			const filteredPendingData = pendingData.filter(
				(record) => record.requester === fullName
			);
			setPendingRecords(filteredPendingData);
		});

		// Fetch and listen for accomplished requests
		const fetchAccomplishedRecords = async () => {
			try {
				const accomplishedSnapshot = await getDocs(
					query(
						collection(db, "AccomplishedRequests"),
						orderBy("DateDecided", "desc")
					)
				);

				const accomplishedData: Record[] =
					accomplishedSnapshot.docs.map((doc) => {
						const data = doc.data() as DocumentData;
						const dateDecided = data.DateDecided
							? data.DateDecided.toDate()
							: new Date(0);

						// Add debug log for PDF data from Firestore
						console.log(
							`PDF data for ${data.transactionId}:`,
							data.pdf,
							data.pdfProcessed
						);

						return {
							dateTime: dateDecided,
							transactionID: data.transactionId || "No ID",
							typeOfForm: data.formData?.formType || "Unknown",
							status:
								data.status.toLowerCase() === "approved"
									? "Approved"
									: "Rejected",
							formData: data.formData,
							dateSubmitted: data.dateSubmitted,
							DateDecided: data.DateDecided,
							requester: data.requester,
							// Ensure pdf data is properly mapped
							pdf: data.pdf,
							pdfProcessed: data.pdfProcessed === true,
						};
					});
				const filteredAccomplishedData = accomplishedData.filter(
					(record) => record.requester === fullName
				);
				setAccomplishedRecords(filteredAccomplishedData);
			} catch (error) {
				console.error("Error fetching accomplished requests:", error);
			}
		};

		fetchAccomplishedRecords();

		const fetchRevisionRecords = async () => {
			try {
				const revisionSnapshot = await getDocs(
					query(
						collection(db, "RevisionsRequests"),
						orderBy("DateDecided", "desc")
					)
				);

				const revisionData: Record[] = revisionSnapshot.docs.map(
					(doc) => {
						const data = doc.data() as DocumentData;
						const dateDecided = data.DateDecided
							? data.DateDecided.toDate()
							: new Date(0);

						return {
							dateTime: dateDecided,
							transactionID: data.transactionId || "No ID",
							typeOfForm: data.formData?.formType || "Unknown",
							status: "For Revision", // All statuses default to this
							formData: data.formData,
							dateSubmitted: data.dateSubmitted,
							DateDecided: data.DateDecided,
							requester: data.requester,
						};
					}
				);

				const filteredRevisionData = revisionData.filter(
					(record) => record.requester === fullName
				);

				setRevisionRecords(filteredRevisionData); // Make sure this state exists
			} catch (error) {
				console.error("Error fetching revision requests:", error);
			}
		};

		fetchRevisionRecords();

		// Cleanup listeners on unmount
		return () => {
			unsubscribePending();
		};
	}, [fullName]);

	return { pendingRecords, accomplishedRecords, revisionRecords };
};

export default useTrackingRecords;
