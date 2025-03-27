import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState, useRef } from "react";
import { db } from "../../../config/firebase";

interface UseNotificationsProps {
	requests: any[];                // Pending requests collection
	accomplishedRecords: any[];     // Accomplished records collection
	uid: string | null;             // User ID
	selectedRole: string;           // Current user role
    transactionId?: string;
}

// ✅ LocalStorage Keys
const ACCOMPLISHED_KEY = "lastAccomplishedCount";
const PENDING_DOC_IDS_KEY = "lastPendingDocIds";
const PENDING_LAST_SEEN_DATE_KEY = "lastPendingDocSubmitted";
const ACCOMPLISHED_LAST_SEEN_DATE_KEY = "lastAccomplishedDateDecided";
const CLEARED_PENDING_DOCS_KEY = "clearedPendingDocs";
const PENDING_LAST_SEEN_DATE_PER_ID = "pendingLastSeenDatePerId";

const useNotifications = ({
	requests,
	accomplishedRecords,
	uid,
	selectedRole,
}: UseNotificationsProps) => {

	// 🔥 State Variables
	const [hasNewPendingRequest, setHasNewPendingRequest] = useState(false);
	const [hasNewAccomplishedRecord, setHasNewAccomplishedRecord] = useState(false);
	const [triggerPendingClass, setTriggerPendingClass] = useState(false);
	const [triggerAccomplishedClass, setTriggerAccomplishedClass] = useState(false);
	const [clearedDocIds, setClearedDocIds] = useState<string[]>([]);

    const fetchAndStoreRequestDate = async (transactionId: string) => {
		try {
			const docRef = doc(db, "FormRequests", transactionId);  // ✅ Reference the specific request
			const docSnap = await getDoc(docRef);

			if (docSnap.exists()) {
				const requestData = docSnap.data();
				const docSubmitted = new Date(requestData.docSubmitted).getTime();

				// ✅ Store the date in localStorage by transactionId
				const storedDates = JSON.parse(
					localStorage.getItem(PENDING_LAST_SEEN_DATE_PER_ID) || "{}"
				);
				
				storedDates[transactionId] = docSubmitted;
				localStorage.setItem(PENDING_LAST_SEEN_DATE_PER_ID, JSON.stringify(storedDates));

				console.log(`✅ Stored date for ${transactionId}: ${docSubmitted}`);
			} else {
				console.log(`❌ No request found for ID: ${transactionId}`);
			}
		} catch (error) {
			console.error("Error fetching request date:", error);
		}
	};
    
	// ✅ UseRef to Prevent Infinite Loop
	const isMounted = useRef(false);

	// ✅ Load cleared IDs from localStorage on initial render only
	useEffect(() => {
		const storedCleared = localStorage.getItem(CLEARED_PENDING_DOCS_KEY);
		if (storedCleared) {
			setClearedDocIds(JSON.parse(storedCleared));
		}
	}, []);

	// ✅ Compare current state with last seen state
	useEffect(() => {
		if (!uid || !isMounted.current) {
			isMounted.current = true;  // Skip the first render
			return;
		}

		const latestClearedIds = JSON.parse(localStorage.getItem(CLEARED_PENDING_DOCS_KEY) || "[]");

		// 🔥 Handle Pending Requests Notifications
		if (selectedRole === "operations handler" || selectedRole === "admin") {
			const lastSeenDocIds = JSON.parse(localStorage.getItem(PENDING_DOC_IDS_KEY) || "[]");
			const currentDocIds = requests.map((doc) => doc.id);

			// ✅ Filter out cleared and seen IDs
			const newDocIds = currentDocIds
				.filter((id) => !lastSeenDocIds.includes(id))   // Exclude seen IDs
				.filter((id) => !latestClearedIds.includes(id));  // Exclude cleared IDs

			// ✅ Check for date-based changes
			const lastSeenDocSubmitted = localStorage.getItem(PENDING_LAST_SEEN_DATE_KEY) || "0";
			const latestDocSubmitted = requests
				.map((doc) => new Date(doc.docSubmitted).getTime())
				.reduce((max, date) => (date > max ? date : max), 0);

			const isNewDate = latestDocSubmitted > Number(lastSeenDocSubmitted);
			const hasNewDocs = newDocIds.length > 0;

			if (hasNewDocs || isNewDate) {
				console.log("🔥 New Pending Requests (excluding cleared):", newDocIds);
				setHasNewPendingRequest(true);
				setTriggerPendingClass(true);
			} else {
				setHasNewPendingRequest(false);
				setTriggerPendingClass(false);
			}

			// ✅ Sync localStorage
			localStorage.setItem(PENDING_DOC_IDS_KEY, JSON.stringify(currentDocIds));
			localStorage.setItem(PENDING_LAST_SEEN_DATE_KEY, latestDocSubmitted.toString());
		}

		// 🔥 Handle Accomplished Records Notifications
		if (selectedRole === "member") {
			const lastAccomplishedCount = parseInt(localStorage.getItem(ACCOMPLISHED_KEY) || "0", 10);
			const lastSeenDateDecided = localStorage.getItem(ACCOMPLISHED_LAST_SEEN_DATE_KEY) || "0";

			// Find the latest DateDecided in the new batch
			const latestDateDecided = accomplishedRecords
				.map((doc) => new Date(doc.DateDecided).getTime())
				.reduce((max, date) => (date > max ? date : max), 0);

			const isNewAccomplishedDate = latestDateDecided > Number(lastSeenDateDecided);

			if (accomplishedRecords.length > lastAccomplishedCount || isNewAccomplishedDate) {
				console.log("🔥 New Accomplished Records:", accomplishedRecords);
				setHasNewAccomplishedRecord(true);
				setTriggerAccomplishedClass(true);
			} else {
				setHasNewAccomplishedRecord(false);
				setTriggerAccomplishedClass(false);
			}

			// ✅ Sync localStorage
			localStorage.setItem(ACCOMPLISHED_KEY, accomplishedRecords.length.toString());
			localStorage.setItem(ACCOMPLISHED_LAST_SEEN_DATE_KEY, latestDateDecided.toString());
		}
	}, [requests, accomplishedRecords, selectedRole, uid]);

	// ✅ Clear Pending Notifications
	const clearPendingNotifications = () => {
		setHasNewPendingRequest(false);
		setTriggerPendingClass(false);

		const currentDocIds = requests.map((doc) => doc.id);
		localStorage.setItem(PENDING_DOC_IDS_KEY, JSON.stringify(currentDocIds));

		const latestDocSubmitted = requests
			.map((doc) => new Date(doc.docSubmitted).getTime())
			.reduce((max, date) => (date > max ? date : max), 0);

		localStorage.setItem(PENDING_LAST_SEEN_DATE_KEY, latestDocSubmitted.toString());
	};

	// ✅ Clear Accomplished Notifications
	const clearAccomplishedNotifications = () => {
		setHasNewAccomplishedRecord(false);
		setTriggerAccomplishedClass(false);

		localStorage.setItem(
			ACCOMPLISHED_KEY,
			accomplishedRecords.length.toString()
		);

		const latestDateDecided = accomplishedRecords
			.map((doc) => new Date(doc.DateDecided).getTime())
			.reduce((max, date) => (date > max ? date : max), 0);

		localStorage.setItem(ACCOMPLISHED_LAST_SEEN_DATE_KEY, latestDateDecided.toString());
	};

	// ✅ Improved Clearing Function
	const clearRequestNotification = (transactionId: string) => {
		const updatedClearedDocIds = [...new Set([...clearedDocIds, transactionId])];

		// ✅ Sync both localStorage and state immediately
		localStorage.setItem(CLEARED_PENDING_DOCS_KEY, JSON.stringify(updatedClearedDocIds));
		setClearedDocIds(updatedClearedDocIds);  // Immediate sync in state

		console.log(`✅ Cleared Notification for Request ID: ${transactionId}`);
	};

	// ✅ Return states and functions
	return {
		hasNewPendingRequest,
		hasNewAccomplishedRecord,
		triggerPendingClass,
		triggerAccomplishedClass,
		clearPendingNotifications,
		clearAccomplishedNotifications,
		clearRequestNotification,
	};
};

export default useNotifications;
