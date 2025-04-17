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
				const accomplishedRef = collection(db, "AccomplishedRequests");
				const accomplishedSnapshot = await getDocs(
					query(accomplishedRef, orderBy("DateDecided", "desc"))
				);

				const accomplishedData: Record[] =
					accomplishedSnapshot.docs.map((doc) => {
						const data = doc.data() as DocumentData;
						const dateDecided = data.DateDecided
							? data.DateDecided.toDate()
							: new Date(0);

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
							pdf: data.pdf,
							pdfProcessed: data.pdfProcessed === true,
							statusReason: data.statusReason,
						};
					});
				const filteredAccomplishedData = accomplishedData.filter(
					(record) => record.requester === fullName
				);
				setAccomplishedRecords(filteredAccomplishedData);
			} catch (error) {
				console.error("Error fetching accomplished requests:", error);

				// Try alternative collection name as fallback
				try {
					const accomplishedSnapshot = await getDocs(
						query(
							collection(db, "accomplishedRequests"),
							orderBy("DateDecided", "desc")
						)
					);

					// Process the data same as above if found...
					if (accomplishedSnapshot.size > 0) {
						// Processing code would go here if needed
					}
				} catch (fallbackError) {
					console.error(
						"Alternative collection approach failed:",
						fallbackError
					);
				}
			}
		};

		fetchAccomplishedRecords();

		const fetchRevisionRecords = async () => {
			try {
				// Try with "RevisionsRequests" first (with the 's')
				const revisionRef = collection(db, "RevisionsRequests");
				const revisionSnapshot = await getDocs(
					query(revisionRef, orderBy("DateDecided", "desc"))
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
							status: "For Revision",
							formData: data.formData,
							dateSubmitted: data.dateSubmitted,
							DateDecided: data.DateDecided,
							requester: data.requester,
							statusReason:
								data.statusReason || "Revision requested",
						};
					}
				);

				// Try different filtering approaches to ensure we catch all records
				const filteredRevisionData = revisionData.filter(
					(record) =>
						record.requester === fullName ||
						record.requester?.toLowerCase() ===
							fullName?.toLowerCase() ||
						record.requester?.trim() === fullName?.trim()
				);

				setRevisionRecords(filteredRevisionData);
			} catch (error) {
				console.error("Error fetching revision requests:", error);

				// Try alternative collection name
				try {
					const revisionRef = collection(db, "RevisionRequests"); // without the 's'
					const revisionSnapshot = await getDocs(
						query(revisionRef, orderBy("DateDecided", "desc"))
					);

					if (revisionSnapshot.size > 0) {
						const revisionData: Record[] =
							revisionSnapshot.docs.map((doc) => {
								const data = doc.data() as DocumentData;
								const dateDecided = data.DateDecided
									? data.DateDecided.toDate()
									: new Date(0);

								return {
									dateTime: dateDecided,
									transactionID:
										data.transactionId || "No ID",
									typeOfForm:
										data.formData?.formType || "Unknown",
									status: "For Revision",
									formData: data.formData,
									dateSubmitted: data.dateSubmitted,
									DateDecided: data.DateDecided,
									requester: data.requester,
									statusReason:
										data.statusReason ||
										"Revision requested",
								};
							});

						const filteredRevisionData = revisionData.filter(
							(record) =>
								record.requester === fullName ||
								record.requester?.toLowerCase() ===
									fullName?.toLowerCase() ||
								record.requester?.trim() === fullName?.trim()
						);

						setRevisionRecords(filteredRevisionData);
					}
				} catch (fallbackError) {
					console.error(
						"Alternative collection approach failed for revisions:",
						fallbackError
					);
				}
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
