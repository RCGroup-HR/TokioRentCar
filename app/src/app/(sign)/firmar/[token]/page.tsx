"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import { useSettingsStore } from "@/stores/settingsStore"
import { SignaturePad } from "@/components/ui"
import {
  Car,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Loader2,
  FileText,
  MapPin,
} from "lucide-react"

interface RentalData {
  id: string
  contractNumber: string
  startDate: string
  expectedEndDate: string
  totalDays: number
  totalAmount: number
  dailyRate: number
  depositAmount: number
  pickupLocation: string
  customerName: string
  agentName: string
  agentSignature: string | null
  vehicle: {
    brand: string
    model: string
    year: number
    licensePlate: string
    color: string
    images: { url: string }[]
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-DO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

type PageState = "loading" | "ready" | "already_signed" | "invalid" | "expired" | "success" | "error"

export default function PublicSignPage() {
  const params = useParams()
  const token = params.token as string
  const { settings } = useSettingsStore()

  const [pageState, setPageState] = useState<PageState>("loading")
  const [rental, setRental] = useState<RentalData | null>(null)
  const [signedAt, setSignedAt] = useState<string | null>(null)

  const [customerSignature, setCustomerSignature] = useState<string | null>(null)
  const [customerSignatureConfirmed, setCustomerSignatureConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  useEffect(() => {
    if (!token) return
    fetchContractData()
  }, [token])

  const fetchContractData = async () => {
    try {
      const res = await fetch(`/api/public/sign/${token}`)
      const data = await res.json()

      if (res.status === 410 || data.expired) {
        setPageState("expired")
        return
      }

      if (!res.ok) {
        setPageState("invalid")
        return
      }

      if (data.alreadySigned) {
        setSignedAt(data.signedAt)
        setPageState("already_signed")
        return
      }

      if (!data.rental) {
        setPageState("invalid")
        return
      }

      setRental(data.rental)
      setPageState("ready")
    } catch (err) {
      console.error("[SignPage] Error fetching contract:", err)
      setPageState("invalid")
    }
  }

  const handleSignatureSave = useCallback((sig: string) => {
    setCustomerSignature(sig)
    setCustomerSignatureConfirmed(true)
  }, [])

  const handleSubmit = async () => {
    if (!customerSignature || !customerSignatureConfirmed) {
      setSubmitError("Por favor firma el contrato antes de continuar.")
      return
    }
    setSubmitError("")
    setSubmitting(true)

    try {
      const res = await fetch(`/api/public/sign/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerSignature }),
      })
      const data = await res.json()

      if (res.ok) {
        setSignedAt(data.signedAt)
        setPageState("success")
      } else {
        setSubmitError(data.error || "Error al guardar la firma. Por favor intenta de nuevo.")
      }
    } catch (err) {
      setSubmitError("Error de conexión. Por favor intenta de nuevo.")
    } finally {
      setSubmitting(false)
    }
  }

  const primaryColor = settings.primaryColor || "#f59e0b"
  const companyName = settings.companyName || "Rent Car"

  // ─── Loading ───────────────────────────────────────────────
  if (pageState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4" style={{ color: primaryColor }} />
          <p className="text-gray-600">Cargando contrato...</p>
        </div>
      </div>
    )
  }

  // ─── Invalid / not found ───────────────────────────────────
  if (pageState === "invalid") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-md p-8 text-center">
          {settings.logo ? (
            <img src={settings.logo} alt={companyName} className="h-12 mx-auto mb-6 object-contain" />
          ) : (
            <h2 className="text-2xl font-bold mb-6" style={{ color: primaryColor }}>{companyName}</h2>
          )}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Enlace no válido</h3>
          <p className="text-gray-600 text-sm">
            Este enlace de firma no es válido, ha expirado o ya fue utilizado.
            Contacta con la empresa para obtener un nuevo enlace.
          </p>
        </div>
      </div>
    )
  }

  // ─── Expired ───────────────────────────────────────────────
  if (pageState === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-md p-8 text-center">
          {settings.logo ? (
            <img src={settings.logo} alt={companyName} className="h-12 mx-auto mb-6 object-contain" />
          ) : (
            <h2 className="text-2xl font-bold mb-6" style={{ color: primaryColor }}>{companyName}</h2>
          )}
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-orange-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Enlace expirado</h3>
          <p className="text-gray-600 text-sm">
            Este enlace de firma ha vencido (48 horas). Contacta con la empresa para que te generen un nuevo enlace.
          </p>
        </div>
      </div>
    )
  }

  // ─── Already signed ────────────────────────────────────────
  if (pageState === "already_signed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-md p-8 text-center">
          {settings.logo ? (
            <img src={settings.logo} alt={companyName} className="h-12 mx-auto mb-6 object-contain" />
          ) : (
            <h2 className="text-2xl font-bold mb-6" style={{ color: primaryColor }}>{companyName}</h2>
          )}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Contrato ya firmado</h3>
          <p className="text-gray-600 text-sm">
            Este contrato fue firmado el{" "}
            <span className="font-semibold">
              {signedAt ? new Date(signedAt).toLocaleString("es-DO") : ""}
            </span>.
          </p>
        </div>
      </div>
    )
  }

  // ─── Success ───────────────────────────────────────────────
  if (pageState === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-md p-8 text-center">
          {settings.logo ? (
            <img src={settings.logo} alt={companyName} className="h-12 mx-auto mb-6 object-contain" />
          ) : (
            <h2 className="text-2xl font-bold mb-6" style={{ color: primaryColor }}>{companyName}</h2>
          )}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">¡Contrato firmado!</h3>
          <p className="text-gray-600 text-sm mb-4">
            Tu firma fue guardada exitosamente. El contrato ha quedado registrado.
          </p>
          <p className="text-xs text-gray-400">
            Firmado el {signedAt ? new Date(signedAt).toLocaleString("es-DO") : new Date().toLocaleString("es-DO")}
          </p>
        </div>
      </div>
    )
  }

  // ─── Ready to sign ─────────────────────────────────────────
  if (!rental) return null

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header con logo */}
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
          {settings.logo ? (
            <img src={settings.logo} alt={companyName} className="h-14 mx-auto mb-3 object-contain" />
          ) : (
            <h1 className="text-2xl font-bold mb-3" style={{ color: primaryColor }}>{companyName}</h1>
          )}
          <h2 className="text-lg font-semibold text-gray-800">Firma de Contrato</h2>
          <p className="text-sm text-gray-500 mt-1">
            Por favor revisa los detalles y firma el contrato a continuación
          </p>
        </div>

        {/* Resumen del contrato */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5" style={{ color: primaryColor }} />
            <h3 className="font-bold text-gray-900">Resumen del Contrato</h3>
            <span className="ml-auto text-sm font-mono text-gray-500">#{rental.contractNumber}</span>
          </div>

          {/* Vehículo */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-3">
            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
              <Car className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {rental.vehicle.brand} {rental.vehicle.model} {rental.vehicle.year}
              </p>
              <p className="text-xs text-gray-500">
                Placa: {rental.vehicle.licensePlate} · {rental.vehicle.color}
              </p>
            </div>
          </div>

          {/* Fechas y ubicación */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Fecha de inicio
              </p>
              <p className="text-sm font-medium text-gray-900">{formatDate(rental.startDate)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Fecha de devolución
              </p>
              <p className="text-sm font-medium text-gray-900">{formatDate(rental.expectedEndDate)}</p>
            </div>
          </div>

          {rental.pickupLocation && (
            <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl mb-3">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700">{rental.pickupLocation}</p>
            </div>
          )}

          {/* Montos */}
          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tarifa diaria</span>
              <span className="font-medium">
                {settings.currencySymbol}{rental.dailyRate.toFixed(2)} × {rental.totalDays} días
              </span>
            </div>
            {rental.depositAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Depósito</span>
                <span className="font-medium">{settings.currencySymbol}{rental.depositAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t pt-2 mt-1">
              <span>Total</span>
              <span style={{ color: primaryColor }}>
                {settings.currencySymbol}{rental.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Firma del agente (pre-firmado) */}
        {rental.agentSignature && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-3">Firma del Agente / Empresa</h3>
            <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 flex flex-col items-center">
              <img
                src={rental.agentSignature}
                alt="Firma del agente"
                className="h-20 object-contain"
              />
              <p className="text-xs text-gray-500 mt-2">{rental.agentName}</p>
            </div>
          </div>
        )}

        {/* Firma del cliente */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-1">Tu firma</h3>
          <p className="text-sm text-gray-500 mb-4">
            Dibuja tu firma en el área de abajo y luego presiona <strong>Firmar Contrato</strong>.
          </p>

          <SignaturePad
            label="Firma del cliente"
            onSave={handleSignatureSave}
            onClear={() => {
              setCustomerSignature(null)
              setCustomerSignatureConfirmed(false)
            }}
            width={undefined}
            height={200}
            autoSave
          />

          {/* Indicador visual de firma capturada */}
          {customerSignature && (
            <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              Firma capturada — presiona el botón para finalizar.
            </div>
          )}

          {submitError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {submitError}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || !customerSignature}
            className="mt-4 w-full py-3 px-6 rounded-xl font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ backgroundColor: submitting || !customerSignature ? "#9CA3AF" : primaryColor }}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando firma...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Firmar Contrato
              </>
            )}
          </button>

          <p className="text-xs text-gray-400 text-center mt-3">
            Al hacer clic en &quot;Firmar Contrato&quot; aceptas los términos del contrato de alquiler.
            Este documento tiene validez legal.
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 pb-4">
          {companyName} · Contrato #{rental.contractNumber} · {rental.customerName}
        </p>
      </div>
    </div>
  )
}
