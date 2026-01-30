"use client"

import { useEffect } from "react"
import { useSettingsStore } from "@/stores/settingsStore"

function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return { h: 0, s: 0, l: 0 }

  let r = parseInt(result[1], 16) / 255
  let g = parseInt(result[2], 16) / 255
  let b = parseInt(result[3], 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings, fetchSettings } = useSettingsStore()

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  useEffect(() => {
    const root = document.documentElement

    // Primary color
    const primary = hexToHSL(settings.primaryColor)
    root.style.setProperty("--color-primary", `${primary.h} ${primary.s}% ${primary.l}%`)
    root.style.setProperty("--color-primary-foreground", primary.l > 50 ? "0 0% 0%" : "0 0% 100%")

    // Secondary color
    const secondary = hexToHSL(settings.secondaryColor)
    root.style.setProperty("--color-secondary", `${secondary.h} ${secondary.s}% ${secondary.l}%`)
    root.style.setProperty("--color-secondary-foreground", secondary.l > 50 ? "0 0% 0%" : "0 0% 100%")

    // Accent color
    const accent = hexToHSL(settings.accentColor)
    root.style.setProperty("--color-accent", `${accent.h} ${accent.s}% ${accent.l}%`)
    root.style.setProperty("--color-accent-foreground", accent.l > 50 ? "0 0% 0%" : "0 0% 100%")

    // Update meta theme color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", settings.primaryColor)
    }
  }, [settings.primaryColor, settings.secondaryColor, settings.accentColor])

  return <>{children}</>
}
