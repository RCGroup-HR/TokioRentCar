"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui"
import { useSettingsStore } from "@/stores/settingsStore"
import { formatCurrency } from "@/lib/utils"
import { ArrowLeft, Printer, Download, Car, Calendar, User, FileText, PenTool, CheckCircle } from "lucide-react"

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
  const contractRef = useRef<HTMLDivElement>(null)

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
      const res = await fetch(`/api/rentals/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setRental(data)
      } else {
        router.push("/admin/rentas")
      }
    } catch (error) {
      console.error("Error fetching rental:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
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
        <div className="flex gap-2">
          {rental.signedAt ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-lg text-sm">
              <CheckCircle className="h-4 w-4" />
              Firmado
            </div>
          ) : (
            <Link href={`/admin/rentas/${params.id}/firmar`}>
              <Button variant="outline" leftIcon={<PenTool className="h-4 w-4" />}>
                Firmar Contrato
              </Button>
            </Link>
          )}
          <Button variant="outline" leftIcon={<Printer className="h-4 w-4" />} onClick={handlePrint}>
            Imprimir
          </Button>
        </div>
      </div>

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
