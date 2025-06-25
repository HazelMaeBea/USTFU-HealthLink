import { addDoc, collection } from "firebase/firestore";
import { db } from "../../../contexts/firebase";

export async function addBenefitLimit(
  category: "Eyeglasses" | "MaxAllowable" | "UponRegistration",
  data: Record<string, any>
) {
  try {
    const collectionRef = collection(db, "globals", "benefitLimits", category);
    const docRef = await addDoc(collectionRef, data);
    console.log(`Added document to ${category} with ID: ${docRef.id}`);
    return docRef;
  } catch (error) {
    console.error(`Failed to add document to ${category}:`, error);
    throw error;
  }
}
