"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useSettingsStore } from "@/stores/settingsStore"
import { VehicleCard } from "@/components/public"
import { Button, Input, Select } from "@/components/ui"
import { Search, Filter, X, Car } from "lucide-react"

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
  { value: "FULLSIZE", label: "Tamaño completo" },
  { value: "SUV", label: "SUV" },
  { value: "LUXURY", label: "Lujo" },
  { value: "VAN", label: "Van" },
  { value: "PICKUP", label: "Pickup" },
  { value: "CONVERTIBLE", label: "Convertible" },
  { value: "SPORTS", label: "Deportivo" },
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

export default function VehiclesPage() {
  const searchParams = useSearchParams()
  const { settings } = useSettingsStore()

  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  // Filters
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState(searchParams.get("category") || "")
  const [transmission, setTransmission] = useState("")
  const [sortBy, setSortBy] = useState("popular")
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchVehicles()
  }, [category, transmission, sortBy, page])

  const fetchVehicles = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", page.toString())
      params.set("limit", "12")
      params.set("available", "true")

      if (search) params.set("search", search)
      if (category) params.set("category", category)

      const response = await fetch(`/api/vehicles?${params.toString()}`)
      const data = await response.json()

      let sortedVehicles = data.vehicles || []

      // Client-side filtering and sorting
      if (transmission) {
        sortedVehicles = sortedVehicles.filter(
          (v: Vehicle) => v.transmission === transmission
        )
      }

      switch (sortBy) {
        case "price_asc":
          sortedVehicles.sort((a: Vehicle, b: Vehicle) => a.dailyRate - b.dailyRate)
          break
        case "price_desc":
          sortedVehicles.sort((a: Vehicle, b: Vehicle) => b.dailyRate - a.dailyRate)
          break
        case "newest":
          sortedVehicles.sort((a: Vehicle, b: Vehicle) => b.year - a.year)
          break
        case "popular":
          sortedVehicles.sort((a: Vehicle, b: Vehicle) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0))
          break
      }

      setVehicles(sortedVehicles)
      setPagination(data.pagination)
    } catch (error) {
      console.error("Error fetching vehicles:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchVehicles()
  }

  const clearFilters = () => {
    setSearch("")
    setCategory("")
    setTransmission("")
    setSortBy("popular")
    setPage(1)
  }

  const hasActiveFilters = search || category || transmission

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div
        className="py-12"
        style={{
          background: `linear-gradient(135deg, ${settings.secondaryColor} 0%, ${settings.accentColor} 100%)`,
        }}
      >
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Nuestros Vehículos
          </h1>
          <p className="text-gray-200 max-w-2xl">
            Explora nuestra amplia flota de vehículos y encuentra el perfecto para tu viaje
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters - Desktop Sidebar */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Filtros</h2>
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
                className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm"
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
                <span className="text-sm text-gray-500 hidden sm:inline">
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
              <div className="lg:hidden bg-white rounded-xl shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Filtros</h2>
                  <button onClick={() => setShowFilters(false)}>
                    <X className="h-5 w-5 text-gray-500" />
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

            {/* Results Count */}
            {pagination && (
              <p className="text-sm text-gray-500 mb-4">
                Mostrando {vehicles.length} de {pagination.total} vehículos
              </p>
            )}

            {/* Vehicle Grid */}
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="loader" />
              </div>
            ) : vehicles.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {vehicles.map((vehicle) => (
                    <VehicleCard key={vehicle.id} vehicle={vehicle} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Anterior
                    </Button>
                    <span className="flex items-center px-4 text-sm text-gray-600">
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
              <div className="text-center py-16 bg-white rounded-xl">
                <Car className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron vehículos
                </h3>
                <p className="text-gray-500 mb-4">
                  Intenta ajustar los filtros de búsqueda
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
