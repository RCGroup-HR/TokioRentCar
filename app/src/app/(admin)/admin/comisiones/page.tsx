"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui"
import { useSettingsStore } from "@/stores/settingsStore"
import { formatCurrency } from "@/lib/utils"
import {
  Search,
  Check,
  DollarSign,
  Clock,
  CheckCircle,
  Users,
  TrendingUp,
} from "lucide-react"

interface Commission {
  id: string
  rate: number
  baseAmount: number
  amount: number
  status: string
  paidAt: string | null
  paymentRef: string | null
  createdAt: string
  agent: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  rental: {
    id: string
    contractNumber: string
    vehicle: {
      brand: string
      model: string
      licensePlate: string
    }
    customer: {
      firstName: string
      lastName: string
    }
  }
}

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobada",
  PAID: "Pagada",
  CANCELLED: "Cancelada",
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
}

export default function ComisionesPage() {
  const { settings } = useSettingsStore()
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")
  const [agentFilter, setAgentFilter] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [summary, setSummary] = useState({ pending: 0, approved: 0, paid: 0 })
  const [showPayModal, setShowPayModal] = useState(false)
  const [paymentRef, setPaymentRef] = useState("")

  const fetchCommissions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("limit", "100")
      if (statusFilter) params.set("status", statusFilter)
      if (agentFilter) params.set("agentId", agentFilter)
      if (dateFrom) params.set("dateFrom", dateFrom)
      if (dateTo) params.set("dateTo", dateTo)

      const res = await fetch(`/api/commissions?${params}`)
      const data = await res.json()
      setCommissions(data.commissions || [])
      setSummary(data.summary || { pending: 0, approved: 0, paid: 0 })
    } catch (error) {
      console.error("Error fetching commissions:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCommissions()
  }, [statusFilter, agentFilter, dateFrom, dateTo])

  const handleApproveSelected = async () => {
    if (selectedIds.length === 0) return

    try {
      const res = await fetch("/api/commissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedIds,
          action: "approve",
        }),
      })

      if (res.ok) {
        setSelectedIds([])
        fetchCommissions()
      }
    } catch (error) {
      console.error("Error approving commissions:", error)
    }
  }

  const handlePaySelected = async () => {
    if (selectedIds.length === 0) return

    try {
      const res = await fetch("/api/commissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedIds,
          action: "pay",
          paymentRef: paymentRef,
        }),
      })

      if (res.ok) {
        setSelectedIds([])
        setShowPayModal(false)
        setPaymentRef("")
        fetchCommissions()
      }
    } catch (error) {
      console.error("Error paying commissions:", error)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const selectAllPending = () => {
    const pendingIds = commissions
      .filter((c) => c.status === "PENDING")
      .map((c) => c.id)
    setSelectedIds(pendingIds)
  }

  const selectAllApproved = () => {
    const approvedIds = commissions
      .filter((c) => c.status === "APPROVED")
      .map((c) => c.id)
    setSelectedIds(approvedIds)
  }

  // Determine what action buttons to show based on selected commissions
  const selectedCommissions = commissions.filter((c) => selectedIds.includes(c.id))
  const allSelectedArePending = selectedCommissions.length > 0 && selectedCommissions.every((c) => c.status === "PENDING")
  const allSelectedAreApproved = selectedCommissions.length > 0 && selectedCommissions.every((c) => c.status === "APPROVED")

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-DO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  // Get unique agents for filter
  const agents = Array.from(
    new Map(commissions.map((c) => [c.agent.id, c.agent])).values()
  )

  const selectedTotal = commissions
    .filter((c) => selectedIds.includes(c.id))
    .reduce((sum, c) => sum + c.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Comisiones</h1>
          <p className="text-gray-600 dark:text-gray-400">Gestión de comisiones de agentes</p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && allSelectedArePending && (
            <Button onClick={handleApproveSelected} className="bg-blue-600 hover:bg-blue-700">
              Aprobar ({selectedIds.length})
            </Button>
          )}
          {selectedIds.length > 0 && allSelectedAreApproved && (
            <Button onClick={() => setShowPayModal(true)} className="bg-green-600 hover:bg-green-700">
              Pagar ({selectedIds.length})
            </Button>
          )}
          {selectedIds.length > 0 && !allSelectedArePending && !allSelectedAreApproved && (
            <p className="text-sm text-amber-600 dark:text-amber-400 py-2">
              Seleccione solo pendientes o solo aprobadas
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pendientes</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(summary.pending, settings.currency, settings.currencySymbol)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Aprobadas</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(summary.approved, settings.currency, settings.currencySymbol)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pagadas</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(summary.paid, settings.currency, settings.currencySymbol)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Agentes</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{agents.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
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
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Todos los agentes</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.firstName} {agent.lastName}
              </option>
            ))}
          </select>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={selectAllPending}>
            Seleccionar Pendientes
          </Button>
          <Button variant="outline" size="sm" onClick={selectAllApproved}>
            Seleccionar Aprobadas
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Desde
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
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
              onChange={(e) => setDateTo(e.target.value)}
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
        ) : commissions.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <TrendingUp className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            <p>No hay comisiones registradas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.length > 0 &&
                        selectedIds.length ===
                          commissions.filter((c) => c.status === "PENDING" || c.status === "APPROVED").length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          const selectableIds = commissions
                            .filter((c) => c.status === "PENDING" || c.status === "APPROVED")
                            .map((c) => c.id)
                          setSelectedIds(selectableIds)
                        } else {
                          setSelectedIds([])
                        }
                      }}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Agente
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Contrato
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Base
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Tasa
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Comisión
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {commissions.map((commission) => (
                  <tr key={commission.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      {(commission.status === "PENDING" || commission.status === "APPROVED") && (
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(commission.id)}
                          onChange={() => toggleSelect(commission.id)}
                          className="rounded border-gray-300 dark:border-gray-600"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-200">
                      {formatDate(commission.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-sm text-gray-900 dark:text-white">
                          {commission.agent.firstName} {commission.agent.lastName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {commission.agent.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-mono text-sm text-gray-900 dark:text-white">
                          {commission.rental.contractNumber}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {commission.rental.vehicle.brand}{" "}
                          {commission.rental.vehicle.model}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-200">
                      {formatCurrency(
                        commission.baseAmount,
                        settings.currency,
                        settings.currencySymbol
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-200">{commission.rate}%</td>
                    <td className="px-4 py-3 font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(
                        commission.amount,
                        settings.currency,
                        settings.currencySymbol
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          statusColors[commission.status]
                        }`}
                      >
                        {statusLabels[commission.status]}
                      </span>
                      {commission.paidAt && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Pagada: {formatDate(commission.paidAt)}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pay Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Confirmar Pago</h2>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total a pagar:</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(
                      selectedTotal,
                      settings.currency,
                      settings.currencySymbol
                    )}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedIds.length} comisiones seleccionadas
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Referencia de Pago
                  </label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="Ej: Transferencia #12345"
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowPayModal(false)
                      setPaymentRef("")
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button className="flex-1" onClick={handlePaySelected}>
                    Confirmar Pago
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
