import React, { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../../src/config/firebase.ts";
import type { PendingRequest } from "./types";

// Export a hook to retrieve pending requests in real-time
export const usePendingRequests = () => {
	const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>(
		[]
	);
	useEffect(() => {
		const reqCollection = collection(db, "FormRequests");
		const unsubscribe = onSnapshot(reqCollection, (snapshot) => {
			const requests = snapshot.docs.map((doc) => ({
				transactionId: doc.id,
				...doc.data(),
			})) as PendingRequest[];
			setPendingRequests(requests);
		});
		return () => unsubscribe();
	}, []);
	return pendingRequests;
};

const PendingRequestBackend = () => {
	const pendingRequests = usePendingRequests();

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

export default PendingRequestBackend;
