"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  User,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
  Check,
  X,
  Eye,
  Car,
  Calendar,
  DollarSign,
  ChevronDown,
  ChevronUp,
  ExternalLink,
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
  idExpiry: string | null
  licenseNumber: string | null
  licenseExpiry: string | null
  licenseCategory: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  dateOfBirth: string | null
  nationality: string | null
  occupation: string | null
  employer: string | null
  employerPhone: string | null
  emergencyContact: string | null
  emergencyPhone: string | null
  emergencyRelationship: string | null
  notes: string | null
  isActive: boolean
  isBlacklisted: boolean
  blacklistReason: string | null
  createdAt: string
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

interface CustomerRental {
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
    brand: string
    model: string
    year: number
    licensePlate: string
    color: string
  }
}

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null)
  const [customerRentals, setCustomerRentals] = useState<CustomerRental[]>([])
  const [loadingRentals, setLoadingRentals] = useState(false)
  const [showRentalsDetail, setShowRentalsDetail] = useState(false)
  const [total, setTotal] = useState(0)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    phoneSecondary: "",
    idType: "CEDULA",
    idNumber: "",
    idExpiry: "",
    licenseNumber: "",
    licenseExpiry: "",
    licenseCategory: "",
    address: "",
    city: "",
    state: "",
    country: "República Dominicana",
    dateOfBirth: "",
    nationality: "Dominicano/a",
    occupation: "",
    employer: "",
    employerPhone: "",
    emergencyContact: "",
    emergencyPhone: "",
    emergencyRelationship: "",
    notes: "",
  })

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("limit", "100")
      params.set("active", "false") // Get all including inactive
      if (search) params.set("search", search)

      const res = await fetch(`/api/customers?${params}`)
      const data = await res.json()
      setCustomers(data.customers || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error("Error fetching customers:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      fetchCustomers()
    }, 300)
    return () => clearTimeout(delaySearch)
  }, [search])

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      phoneSecondary: "",
      idType: "CEDULA",
      idNumber: "",
      idExpiry: "",
      licenseNumber: "",
      licenseExpiry: "",
      licenseCategory: "",
      address: "",
      city: "",
      state: "",
      country: "República Dominicana",
      dateOfBirth: "",
      nationality: "Dominicano/a",
      occupation: "",
      employer: "",
      employerPhone: "",
      emergencyContact: "",
      emergencyPhone: "",
      emergencyRelationship: "",
      notes: "",
    })
  }

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      phoneSecondary: customer.phoneSecondary || "",
      idType: customer.idType,
      idNumber: customer.idNumber,
      idExpiry: customer.idExpiry ? customer.idExpiry.split("T")[0] : "",
      licenseNumber: customer.licenseNumber || "",
      licenseExpiry: customer.licenseExpiry ? customer.licenseExpiry.split("T")[0] : "",
      licenseCategory: customer.licenseCategory || "",
      address: customer.address || "",
      city: customer.city || "",
      state: customer.state || "",
      country: customer.country || "República Dominicana",
      dateOfBirth: customer.dateOfBirth ? customer.dateOfBirth.split("T")[0] : "",
      nationality: customer.nationality || "Dominicano/a",
      occupation: customer.occupation || "",
      employer: customer.employer || "",
      employerPhone: customer.employerPhone || "",
      emergencyContact: customer.emergencyContact || "",
      emergencyPhone: customer.emergencyPhone || "",
      emergencyRelationship: customer.emergencyRelationship || "",
      notes: customer.notes || "",
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingCustomer
        ? `/api/customers/${editingCustomer.id}`
        : "/api/customers"
      const method = editingCustomer ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          isActive: editingCustomer?.isActive ?? true,
        }),
      })

      if (res.ok) {
        setShowModal(false)
        setEditingCustomer(null)
        resetForm()
        fetchCustomers()
      } else {
        const error = await res.json()
        alert(error.error || "Error al guardar cliente")
      }
    } catch (error) {
      console.error("Error saving customer:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este cliente?")) return

    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        fetchCustomers()
      }
    } catch (error) {
      console.error("Error deleting customer:", error)
    }
  }

  const toggleActive = async (customer: Customer) => {
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...customer, isActive: !customer.isActive }),
      })

      if (res.ok) {
        fetchCustomers()
      }
    } catch (error) {
      console.error("Error toggling customer:", error)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("es-DO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const fetchCustomerRentals = async (customerId: string) => {
    setLoadingRentals(true)
    try {
      const res = await fetch(`/api/customers/${customerId}/rentals`)
      const data = await res.json()
      setCustomerRentals(data.rentals || [])
    } catch (error) {
      console.error("Error fetching customer rentals:", error)
      setCustomerRentals([])
    } finally {
      setLoadingRentals(false)
    }
  }

  const openViewModal = async (customer: Customer) => {
    setViewingCustomer(customer)
    setShowViewModal(true)
    setShowRentalsDetail(false)
    setCustomerRentals([])
    await fetchCustomerRentals(customer.id)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const getRentalStats = () => {
    const total = customerRentals.length
    const totalSpent = customerRentals.reduce((sum, r) => sum + r.totalAmount, 0)
    const activeRentals = customerRentals.filter(r => r.status === "ACTIVE").length
    const completedRentals = customerRentals.filter(r => r.status === "COMPLETED").length
    return { total, totalSpent, activeRentals, completedRentals }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clientes</h1>
          <p className="text-gray-600 dark:text-gray-400">Gestión de clientes ({total} registrados)</p>
        </div>
        <Button
          onClick={() => {
            setEditingCustomer(null)
            resetForm()
            setShowModal(true)
          }}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Nuevo Cliente
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, email, teléfono, cédula..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="loader mx-auto" />
          </div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <User className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No hay clientes registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Contacto
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Documento
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Licencia
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-300">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-300">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      !customer.isActive ? "opacity-50" : ""
                    } ${customer.isBlacklisted ? "bg-red-50 dark:bg-red-900/20" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                          <User className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium dark:text-white">
                            {customer.firstName} {customer.lastName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Desde {formatDate(customer.createdAt)}
                          </p>
                        </div>
                        {customer.isBlacklisted && (
                          <span className="text-red-500" title={customer.blacklistReason || "En lista negra"}>
                            <AlertTriangle className="h-4 w-4" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <p className="text-sm flex items-center gap-1 dark:text-gray-300">
                          <Phone className="h-3 w-3 text-gray-400" />
                          {customer.phone}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium dark:text-white">
                          {idTypeLabels[customer.idType]}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                          {customer.idNumber}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {customer.licenseNumber ? (
                        <div>
                          <p className="text-sm font-mono dark:text-white">{customer.licenseNumber}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Vence: {formatDate(customer.licenseExpiry)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          customer.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400"
                        }`}
                      >
                        {customer.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => openViewModal(customer)}
                          className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(customer)}
                          className="p-2 text-gray-500 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleActive(customer)}
                          className={`p-2 ${
                            customer.isActive
                              ? "text-green-500 hover:text-red-500"
                              : "text-red-500 hover:text-green-500"
                          }`}
                          title={customer.isActive ? "Desactivar" : "Activar"}
                        >
                          {customer.isActive ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Modal */}
      {showViewModal && viewingCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <User className="h-8 w-8 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold dark:text-white">
                      {viewingCustomer.firstName} {viewingCustomer.lastName}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">{viewingCustomer.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3 dark:text-white">Contacto</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Teléfono:</span> <span className="dark:text-white">{viewingCustomer.phone}</span></p>
                    {viewingCustomer.phoneSecondary && (
                      <p><span className="text-gray-500">Tel. secundario:</span> <span className="dark:text-white">{viewingCustomer.phoneSecondary}</span></p>
                    )}
                    <p><span className="text-gray-500">Email:</span> <span className="dark:text-white">{viewingCustomer.email}</span></p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 dark:text-white">Documento</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Tipo:</span> <span className="dark:text-white">{idTypeLabels[viewingCustomer.idType]}</span></p>
                    <p><span className="text-gray-500">Número:</span> <span className="dark:text-white">{viewingCustomer.idNumber}</span></p>
                    <p><span className="text-gray-500">Vencimiento:</span> <span className="dark:text-white">{formatDate(viewingCustomer.idExpiry)}</span></p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 dark:text-white">Licencia</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Número:</span> <span className="dark:text-white">{viewingCustomer.licenseNumber || "-"}</span></p>
                    <p><span className="text-gray-500">Vencimiento:</span> <span className="dark:text-white">{formatDate(viewingCustomer.licenseExpiry)}</span></p>
                    <p><span className="text-gray-500">Categoría:</span> <span className="dark:text-white">{viewingCustomer.licenseCategory || "-"}</span></p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 dark:text-white">Dirección</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Dirección:</span> <span className="dark:text-white">{viewingCustomer.address || "-"}</span></p>
                    <p><span className="text-gray-500">Ciudad:</span> <span className="dark:text-white">{viewingCustomer.city || "-"}</span></p>
                    <p><span className="text-gray-500">País:</span> <span className="dark:text-white">{viewingCustomer.country || "-"}</span></p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 dark:text-white">Información Personal</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Fecha de nacimiento:</span> <span className="dark:text-white">{formatDate(viewingCustomer.dateOfBirth)}</span></p>
                    <p><span className="text-gray-500">Nacionalidad:</span> <span className="dark:text-white">{viewingCustomer.nationality || "-"}</span></p>
                    <p><span className="text-gray-500">Ocupación:</span> <span className="dark:text-white">{viewingCustomer.occupation || "-"}</span></p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 dark:text-white">Contacto de Emergencia</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Nombre:</span> <span className="dark:text-white">{viewingCustomer.emergencyContact || "-"}</span></p>
                    <p><span className="text-gray-500">Teléfono:</span> <span className="dark:text-white">{viewingCustomer.emergencyPhone || "-"}</span></p>
                    <p><span className="text-gray-500">Relación:</span> <span className="dark:text-white">{viewingCustomer.emergencyRelationship || "-"}</span></p>
                  </div>
                </div>
              </div>

              {viewingCustomer.notes && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-2 dark:text-white">Notas</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    {viewingCustomer.notes}
                  </p>
                </div>
              )}

              {/* Historial de Rentas */}
              <div className="mt-6 border-t dark:border-gray-700 pt-6">
                <button
                  onClick={() => setShowRentalsDetail(!showRentalsDetail)}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-900/30 dark:hover:to-orange-900/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center">
                      <Car className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-lg dark:text-white">Historial de Rentas</h3>
                      {loadingRentals ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Cargando...</p>
                      ) : (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {getRentalStats().total} {getRentalStats().total === 1 ? "renta" : "rentas"} •
                          <span className="text-green-600 dark:text-green-400 font-medium ml-1">
                            {formatCurrency(getRentalStats().totalSpent)} total
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRentalStats().activeRentals > 0 && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium">
                        {getRentalStats().activeRentals} activa{getRentalStats().activeRentals > 1 ? "s" : ""}
                      </span>
                    )}
                    {showRentalsDetail ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {showRentalsDetail && (
                  <div className="mt-4 space-y-3">
                    {loadingRentals ? (
                      <div className="text-center py-8">
                        <div className="loader mx-auto" />
                      </div>
                    ) : customerRentals.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Car className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                        <p>Este cliente no tiene rentas registradas</p>
                      </div>
                    ) : (
                      customerRentals.map((rental) => (
                        <div
                          key={rental.id}
                          className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-semibold text-amber-600 dark:text-amber-400">
                                  {rental.contractNumber}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${rentalStatusLabels[rental.status]?.color || "bg-gray-100 text-gray-800"}`}>
                                  {rentalStatusLabels[rental.status]?.label || rental.status}
                                </span>
                              </div>
                              <p className="text-lg font-medium dark:text-white mt-1">
                                {rental.vehicle.brand} {rental.vehicle.model} {rental.vehicle.year}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {rental.vehicle.color} • {rental.vehicle.licensePlate}
                              </p>
                            </div>
                            <a
                              href={`/admin/rentas/${rental.id}`}
                              className="p-2 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                              title="Ver contrato"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm">
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
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="text-gray-500 dark:text-gray-400 text-xs">Duración</p>
                                <p className="dark:text-white">{rental.totalDays} {rental.totalDays === 1 ? "día" : "días"}</p>
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
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowViewModal(false)}
                >
                  Cerrar
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    setShowViewModal(false)
                    openEditModal(viewingCustomer)
                  }}
                >
                  Editar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-6 dark:text-white">
                {editingCustomer ? "Editar Cliente" : "Nuevo Cliente"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Info */}
                <div>
                  <h3 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">Información Personal</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Apellido *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fecha de Nacimiento
                      </label>
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nacionalidad
                      </label>
                      <input
                        type="text"
                        value={formData.nationality}
                        onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Ocupación
                      </label>
                      <input
                        type="text"
                        value={formData.occupation}
                        onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div>
                  <h3 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">Contacto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Teléfono Secundario
                      </label>
                      <input
                        type="tel"
                        value={formData.phoneSecondary}
                        onChange={(e) => setFormData({ ...formData, phoneSecondary: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <h3 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">Documentos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tipo de Documento *
                      </label>
                      <select
                        value={formData.idType}
                        onChange={(e) => setFormData({ ...formData, idType: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="CEDULA">Cédula</option>
                        <option value="PASSPORT">Pasaporte</option>
                        <option value="LICENSE">Licencia</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Número de Documento *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.idNumber}
                        onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Vencimiento Documento
                      </label>
                      <input
                        type="date"
                        value={formData.idExpiry}
                        onChange={(e) => setFormData({ ...formData, idExpiry: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Número de Licencia
                      </label>
                      <input
                        type="text"
                        value={formData.licenseNumber}
                        onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Vencimiento Licencia
                      </label>
                      <input
                        type="date"
                        value={formData.licenseExpiry}
                        onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Categoría Licencia
                      </label>
                      <input
                        type="text"
                        value={formData.licenseCategory}
                        onChange={(e) => setFormData({ ...formData, licenseCategory: e.target.value })}
                        placeholder="A, B, C..."
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h3 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">Dirección</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Dirección
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Ciudad
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Estado/Provincia
                      </label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        País
                      </label>
                      <input
                        type="text"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div>
                  <h3 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">Contacto de Emergencia</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={formData.emergencyContact}
                        onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={formData.emergencyPhone}
                        onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Relación
                      </label>
                      <input
                        type="text"
                        value={formData.emergencyRelationship}
                        onChange={(e) => setFormData({ ...formData, emergencyRelationship: e.target.value })}
                        placeholder="Familiar, amigo, etc."
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notas
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                      setEditingCustomer(null)
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1">
                    {editingCustomer ? "Guardar Cambios" : "Crear Cliente"}
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
