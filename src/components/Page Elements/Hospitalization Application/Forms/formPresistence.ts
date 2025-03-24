import { FieldValues } from "react-hook-form";

/**
 * Save form data to localStorage
 * @param formType Unique identifier for the form (e.g., 'inpatient', 'outpatient')
 * @param data Form data to save
 */
export const saveFormData = (formType: string, data: FieldValues): void => {
  try {
    localStorage.setItem(`form_${formType}`, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving form data:", error);
  }
};

/**
 * Load saved form data from localStorage
 * @param formType Unique identifier for the form
 * @returns The saved form data or null if none exists
 */
export const loadFormData = (formType: string): FieldValues | null => {
  try {
    const saved = localStorage.getItem(`form_${formType}`);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error("Error loading form data:", error);
    return null;
  }
};

/**
 * Clear saved form data from localStorage
 * @param formType Unique identifier for the form
 */
export const clearFormData = (formType: string): void => {
  try {
    localStorage.removeItem(`form_${formType}`);
  } catch (error) {
    console.error("Error clearing form data:", error);
  }
};