import { z } from "zod";
import { HospitalFormData } from "../../PendingRequestPage/types";

// Base schema shared across form types
export const baseFormSchema = z.object({
	lastname: z
		.string({
			required_error: "Please enter your last name",
			invalid_type_error: "Last name must be text",
		})
		.min(1, "Please enter your last name"),
	firstname: z
		.string({
			required_error: "Please enter your first name",
			invalid_type_error: "First name must be text",
		})
		.min(1, "Please enter your first name"),
	middlename: z
		.string({
			required_error: "Please enter your middle name",
			invalid_type_error: "Middle name must be text",
		})
		.min(1, "Please enter your middle name"),
	suffix: z
		.string({
			invalid_type_error: "Please enter your suffix",
		})
		.nullish(),
	age: z.coerce
		.number({
			invalid_type_error: "Please enter a valid age",
			required_error: "Age is required",
		})
		.min(18, "You must be at least 18 years old to apply"),
	gender: z.enum(["Male", "Female"], {
		errorMap: () => ({ message: "Please select your gender" }),
	}),
	contact: z
		.union([
			z.string().min(1, "Contact number is required"),
			z.number().int("Contact must be a valid phone number"),
			z.null(),
		])
		.optional(),
	college: z
		.string({
			required_error: "Please select your college",
			invalid_type_error: "Please make a valid selection",
		})
		.min(1, "Please select your college"),
	employeeID: z.any().nullable().optional(),
	applicantSignature: z.any().refine((files) => files && files.length > 0, {
		message: "Please upload your signature",
	}),
	claimRequestCount: z.coerce
		.number({
			invalid_type_error: "Please enter a valid number",
			required_error: "Number of claims is required",
		})
		.min(1, "Please enter at least 1 claim")
		.max(10, "Maximum of 10 claims allowed"),
	certify: z.enum(["Yes"], {
		errorMap: () => ({
			message:
				"You must certify that all information provided is true and correct",
		}),
	}),
	// Eyeglasses form fields
	ORNumber: z.string().optional(),
	issuedBy: z.string().optional(),
	amountPaid: z.number().optional(),
	eyeglassesReceipt: z.any().optional(),

	// For all other form types
	procedureSpecify: z.string().optional(),

	// Academic fields
	term: z.string().optional(),
	academicYear: z.string().optional(),

	// Health benefits fields
	benefits: z.string().optional(),
	hmo: z.string().optional(),
});

// Base FormData type from schema with updated contact field
export type BaseFormData = z.infer<typeof baseFormSchema>;

// Add confinement fields to the UnifiedFormData type
export interface ConfinementFields {
	confinementFrom?: string;
	confinementTo?: string;
}

// Add academic related fields as an interface
export interface AcademicFields {
	term?: string;
	academicYear?: string;
}

// UnifiedFormData combines all possible form fields
export type UnifiedFormData = BaseFormData &
	HospitalFormData &
	ConfinementFields &
	AcademicFields;
