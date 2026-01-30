"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui"
import { useSettingsStore } from "@/stores/settingsStore"
import { formatCurrency } from "@/lib/utils"
import { ArrowLeft, Car, User, Calendar, Save, Search, Plus, X, Check, UserCog } from "lucide-react"
import { useSession } from "next-auth/react"

interface Vehicle {
  id: string
  brand: string
  model: string
  year: number
  licensePlate: string
  dailyRate: number
  depositAmount: number
  mileage: number
  images: { url: string; isPrimary: boolean }[]
}

interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  idType: string
  idNumber: string
  licenseNumber: string | null
  licenseExpiry: string | null
  address: string | null
  city: string | null
}

interface Location {
  id: string
  name: string
  address: string
}

interface Agent {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
}

export default function NuevaRentaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const { settings } = useSettingsStore()
  const [loading, setLoading] = useState(false)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedAgentId, setSelectedAgentId] = useState<string>("")

  // Customer search
  const [customerSearch, setCustomerSearch] = useState("")
  const [customerResults, setCustomerResults] = useState<Customer[]>([])
  const [showCustomerSearch, setShowCustomerSearch] = useState(false)
  const [searchingCustomer, setSearchingCustomer] = useState(false)

  // Vehicle search
  const [vehicleSearch, setVehicleSearch] = useState("")
  const [vehicleResults, setVehicleResults] = useState<Vehicle[]>([])
  const [showVehicleSearch, setShowVehicleSearch] = useState(false)

  const [formData, setFormData] = useState({
    customerId: "",
    vehicleId: searchParams.get("vehicleId") || "",
    reservationId: searchParams.get("reservationId") || "",
    startDate: new Date().toISOString().split("T")[0],
    startTime: "10:00",
    expectedEndDate: "",
    expectedEndTime: "10:00",
    dailyRate: 0,
    depositAmount: 0,
    startMileage: 0,
    pickupLocation: "",
    pickupCondition: "EXCELLENT",
    fuelLevelStart: "FULL",
    licenseNumber: "",
    licenseExpiry: "",
    idNumber: "",
    idType: "CEDULA",
    notes: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (formData.vehicleId) {
      const vehicle = vehicles.find((v) => v.id === formData.vehicleId)
      if (vehicle) {
        setSelectedVehicle(vehicle)
        setFormData((prev) => ({
          ...prev,
          dailyRate: vehicle.dailyRate,
          depositAmount: vehicle.depositAmount,
          startMileage: vehicle.mileage,
        }))
      }
    }
  }, [formData.vehicleId, vehicles])

  const fetchData = async () => {
    try {
      const [vehiclesRes, locationsRes, agentsRes] = await Promise.all([
        fetch("/api/vehicles?status=AVAILABLE&limit=100"),
        fetch("/api/locations"),
        fetch("/api/users?role=AGENT,ADMIN,SUPER_ADMIN&limit=100"),
      ])

      const vehiclesData = await vehiclesRes.json()
      const locationsData = await locationsRes.json()
      const agentsData = await agentsRes.json()

      setVehicles(vehiclesData.vehicles || [])
      setLocations(locationsData || [])
      setAgents(agentsData.users || [])

      // Set default location
      const defaultLocation = locationsData.find((l: Location) => l.name)
      if (defaultLocation) {
        setFormData((prev) => ({
          ...prev,
          pickupLocation: defaultLocation.name,
        }))
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    }
  }

  // Set current logged user as default agent
  useEffect(() => {
    if (session?.user?.id && agents.length > 0 && !selectedAgentId) {
      const currentUserIsAgent = agents.find(a => a.id === session.user.id)
      if (currentUserIsAgent) {
        setSelectedAgentId(session.user.id)
      }
    }
  }, [session, agents, selectedAgentId])

  // Debounced customer search
  const searchCustomers = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setCustomerResults([])
      return
    }

    setSearchingCustomer(true)
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(query)}&limit=10`)
      const data = await res.json()
      setCustomerResults(data.customers || [])
    } catch (error) {
      console.error("Error searching customers:", error)
    } finally {
      setSearchingCustomer(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      searchCustomers(customerSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [customerSearch, searchCustomers])

  // Filter vehicles based on search
  useEffect(() => {
    if (!vehicleSearch) {
      setVehicleResults(vehicles)
      return
    }
    const search = vehicleSearch.toLowerCase()
    const filtered = vehicles.filter(
      (v) =>
        v.brand.toLowerCase().includes(search) ||
        v.model.toLowerCase().includes(search) ||
        v.licensePlate.toLowerCase().includes(search) ||
        v.year.toString().includes(search)
    )
    setVehicleResults(filtered)
  }, [vehicleSearch, vehicles])

  const selectVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setFormData((prev) => ({
      ...prev,
      vehicleId: vehicle.id,
      dailyRate: vehicle.dailyRate,
      depositAmount: vehicle.depositAmount,
      startMileage: vehicle.mileage,
    }))
    setShowVehicleSearch(false)
    setVehicleSearch("")
  }

  const clearVehicle = () => {
    setSelectedVehicle(null)
    setFormData((prev) => ({
      ...prev,
      vehicleId: "",
      dailyRate: 0,
      depositAmount: 0,
      startMileage: 0,
    }))
  }

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setFormData((prev) => ({
      ...prev,
      customerId: customer.id,
      idType: customer.idType,
      idNumber: customer.idNumber,
      licenseNumber: customer.licenseNumber || "",
      licenseExpiry: customer.licenseExpiry ? customer.licenseExpiry.split("T")[0] : "",
    }))
    setShowCustomerSearch(false)
    setCustomerSearch("")
    setCustomerResults([])
  }

  const clearCustomer = () => {
    setSelectedCustomer(null)
    setFormData((prev) => ({
      ...prev,
      customerId: "",
      idType: "CEDULA",
      idNumber: "",
      licenseNumber: "",
      licenseExpiry: "",
    }))
  }

  const calculateTotal = () => {
    if (!formData.startDate || !formData.expectedEndDate) return 0
    const start = new Date(formData.startDate)
    const end = new Date(formData.expectedEndDate)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    if (days <= 0) return 0
    const subtotal = days * formData.dailyRate
    const taxes = settings.applyTax ? subtotal * (settings.taxRate / 100) : 0
    return subtotal + taxes
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.customerId) {
      alert("Por favor seleccione un cliente")
      return
    }

    if (!selectedAgentId) {
      alert("Por favor seleccione un agente")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/rentals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          agentId: selectedAgentId,
          licenseExpiry: formData.licenseExpiry || null,
        }),
      })

      if (res.ok) {
        const rental = await res.json()
        router.push(`/admin/rentas/${rental.id}`)
      } else {
        const error = await res.json()
        alert(error.error || "Error al crear renta")
      }
    } catch (error) {
      console.error("Error creating rental:", error)
      alert("Error al crear renta")
    } finally {
      setLoading(false)
    }
  }

  const primaryImage = selectedVehicle?.images.find((img) => img.isPrimary) ||
    selectedVehicle?.images[0]

  const idTypeLabels: Record<string, string> = {
    CEDULA: "Cédula",
    PASSPORT: "Pasaporte",
    LICENSE: "Licencia",
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/rentas">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nueva Renta</h1>
          <p className="text-gray-500 dark:text-gray-400">Crear contrato de alquiler</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-white">
              <User className="h-5 w-5" />
              Cliente
            </h2>

            {/* Selected Customer Display */}
            {selectedCustomer ? (
              <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Check className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-800 dark:text-green-300">
                        {selectedCustomer.firstName} {selectedCustomer.lastName}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        {selectedCustomer.phone} • {selectedCustomer.email}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        {idTypeLabels[selectedCustomer.idType]}: {selectedCustomer.idNumber}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearCustomer}
                    className="p-1 hover:bg-green-200 dark:hover:bg-green-800 rounded"
                  >
                    <X className="h-5 w-5 text-green-600" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Buscar Cliente *
                </label>
                <div className="relative">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar por nombre, cédula, teléfono..."
                        value={customerSearch}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value)
                          setShowCustomerSearch(true)
                        }}
                        onFocus={() => setShowCustomerSearch(true)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <Link href="/admin/clientes">
                      <Button type="button" variant="outline" leftIcon={<Plus className="h-4 w-4" />}>
                        Nuevo
                      </Button>
                    </Link>
                  </div>

                  {/* Search Results Dropdown */}
                  {showCustomerSearch && (customerResults.length > 0 || searchingCustomer) && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {searchingCustomer ? (
                        <div className="p-4 text-center text-gray-500">
                          <div className="loader-sm mx-auto" />
                        </div>
                      ) : (
                        customerResults.map((customer) => (
                          <button
                            key={customer.id}
                            type="button"
                            onClick={() => selectCustomer(customer)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b dark:border-gray-700 last:border-0"
                          >
                            <p className="font-medium dark:text-white">
                              {customer.firstName} {customer.lastName}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {customer.phone} • {idTypeLabels[customer.idType]}: {customer.idNumber}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Customer Documents - Only editable if customer selected */}
            {selectedCustomer && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t dark:border-gray-700">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo de Documento
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
                    Número de Documento
                  </label>
                  <input
                    type="text"
                    value={formData.idNumber}
                    onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Número de Licencia *
                  </label>
                  <input
                    type="text"
                    required
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
              </div>
            )}
          </div>

          {/* Agent Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-white">
              <UserCog className="h-5 w-5" />
              Agente
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Agente Responsable *
              </label>
              <select
                required
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Seleccionar agente...</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.firstName} {agent.lastName} ({agent.role === "SUPER_ADMIN" ? "Super Admin" : agent.role === "ADMIN" ? "Admin" : "Agente"})
                    {agent.id === session?.user?.id ? " - (Tú)" : ""}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                El agente seleccionado recibirá la comisión por esta renta
              </p>
            </div>
          </div>

          {/* Vehicle Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-white">
              <Car className="h-5 w-5" />
              Vehículo
            </h2>

            {/* Selected Vehicle Display */}
            {selectedVehicle ? (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center overflow-hidden">
                      {selectedVehicle.images[0] ? (
                        <Image
                          src={selectedVehicle.images[0].url}
                          alt={selectedVehicle.brand}
                          width={64}
                          height={64}
                          className="object-cover"
                        />
                      ) : (
                        <Car className="h-8 w-8 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-blue-800 dark:text-blue-300">
                        {selectedVehicle.brand} {selectedVehicle.model} {selectedVehicle.year}
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        Placa: {selectedVehicle.licensePlate}
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        {formatCurrency(selectedVehicle.dailyRate, settings.currency, settings.currencySymbol)}/día
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearVehicle}
                    className="p-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded"
                  >
                    <X className="h-5 w-5 text-blue-600" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Buscar Vehículo *
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por marca, modelo, placa, año..."
                    value={vehicleSearch}
                    onChange={(e) => {
                      setVehicleSearch(e.target.value)
                      setShowVehicleSearch(true)
                    }}
                    onFocus={() => setShowVehicleSearch(true)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />

                  {/* Vehicle Search Results Dropdown */}
                  {showVehicleSearch && vehicleResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg max-h-72 overflow-y-auto">
                      {vehicleResults.map((vehicle) => (
                        <button
                          key={vehicle.id}
                          type="button"
                          onClick={() => selectVehicle(vehicle)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b dark:border-gray-700 last:border-0 flex items-center gap-3"
                        >
                          <div className="w-12 h-12 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {vehicle.images[0] ? (
                              <Image
                                src={vehicle.images[0].url}
                                alt={vehicle.brand}
                                width={48}
                                height={48}
                                className="object-cover"
                              />
                            ) : (
                              <Car className="h-6 w-6 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium dark:text-white">
                              {vehicle.brand} {vehicle.model} {vehicle.year}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {vehicle.licensePlate} • {formatCurrency(vehicle.dailyRate, settings.currency, settings.currencySymbol)}/día
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {vehicles.length} vehículos disponibles
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kilometraje Inicial
                </label>
                <input
                  type="number"
                  value={formData.startMileage}
                  onChange={(e) => setFormData({ ...formData, startMileage: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Condición de Entrega
                </label>
                <select
                  value={formData.pickupCondition}
                  onChange={(e) => setFormData({ ...formData, pickupCondition: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="EXCELLENT">Excelente</option>
                  <option value="GOOD">Buena</option>
                  <option value="FAIR">Regular</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nivel de Combustible
                </label>
                <select
                  value={formData.fuelLevelStart}
                  onChange={(e) => setFormData({ ...formData, fuelLevelStart: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="FULL">Lleno</option>
                  <option value="THREE_QUARTERS">3/4</option>
                  <option value="HALF">1/2</option>
                  <option value="QUARTER">1/4</option>
                  <option value="EMPTY">Vacío</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Lugar de Recogida
                </label>
                <select
                  value={formData.pickupLocation}
                  onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {locations.map((location) => (
                    <option key={location.id} value={location.name}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Dates & Pricing */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-white">
              <Calendar className="h-5 w-5" />
              Fechas y Precios
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha de Salida *
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hora de Salida *
                </label>
                <input
                  type="time"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha de Entrada *
                </label>
                <input
                  type="date"
                  required
                  value={formData.expectedEndDate}
                  onChange={(e) => setFormData({ ...formData, expectedEndDate: e.target.value })}
                  min={formData.startDate}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hora de Entrada *
                </label>
                <input
                  type="time"
                  required
                  value={formData.expectedEndTime}
                  onChange={(e) => setFormData({ ...formData, expectedEndTime: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tarifa Diaria ({settings.currencySymbol})
                </label>
                <input
                  type="number"
                  value={formData.dailyRate}
                  onChange={(e) => setFormData({ ...formData, dailyRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Depósito ({settings.currencySymbol})
                </label>
                <input
                  type="number"
                  value={formData.depositAmount}
                  onChange={(e) => setFormData({ ...formData, depositAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notas
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas adicionales..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          {/* Vehicle Preview */}
          {selectedVehicle && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 mb-3">
                {primaryImage ? (
                  <Image
                    src={primaryImage.url}
                    alt={selectedVehicle.brand}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Car className="h-12 w-12 text-gray-300" />
                  </div>
                )}
              </div>
              <h3 className="font-semibold dark:text-white">
                {selectedVehicle.brand} {selectedVehicle.model} {selectedVehicle.year}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Placa: {selectedVehicle.licensePlate}
              </p>
            </div>
          )}

          {/* Pricing Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <h3 className="font-semibold mb-3 dark:text-white">Resumen</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Tarifa diaria:</span>
                <span className="dark:text-white">
                  {formatCurrency(formData.dailyRate, settings.currency, settings.currencySymbol)}
                </span>
              </div>
              {formData.startDate && formData.expectedEndDate && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Días:</span>
                    <span className="dark:text-white">
                      {Math.max(
                        1,
                        Math.ceil(
                          (new Date(formData.expectedEndDate).getTime() -
                            new Date(formData.startDate).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                    <span className="dark:text-white">
                      {formatCurrency(
                        Math.max(
                          1,
                          Math.ceil(
                            (new Date(formData.expectedEndDate).getTime() -
                              new Date(formData.startDate).getTime()) /
                              (1000 * 60 * 60 * 24)
                          )
                        ) * formData.dailyRate,
                        settings.currency,
                        settings.currencySymbol
                      )}
                    </span>
                  </div>
                  {settings.applyTax && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">ITBIS ({settings.taxRate}%):</span>
                      <span className="dark:text-white">
                        {formatCurrency(
                          Math.max(
                            1,
                            Math.ceil(
                              (new Date(formData.expectedEndDate).getTime() -
                                new Date(formData.startDate).getTime()) /
                                (1000 * 60 * 60 * 24)
                            )
                          ) *
                            formData.dailyRate *
                            (settings.taxRate / 100),
                          settings.currency,
                          settings.currencySymbol
                        )}
                      </span>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between pt-2 border-t dark:border-gray-700 font-semibold">
                <span className="dark:text-white">Total:</span>
                <span className="text-amber-600">
                  {formatCurrency(calculateTotal(), settings.currency, settings.currencySymbol)}
                </span>
              </div>
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Depósito:</span>
                <span>
                  {formatCurrency(formData.depositAmount, settings.currency, settings.currencySymbol)}
                </span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={loading || !selectedCustomer}
            leftIcon={
              loading ? <div className="loader-sm" /> : <Save className="h-4 w-4" />
            }
          >
            {loading ? "Creando..." : "Crear Contrato de Renta"}
          </Button>
        </div>
      </form>
    </div>
  )
}
