import React, { useState, useEffect } from "react";
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
}

// Export a hook to retrieve paginated pending requests in real-time
export const usePendingRequests = (
	initialPage = 1,
	pageSize = 6
): PaginatedRequests => {
	const [allRequests, setAllRequests] = useState<PendingRequest[]>([]);
	const [currentPage, setCurrentPage] = useState<number>(initialPage);

	// Fetch all requests in real-time
	useEffect(() => {
		const unsubscribe = onSnapshot(reqCollection, (snapshot) => {
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
		});
		return () => unsubscribe();
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
	};
};

const PendingRequestBackend = () => {
	const { requests: pendingRequests } = usePendingRequests();

	return (
		<div>
			{pendingRequests.map((request) => (
				<div key={request.transactionId}>
					<p>
						{request.transactionId} - {request.requester}
					</p>
				</div>
			))}
		</div>
	);
};

export async function getRemainingBenefits(
	inputRequester: string
): Promise<number> {
	try {
		const usersCollection = collection(db, "users");
		const userQuery = query(
			usersCollection,
			where("displayName", "==", inputRequester)
		);
		const querySnapshot = await getDocs(userQuery);

		if (querySnapshot.empty) {
			console.log("No matching documents found.");
			return 0;
		}

		let remainingBenefits: number = 0;

		querySnapshot.forEach((doc: DocumentData) => {
			remainingBenefits = doc.data().remainingBenefits;
			// console.log(doc.data().remainingBenefits);
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
			const docRef = doc(db, "FormRequests", document.id); // Get the document reference
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
			); // Update or set fields
			console.log(`Document with ID ${document.id} has been updated.`);
			// console.log(docRef);

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
					DateDecided: decisionTimestamp, // Add DateDecided here as well
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

export default PendingRequestBackend;
