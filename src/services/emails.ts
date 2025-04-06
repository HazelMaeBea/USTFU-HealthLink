import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../contexts/firebase";

const getNotificationSetting = async (email: string) => {
    try {
      const usersCollection = collection(db, "users");
      const emailQuery = query(usersCollection, where("email", "==", email));
      const querySnapshot = await getDocs(emailQuery);
  
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const data = userDoc.data();
  
        if (data.settings && data.settings.notification !== undefined) {
          return data.settings.notification;
        } else {
          console.log("Notification setting not found in the document.");
          return true;
        }
      } else {
        console.log("No document found with the provided email.");
        return false;
      }
    } catch (error) {
      console.error("Error querying document:", error);
      throw error;
    }
  };
  
    
const mailCollection = collection(db, "mail");
export const sendEmailVerification = async (email:string, name:string, isApproved:boolean) => {
    const emailFlag = await getNotificationSetting(email);
    if(emailFlag) {
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
}

export async function sendEmailPending(email:string, name:string, action:string, formType: string, reason?:string) {
    const emailFlag = await getNotificationSetting(email);
    if (emailFlag) {
        let reasonFlag = true;
        let reasonValue = "";
        const formName = formType.toLocaleLowerCase()
        if (reason == 'empty') {
            reasonFlag = false;
          }
    
        if (action.toLowerCase() == 'approved') {
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
}