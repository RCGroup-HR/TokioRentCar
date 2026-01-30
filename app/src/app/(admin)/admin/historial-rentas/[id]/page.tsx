"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui"
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  FileText,
  Car,
  Calendar,
  DollarSign,
  ExternalLink,
  AlertTriangle,
  TrendingUp,
  Clock,
} from "lucide-react"

interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  phoneSecondary: string | null
  idType: string
  idNumber: string
  address: string | null
  city: string | null
  country: string | null
  isActive: boolean
  isBlacklisted: boolean
  blacklistReason: string | null
}

interface Rental {
  id: string
  contractNumber: string
  status: string
  startDate: string
  expectedEndDate: string
  actualEndDate: string | null
  totalDays: number
  dailyRate: number
  totalAmount: number
  vehicle: {
    id: string
    brand: string
    model: string
    year: number
    licensePlate: string
    color: string
  }
}

const idTypeLabels: Record<string, string> = {
  CEDULA: "Cédula",
  PASSPORT: "Pasaporte",
  LICENSE: "Licencia",
}

const rentalStatusLabels: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Activa", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  COMPLETED: { label: "Completada", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  EXTENDED: { label: "Extendida", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  CANCELLED: { label: "Cancelada", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  OVERDUE: { label: "Vencida", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
}

export default function CustomerRentalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [rentals, setRentals] = useState<Rental[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch customer details and rentals in parallel
        const [customerRes, rentalsRes] = await Promise.all([
          fetch(`/api/customers/${id}`),
          fetch(`/api/customers/${id}/rentals`),
        ])

        if (customerRes.ok) {
          const customerData = await customerRes.json()
          setCustomer(customerData)
        }

        if (rentalsRes.ok) {
          const rentalsData = await rentalsRes.json()
          setRentals(rentalsData.rentals || [])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("es-DO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const getStats = () => {
    const totalRentals = rentals.length
    const totalSpent = rentals.reduce((sum, r) => sum + r.totalAmount, 0)
    const activeRentals = rentals.filter((r) => r.status === "ACTIVE").length
    const completedRentals = rentals.filter((r) => r.status === "COMPLETED").length
    const avgPerRental = totalRentals > 0 ? totalSpent / totalRentals : 0
    const totalDays = rentals.reduce((sum, r) => sum + r.totalDays, 0)

    return { totalRentals, totalSpent, activeRentals, completedRentals, avgPerRental, totalDays }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loader" />
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Cliente no encontrado</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/admin/historial-rentas")}
        >
          Volver al listado
        </Button>
      </div>
    )
  }

  const stats = getStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/historial-rentas")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>

      {/* Customer Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
              <User className="h-8 w-8 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold dark:text-white">
                  {customer.firstName} {customer.lastName}
                </h1>
                {customer.isBlacklisted && (
                  <span
                    className="text-red-500"
                    title={customer.blacklistReason || "En lista negra"}
                  >
                    <AlertTriangle className="h-5 w-5" />
                  </span>
                )}
              </div>
              <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <p className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {idTypeLabels[customer.idType]}: {customer.idNumber}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {customer.phone}
                  {customer.phoneSecondary && ` / ${customer.phoneSecondary}`}
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {customer.email}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-2xl font-bold text-amber-600">{stats.totalRentals}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Rentas</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalSpent)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Facturado</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{stats.totalDays}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Días Totales</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.avgPerRental)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Promedio/Renta</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.activeRentals}</p>
              <p className="text-xs text-green-600 dark:text-green-500">Activas</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.completedRentals}</p>
              <p className="text-xs text-blue-600 dark:text-blue-500">Completadas</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                {rentals.filter((r) => r.status === "EXTENDED").length}
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-500">Extendidas</p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                {rentals.filter((r) => r.status === "CANCELLED" || r.status === "OVERDUE").length}
              </p>
              <p className="text-xs text-red-600 dark:text-red-500">Canceladas/Vencidas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rentals List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold dark:text-white">
            Historial de Rentas ({rentals.length})
          </h2>
        </div>

        {rentals.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <Car className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            <p>Este cliente no tiene rentas registradas</p>
          </div>
        ) : (
          <div className="divide-y dark:divide-gray-700">
            {rentals.map((rental) => (
              <div
                key={rental.id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-sm font-semibold text-amber-600 dark:text-amber-400">
                        {rental.contractNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          rentalStatusLabels[rental.status]?.color || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {rentalStatusLabels[rental.status]?.label || rental.status}
                      </span>
                    </div>
                    <p className="text-lg font-medium dark:text-white">
                      {rental.vehicle.brand} {rental.vehicle.model} {rental.vehicle.year}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {rental.vehicle.color} • {rental.vehicle.licensePlate}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">Período</p>
                        <p className="dark:text-white">
                          {formatDate(rental.startDate)} - {formatDate(rental.actualEndDate || rental.expectedEndDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">Duración</p>
                        <p className="dark:text-white">
                          {rental.totalDays} {rental.totalDays === 1 ? "día" : "días"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">Total</p>
                        <p className="font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(rental.totalAmount)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <a
                    href={`/admin/rentas/${rental.id}`}
                    className="p-2 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors self-start md:self-center"
                    title="Ver contrato"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
