"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui"
import { useSettingsStore } from "@/stores/settingsStore"
import { formatCurrency } from "@/lib/utils"
import {
  Search,
  Eye,
  Check,
  X,
  Calendar,
  Car,
  User,
  Phone,
  Mail,
  Clock,
  FileText,
} from "lucide-react"

interface Reservation {
  id: string
  reservationCode: string
  status: string
  startDate: string
  endDate: string
  totalDays: number
  totalAmount: number
  depositAmount: number
  customerPhone: string
  customerEmail: string
  paymentStatus: string
  createdAt: string
  customer: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  vehicle: {
    id: string
    brand: string
    model: string
    year: number
    licensePlate: string
    images: { url: string; isPrimary: boolean }[]
  }
}

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  COMPLETED: "Completada",
  NO_SHOW: "No se presentó",
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  NO_SHOW: "bg-gray-100 text-gray-800",
}

const paymentStatusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  PARTIAL: "Parcial",
  PAID: "Pagado",
  REFUNDED: "Reembolsado",
}

export default function ReservacionesPage() {
  const { settings } = useSettingsStore()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchReservations = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", page.toString())
      params.set("limit", "10")
      if (statusFilter) params.set("status", statusFilter)
      if (dateFrom) params.set("dateFrom", dateFrom)
      if (dateTo) params.set("dateTo", dateTo)

      const res = await fetch(`/api/reservations?${params}`)
      const data = await res.json()
      setReservations(data.reservations || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      console.error("Error fetching reservations:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReservations()
  }, [statusFilter, dateFrom, dateTo, page])

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        fetchReservations()
        setSelectedReservation(null)
      }
    } catch (error) {
      console.error("Error updating reservation:", error)
    }
  }

  const filteredReservations = reservations.filter((r) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      r.reservationCode.toLowerCase().includes(searchLower) ||
      r.customer.firstName.toLowerCase().includes(searchLower) ||
      r.customer.lastName.toLowerCase().includes(searchLower) ||
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reservaciones</h1>
          <p className="text-gray-600 dark:text-gray-400">Gestiona las reservaciones de vehículos</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(statusFilter === status ? "" : status)}
            className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm text-left transition ${
              statusFilter === status ? "ring-2 ring-amber-500" : ""
            }`}
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">{statusLabels[status]}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {reservations.filter((r) => r.status === status).length}
            </p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por código, cliente o vehículo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
        ) : filteredReservations.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            <p>No hay reservaciones</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                      Código
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                      Vehículo
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                      Fechas
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                      Total
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
                  {filteredReservations.map((reservation) => {
                    const primaryImage =
                      reservation.vehicle.images.find((img) => img.isPrimary) ||
                      reservation.vehicle.images[0]

                    return (
                      <tr key={reservation.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                            {reservation.reservationCode}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {reservation.customer.firstName}{" "}
                              {reservation.customer.lastName}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {reservation.customerPhone || reservation.customer.phone}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-8 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
                              {primaryImage ? (
                                <Image
                                  src={primaryImage.url}
                                  alt={reservation.vehicle.brand}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Car className="h-4 w-4 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm text-gray-900 dark:text-white">
                                {reservation.vehicle.brand} {reservation.vehicle.model}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {reservation.vehicle.licensePlate}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900 dark:text-gray-200">
                            <p>{formatDate(reservation.startDate)}</p>
                            <p className="text-gray-500 dark:text-gray-400">
                              al {formatDate(reservation.endDate)}
                            </p>
                            <p className="text-xs text-gray-400">
                              {reservation.totalDays} días
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(
                              reservation.totalAmount,
                              settings.currency,
                              settings.currencySymbol
                            )}
                          </p>
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded ${
                              reservation.paymentStatus === "PAID"
                                ? "bg-green-100 text-green-700"
                                : reservation.paymentStatus === "PARTIAL"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {paymentStatusLabels[reservation.paymentStatus]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              statusColors[reservation.status]
                            }`}
                          >
                            {statusLabels[reservation.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedReservation(reservation)}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/30 rounded"
                              title="Ver detalles"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {reservation.status === "PENDING" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleStatusChange(reservation.id, "CONFIRMED")
                                  }
                                  className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:text-gray-400 dark:hover:text-green-400 dark:hover:bg-green-900/30 rounded"
                                  title="Confirmar"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleStatusChange(reservation.id, "CANCELLED")
                                  }
                                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/30 rounded"
                                  title="Cancelar"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            {reservation.status === "CONFIRMED" && (
                              <Link
                                href={`/admin/rentas/nueva?reservationId=${reservation.id}`}
                              >
                                <button
                                  className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 dark:text-gray-400 dark:hover:text-amber-400 dark:hover:bg-amber-900/30 rounded"
                                  title="Crear Renta"
                                >
                                  <FileText className="h-4 w-4" />
                                </button>
                              </Link>
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
              <div className="flex items-center justify-between px-4 py-3 border-t dark:border-gray-700">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Anterior
                </Button>
                <span className="text-sm text-gray-500 dark:text-gray-400">
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

      {/* Detail Modal */}
      {selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Reservación {selectedReservation.reservationCode}
                  </h2>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      statusColors[selectedReservation.status]
                    }`}
                  >
                    {statusLabels[selectedReservation.status]}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedReservation(null)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Customer Info */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                    <User className="h-4 w-4" />
                    Cliente
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedReservation.customer.firstName}{" "}
                      {selectedReservation.customer.lastName}
                    </p>
                    <p className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Mail className="h-4 w-4" />
                      {selectedReservation.customerEmail ||
                        selectedReservation.customer.email}
                    </p>
                    <p className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Phone className="h-4 w-4" />
                      {selectedReservation.customerPhone ||
                        selectedReservation.customer.phone}
                    </p>
                  </div>
                </div>

                {/* Vehicle Info */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                    <Car className="h-4 w-4" />
                    Vehículo
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedReservation.vehicle.brand}{" "}
                      {selectedReservation.vehicle.model}{" "}
                      {selectedReservation.vehicle.year}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Placa: {selectedReservation.vehicle.licensePlate}
                    </p>
                  </div>
                </div>

                {/* Dates */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                    <Calendar className="h-4 w-4" />
                    Fechas
                  </h3>
                  <div className="space-y-2 text-sm text-gray-900 dark:text-gray-200">
                    <p>
                      <span className="text-gray-600 dark:text-gray-400">Inicio:</span>{" "}
                      {formatDate(selectedReservation.startDate)}
                    </p>
                    <p>
                      <span className="text-gray-600 dark:text-gray-400">Fin:</span>{" "}
                      {formatDate(selectedReservation.endDate)}
                    </p>
                    <p>
                      <span className="text-gray-600 dark:text-gray-400">Duración:</span>{" "}
                      {selectedReservation.totalDays} días
                    </p>
                  </div>
                </div>

                {/* Payment */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                    <Clock className="h-4 w-4" />
                    Pago
                  </h3>
                  <div className="space-y-2 text-sm text-gray-900 dark:text-gray-200">
                    <p>
                      <span className="text-gray-600 dark:text-gray-400">Total:</span>{" "}
                      <span className="font-semibold">
                        {formatCurrency(
                          selectedReservation.totalAmount,
                          settings.currency,
                          settings.currencySymbol
                        )}
                      </span>
                    </p>
                    <p>
                      <span className="text-gray-600 dark:text-gray-400">Depósito:</span>{" "}
                      {formatCurrency(
                        selectedReservation.depositAmount,
                        settings.currency,
                        settings.currencySymbol
                      )}
                    </p>
                    <p>
                      <span className="text-gray-600 dark:text-gray-400">Estado:</span>{" "}
                      {paymentStatusLabels[selectedReservation.paymentStatus]}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6 pt-6 border-t dark:border-gray-700">
                {selectedReservation.status === "PENDING" && (
                  <>
                    <Button
                      onClick={() =>
                        handleStatusChange(selectedReservation.id, "CONFIRMED")
                      }
                      className="flex-1"
                    >
                      Confirmar Reservación
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        handleStatusChange(selectedReservation.id, "CANCELLED")
                      }
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </>
                )}
                {selectedReservation.status === "CONFIRMED" && (
                  <Link
                    href={`/admin/rentas/nueva?reservationId=${selectedReservation.id}`}
                    className="flex-1"
                  >
                    <Button className="w-full">Crear Contrato de Renta</Button>
                  </Link>
                )}
                <Button
                  variant="outline"
                  onClick={() => setSelectedReservation(null)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
