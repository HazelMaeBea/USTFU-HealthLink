import { addDoc, collection } from "firebase/firestore";
import { db } from "../contexts/firebase";

    
    
const mailCollection = collection(db, "mail");
export const sendEmailVerification = async (email:string, name:string, isApproved:boolean) => {
    if(isApproved) {
        addDoc(mailCollection, {
            to: [email],
            message: {
                subject: "Your verification has been approved!",
                html: "<h2>Welcome to USTFU Healthlink " + name + "!</h2><p>Your verification to access the USTFU Healthlink webapp has been approved.\nLook forward to being able to avail for your benefits anytime and anywhere.</p>"
            }
        })
    } else {
        addDoc(mailCollection, {
            to: [email],
            message: {
                subject: "Your verification has been rejected.",
                html: "<h2>Apologies " + name + ".</h2><p>Your verification to access the USTFU Healthlink webapp has been rejected.\nWe sincerely apologize as you might not be able to avail for our current benefits at this time.</p>"
            }
        })
    }
}

export async function sendEmailPending(email:string, name:string, action:string, formType: string, reason?:string) {
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
		addDoc(mailCollection, {
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
		addDoc(mailCollection, {
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
		addDoc(mailCollection, {
			to: [email],
			message: {
				subject: "Your " + formName + " requires revisions!",
				html: "<h2>Apologies " + name + "!</h2><p>But your requested benefits form requires some revisions.</p>" + reasonValue
			}
		})
	}
}