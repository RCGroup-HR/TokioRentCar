"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui"
import { useSettingsStore } from "@/stores/settingsStore"
import { formatCurrency } from "@/lib/utils"
import { ArrowLeft, Printer, Download, Car, Calendar, User, FileText, PenTool, CheckCircle, Share2, Loader2, Link2, Copy, Check, Trash2, ExternalLink, Activity, PlusCircle, Edit3, RotateCcw } from "lucide-react"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  phoneSecondary?: string
  idType: string
  idNumber: string
  licenseNumber?: string
  licenseExpiry?: string
  address?: string
  city?: string
  state?: string
}

interface Vehicle {
  id: string
  brand: string
  model: string
  year: number
  licensePlate: string
  color: string
  category: string
  transmission: string
  fuelType: string
  mileage: number
  images: { url: string; isPrimary: boolean }[]
}

interface Rental {
  id: string
  contractNumber: string
  startDate: string
  expectedEndDate: string
  actualEndDate?: string
  startMileage: number
  endMileage?: number
  pickupLocation: string
  dropoffLocation?: string
  dailyRate: number
  totalDays: number
  subtotal: number
  taxes: number
  discount: number
  extraCharges: number
  totalAmount: number
  depositAmount: number
  depositReturned: number
  status: string
  pickupCondition?: string
  fuelLevelStart?: number
  fuelLevelEnd?: number
  licenseNumber?: string
  idNumber?: string
  idType?: string
  notes?: string
  createdAt: string
  customerSignature?: string | null
  agentSignature?: string | null
  signedAt?: string | null
  signToken?: string | null
  rentalCustomers: {
    customer: Customer
  }[]
  agent?: {
    id: string
    firstName: string
    lastName: string
  }
  vehicle: Vehicle
}

interface ActivityLog {
  id: string
  action: string
  description: string
  metadata?: Record<string, any>
  createdAt: string
}

// Checklist items for the contract
const checklistItems = [
  "AIRE ACONDICIONADO", "DOCUMENTO", "ANTENA",
  "ENCENDEDOR", "MICA", "GATO",
  "RADIO", "ASIENTOS", "CINTURON",
  "BATERIA", "GOMA DE REPUESTO", "TAPA PARA GASOLINA",
  "LIMPIA VIDRIO", "PLACA", "LLAVE DE RUEDAS",
  "REVISTA", "VIDRIO", "BOCINA",
  "PLANTA DE MUSICA", "", "ALFOMBRAS",
  "BOCINA DE BAJO", "", "ESPEJOS",
  "MONITOR DE MUSICA", "", "",
]

export default function RentalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { settings } = useSettingsStore()
  const [rental, setRental] = useState<Rental | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [generatingLink, setGeneratingLink] = useState(false)
  const [revokingLink, setRevokingLink] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const contractRef = useRef<HTMLDivElement>(null)

  const signUrl = rental?.signToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/firmar/${rental.signToken}`
    : null

  useEffect(() => {
    if (params.id) {
      fetchRental()
    }
  }, [params.id])

  // Auto-print if ?print=true
  useEffect(() => {
    if (rental && searchParams.get("print") === "true") {
      setTimeout(() => {
        window.print()
      }, 500)
    }
  }, [rental, searchParams])

  const fetchRental = async () => {
    try {
      const [rentalRes, activityRes] = await Promise.all([
        fetch(`/api/rentals/${params.id}`),
        fetch(`/api/rentals/${params.id}/activity`),
      ])
      if (rentalRes.ok) {
        const data = await rentalRes.json()
        setRental(data)
      } else {
        router.push("/admin/rentas")
      }
      if (activityRes.ok) {
        const actData = await activityRes.json()
        setActivityLogs(actData.logs || [])
      }
    } catch (error) {
      console.error("Error fetching rental:", error)
    } finally {
      setLoading(false)
    }
  }

  const refreshActivity = async () => {
    try {
      const res = await fetch(`/api/rentals/${params.id}/activity`)
      if (res.ok) {
        const data = await res.json()
        setActivityLogs(data.logs || [])
      }
    } catch {}
  }

  const handleGenerateLink = async () => {
    if (!rental) return
    setGeneratingLink(true)
    try {
      const res = await fetch(`/api/rentals/${rental.id}/sign-token`, { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        setRental((prev) => prev ? { ...prev, signToken: data.signToken } : prev)
        refreshActivity()
      } else {
        alert(data.error || "Error al generar el link")
      }
    } catch {
      alert("Error de conexión")
    } finally {
      setGeneratingLink(false)
    }
  }

  const handleRevokeLink = async () => {
    if (!rental || !confirm("¿Seguro que deseas revocar el link de firma? El cliente ya no podrá usarlo.")) return
    setRevokingLink(true)
    try {
      const res = await fetch(`/api/rentals/${rental.id}/sign-token`, { method: "DELETE" })
      if (res.ok) {
        setRental((prev) => prev ? { ...prev, signToken: null } : prev)
        refreshActivity()
      } else {
        const data = await res.json()
        alert(data.error || "Error al revocar el link")
      }
    } catch {
      alert("Error de conexión")
    } finally {
      setRevokingLink(false)
    }
  }

  const handleCopyLink = () => {
    if (!signUrl) return
    navigator.clipboard.writeText(signUrl).then(() => {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    })
  }

  const handleShareLinkWhatsApp = () => {
    if (!signUrl || !rental) return
    const customer = rental.rentalCustomers[0]?.customer
    const name = customer ? `${customer.firstName}` : "cliente"
    const message = `Hola ${name}, te enviamos el enlace para firmar tu contrato de alquiler #${rental.contractNumber}:\n\n${signUrl}\n\nPor favor firma a la brevedad posible.`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank")
  }

  const handlePrint = () => {
    window.print()
  }

  const generatePDF = async (): Promise<Blob | null> => {
    if (!contractRef.current) return null

    try {
      const canvas = await html2canvas(contractRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const imgWidth = 210 // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)

      return pdf.output('blob')
    } catch (error) {
      console.error('Error generating PDF:', error)
      return null
    }
  }

  const handleShareWhatsApp = async () => {
    if (!rental || !customer) return

    setGeneratingPdf(true)

    try {
      const pdfBlob = await generatePDF()

      if (!pdfBlob) {
        alert('Error al generar el PDF')
        setGeneratingPdf(false)
        return
      }

      const fileName = `Contrato-${rental.contractNumber}.pdf`
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' })

      // Check if Web Share API is available and supports files
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: `Contrato ${rental.contractNumber}`,
          text: `Contrato de alquiler - ${settings.companyName || 'Rent Car'}`,
        })
      } else {
        // Fallback: Download PDF and open WhatsApp with message
        const url = URL.createObjectURL(pdfBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        // Open WhatsApp with message
        const vehicleName = `${rental.vehicle.brand} ${rental.vehicle.model} ${rental.vehicle.year}`
        const startDate = formatDate(rental.startDate)
        const endDate = formatDate(rental.expectedEndDate)
        const total = formatCurrency(rental.totalAmount, settings.currency, settings.currencySymbol)

        const message = `🚗 *Contrato de Alquiler*
━━━━━━━━━━━━━━━
📋 *No. ${rental.contractNumber}*

👤 *Cliente:* ${customer.firstName} ${customer.lastName}

🚙 *Vehículo:* ${vehicleName}
🔢 *Placa:* ${rental.vehicle.licensePlate}

📅 *Período:*
   Desde: ${startDate}
   Hasta: ${endDate}

💰 *Total:* ${total}

📎 *El PDF del contrato se ha descargado. Por favor adjúntelo a este chat.*
━━━━━━━━━━━━━━━
${settings.companyName || 'Rent Car'}`

        const encodedMessage = encodeURIComponent(message)
        const whatsappUrl = `https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${encodedMessage}`

        setTimeout(() => {
          window.open(whatsappUrl, '_blank')
        }, 500)
      }
    } catch (error) {
      console.error('Error sharing:', error)
      alert('Error al compartir. Intente nuevamente.')
    } finally {
      setGeneratingPdf(false)
    }
  }

  const getFuelLevelPosition = (level: number | undefined) => {
    if (!level) return 0
    // Convert percentage to position (0-100)
    return level
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-DO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("es-DO", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loader" />
      </div>
    )
  }

  if (!rental) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Renta no encontrada</p>
      </div>
    )
  }

  const customer = rental.rentalCustomers[0]?.customer
  const primaryImage = rental.vehicle.images.find((img) => img.isPrimary) || rental.vehicle.images[0]

  return (
    <div className="space-y-6">
      {/* Header - Hidden on print */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/admin/rentas">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Contrato #{rental.contractNumber}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Detalles del contrato de alquiler
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {rental.signedAt ? (
            <>
              <div className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-lg text-sm">
                <CheckCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Firmado</span>
              </div>
              <Button
                variant="outline"
                leftIcon={generatingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                onClick={handleShareWhatsApp}
                disabled={generatingPdf}
                className="bg-green-500 hover:bg-green-600 text-white border-green-500 hover:border-green-600 disabled:opacity-50"
              >
                {generatingPdf ? 'Generando...' : <><span className="hidden sm:inline">Compartir</span> WhatsApp</>}
              </Button>
            </>
          ) : (
            <>
              {/* Firma presencial */}
              <Link href={`/admin/rentas/${params.id}/firmar`}>
                <Button variant="outline" leftIcon={<PenTool className="h-4 w-4" />}>
                  <span className="hidden sm:inline">Firmar</span> Contrato
                </Button>
              </Link>

              {/* Link de firma remota */}
              {!rental.signToken ? (
                <Button
                  variant="outline"
                  leftIcon={generatingLink ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                  onClick={handleGenerateLink}
                  disabled={generatingLink}
                >
                  <span className="hidden sm:inline">Generar</span> Link
                </Button>
              ) : (
                <Button
                  variant="outline"
                  leftIcon={<Trash2 className="h-4 w-4" />}
                  onClick={handleRevokeLink}
                  disabled={revokingLink}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <span className="hidden sm:inline">Revocar</span> Link
                </Button>
              )}
            </>
          )}
          <Button variant="outline" leftIcon={<Printer className="h-4 w-4" />} onClick={handlePrint}>
            <span className="hidden sm:inline">Imprimir</span>
          </Button>
        </div>
      </div>

      {/* Panel link de firma remota — visible solo cuando hay token activo */}
      {rental.signToken && !rental.signedAt && signUrl && (
        <div className="print:hidden bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-amber-100 dark:bg-amber-800/50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Link2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
                Link de firma activo
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
                Envía este enlace al cliente para que firme el contrato desde cualquier dispositivo.
                El link se invalidará automáticamente una vez firmado.
              </p>
              {/* URL del link */}
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2 mb-3">
                <span className="text-xs text-gray-600 dark:text-gray-300 truncate flex-1 font-mono">
                  {signUrl}
                </span>
                <button
                  onClick={handleCopyLink}
                  className="flex-shrink-0 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  title="Copiar link"
                >
                  {linkCopied
                    ? <Check className="h-4 w-4 text-green-500" />
                    : <Copy className="h-4 w-4 text-gray-500" />
                  }
                </button>
                <a
                  href={signUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  title="Abrir en nueva pestaña"
                >
                  <ExternalLink className="h-4 w-4 text-gray-500" />
                </a>
              </div>
              {/* Botones de acción del link */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition font-medium"
                >
                  {linkCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {linkCopied ? "¡Copiado!" : "Copiar link"}
                </button>
                <button
                  onClick={handleShareLinkWhatsApp}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition font-medium"
                >
                  <Share2 className="h-3 w-3" />
                  Enviar por WhatsApp
                </button>
                <button
                  onClick={handleRevokeLink}
                  disabled={revokingLink}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white dark:bg-gray-800 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg transition font-medium disabled:opacity-50"
                >
                  <Trash2 className="h-3 w-3" />
                  Revocar link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contract Document */}
      <div
        id="contract-print-area"
        ref={contractRef}
        className="bg-white text-black p-8 shadow-lg print:shadow-none print:p-4 max-w-4xl mx-auto rounded-lg border border-gray-200 dark:border-gray-700"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
          <div className="flex items-center gap-4">
            {/* Logo/Image - tamaño estándar en esquina superior izquierda */}
            {settings.contractHeaderImage ? (
              <img
                src={settings.contractHeaderImage}
                alt="Logo de contrato"
                className="object-contain w-[120px] max-h-[60px]"
              />
            ) : settings.logo ? (
              <img
                src={settings.logo}
                alt={settings.companyName || "Logo"}
                className="object-contain w-[120px] max-h-[60px]"
              />
            ) : (
              <div className="text-2xl font-bold text-red-600">
                {settings.companyName || "TOKIO"}
                <div className="text-sm font-normal text-black">Rent Car</div>
              </div>
            )}
            <div className="text-xs text-black">
              <p className="font-semibold">{settings.companyName || "Rent Car"}</p>
              <p>{settings.address || "Av. Pedro A. Rivera Km 1"}</p>
              <p>{settings.city || "La Vega, Rep. Dom."}</p>
              <p>{settings.phone || "809-786-8457"}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-black">CONTRATO DE ALQUILER DE VEHICULOS</h2>
          </div>
        </div>

        {/* Contract Number */}
        <div className="text-red-600 font-bold text-lg mb-4">
          No.{rental.contractNumber}
        </div>

        {/* Main Content - Two Columns */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          {/* Left Column - Customer Data */}
          <div>
            <h3 className="font-bold underline mb-3 text-center">Datos del Cliente</h3>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1 font-medium">Nombre</td>
                  <td className="py-1 border-b border-gray-400">
                    {customer ? `${customer.firstName} ${customer.lastName}` : "-"}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 font-medium">Dirección</td>
                  <td className="py-1 border-b border-gray-400">
                    {customer?.address || "-"}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 font-medium">Teléfono</td>
                  <td className="py-1 border-b border-gray-400">
                    {customer?.phone || "-"}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 font-medium">Cédula de Ident.</td>
                  <td className="py-1 border-b border-gray-400">
                    {rental.idNumber || customer?.idNumber || "-"}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 font-medium">No. Pasaporte</td>
                  <td className="py-1 border-b border-gray-400">
                    {rental.idType === "PASSPORT" ? rental.idNumber : "-"}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 font-medium">No. Licencia</td>
                  <td className="py-1 border-b border-gray-400">
                    {rental.licenseNumber || customer?.licenseNumber || "-"}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 font-medium">Tarjeta de Crédito</td>
                  <td className="py-1 border-b border-gray-400">-</td>
                </tr>
                <tr>
                  <td className="py-1 font-medium">Depósito</td>
                  <td className="py-1 border-b border-gray-400">
                    {formatCurrency(rental.depositAmount, settings.currency, settings.currencySymbol)}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 font-medium">Cuota Diaria {settings.currencySymbol}</td>
                  <td className="py-1 border-b border-gray-400">
                    {formatCurrency(rental.dailyRate, settings.currency, settings.currencySymbol)}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 font-medium">Dias de Renta</td>
                  <td className="py-1 border-b border-gray-400">
                    {rental.totalDays} Día{rental.totalDays > 1 ? "s" : ""} y 0 Horas
                  </td>
                </tr>
                <tr>
                  <td className="py-1 font-medium">Total a Pagar</td>
                  <td className="py-1 border-b border-gray-400 font-bold">
                    {formatCurrency(rental.totalAmount, settings.currency, settings.currencySymbol)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Right Column - Vehicle Data */}
          <div>
            <h3 className="font-bold underline mb-3 text-center">Datos del Vehículo</h3>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1 font-medium">Marca</td>
                  <td className="py-1 border-b border-gray-400">{rental.vehicle.brand}</td>
                </tr>
                <tr>
                  <td className="py-1 font-medium">Año</td>
                  <td className="py-1 border-b border-gray-400">{rental.vehicle.year}</td>
                </tr>
                <tr>
                  <td className="py-1 font-medium">Tipo de Vehiculo</td>
                  <td className="py-1 border-b border-gray-400">{rental.vehicle.category}</td>
                </tr>
                <tr>
                  <td className="py-1 font-medium">Color</td>
                  <td className="py-1 border-b border-gray-400">{rental.vehicle.color}</td>
                </tr>
                <tr>
                  <td className="py-1 font-medium">No. Placa</td>
                  <td className="py-1 border-b border-gray-400">{rental.vehicle.licensePlate}</td>
                </tr>
                <tr>
                  <td className="py-1 font-medium">Fecha de Salida</td>
                  <td className="py-1 border-b border-gray-400">{formatDate(rental.startDate)}</td>
                </tr>
                <tr>
                  <td className="py-1 font-medium">Hora de Salida (24Hrs)</td>
                  <td className="py-1 border-b border-gray-400">{formatTime(rental.startDate)}</td>
                </tr>
                <tr>
                  <td className="py-1 font-medium">Fecha de Entrada</td>
                  <td className="py-1 border-b border-gray-400">{formatDate(rental.expectedEndDate)}</td>
                </tr>
                <tr>
                  <td className="py-1 font-medium">Hora de Entrada (24Hrs)</td>
                  <td className="py-1 border-b border-gray-400">{formatTime(rental.expectedEndDate)}</td>
                </tr>
                <tr>
                  <td className="py-1 font-medium">Kilometraje</td>
                  <td className="py-1 border-b border-gray-400">{rental.startMileage.toLocaleString()} km</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Checklist and Fuel Gauge */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          {/* Checklist */}
          <div>
            <h3 className="font-bold underline mb-3 text-center">CheckList</h3>
            <div className="grid grid-cols-3 gap-1 text-xs">
              {checklistItems.map((item, index) => (
                <div key={index} className="flex items-center gap-1">
                  {item && (
                    <>
                      <span className="w-3 h-3 border border-gray-400 inline-block"></span>
                      <span>{item}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Fuel Gauge and Vehicle Diagrams */}
          <div>
            {/* Fuel Gauge */}
            <div className="mb-4">
              <div className="flex items-center justify-center">
                <div className="relative w-48 h-24">
                  <svg viewBox="0 0 200 100" className="w-full h-full">
                    {/* Gauge background */}
                    <path
                      d="M 20 80 A 80 80 0 0 1 180 80"
                      fill="none"
                      stroke="#e5e5e5"
                      strokeWidth="15"
                    />
                    {/* Gauge fill */}
                    <path
                      d="M 20 80 A 80 80 0 0 1 180 80"
                      fill="none"
                      stroke="#dc2626"
                      strokeWidth="15"
                      strokeDasharray={`${(rental.fuelLevelStart || 100) * 2.51} 251`}
                    />
                    {/* Labels */}
                    <text x="15" y="95" fontSize="12" fill="#666">E</text>
                    <text x="55" y="45" fontSize="10" fill="#666">1/4</text>
                    <text x="90" y="30" fontSize="10" fill="#666">1/2</text>
                    <text x="130" y="45" fontSize="10" fill="#666">3/4</text>
                    <text x="180" y="95" fontSize="12" fill="#666">F</text>
                    <text x="80" y="70" fontSize="14" fontWeight="bold" fill="#333">GASOLINA</text>
                  </svg>
                </div>
              </div>
            </div>

            {/* Vehicle Diagrams */}
            <div className="grid grid-cols-2 gap-2">
              <div className="border border-gray-300 p-2 h-20 flex items-center justify-center">
                <Car className="h-12 w-12 text-gray-400" />
              </div>
              <div className="border border-gray-300 p-2 h-20 flex items-center justify-center">
                <Car className="h-12 w-12 text-gray-400 rotate-90" />
              </div>
              <div className="border border-gray-300 p-2 h-20 flex items-center justify-center">
                <Car className="h-12 w-12 text-gray-400" />
              </div>
              <div className="border border-gray-300 p-2 h-20 flex items-center justify-center">
                <Car className="h-12 w-12 text-gray-400 -rotate-90" />
              </div>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="text-xs text-black mb-4 border-t border-black pt-4">
          <p>
            Soy el cliente quien garantizo y aseguro que todo lo que esta marcado arriba es correcto,
            por lo cual me comprometo a devolverlo de la misma forma, en caso de no ser asi tengo que
            pagar a la Rent-a-Car el valor del costo de cada accesorio que le falte al vehiculo.
          </p>
        </div>

        {/* Observations */}
        <div className="mb-6">
          <div className="border border-black p-3 min-h-[80px]">
            <p className="text-sm text-black">
              <span className="font-bold">Observación:</span> {rental.notes || ""}
            </p>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 mt-8">
          <div className="text-center">
            {rental.customerSignature ? (
              <div className="mx-8">
                <img
                  src={rental.customerSignature}
                  alt="Firma del cliente"
                  className="h-20 mx-auto border-b border-black"
                />
                <p className="font-medium text-black mt-2">Firma del Cliente</p>
                {customer && (
                  <p className="text-sm text-black">
                    {customer.firstName} {customer.lastName}
                  </p>
                )}
              </div>
            ) : (
              <div className="border-t border-black pt-2 mx-8 h-24 flex flex-col justify-end">
                <p className="font-medium text-black">Firma del Cliente</p>
                {customer && (
                  <p className="text-sm text-black">
                    {customer.firstName} {customer.lastName}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="text-center">
            {rental.agentSignature ? (
              <div className="mx-8">
                <img
                  src={rental.agentSignature}
                  alt="Firma del agente"
                  className="h-20 mx-auto border-b border-black"
                />
                <p className="font-medium text-black mt-2">Agente de Renta</p>
                {rental.agent && (
                  <p className="text-sm text-black">
                    {rental.agent.firstName} {rental.agent.lastName}
                  </p>
                )}
              </div>
            ) : (
              <div className="border-t border-black pt-2 mx-8 h-24 flex flex-col justify-end">
                <p className="font-medium text-black">Agente de Renta</p>
                {rental.agent && (
                  <p className="text-sm text-black">
                    {rental.agent.firstName} {rental.agent.lastName}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Signed date indicator */}
        {rental.signedAt && (
          <div className="text-center text-xs text-gray-500 mt-4">
            Contrato firmado digitalmente el {new Date(rental.signedAt).toLocaleString("es-DO")}
          </div>
        )}
      </div>

      {/* Activity Timeline */}
      {activityLogs.length > 0 && (
        <div className="print:hidden bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 max-w-4xl mx-auto">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-gray-500" />
            Historial de actividad
          </h3>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
            <div className="space-y-4">
              {activityLogs.map((log) => {
                const iconMap: Record<string, { icon: React.ReactNode; color: string }> = {
                  RENTAL_CREATED:    { icon: <PlusCircle className="h-3.5 w-3.5" />, color: "bg-blue-500" },
                  SIGNED_PRESENTIAL: { icon: <PenTool className="h-3.5 w-3.5" />,    color: "bg-green-500" },
                  SIGNED_REMOTE:     { icon: <CheckCircle className="h-3.5 w-3.5" />,color: "bg-green-500" },
                  LINK_GENERATED:    { icon: <Link2 className="h-3.5 w-3.5" />,       color: "bg-amber-500" },
                  LINK_REVOKED:      { icon: <Trash2 className="h-3.5 w-3.5" />,      color: "bg-red-500" },
                  STATUS_CHANGED:    { icon: <RotateCcw className="h-3.5 w-3.5" />,   color: "bg-purple-500" },
                }
                const entry = iconMap[log.action] ?? { icon: <Edit3 className="h-3.5 w-3.5" />, color: "bg-gray-500" }
                return (
                  <div key={log.id} className="flex items-start gap-4 pl-0">
                    <div className={`relative z-10 w-8 h-8 rounded-full ${entry.color} flex items-center justify-center text-white flex-shrink-0`}>
                      {entry.icon}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-sm text-gray-800 dark:text-gray-200">{log.description}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {new Date(log.createdAt).toLocaleString("es-DO", {
                          day: "2-digit", month: "2-digit", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          #contract-print-area,
          #contract-print-area * {
            visibility: visible;
          }
          #contract-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}
