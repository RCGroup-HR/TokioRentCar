"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui"
import { useSettingsStore } from "@/stores/settingsStore"
import { formatCurrency } from "@/lib/utils"
import {
  Car,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  PieChart,
  Download,
} from "lucide-react"

interface VehicleReport {
  vehicle: {
    id: string
    brand: string
    model: string
    year: number
    licensePlate: string
    dailyRate: number
    image: string | null
  }
  metrics: {
    totalRevenue: number
    totalExpenses: number
    netProfit: number
    totalRentals: number
    totalRentedDays: number
    avgDailyRate: number
    roi: string | number
    profitMargin: string | number
  }
  expensesByCategory: Record<string, number>
}

interface ReportTotals {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  totalRentals: number
  totalRentedDays: number
  profitMargin: string | number
  avgRevenuePerVehicle: number
}

export default function ReportesPage() {
  const { settings } = useSettingsStore()
  const [vehicles, setVehicles] = useState<VehicleReport[]>([])
  const [totals, setTotals] = useState<ReportTotals | null>(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [vehicleFilter, setVehicleFilter] = useState("")

  const fetchReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (startDate) params.set("startDate", startDate)
      if (endDate) params.set("endDate", endDate)
      if (vehicleFilter) params.set("vehicleId", vehicleFilter)

      const res = await fetch(`/api/reports/profitability?${params}`)
      const data = await res.json()
      setVehicles(data.vehicles || [])
      setTotals(data.totals || null)
    } catch (error) {
      console.error("Error fetching report:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [startDate, endDate, vehicleFilter])

  const exportToCSV = () => {
    const headers = [
      "Vehículo",
      "Placa",
      "Ingresos",
      "Gastos",
      "Ganancia Neta",
      "Rentas",
      "Días Rentados",
      "Margen %",
    ]
    const rows = vehicles.map((v) => [
      `${v.vehicle.brand} ${v.vehicle.model} ${v.vehicle.year}`,
      v.vehicle.licensePlate,
      v.metrics.totalRevenue,
      v.metrics.totalExpenses,
      v.metrics.netProfit,
      v.metrics.totalRentals,
      v.metrics.totalRentedDays,
      v.metrics.profitMargin,
    ])

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `reporte-rentabilidad-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reportes</h1>
          <p className="text-gray-600 dark:text-gray-400">Análisis de rentabilidad por vehículo</p>
        </div>
        <Button
          variant="outline"
          onClick={exportToCSV}
          leftIcon={<Download className="h-4 w-4" />}
        >
          Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex flex-col sm:flex-row gap-4">
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Fecha Inicio</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Fecha Fin</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div className="flex-1" />
        <Button
          variant="outline"
          onClick={() => {
            setStartDate("")
            setEndDate("")
            setVehicleFilter("")
          }}
        >
          Limpiar Filtros
        </Button>
      </div>

      {/* Summary Cards */}
      {totals && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Ingresos</p>
                <p className="text-lg font-bold dark:text-white">
                  {formatCurrency(
                    totals.totalRevenue,
                    settings.currency,
                    settings.currencySymbol
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Gastos</p>
                <p className="text-lg font-bold dark:text-white">
                  {formatCurrency(
                    totals.totalExpenses,
                    settings.currency,
                    settings.currencySymbol
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Ganancia</p>
                <p
                  className={`text-lg font-bold ${
                    totals.netProfit >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {formatCurrency(
                    totals.netProfit,
                    settings.currency,
                    settings.currencySymbol
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <PieChart className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Margen</p>
                <p className="text-lg font-bold dark:text-white">{totals.profitMargin}%</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Car className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Rentas</p>
                <p className="text-lg font-bold dark:text-white">{totals.totalRentals}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                <Calendar className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Días Rentados</p>
                <p className="text-lg font-bold dark:text-white">{totals.totalRentedDays}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Reports */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700">
          <h2 className="font-semibold dark:text-white">Rentabilidad por Vehículo</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="loader mx-auto" />
          </div>
        ) : vehicles.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            <p>No hay datos para mostrar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Vehículo
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-300">
                    Ingresos
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-300">
                    Gastos
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-300">
                    Ganancia
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-300">
                    Rentas
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-300">
                    Días
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-300">
                    Margen
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-300">
                    ROI
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {vehicles.map((report) => (
                  <tr key={report.vehicle.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-8 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
                          {report.vehicle.image ? (
                            <Image
                              src={report.vehicle.image}
                              alt={report.vehicle.brand}
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
                          <p className="font-medium text-sm dark:text-white">
                            {report.vehicle.brand} {report.vehicle.model}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {report.vehicle.licensePlate} • {report.vehicle.year}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-green-600">
                      {formatCurrency(
                        report.metrics.totalRevenue,
                        settings.currency,
                        settings.currencySymbol
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-red-600">
                      {formatCurrency(
                        report.metrics.totalExpenses,
                        settings.currency,
                        settings.currencySymbol
                      )}
                    </td>
                    <td
                      className={`px-4 py-3 text-right text-sm font-semibold ${
                        report.metrics.netProfit >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatCurrency(
                        report.metrics.netProfit,
                        settings.currency,
                        settings.currencySymbol
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-sm dark:text-gray-300">
                      {report.metrics.totalRentals}
                    </td>
                    <td className="px-4 py-3 text-center text-sm dark:text-gray-300">
                      {report.metrics.totalRentedDays}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          Number(report.metrics.profitMargin) >= 30
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : Number(report.metrics.profitMargin) >= 15
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {report.metrics.profitMargin}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm dark:text-gray-300">
                      {report.metrics.roi}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Expense Breakdown */}
      {vehicles.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {vehicles.slice(0, 4).map((report) => (
            <div key={report.vehicle.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <h3 className="font-semibold mb-3 dark:text-white">
                {report.vehicle.brand} {report.vehicle.model} - Desglose de Gastos
              </h3>
              {Object.keys(report.expensesByCategory).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(report.expensesByCategory).map(
                    ([category, amount]) => {
                      const categoryLabels: Record<string, string> = {
                        FUEL: "Combustible",
                        MAINTENANCE: "Mantenimiento",
                        REPAIR: "Reparación",
                        INSURANCE: "Seguro",
                        TAX: "Impuestos",
                        CLEANING: "Limpieza",
                        OTHER: "Otro",
                      }
                      const total = report.metrics.totalExpenses
                      const percentage = total > 0 ? (amount / total) * 100 : 0

                      return (
                        <div key={category}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600 dark:text-gray-400">
                              {categoryLabels[category] || category}
                            </span>
                            <span className="font-medium dark:text-white">
                              {formatCurrency(
                                amount,
                                settings.currency,
                                settings.currencySymbol
                              )}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    }
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">Sin gastos registrados</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
