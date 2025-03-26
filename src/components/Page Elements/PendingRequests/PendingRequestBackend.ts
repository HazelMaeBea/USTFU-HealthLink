import { useState, useEffect } from "react";
import {
	collection,
	doc,
	DocumentData,
	getDocs,
	onSnapshot,
	query,
	setDoc,
	where,
	deleteDoc,
	Timestamp,
	orderBy,
	limit,
	updateDoc,
} from "firebase/firestore";
import { db, getFormID } from "../../../../src/config/firebase.ts";
import type { PendingRequest } from "./types";

const reqCollection = collection(db, "FormRequests");
const usersCollection = collection(db, "users");

// Interface for pagination metadata
export interface PaginationInfo {
	currentPage: number;
	totalPages: number;
	pageSize: number;
	totalItems: number;
}

// Interface for the hook return value
export interface PaginatedRequests {
	requests: PendingRequest[];
	pagination: PaginationInfo;
	setCurrentPage: (page: number) => void;
	isLoading: boolean;
	error: string | null;
}

// Fixed usePendingRequests hook
export const usePendingRequests = (initialPage = 1, pageSize = 1000) => {
	const [requests, setRequests] = useState<PendingRequest[]>([]);
	const [pagination, setPagination] = useState({
		currentPage: initialPage,
		totalPages: 1,
		totalRecords: 0,
	});
	const [currentPage, setCurrentPage] = useState(initialPage);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchData = async () => {
		const formRequestsRef = collection(db, "FormRequests");
		const q = query(formRequestsRef, where("status", "==", "pending"));

		setIsLoading(true);

		try {
			const snapshot = await getDocs(q);  // Manual fetch
			const results: PendingRequest[] = [];
			snapshot.forEach((doc) => {
				const data = doc.data() as PendingRequest;
				results.push({
					...data,
					id: doc.id,
				});
			});

			// Update state with fetched data
			setRequests(results);
			setPagination({
				currentPage,
				totalPages: Math.ceil(results.length / pageSize) || 1,
				totalRecords: results.length,
			});
		} catch (error) {
			console.error("Error fetching pending requests:", error);
			setError("Failed to load pending requests. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		// Use onSnapshot for real-time updates
		const formRequestsRef = collection(db, "FormRequests");
		const q = query(formRequestsRef, where("status", "==", "pending"));

		const unsubscribe = onSnapshot(
			q,
			(snapshot) => {
				console.log(`Received ${snapshot.size} pending requests`);
				const results: PendingRequest[] = [];
				snapshot.forEach((doc) => {
					const data = doc.data() as PendingRequest;
					results.push({
						...data,
						id: doc.id,
					});
				});

				setRequests(results);
				setPagination({
					currentPage,
					totalPages: Math.ceil(results.length / pageSize) || 1,
					totalRecords: results.length,
				});
				setIsLoading(false);
			},
			(error) => {
				console.error("Error fetching real-time pending requests:", error);
				setError("Failed to load pending requests. Please try again.");
				setIsLoading(false);
			}
		);

		// Cleanup the listener when the component unmounts
		return () => unsubscribe();
	}, [currentPage, pageSize]);

	return { requests, pagination, setCurrentPage, isLoading, error, fetchData };
};

export async function getRemainingBenefits(
	inputRequester: string
): Promise<number> {
	try {
		const userQuery = query(
			usersCollection,
			where("fullName", "==", inputRequester)
		);
		const querySnapshot = await getDocs(userQuery);
		console.log(inputRequester);

		if (querySnapshot.empty) {
			console.log("No matching documents found.");
			return 1;
		}

		let remainingBenefits: number = 0;

		querySnapshot.forEach((doc: DocumentData) => {
			remainingBenefits = doc.data().personalInfo.remainingBenefits;
		});

		return remainingBenefits;
	} catch (error) {
		console.error("Error fetching remainingBenefits:", error);
		throw error;
	}
}

// Update the updateDocument function to include validUntil
export const updateDocument = async (
	transID: string,
	textArea: string,
	status: string,
	validUntil?: string // Add optional validUntil parameter
) => {
	try {
		const userQuery = query(
			reqCollection,
			where("transactionId", "==", transID)
		);
		const querySnapshot = await getDocs(userQuery);
		for (const document of querySnapshot.docs) {
			const docRef = doc(db, "FormRequests", document.id);
			const docData = document.data();

			const decisionTimestamp = Timestamp.now();

			// Create update object with optional validUntil field
			await updateDoc(docRef, {
				status: status,                       // ✅ Ensure status is updated
				statusReason: textArea,
				DateDecided: decisionTimestamp,
				...(validUntil ? { validUntil } : {})
			});

			console.log(`Document with ID ${document.id} has been updated.`);
			console.log(`Document with ID ${document.id} has been updated.`);

			let newCollection = "";
			if (["approved", "rejected"].includes(status)) {
				newCollection = "AccomplishedRequests"; // Approved & Rejected go here
			} else if (status === "for revision") {
				newCollection = "RevisionsRequests";
			}

			// insert code to generate new ID
			const formIDValue = await getFormID(true, docData.claimRequestCount) || 1;
			const formIDString = formIDValue?.toString().padStart(6, "0") || "error";
			const currentYear: string = new Date().getFullYear().toString();
			const formID = currentYear + "-" + formIDString + "-O";
			console.log("Generated FormID", formID)
			
			if (newCollection) {
				const newDocRef = doc(db, newCollection, formID);

				// Create new document data with all fields
				const newDocData = {
					...docData,
					status,
					statusReason: textArea,
					DateDecided: decisionTimestamp,
					...(validUntil ? { validUntil } : {}), // Include validUntil if available
					...(newCollection === "AccomplishedRequests" &&
					status === "approved"
						? { pdfProcessed: false }
						: {}),
				};

				// Copy document to the new collection
				await setDoc(newDocRef, newDocData);

				// Delete from the original collection
				await deleteDoc(docRef);
				console.log(
					`Document moved to ${newCollection} and deleted from FormRequests.`
				);
			}
		}
	} catch (error) {
		console.error("Error updating document:", error);
	}
};

export const updateBenefits = async (
	newValue: number,
	userName: string | null
) => {
	try {
		const userQuery = query(
			usersCollection,
			where("fullName", "==", userName)
		);

		const querySnapshot = await getDocs(userQuery);
		querySnapshot.forEach(async (document) => {
			const docRef = doc(db, "users", document.id);

			await setDoc(
				docRef,
				{
					personalInfo: { remainingBenefits: newValue },
				},
				{ merge: true }
			);
		});
	} catch (error) {
		console.error(error);
	}
};
