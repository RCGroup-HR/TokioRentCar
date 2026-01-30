import { create } from "zustand"
import { persist } from "zustand/middleware"

type Theme = "light" | "dark" | "system"

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: "light" | "dark"
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "system",
      resolvedTheme: "light",

      setTheme: (theme) => {
        set({ theme })

        // Update resolved theme
        let resolved: "light" | "dark" = "light"
        if (theme === "system") {
          resolved = window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
        } else {
          resolved = theme
        }
        set({ resolvedTheme: resolved })

        // Apply to document
        if (resolved === "dark") {
          document.documentElement.classList.add("dark")
        } else {
          document.documentElement.classList.remove("dark")
        }
      },
    }),
    {
      name: "theme-storage",
      onRehydrateStorage: () => (state) => {
        // Apply theme after rehydration
        if (state) {
          let resolved: "light" | "dark" = "light"
          if (state.theme === "system") {
            if (typeof window !== "undefined") {
              resolved = window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light"
            }
          } else {
            resolved = state.theme
          }

          if (typeof document !== "undefined") {
            if (resolved === "dark") {
              document.documentElement.classList.add("dark")
            } else {
              document.documentElement.classList.remove("dark")
            }
          }
        }
      },
    }
  )
)
