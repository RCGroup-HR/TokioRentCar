"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui"
import { useSettingsStore } from "@/stores/settingsStore"
import { useLanguageStore } from "@/stores/languageStore"
import { useCurrency } from "@/hooks/useCurrency"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Car,
  DollarSign,
  Wrench,
  Fuel,
  FileText,
  Shield,
  Receipt,
  X,
} from "lucide-react"

interface Expense {
  id: string
  category: string
  description: string
  amount: number
  date: string
  vendor: string | null
  invoiceNumber: string | null
  mileageAtExpense: number | null
  notes: string | null
  vehicle: {
    id: string
    brand: string
    model: string
    licensePlate: string
  }
  registeredBy: {
    id: string
    firstName: string
    lastName: string
  }
}

const categoryLabels: Record<string, string> = {
  FUEL: "Combustible",
  MAINTENANCE: "Mantenimiento",
  REPAIR: "Reparación",
  INSURANCE: "Seguro",
  TAX: "Impuestos",
  CLEANING: "Limpieza",
  ACCESSORIES: "Accesorios",
  OTHER: "Otro",
}

const categoryIcons: Record<string, React.ReactNode> = {
  FUEL: <Fuel className="h-4 w-4" />,
  MAINTENANCE: <Wrench className="h-4 w-4" />,
  REPAIR: <Wrench className="h-4 w-4" />,
  INSURANCE: <Shield className="h-4 w-4" />,
  TAX: <FileText className="h-4 w-4" />,
  CLEANING: <Car className="h-4 w-4" />,
  ACCESSORIES: <Car className="h-4 w-4" />,
  OTHER: <Receipt className="h-4 w-4" />,
}

export default function GastosPage() {
  const { data: session } = useSession()
  const { settings } = useSettingsStore()
  const { language } = useLanguageStore()
  const { formatDual, primarySymbol } = useCurrency()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [vehicles, setVehicles] = useState<{ id: string; brand: string; model: string; licensePlate: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [vehicleFilter, setVehicleFilter] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [totalAmount, setTotalAmount] = useState(0)
  const [formData, setFormData] = useState({
    vehicleId: "",
    category: "MAINTENANCE",
    description: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    vendor: "",
    invoiceNumber: "",
    mileageAtExpense: "",
    notes: "",
  })

  // Check if user is admin (can edit/delete)
  const isAdmin = session?.user?.role === "SUPER_ADMIN" || session?.user?.role === "ADMIN"

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("limit", "100")
      if (categoryFilter) params.set("category", categoryFilter)
      if (vehicleFilter) params.set("vehicleId", vehicleFilter)
      if (dateFrom) params.set("dateFrom", dateFrom)
      if (dateTo) params.set("dateTo", dateTo)

      const res = await fetch(`/api/expenses?${params}`)
      const data = await res.json()
      setExpenses(data.expenses || [])
      setTotalAmount(data.totalAmount || 0)
    } catch (error) {
      console.error("Error fetching expenses:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVehicles = async () => {
    try {
      const res = await fetch("/api/vehicles?limit=100")
      const data = await res.json()
      setVehicles(data.vehicles || [])
    } catch (error) {
      console.error("Error fetching vehicles:", error)
    }
  }

  useEffect(() => {
    fetchExpenses()
    fetchVehicles()
  }, [categoryFilter, vehicleFilter, dateFrom, dateTo])

  const resetForm = () => {
    setFormData({
      vehicleId: "",
      category: "MAINTENANCE",
      description: "",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      vendor: "",
      invoiceNumber: "",
      mileageAtExpense: "",
      notes: "",
    })
    setEditingExpense(null)
  }

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense)
    setFormData({
      vehicleId: expense.vehicle.id,
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      date: expense.date.split("T")[0],
      vendor: expense.vendor || "",
      invoiceNumber: expense.invoiceNumber || "",
      mileageAtExpense: expense.mileageAtExpense?.toString() || "",
      notes: expense.notes || "",
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingExpense
        ? `/api/expenses/${editingExpense.id}`
        : "/api/expenses"
      const method = editingExpense ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          mileageAtExpense: formData.mileageAtExpense
            ? parseInt(formData.mileageAtExpense)
            : null,
        }),
      })

      if (res.ok) {
        setShowModal(false)
        resetForm()
        fetchExpenses()
      } else {
        const error = await res.json()
        alert(error.error || "Error al guardar gasto")
      }
    } catch (error) {
      console.error("Error saving expense:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este gasto? Esta acción no se puede deshacer.")) return

    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        fetchExpenses()
      } else {
        const error = await res.json()
        alert(error.error || "Error al eliminar gasto")
      }
    } catch (error) {
      console.error("Error deleting expense:", error)
    }
  }

  const filteredExpenses = expenses.filter((e) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      e.description.toLowerCase().includes(searchLower) ||
      e.vehicle.brand.toLowerCase().includes(searchLower) ||
      e.vehicle.model.toLowerCase().includes(searchLower) ||
      e.vehicle.licensePlate.toLowerCase().includes(searchLower) ||
      (e.vendor && e.vendor.toLowerCase().includes(searchLower))
    )
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-DO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  // Calculate stats by category
  const expensesByCategory = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gastos</h1>
          <p className="text-gray-600 dark:text-gray-400">Registro de gastos por vehículo</p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Nuevo Gasto
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <DollarSign className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {language === "en" ? "Total Expenses" : "Total Gastos"}
              </p>
              <p className="text-lg font-bold dark:text-white">
                {formatDual(totalAmount)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Fuel className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {language === "en" ? "Fuel" : "Combustible"}
              </p>
              <p className="text-lg font-bold dark:text-white">
                {formatDual(expensesByCategory["FUEL"] || 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Wrench className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {language === "en" ? "Maintenance" : "Mantenimiento"}
              </p>
              <p className="text-lg font-bold dark:text-white">
                {formatDual(
                  (expensesByCategory["MAINTENANCE"] || 0) +
                    (expensesByCategory["REPAIR"] || 0)
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {language === "en" ? "Insurance" : "Seguros"}
              </p>
              <p className="text-lg font-bold dark:text-white">
                {formatDual(expensesByCategory["INSURANCE"] || 0)}
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
              placeholder="Buscar gastos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Todas las categorías</option>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Todos los vehículos</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.brand} {v.model} - {v.licensePlate}
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
              onChange={(e) => setDateFrom(e.target.value)}
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
              onChange={(e) => setDateTo(e.target.value)}
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
        ) : filteredExpenses.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <Receipt className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No hay gastos registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Vehículo
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Categoría
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Descripción
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Proveedor
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-300">
                    Monto
                  </th>
                  {isAdmin && (
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-300">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 text-sm dark:text-white">
                      {formatDate(expense.date)}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-sm dark:text-white">
                          {expense.vehicle.brand} {expense.vehicle.model}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {expense.vehicle.licensePlate}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs dark:text-gray-300">
                        {categoryIcons[expense.category]}
                        {categoryLabels[expense.category]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm dark:text-white">{expense.description}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {expense.vendor || "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-red-600">
                      {formatDual(expense.amount)}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => openEditModal(expense)}
                            className="p-2 text-gray-500 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(expense.id)}
                            className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Notice for Agents */}
      {!isAdmin && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Solo los administradores pueden editar o eliminar gastos. Si necesitas modificar un gasto, contacta a un administrador.
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold dark:text-white">
                  {editingExpense ? "Editar Gasto" : "Registrar Gasto"}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="h-5 w-5 dark:text-white" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Vehículo *
                  </label>
                  <select
                    required
                    value={formData.vehicleId}
                    onChange={(e) =>
                      setFormData({ ...formData, vehicleId: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Seleccionar vehículo</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.brand} {v.model} - {v.licensePlate}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Categoría *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descripción *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {language === "en" ? "Amount" : "Monto"} ({primarySymbol}) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          amount: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fecha *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Proveedor
                  </label>
                  <input
                    type="text"
                    value={formData.vendor}
                    onChange={(e) =>
                      setFormData({ ...formData, vendor: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      No. Factura
                    </label>
                    <input
                      type="text"
                      value={formData.invoiceNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, invoiceNumber: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Kilometraje
                    </label>
                    <input
                      type="number"
                      value={formData.mileageAtExpense}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          mileageAtExpense: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notas
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1">
                    {editingExpense ? "Guardar Cambios" : "Guardar Gasto"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
