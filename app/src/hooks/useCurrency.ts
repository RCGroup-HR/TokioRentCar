"use client"

import { useSettingsStore } from "@/stores/settingsStore"
import { formatCurrency, formatDualCurrency } from "@/lib/utils"

export function useCurrency() {
  const { settings } = useSettingsStore()

  const format = (amount: number): string => {
    return formatCurrency(amount, settings.currency, settings.currencySymbol)
  }

  const formatSecondary = (amount: number): string => {
    const secondaryAmount = amount * settings.exchangeRate
    return formatCurrency(
      secondaryAmount,
      settings.secondaryCurrency,
      settings.secondaryCurrencySymbol
    )
  }

  const formatDual = (amount: number): string => {
    const result = formatDualCurrency(amount, {
      primaryCurrency: settings.currency,
      primarySymbol: settings.currencySymbol,
      secondaryCurrency: settings.secondaryCurrency,
      secondarySymbol: settings.secondaryCurrencySymbol,
      exchangeRate: settings.exchangeRate,
      showDual: settings.showDualCurrency,
    })
    return result.combined
  }

  const formatBoth = (amount: number) => {
    return formatDualCurrency(amount, {
      primaryCurrency: settings.currency,
      primarySymbol: settings.currencySymbol,
      secondaryCurrency: settings.secondaryCurrency,
      secondarySymbol: settings.secondaryCurrencySymbol,
      exchangeRate: settings.exchangeRate,
      showDual: settings.showDualCurrency,
    })
  }

  const convert = (amount: number, toSecondary: boolean = true): number => {
    if (toSecondary) {
      return amount * settings.exchangeRate
    }
    return amount / settings.exchangeRate
  }

  return {
    format,
    formatSecondary,
    formatDual,
    formatBoth,
    convert,
    primaryCurrency: settings.currency,
    primarySymbol: settings.currencySymbol,
    secondaryCurrency: settings.secondaryCurrency,
    secondarySymbol: settings.secondaryCurrencySymbol,
    exchangeRate: settings.exchangeRate,
    showDualCurrency: settings.showDualCurrency,
  }
}
