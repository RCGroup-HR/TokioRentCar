"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui"
import {
  Search,
  User,
  Car,
  DollarSign,
  Calendar,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Users,
  Activity,
} from "lucide-react"

interface CustomerWithStats {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  idNumber: string
  idType: string
  isActive: boolean
  isBlacklisted: boolean
  stats: {
    totalRentals: number
    totalSpent: number
    activeRentals: number
    completedRentals: number
    lastRentalDate: string | null
  }
}

interface OverallStats {
  totalCustomersWithRentals: number
  totalRevenue: number
  totalRentals: number
  activeRentals: number
}

const idTypeLabels: Record<string, string> = {
  CEDULA: "Cédula",
  PASSPORT: "Pasaporte",
  LICENSE: "Licencia",
}

export default function HistorialRentasPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<CustomerWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [overallStats, setOverallStats] = useState<OverallStats>({
    totalCustomersWithRentals: 0,
    totalRevenue: 0,
    totalRentals: 0,
    activeRentals: 0,
  })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", page.toString())
      params.set("limit", "20")
      if (search) params.set("search", search)
      if (dateFrom) params.set("dateFrom", dateFrom)
      if (dateTo) params.set("dateTo", dateTo)

      const res = await fetch(`/api/customers/rental-history?${params}`)
      const data = await res.json()
      setCustomers(data.customers || [])
      setOverallStats(data.overallStats || {
        totalCustomersWithRentals: 0,
        totalRevenue: 0,
        totalRentals: 0,
        activeRentals: 0,
      })
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      fetchData()
    }, 300)
    return () => clearTimeout(delaySearch)
  }, [search, dateFrom, dateTo, page])

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Historial de Rentas por Cliente
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Resumen de ingresos y actividad por cliente
          </p>
        </div>
      </div>

      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Clientes con Rentas</p>
              <p className="text-xl font-bold dark:text-white">
                {overallStats.totalCustomersWithRentals}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-green-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ingresos Totales</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(overallStats.totalRevenue)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-amber-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Car className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Rentas</p>
              <p className="text-xl font-bold dark:text-white">
                {overallStats.totalRentals}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Activity className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Rentas Activas</p>
              <p className="text-xl font-bold dark:text-white">
                {overallStats.activeRentals}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, email, teléfono, cédula..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
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

      {/* Customer List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="loader mx-auto" />
          </div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <Car className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No hay clientes con historial de rentas</p>
          </div>
        ) : (
          <div className="divide-y dark:divide-gray-700">
            {customers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => router.push(`/admin/historial-rentas/${customer.id}`)}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
                  !customer.isActive ? "opacity-60" : ""
                } ${customer.isBlacklisted ? "bg-red-50 dark:bg-red-900/10" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <User className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold dark:text-white">
                          {customer.firstName} {customer.lastName}
                        </h3>
                        {customer.isBlacklisted && (
                          <span className="text-red-500" title="En lista negra">
                            <AlertTriangle className="h-4 w-4" />
                          </span>
                        )}
                        {customer.stats.activeRentals > 0 && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium">
                            {customer.stats.activeRentals} activa{customer.stats.activeRentals > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {idTypeLabels[customer.idType]}: {customer.idNumber} • {customer.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                        <Car className="h-4 w-4" />
                        <span>{customer.stats.totalRentals} rentas</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="h-4 w-4" />
                        <span>Última: {formatDate(customer.stats.lastRentalDate)}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(customer.stats.totalSpent)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        total facturado
                      </p>
                    </div>

                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t dark:border-gray-700 flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Anterior
            </Button>
            <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
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
      </div>
    </div>
  )
}
