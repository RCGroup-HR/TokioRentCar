import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = "USD", symbol = "$"): string {
  const locale = currency === "DOP" ? "es-DO" : "en-US"
  return `${symbol}${amount.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export interface DualCurrencyOptions {
  primaryCurrency?: string
  primarySymbol?: string
  secondaryCurrency?: string
  secondarySymbol?: string
  exchangeRate?: number
  showDual?: boolean
}

export function formatDualCurrency(
  amount: number,
  options: DualCurrencyOptions = {}
): { primary: string; secondary: string; combined: string } {
  const {
    primaryCurrency = "USD",
    primarySymbol = "$",
    secondaryCurrency = "DOP",
    secondarySymbol = "RD$",
    exchangeRate = 60,
    showDual = true,
  } = options

  const primaryFormatted = formatCurrency(amount, primaryCurrency, primarySymbol)
  const secondaryAmount = amount * exchangeRate
  const secondaryFormatted = formatCurrency(secondaryAmount, secondaryCurrency, secondarySymbol)

  return {
    primary: primaryFormatted,
    secondary: secondaryFormatted,
    combined: showDual ? `${primaryFormatted} (${secondaryFormatted})` : primaryFormatted,
  }
}

export function formatDate(date: Date | string, locale = "es-DO"): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function formatDateShort(date: Date | string, locale = "es-DO"): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

export function generateReservationCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `RES-${timestamp}-${random}`
}

export function generateContractNumber(): string {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `CTR-${year}${month}-${random}`
}

export function calculateDaysBetween(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays || 1
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
}

export function getVehicleCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    ECONOMY: "Económico",
    COMPACT: "Compacto",
    MIDSIZE: "Mediano",
    FULLSIZE: "Tamaño completo",
    SUV: "SUV",
    LUXURY: "Lujo",
    VAN: "Van",
    PICKUP: "Pickup",
    CONVERTIBLE: "Convertible",
    SPORTS: "Deportivo",
  }
  return labels[category] || category
}

export function getTransmissionLabel(transmission: string): string {
  return transmission === "AUTOMATIC" ? "Automático" : "Manual"
}

export function getFuelTypeLabel(fuelType: string): string {
  const labels: Record<string, string> = {
    GASOLINE: "Gasolina",
    DIESEL: "Diésel",
    ELECTRIC: "Eléctrico",
    HYBRID: "Híbrido",
  }
  return labels[fuelType] || fuelType
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    AVAILABLE: "Disponible",
    RENTED: "Rentado",
    MAINTENANCE: "Mantenimiento",
    RESERVED: "Reservado",
    OUT_OF_SERVICE: "Fuera de servicio",
    PENDING: "Pendiente",
    CONFIRMED: "Confirmado",
    CANCELLED: "Cancelado",
    COMPLETED: "Completado",
    NO_SHOW: "No se presentó",
    ACTIVE: "Activo",
    EXTENDED: "Extendido",
    OVERDUE: "Atrasado",
  }
  return labels[status] || status
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    AVAILABLE: "bg-green-100 text-green-800",
    RENTED: "bg-blue-100 text-blue-800",
    MAINTENANCE: "bg-yellow-100 text-yellow-800",
    RESERVED: "bg-purple-100 text-purple-800",
    OUT_OF_SERVICE: "bg-red-100 text-red-800",
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
    COMPLETED: "bg-gray-100 text-gray-800",
    NO_SHOW: "bg-red-100 text-red-800",
    ACTIVE: "bg-blue-100 text-blue-800",
    EXTENDED: "bg-orange-100 text-orange-800",
    OVERDUE: "bg-red-100 text-red-800",
    PAID: "bg-green-100 text-green-800",
    PARTIAL: "bg-yellow-100 text-yellow-800",
    REFUNDED: "bg-gray-100 text-gray-800",
  }
  return colors[status] || "bg-gray-100 text-gray-800"
}
