import { create } from "zustand";

interface UiState {
    isVendingMode: boolean;
    setVendingMode: (isVendingMode: boolean) => void;
    showAgeDetectionToast: boolean;
    setShowAgeDetectionToast: (show: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
    isVendingMode: false,
    setVendingMode: (isVendingMode) => set({ isVendingMode }),
    showAgeDetectionToast: false,
    setShowAgeDetectionToast: (show) => set({ showAgeDetectionToast: show }),
}));
