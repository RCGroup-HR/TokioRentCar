"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { Button, SignaturePad } from "@/components/ui"
import {
  ArrowLeft,
  Car,
  User,
  Calendar,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  PenTool,
} from "lucide-react"

interface RentalData {
  id: string
  contractNumber: string
  status: string
  startDate: string
  expectedEndDate: string
  totalDays: number
  dailyRate: number
  totalAmount: number
  customerSignature: string | null
  agentSignature: string | null
  signedAt: string | null
  vehicle: {
    brand: string
    model: string
    year: number
    licensePlate: string
    color: string
  }
  rentalCustomers: Array<{
    customer: {
      firstName: string
      lastName: string
      idNumber: string
    }
  }>
  agent: {
    id: string
    firstName: string
    lastName: string
    signature: string | null
  } | null
}

export default function FirmarContratoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()

  const [rental, setRental] = useState<RentalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [customerSignature, setCustomerSignature] = useState<string | null>(null)
  const [customerSignatureConfirmed, setCustomerSignatureConfirmed] = useState(false)

  useEffect(() => {
    fetchRental()
  }, [id])

  const fetchRental = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/rentals/${id}`)
      if (!res.ok) throw new Error("Error al cargar el contrato")
      const data = await res.json()
      setRental(data)

      // Load existing customer signature
      if (data.customerSignature) {
        setCustomerSignature(data.customerSignature)
        setCustomerSignatureConfirmed(true)
      }
    } catch (err) {
      console.error("Error fetching rental:", err)
      setError("No se pudo cargar el contrato")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSignatures = async () => {
    if (!customerSignatureConfirmed || !customerSignature) {
      setError("El cliente debe firmar el contrato")
      return
    }

    // Check if agent has signature configured
    if (!rental?.agent?.signature) {
      setError("El agente no tiene firma configurada. Configure la firma en el perfil del usuario.")
      return
    }

    try {
      setSaving(true)
      setError(null)

      const res = await fetch(`/api/rentals/${id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerSignature,
          agentSignature: rental.agent.signature, // Use agent's signature from profile
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Error al guardar las firmas")
      }

      setSuccess("Contrato firmado exitosamente")

      // Refresh rental data
      await fetchRental()

      // Redirect after success
      setTimeout(() => {
        router.push(`/admin/rentas/${id}`)
      }, 2000)
    } catch (err) {
      console.error("Error saving signatures:", err)
      setError(err instanceof Error ? err.message : "Error al guardar las firmas")
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-DO", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-amber-500 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando contrato...</p>
        </div>
      </div>
    )
  }

  if (!rental) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Contrato no encontrado</p>
          <Button onClick={() => router.back()} className="mt-4">
            Volver
          </Button>
        </div>
      </div>
    )
  }

  const customer = rental.rentalCustomers[0]?.customer
  const isSigned = !!rental.signedAt

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Volver</span>
            </button>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Contrato</p>
              <p className="font-mono font-bold text-amber-600 dark:text-amber-400">
                {rental.contractNumber}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {/* Status Badge */}
        {isSigned && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">
                Contrato Firmado
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                Firmado el {formatDate(rental.signedAt!)}
              </p>
            </div>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            <p className="text-green-800 dark:text-green-200">{success}</p>
          </div>
        )}

        {/* Contract Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 dark:text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-500" />
            Resumen del Contrato
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Vehicle Info */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Car className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Vehículo</p>
                <p className="font-medium dark:text-white">
                  {rental.vehicle.brand} {rental.vehicle.model} {rental.vehicle.year}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {rental.vehicle.color} • {rental.vehicle.licensePlate}
                </p>
              </div>
            </div>

            {/* Customer Info */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <User className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Cliente</p>
                <p className="font-medium dark:text-white">
                  {customer?.firstName} {customer?.lastName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {customer?.idNumber}
                </p>
              </div>
            </div>

            {/* Dates */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Período</p>
                <p className="font-medium dark:text-white">
                  {rental.totalDays} {rental.totalDays === 1 ? "día" : "días"}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(rental.startDate).split(",")[0]} - {formatDate(rental.expectedEndDate).split(",")[0]}
                </p>
              </div>
            </div>

            {/* Total */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <span className="text-xl font-bold text-amber-600 dark:text-amber-400">$</span>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(rental.totalAmount)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Signature Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-6 dark:text-white">
            Firmas del Contrato
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Customer Signature */}
            <div>
              <SignaturePad
                label={`Firma del Cliente${customer ? ` - ${customer.firstName} ${customer.lastName}` : ""}`}
                onSave={(sig) => {
                  setCustomerSignature(sig)
                  setCustomerSignatureConfirmed(true)
                }}
                onClear={() => {
                  setCustomerSignature(null)
                  setCustomerSignatureConfirmed(false)
                }}
                existingSignature={rental.customerSignature}
                disabled={isSigned}
                width={350}
                height={180}
              />
              {customerSignatureConfirmed && !isSigned && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Firma del cliente confirmada
                </p>
              )}
            </div>

            {/* Agent Signature - Read Only, from profile */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-3">
                Firma del Agente{rental.agent ? ` - ${rental.agent.firstName} ${rental.agent.lastName}` : ""}
              </label>

              {rental.agentSignature ? (
                // Show saved signature if contract is signed
                <div className="border-2 border-green-400 dark:border-green-600 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                  <img
                    src={rental.agentSignature}
                    alt="Firma del agente"
                    className="h-[150px] mx-auto"
                  />
                  <p className="text-sm text-green-600 dark:text-green-400 text-center mt-2 flex items-center justify-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Firma registrada
                  </p>
                </div>
              ) : rental.agent?.signature ? (
                // Show agent's profile signature (preview)
                <div className="border-2 border-dashed border-amber-400 dark:border-amber-600 rounded-lg p-4 bg-amber-50 dark:bg-amber-900/20">
                  <img
                    src={rental.agent.signature}
                    alt="Firma del agente"
                    className="h-[150px] mx-auto opacity-70"
                  />
                  <p className="text-sm text-amber-600 dark:text-amber-400 text-center mt-2 flex items-center justify-center gap-1">
                    <PenTool className="h-4 w-4" />
                    Se usará esta firma al guardar
                  </p>
                </div>
              ) : (
                // No signature configured
                <div className="border-2 border-dashed border-red-300 dark:border-red-700 rounded-lg p-8 bg-red-50 dark:bg-red-900/20">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
                    <p className="text-red-600 dark:text-red-400 font-medium">
                      Sin firma configurada
                    </p>
                    <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                      El agente debe configurar su firma en su perfil de usuario
                    </p>
                    <a
                      href="/admin/usuarios"
                      className="text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400 mt-2 inline-block underline"
                    >
                      Ir a gestión de usuarios
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          {!isSigned && (
            <div className="mt-8 flex justify-end gap-4">
              <Button variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button
                onClick={handleSaveSignatures}
                disabled={saving || !customerSignatureConfirmed || !rental.agent?.signature}
                leftIcon={
                  saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )
                }
              >
                {saving ? "Guardando..." : "Firmar Contrato"}
              </Button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
            Instrucciones para firmar:
          </h3>
          <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
            <li>• El cliente debe firmar usando su dedo o un stylus en el área designada</li>
            <li>• Puede limpiar y volver a intentar si no queda satisfecho</li>
            <li>• Haga clic en "Confirmar Firma" después de firmar</li>
            <li>• La firma del agente se toma automáticamente de su perfil de usuario</li>
            <li>• Una vez firmado, el contrato no podrá ser modificado</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
