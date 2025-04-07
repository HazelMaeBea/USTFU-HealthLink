import { create } from "zustand";
import { UnifiedFormData } from "../../Pages/FormPages/FormUtil/formTypes"; // adjust path as needed

type RevisionStore = {
  formData: UnifiedFormData | null;
  transactionId: string;
  isRevisionMode: boolean;
  setFormData: (data: UnifiedFormData, transactionId: string) => void;
  resetRevision: () => void;
};

export const useRevisionStore = create<RevisionStore>((set) => ({
  formData: null,
  transactionId: "",
  isRevisionMode: false,

  setFormData: (data, transactionId) =>
    set({ formData: data, transactionId, isRevisionMode: true }),

  resetRevision: () =>
    set({ formData: null, transactionId: "", isRevisionMode: false }),
}));
