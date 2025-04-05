import { useState, useEffect } from "react";
import {
	collection,
	doc,
	getDocs,
	onSnapshot,
	query,
	setDoc,
	where,
	deleteDoc,
	Timestamp,
	updateDoc,
	addDoc,
} from "firebase/firestore";
import { db, getFormID } from "../../../contexts/firebase.ts";
import type { PendingRequest } from "./types.ts";
import { pushAccomplishedNotification } from "../../Page Elements/NotifBadge/NotifTrigger.ts";

const reqCollection = collection(db, "FormRequests");
const usersCollection = collection(db, "users");

// Interface for pagination metadata
export interface PaginationInfo {
	currentPage: number;
	totalPages: number;
	pageSize: number;
	totalItems: number;
}

export interface BenefitsData {
	fullName: string;
	remainingBenefits: number;
}

// Interface for form data
export interface FormProcessingData {
	validUntil?: string;
	reimbursementAmount?: number;
	benefitPercentage?: string;
	officialRep?: string;
	signatureImage?: string | null;
	benefitUsed?: number;
	originalBenefit?: number;
	remainingBenefit?: number;
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
			const snapshot = await getDocs(q); // Manual fetch
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
				console.error(
					"Error fetching real-time pending requests:",
					error
				);
				setError("Failed to load pending requests. Please try again.");
				setIsLoading(false);
			}
		);

		// Cleanup the listener when the component unmounts
		return () => unsubscribe();
	}, [currentPage, pageSize]);

	return {
		requests,
		pagination,
		setCurrentPage,
		isLoading,
		error,
		fetchData,
	};
};

// Update the updateDocument function to handle all form data
export const updateDocument = async (
	requester: string | null,
	transID: string,
	textArea: string,
	status: string,
	formData: FormProcessingData
) => {
	try {
		const userQuery = query(
			reqCollection,
			where("transactionId", "==", transID)
		);

		const requesterQuery = query(
			usersCollection,
			where("fullName", "==", requester)
		)

		const requesterSnapshot = await getDocs(requesterQuery)

		
		const querySnapshot = await getDocs(userQuery);
		for (const document of querySnapshot.docs) {
			const docRef = doc(db, "FormRequests", document.id);
			const docData = document.data();
			const formType = docData.formData?.formType;
			
			if (!requesterSnapshot.empty) {
				requesterSnapshot.forEach((doc) => {
					// console.log("Printing out requesterSnapshot: ");
					// console.log(doc.data().email, doc.data().fullName, status, textArea, formType);
					sendEmail(doc.data().email, doc.data().fullName, status, formType, textArea);
				});
				} else {
					console.log("No matching documents found.");
			}		  
			
			const decisionTimestamp = Timestamp.now();
			const updateObj: any = {
				status: status,
				statusReason: textArea,
				DateDecided: decisionTimestamp,
			};

			// Add validUntil if provided
			if (formData.validUntil) {
				updateObj.validUntil = formData.validUntil;
			}

			// Store benefit history data for all approved forms that modify benefits
			if (status === "approved") {
				// Create a benefit history record to track changes
				const benefitHistory = {
					transactionId: transID,
					date: decisionTimestamp,
					originalBenefit: formData.originalBenefit || 0,
					benefitUsed: formData.benefitUsed || 0,
					remainingBenefit: formData.remainingBenefit || 0,
					formType: formType || "unknown",
				};

				updateObj.benefitHistory = benefitHistory;
			}

			// Form-specific updates
			if (formType === "eyeglasses" && status === "approved") {
				// For eyeglasses forms, add reimbursement data
				updateObj["formData.reimbursementAmount"] =
					formData.reimbursementAmount;
				updateObj["formData.eyeglassesBenefitClaimedDate"] =
					decisionTimestamp;

				// Update user's eyeglasses reimbursement record
				if (formData.reimbursementAmount) {
					await updateUserEyeglassesReimbursement(
						docData.requester,
						formData.reimbursementAmount
					);
				}
			} else if (formType === "hospital" && status === "approved") {
				// For hospital forms, add hospital certification data
				updateObj["formData.benefitPercentage"] =
					formData.benefitPercentage || "100";
				updateObj["formData.officialRep"] = formData.officialRep || "";

				// If signature is provided, convert base64 to storage URL (placeholder for now)
				if (formData.signatureImage) {
					updateObj["formData.ustfuSig"] = {
						url: formData.signatureImage, // In production, you'd upload this to storage
						filename: `signature_${Date.now()}.png`,
					};
				}
			}

			// Apply updates to the document
			await updateDoc(docRef, updateObj);
			console.log(`Document with ID ${document.id} has been updated.`);

			// Determine which collection to move the document to
			let newCollection = "";
			if (["approved", "rejected"].includes(status)) {
				newCollection = "AccomplishedRequests"; // Approved & Rejected go here
			} else if (status === "for revision") {
				newCollection = "RevisionsRequests";
			}

			// Generate new ID for the document in its new collection
			const formIDValue =
				(await getFormID(true, docData.claimRequestCount)) || 1;
			const formIDString =
				formIDValue?.toString().padStart(6, "0") || "error";
			const currentYear: string = new Date().getFullYear().toString();
			const formID = currentYear + "-" + formIDString + "-O";
			console.log("Generated FormID", formID);

			if (newCollection) {
				const newDocRef = doc(db, newCollection, formID);

				// Create new document data with all fields
				const newDocData: {
					formData?: any;
					status: string;
					statusReason: string;
					DateDecided: Timestamp;
					pdfProcessed?: boolean;
					validUntil?: string;
					benefitHistory?: any;
					[key: string]: any;
				} = {
					...docData,
					status,
					statusReason: textArea,
					DateDecided: decisionTimestamp,
					pdfProcessed:
						newCollection === "AccomplishedRequests" &&
						status === "approved"
							? false
							: undefined,
				};

				// Add form-specific data to the new document
				if (formData.validUntil) {
					newDocData.validUntil = formData.validUntil;
				}

				// Add benefit history to the document
				if (status === "approved") {
					newDocData.benefitHistory = {
						transactionId: transID,
						date: decisionTimestamp,
						originalBenefit: formData.originalBenefit || 0,
						benefitUsed: formData.benefitUsed || 0,
						remainingBenefit: formData.remainingBenefit || 0,
						formType: formType || "unknown",
					};
				}

				// Form-specific data for the new document
				if (formType === "eyeglasses") {
					if (!newDocData.formData)
						newDocData.formData = { formType: "eyeglasses" };
					if (formData.reimbursementAmount !== undefined) {
						newDocData.formData.reimbursementAmount =
							formData.reimbursementAmount;
						newDocData.formData.eyeglassesBenefitClaimedDate =
							decisionTimestamp;
					}
				} else if (formType === "hospital") {
					if (!newDocData.formData)
						newDocData.formData = { formType: "hospital" };
					if (formData.benefitPercentage) {
						newDocData.formData.benefitPercentage =
							formData.benefitPercentage;
					}
					if (formData.officialRep) {
						newDocData.formData.officialRep = formData.officialRep;
					}
					if (formData.signatureImage) {
						newDocData.formData.ustfuSig = {
							url: formData.signatureImage,
							filename: `signature_${Date.now()}.png`,
						};
					}
				}

				// Copy document to the new collection
				await setDoc(newDocRef, newDocData);

				// Delete from the original collection
				await deleteDoc(docRef);
				console.log(
					`Document moved to ${newCollection} and deleted from FormRequests.`
				);

				// Send notification to requester
				if (
					newCollection === "AccomplishedRequests" ||
					newCollection === "RevisionsRequests"
				) {
					await pushAccomplishedNotification(
						transID,
						docData.requester
					);
					console.log(
						`✅ Notification pushed for requester: ${docData.requester}`
					);
				}
			}
		}
	} catch (error) {
		console.error("Error updating document:", error);
	}
};

// Update the updateUserEyeglassesReimbursement function to use direct date tracking
export const updateUserEyeglassesReimbursement = async (
	userName: string,
	reimbursementAmount: number
) => {
	try {
		const userQuery = query(
			usersCollection,
			where("fullName", "==", userName)
		);

		const querySnapshot = await getDocs(userQuery);
		querySnapshot.forEach(async (document) => {
			const docRef = doc(db, "users", document.id);

			// Only store the direct fields without using history array
			await setDoc(
				docRef,
				{
					personalInfo: {
						lastReimbursementAmount: reimbursementAmount,
						eyeglassesBenefitClaimedDate: Timestamp.now(),
					},
				},
				{ merge: true }
			);

			console.log(
				`Updated eyeglasses reimbursement data for user: ${userName}`
			);
		});
	} catch (error) {
		console.error("Error updating user eyeglasses data:", error);
	}
};

// Update the updateBenefits function to focus on remaining benefit without history array
export const updateBenefits = async (
	newValue: number,
	userName: string | null
) => {
	try {
		if (!userName) return;

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
					personalInfo: {
						remainingBenefits: newValue,
						lastBenefitUpdate: Timestamp.now(),
					},
				},
				{ merge: true }
			);

			console.log(`Updated benefits for user ${userName}: ${newValue}`);
		});
	} catch (error) {
		console.error("Error updating benefits:", error);
	}
};

export async function getUsersBenefits() {
	const snapshot = await getDocs(usersCollection);

	const result: Record<string, BenefitsData["remainingBenefits"]> = {};
	snapshot.forEach((doc) => {
		const data = {
			fullName: doc.data().fullName,
			remainingBenefits:
				doc.data()?.personalInfo?.remainingBenefits ??
				doc.data()?.remainingBenefits ??
				0,
		} as BenefitsData;

		if (data.fullName && data.remainingBenefits !== undefined) {
			result[data.fullName] = data.remainingBenefits;
		}
	});
	return result;
}

const emailCollection = collection(db, "mail");
export async function sendEmail(email:string, name:string, action:string, formType: string, reason?:string) {
	console.log("Inside sendEmail function");
	let reasonFlag = true;
	let reasonValue = "";
	console.log(reason)
	const formName = formType.toLocaleLowerCase()
	if (reason == 'empty') {
		reasonFlag = false;
	  }

	console.log(reasonFlag)

	if (action.toLowerCase() == 'approved') {
		console.log("Inside approved function");
		if (reasonFlag) {
			reasonValue = "<p>The following reason for your approval has been given:" + reason + "</p>"
		}
		addDoc(emailCollection, {
			to: [email],
			message: {
				subject: "Your " + formName + " form has been approved!",
				html: "<h2>Congratulations " + name + "!</h2><p>Your requested benefits form has been approved.</p>" + reasonValue
			}
		})
	} else if(action.toLowerCase() == 'rejected') {
		console.log("Inside rejected function");
		if (reasonFlag) {
			reasonValue = "<p>The following reason for your rejection has been given:" + reason + "</p>"
		}
		addDoc(emailCollection, {
			to: [email],
			message: {
				subject: "Your " + formName + " has been rejected",
				html: "<h2>Apologies " + name + "!</h2><p>Your requested benefits form has been rejected.</p>" + reasonValue
			}
		})
	} else {
		console.log("Inside revisons function");
		if (reasonFlag) {
			reasonValue = "<p>The following reason for revisions have been given :" + reason + "</p>"
		}
		addDoc(emailCollection, {
			to: [email],
			message: {
				subject: "Your " + formName + " requires revisions!",
				html: "<h2>Apologies " + name + "!</h2><p>But your requested benefits form requires some revisions.</p>" + reasonValue
			}
		})
	}
}