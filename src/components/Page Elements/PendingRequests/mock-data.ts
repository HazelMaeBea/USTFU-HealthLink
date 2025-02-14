import type { PendingRequest } from "./types";
// import { collection, getDocs } from "firebase/firestore";
// import { db } from "../../../config/firebase"

// const formRequestsCollection = collection(db, "FormRequests");

// export const getFormsList = async () => {
// 	try {
// 		const data = await getDocs(formRequestsCollection);
// 		const filteredData = data.docs.map((doc) => ({
// 			...doc.data(),
// 		}));
// 		console.log(filteredData);
// 	} catch (error) {
// 		console.log(error)
// 	}
// }

export const mockPendingRequests: PendingRequest[] = [
	{
		transactionId: "TRN2084921934",
		requester: "Test Dela Test",
		dateSubmitted: "2024-10-28",
		status: "pending",
		formData: {
			formType: "hospital",
			lastname: "Dela Test",
			firstname: "Test",
			middlename: "Gold",
			age: 27,
			gender: "Male",
			contact: 9991112222,
			college: "Junior High School",
			hospital: "UST Hospital",
			illness: "Fever",
			physician: "Dr. Smith",
			procedures: "Check-up",
			term: "1st",
			year: "2024-2025",
			load: "16",
			status: "Tenured",
			benefits: "HMO",
			docRequest: {
				url: "/docs/request.pdf",
				filename: "drSmithNote_Oct.pdf",
			},
			hospitalInvoice: {
				url: "/docs/invoice.pdf",
				filename: "HospitalReceiptOct.jpg",
			},
			labInvoice: {
				url: "/docs/lab.pdf",
				filename: "LabreceiptS9234892734.pdf",
			},
			employeeID: {
				url: "/docs/id.pdf",
				filename: "ID_back_Delacruz.png",
			},
			applicantSignature: {
				url: "/docs/signature.png",
				filename: "signature.png",
			},
			hospitalStatus: "Out-Patient",
			claimRequestCount: 1,
		},
	},
	{
		transactionId: "TRN2084921935",
		requester: "Maria Santos",
		dateSubmitted: "2024-10-29",
		status: "pending",
		formData: {
			formType: "eyeglasses",
			lastname: "Santos",
			firstname: "Maria",
			middlename: "Cruz",
			age: 35,
			gender: "Female",
			contact: 9991113333,
			college: "College of Science",
			ORNumber: "OR123456",
			issuedBy: "Metro Optical",
			amountPaid: 5000,
			employeeID: {
				url: "/docs/id.pdf",
				filename: "ID_Santos.png",
			},
			applicantSignature: {
				url: "/docs/signature.png",
				filename: "signature_santos.png",
			},
			claimRequestCount: 1,
		},
	},
];
