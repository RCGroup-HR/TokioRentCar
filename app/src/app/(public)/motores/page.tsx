"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useSettingsStore } from "@/stores/settingsStore"
import { VehicleCard, CatalogTabs } from "@/components/public"
import { Button, Input, Select } from "@/components/ui"
import { Search, Filter, X, Bike, CalendarCheck } from "lucide-react"

interface Vehicle {
  id: string
  brand: string
  model: string
  year: number
  category: string
  transmission: string
  fuelType: string
  seats: number
  airConditioning: boolean
  dailyRate: number
  images: { id: string; url: string; isPrimary: boolean }[]
  isFeatured: boolean
  status: string
  isAvailableForDates: boolean | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const categoryOptions = [
  { value: "", label: "Todas las categorías" },
  { value: "ECONOMY", label: "Económico" },
  { value: "COMPACT", label: "Compacto" },
  { value: "MIDSIZE", label: "Mediano" },
  { value: "SPORTS", label: "Deportivo" },
  { value: "LUXURY", label: "Lujo" },
]

const transmissionOptions = [
  { value: "", label: "Todas las transmisiones" },
  { value: "AUTOMATIC", label: "Automático" },
  { value: "MANUAL", label: "Manual" },
]

const sortOptions = [
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
  { value: "newest", label: "Más recientes" },
  { value: "popular", label: "Más populares" },
]

/** Formatea una fecha "YYYY-MM-DD" en español sin problemas de zona horaria */
function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return ""
  const parts = dateStr.split("-")
  if (parts.length !== 3) return dateStr
  const [year, month, day] = parts.map(Number)
  const months = ["ene", "feb", "mar", "abr", "may", "jun",
                  "jul", "ago", "sep", "oct", "nov", "dic"]
  return `${day} ${months[month - 1]} ${year}`
}

function MotoresContent() {
  const searchParams = useSearchParams()
  const { settings } = useSettingsStore()

  // Fechas desde la búsqueda (SearchForm en home)
  const dateStart = searchParams.get("start") || ""
  const dateEnd = searchParams.get("end") || ""
  const hasDateFilter = !!(dateStart && dateEnd)

  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false)

  const [search, setSearch] = useState("")
  const [category, setCategory] = useState(searchParams.get("category") || "")
  const [transmission, setTransmission] = useState("")
  const [sortBy, setSortBy] = useState("popular")
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchMotores()
  }, [category, transmission, sortBy, page])

  const fetchMotores = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", page.toString())
      params.set("limit", "12")
      params.set("vehicleType", "MOTOR")

      if (search) params.set("search", search)
      if (category) params.set("category", category)

      // Siempre mostrar todos los vehículos activos (incluyendo rentados)
      // Con fechas: calcular disponibilidad por solapamiento de rentas
      if (dateStart && dateEnd) {
        params.set("startDate", dateStart)
        params.set("endDate", dateEnd)
      }

      const response = await fetch(`/api/vehicles?${params.toString()}`)
      const data = await response.json()

      let sortedVehicles: Vehicle[] = data.vehicles || []

      if (transmission) {
        sortedVehicles = sortedVehicles.filter(
          (v) => v.transmission === transmission
        )
      }

      switch (sortBy) {
        case "price_asc":
          sortedVehicles.sort((a, b) => a.dailyRate - b.dailyRate)
          break
        case "price_desc":
          sortedVehicles.sort((a, b) => b.dailyRate - a.dailyRate)
          break
        case "newest":
          sortedVehicles.sort((a, b) => b.year - a.year)
          break
        case "popular":
          sortedVehicles.sort(
            (a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0)
          )
          break
      }

      // Si hay filtro de fechas, poner disponibles arriba
      if (hasDateFilter) {
        sortedVehicles.sort((a, b) => {
          const aAvail = a.isAvailableForDates === true ? 0 : 1
          const bAvail = b.isAvailableForDates === true ? 0 : 1
          return aAvail - bAvail
        })
      }

      setVehicles(sortedVehicles)
      setPagination(data.pagination)
    } catch (error) {
      console.error("Error fetching motors:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchMotores()
  }

  const clearFilters = () => {
    setSearch("")
    setCategory("")
    setTransmission("")
    setSortBy("popular")
    setShowOnlyAvailable(false)
    setPage(1)
  }

  const hasActiveFilters = search || category || transmission

  // Vehículos disponibles para las fechas seleccionadas
  const availableCount = hasDateFilter
    ? vehicles.filter((v) => v.isAvailableForDates !== false).length
    : vehicles.length

  // Lista a mostrar en el grid
  const displayedVehicles =
    hasDateFilter && showOnlyAvailable
      ? vehicles.filter((v) => v.isAvailableForDates !== false)
      : vehicles

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div
        className="py-12"
        style={{
          background: `linear-gradient(135deg, ${settings.secondaryColor} 0%, ${settings.accentColor} 100%)`,
        }}
      >
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Nuestros Motores
          </h1>
          <p className="text-gray-200 max-w-2xl">
            Explora nuestra selección de motores y encuentra el ideal para tu recorrido
          </p>
        </div>
      </div>

      <CatalogTabs activeTab="motores" />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters - Desktop Sidebar */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Filtros
                </h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-primary hover:underline"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              <form onSubmit={handleSearch} className="space-y-6">
                <Input
                  label="Buscar"
                  placeholder="Marca, modelo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                />

                <Select
                  label="Categoría"
                  options={categoryOptions}
                  value={category}
                  onChange={setCategory}
                />

                <Select
                  label="Transmisión"
                  options={transmissionOptions}
                  value={transmission}
                  onChange={setTransmission}
                />

                <Button type="submit" className="w-full">
                  Aplicar Filtros
                </Button>
              </form>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile Filter Button & Sort */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg shadow-sm"
              >
                <Filter className="h-4 w-4" />
                Filtros
                {hasActiveFilters && (
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: settings.primaryColor }}
                  />
                )}
              </button>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-200 hidden sm:inline">
                  Ordenar por:
                </span>
                <Select
                  options={sortOptions}
                  value={sortBy}
                  onChange={setSortBy}
                  className="w-48"
                />
              </div>
            </div>

            {/* Mobile Filters */}
            {showFilters && (
              <div className="lg:hidden bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Filtros
                  </h2>
                  <button onClick={() => setShowFilters(false)}>
                    <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>

                <form onSubmit={handleSearch} className="space-y-4">
                  <Input
                    label="Buscar"
                    placeholder="Marca, modelo..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    leftIcon={<Search className="h-4 w-4" />}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Categoría"
                      options={categoryOptions}
                      value={category}
                      onChange={setCategory}
                    />
                    <Select
                      label="Transmisión"
                      options={transmissionOptions}
                      value={transmission}
                      onChange={setTransmission}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      Aplicar
                    </Button>
                    {hasActiveFilters && (
                      <Button type="button" variant="outline" onClick={clearFilters}>
                        Limpiar
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* Banner de disponibilidad por fechas */}
            {hasDateFilter && !loading && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <CalendarCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                        {formatDateDisplay(dateStart)} — {formatDateDisplay(dateEnd)}
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-0.5">
                        <span className="font-medium">{availableCount}</span> de{" "}
                        <span className="font-medium">{vehicles.length}</span> motores disponibles para estas fechas
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowOnlyAvailable(!showOnlyAvailable)}
                    className={`flex-shrink-0 text-sm font-medium px-4 py-2 rounded-lg transition ${
                      showOnlyAvailable
                        ? "bg-blue-600 text-white"
                        : "bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    }`}
                  >
                    {showOnlyAvailable ? "✓ Solo disponibles" : "Ver solo disponibles"}
                  </button>
                </div>
              </div>
            )}

            {/* Results Count */}
            {pagination && !loading && (
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-4">
                Mostrando {displayedVehicles.length} de {pagination.total} motores
              </p>
            )}

            {/* Grid */}
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="loader" />
              </div>
            ) : displayedVehicles.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {displayedVehicles.map((vehicle) => (
                    <VehicleCard
                      key={vehicle.id}
                      vehicle={vehicle}
                      basePath="/motores"
                    />
                  ))}
                </div>

                {pagination && pagination.totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Anterior
                    </Button>
                    <span className="flex items-center px-4 text-sm font-medium text-gray-800 dark:text-gray-200">
                      Página {page} de {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      disabled={page === pagination.totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Siguiente
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl">
                <Bike className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No se encontraron motores
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {showOnlyAvailable
                    ? "No hay motores disponibles para las fechas seleccionadas"
                    : "Intenta ajustar los filtros de búsqueda"}
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="loader" />
    </div>
  )
}

export default function MotoresPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <MotoresContent />
    </Suspense>
  )
}
