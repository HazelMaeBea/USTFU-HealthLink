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
} from "firebase/firestore";
import { db } from "../../../../src/config/firebase.ts";
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

// Export a hook to retrieve paginated pending requests in real-time
export const usePendingRequests = (
	initialPage = 1,
	pageSize = 6
): PaginatedRequests => {
	const [allRequests, setAllRequests] = useState<PendingRequest[]>([]);
	const [currentPage, setCurrentPage] = useState<number>(initialPage);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	// Fetch all requests in real-time
	useEffect(() => {
		setIsLoading(true);
		setError(null);

		try {
			const unsubscribe = onSnapshot(
				reqCollection,
				(snapshot) => {
					const requests = snapshot.docs.map((doc) => ({
						transactionId: doc.id,
						...doc.data(),
					})) as PendingRequest[];

					// Sort by date if needed (assuming dateSubmitted is a string in format MM/DD/YYYY)
					const sortedRequests = requests.sort((a, b) => {
						return (
							new Date(a.dateSubmitted).getTime() -
							new Date(b.dateSubmitted).getTime()
						);
					});

					setAllRequests(sortedRequests);
					setIsLoading(false);
				},
				(err) => {
					console.error("Error in snapshot listener:", err);
					setError(
						"Failed to load requests. Please try again later."
					);
					setIsLoading(false);
				}
			);

			return () => unsubscribe();
		} catch (err) {
			console.error("Error setting up requests listener:", err);
			setError("Failed to load requests. Please try again later.");
			setIsLoading(false);
		}
	}, []);

	// Calculate pagination info
	const totalItems = allRequests.length;
	const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

	// Ensure currentPage is valid
	useEffect(() => {
		if (currentPage > totalPages && totalPages > 0) {
			setCurrentPage(totalPages);
		}
	}, [currentPage, totalPages]);

	// Get paginated data
	const startIndex = (currentPage - 1) * pageSize;
	const paginatedRequests = allRequests.slice(
		startIndex,
		startIndex + pageSize
	);

	// Create pagination info object
	const pagination: PaginationInfo = {
		currentPage,
		totalPages,
		pageSize,
		totalItems,
	};

	return {
		requests: paginatedRequests,
		pagination,
		setCurrentPage,
		isLoading,
		error,
	};
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

export const updateDocument = async (
	transID: string,
	textArea: string,
	status: string
) => {
	try {
		const userQuery = query(
			reqCollection,
			where("transactionId", "==", transID)
		);
		const querySnapshot = await getDocs(userQuery);
		querySnapshot.forEach(async (document) => {
			const docRef = doc(db, "FormRequests", document.id);
			const docData = document.data();

			const decisionTimestamp = Timestamp.now();

			await setDoc(
				docRef,
				{
					statusReason: textArea,
					status: status,
					DateDecided: decisionTimestamp,
				},
				{ merge: true }
			);
			console.log(`Document with ID ${document.id} has been updated.`);

			let newCollection = "";
			if (["approved", "rejected"].includes(status)) {
				newCollection = "AccomplishedRequests"; // Approved & Rejected go here
			} else if (status === "for revision") {
				newCollection = "RevisionsRequests";
			}

			if (newCollection) {
				const newDocRef = doc(db, newCollection, document.id);

				// Copy document to the new collection with DateDecided
				await setDoc(newDocRef, {
					...docData,
					status,
					statusReason: textArea,
					DateDecided: decisionTimestamp,
					...(newCollection === "AccomplishedRequests" && status === "approved" ? { pdfProcessed: false } : {})
				});

				// Delete from the original collection
				await deleteDoc(docRef);
				console.log(
					`Document moved to ${newCollection} and deleted from FormRequests.`
				);
			}
		});
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
