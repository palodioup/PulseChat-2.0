import { create } from 'zustand';

export const useContactStore = create((set) => ({
  // 1. Initial State
  allContacts: [], 

  addContact: (userId) =>
    set((state) => {
      // 2. SAFETY: If allContacts is undefined, use an empty array []
      const list = state.allContacts || [];

      // 3. Prevent invalid IDs
      if (!userId || userId === "check") return { allContacts: list };

      // 4. Check for duplicates safely
      if (list.includes(userId)) return { allContacts: list };

      return {
        allContacts: [...list, userId],
      };
    }),

  setContacts: (contacts) => set({ allContacts: contacts || [] }),
}));
