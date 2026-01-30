"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui"
import { useSettingsStore } from "@/stores/settingsStore"
import { formatCurrency } from "@/lib/utils"
import {
  Plus,
  Search,
  Eye,
  FileText,
  Car,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Printer,
} from "lucide-react"

interface Rental {
  id: string
  contractNumber: string
  status: string
  startDate: string
  expectedEndDate: string
  actualEndDate: string | null
  totalDays: number
  totalAmount: number
  depositAmount: number
  customer: {
    id: string
    firstName: string
    lastName: string
    phone: string
  } | null
  agent: {
    id: string
    firstName: string
    lastName: string
  }
  vehicle: {
    id: string
    brand: string
    model: string
    year: number
    licensePlate: string
    images: { url: string; isPrimary: boolean }[]
  }
  payments: { id: string; amount: number; status: string }[]
}

const statusLabels: Record<string, string> = {
  ACTIVE: "Activa",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  OVERDUE: "Vencida",
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  CANCELLED: "bg-red-100 text-red-800",
  OVERDUE: "bg-orange-100 text-orange-800",
}

export default function RentasPage() {
  const { settings } = useSettingsStore()
  const [rentals, setRentals] = useState<Rental[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchRentals = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", page.toString())
      params.set("limit", "10")
      if (statusFilter) params.set("status", statusFilter)
      if (dateFrom) params.set("dateFrom", dateFrom)
      if (dateTo) params.set("dateTo", dateTo)

      const res = await fetch(`/api/rentals?${params}`)
      const data = await res.json()
      setRentals(data.rentals || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      console.error("Error fetching rentals:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRentals()
  }, [statusFilter, dateFrom, dateTo, page])

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/rentals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          actualEndDate: newStatus === "COMPLETED" ? new Date().toISOString() : null,
        }),
      })

      if (res.ok) {
        fetchRentals()
      }
    } catch (error) {
      console.error("Error updating rental:", error)
    }
  }

  const filteredRentals = rentals.filter((r) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      r.contractNumber.toLowerCase().includes(searchLower) ||
      r.customer?.firstName.toLowerCase().includes(searchLower) ||
      r.customer?.lastName.toLowerCase().includes(searchLower) ||
      r.agent.firstName.toLowerCase().includes(searchLower) ||
      r.agent.lastName.toLowerCase().includes(searchLower) ||
      r.vehicle.brand.toLowerCase().includes(searchLower) ||
      r.vehicle.model.toLowerCase().includes(searchLower) ||
      r.vehicle.licensePlate.toLowerCase().includes(searchLower)
    )
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-DO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const calculatePaidAmount = (payments: Rental["payments"]) => {
    return payments
      .filter((p) => p.status === "COMPLETED")
      .reduce((sum, p) => sum + p.amount, 0)
  }

  // Stats
  const activeCount = rentals.filter((r) => r.status === "ACTIVE").length
  const completedCount = rentals.filter((r) => r.status === "COMPLETED").length
  const totalRevenue = rentals
    .filter((r) => r.status === "COMPLETED")
    .reduce((sum, r) => sum + r.totalAmount, 0)
  const pendingPayments = rentals
    .filter((r) => r.status === "ACTIVE")
    .reduce((sum, r) => sum + (r.totalAmount - calculatePaidAmount(r.payments)), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rentas</h1>
          <p className="text-gray-600 dark:text-gray-400">Gestiona los contratos de renta</p>
        </div>
        <Link href="/admin/rentas/nueva">
          <Button leftIcon={<Plus className="h-4 w-4" />}>Nueva Renta</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Clock className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Activas</p>
              <p className="text-2xl font-bold dark:text-white">{activeCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completadas</p>
              <p className="text-2xl font-bold dark:text-white">{completedCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <DollarSign className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ingresos</p>
              <p className="text-xl font-bold dark:text-white">
                {formatCurrency(totalRevenue, settings.currency, settings.currencySymbol)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <DollarSign className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Por Cobrar</p>
              <p className="text-xl font-bold dark:text-white">
                {formatCurrency(
                  pendingPayments,
                  settings.currency,
                  settings.currencySymbol
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por contrato, cliente o vehículo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Todos los estados</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Desde
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value)
                setPage(1)
              }}
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Hasta
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value)
                setPage(1)
              }}
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          {(dateFrom || dateTo) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDateFrom("")
                setDateTo("")
                setPage(1)
              }}
            >
              Limpiar fechas
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="loader mx-auto" />
          </div>
        ) : filteredRentals.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            <p>No hay rentas</p>
            <Link href="/admin/rentas/nueva" className="inline-block mt-4">
              <Button size="sm">Crear Primera Renta</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                      Contrato
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                      Vehículo
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                      Período
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                      Monto
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-300">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {filteredRentals.map((rental) => {
                    const primaryImage =
                      rental.vehicle.images.find((img) => img.isPrimary) ||
                      rental.vehicle.images[0]
                    const paidAmount = calculatePaidAmount(rental.payments)
                    const pendingAmount = rental.totalAmount - paidAmount

                    return (
                      <tr key={rental.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3">
                          <div>
                            <span className="font-mono text-sm font-medium dark:text-white">
                              {rental.contractNumber}
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Agente: {rental.agent.firstName} {rental.agent.lastName}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium dark:text-white">
                              {rental.customer
                                ? `${rental.customer.firstName} ${rental.customer.lastName}`
                                : "Sin cliente"}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {rental.customer?.phone || "-"}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-8 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
                              {primaryImage ? (
                                <img
                                  src={primaryImage.url}
                                  alt={rental.vehicle.brand}
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Car className="h-4 w-4 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm dark:text-white">
                                {rental.vehicle.brand} {rental.vehicle.model}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {rental.vehicle.licensePlate}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm dark:text-gray-300">
                            <p>{formatDate(rental.startDate)}</p>
                            <p className="text-gray-500 dark:text-gray-400">
                              al{" "}
                              {formatDate(
                                rental.actualEndDate || rental.expectedEndDate
                              )}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {rental.totalDays} días
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-semibold dark:text-white">
                              {formatCurrency(
                                rental.totalAmount,
                                settings.currency,
                                settings.currencySymbol
                              )}
                            </p>
                            {rental.status === "ACTIVE" && pendingAmount > 0 && (
                              <p className="text-xs text-red-600 dark:text-red-400">
                                Pendiente:{" "}
                                {formatCurrency(
                                  pendingAmount,
                                  settings.currency,
                                  settings.currencySymbol
                                )}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              statusColors[rental.status]
                            }`}
                          >
                            {statusLabels[rental.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/admin/rentas/${rental.id}`}>
                              <button
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                                title="Ver contrato"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </Link>
                            <Link href={`/admin/rentas/${rental.id}?print=true`}>
                              <button
                                className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded"
                                title="Imprimir contrato"
                              >
                                <Printer className="h-4 w-4" />
                              </button>
                            </Link>
                            {rental.status === "ACTIVE" && (
                              <button
                                onClick={() =>
                                  handleStatusChange(rental.id, "COMPLETED")
                                }
                                className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
                                title="Completar"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Anterior
                </Button>
                <span className="text-sm text-gray-500">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
