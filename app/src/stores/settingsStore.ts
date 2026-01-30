import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface CompanySettings {
  id?: string
  companyName: string
  slogan?: string
  logo?: string
  favicon?: string
  contractHeaderImage?: string  // Imagen de encabezado para contratos
  primaryColor: string
  secondaryColor: string
  accentColor: string
  phone?: string
  whatsapp?: string
  email?: string
  address?: string
  city?: string
  country?: string
  googleMapsUrl?: string
  latitude?: number
  longitude?: number
  facebook?: string
  instagram?: string
  twitter?: string
  youtube?: string
  tiktok?: string
  // Primary currency (e.g., USD)
  currency: string
  currencySymbol: string
  // Secondary currency (e.g., DOP)
  secondaryCurrency: string
  secondaryCurrencySymbol: string
  // Exchange rate: 1 primary = X secondary
  exchangeRate: number
  // Show prices in both currencies
  showDualCurrency: boolean
  // Tax configuration (ITBIS)
  applyTax: boolean
  taxRate: number
  timezone: string
  defaultLanguage: string
  termsAndConditions?: string
  privacyPolicy?: string
  cancellationPolicy?: string
  businessHours?: Record<string, { open: string; close: string; closed?: boolean }>
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string
}

interface SettingsState {
  settings: CompanySettings
  isLoading: boolean
  setSettings: (settings: Partial<CompanySettings>) => void
  fetchSettings: () => Promise<void>
  updateSettings: (settings: Partial<CompanySettings>) => Promise<void>
}

const defaultSettings: CompanySettings = {
  companyName: "Rent Car",
  slogan: "Tu mejor opción en alquiler de vehículos",
  primaryColor: "#F59E0B",
  secondaryColor: "#1F2937",
  accentColor: "#000000",
  currency: "USD",
  currencySymbol: "$",
  secondaryCurrency: "DOP",
  secondaryCurrencySymbol: "RD$",
  exchangeRate: 60,
  showDualCurrency: true,
  applyTax: true,
  taxRate: 18,
  timezone: "America/Santo_Domingo",
  defaultLanguage: "es",
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      isLoading: false,

      setSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }))
      },

      fetchSettings: async () => {
        set({ isLoading: true })
        try {
          const response = await fetch("/api/settings")
          if (response.ok) {
            const data = await response.json()
            set({ settings: { ...defaultSettings, ...data } })
          }
        } catch (error) {
          console.error("Error fetching settings:", error)
        } finally {
          set({ isLoading: false })
        }
      },

      updateSettings: async (newSettings) => {
        set({ isLoading: true })
        try {
          const response = await fetch("/api/settings", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newSettings),
          })
          if (response.ok) {
            const data = await response.json()
            // Update local state with the response from server
            set({ settings: { ...defaultSettings, ...data } })
          } else {
            throw new Error("Error updating settings")
          }
        } catch (error) {
          console.error("Error updating settings:", error)
          throw error
        } finally {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: "company-settings",
      partialize: (state) => ({ settings: state.settings }),
    }
  )
)
