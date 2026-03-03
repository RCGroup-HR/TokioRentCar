"use client"

import { Suspense, useEffect, useState } from "react"
import { useSettingsStore } from "@/stores/settingsStore"
import { ApartmentCard, CatalogTabs } from "@/components/public"
import { Button, Input, Select } from "@/components/ui"
import { Search, Filter, X, Building2 } from "lucide-react"

interface Apartment {
  id: string
  name: string
  city: string
  rooms: number
  bathrooms: number
  maxGuests: number
  category: string
  pricePerNight: number
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
  { value: "STUDIO", label: "Estudio" },
  { value: "ONE_BEDROOM", label: "1 Habitación" },
  { value: "TWO_BEDROOM", label: "2 Habitaciones" },
  { value: "THREE_BEDROOM", label: "3 Habitaciones" },
  { value: "PENTHOUSE", label: "Penthouse" },
  { value: "VILLA", label: "Villa" },
  { value: "OTHER", label: "Otro" },
]

const sortOptions = [
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
  { value: "newest", label: "Más recientes" },
  { value: "popular", label: "Más populares" },
]

function DepartamentosContent() {
  const { settings } = useSettingsStore()

  const [apartments, setApartments] = useState<Apartment[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [sortBy, setSortBy] = useState("popular")
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchApartments()
  }, [category, sortBy, page])

  const fetchApartments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", page.toString())
      params.set("limit", "12")
      params.set("available", "true")

      if (search) params.set("search", search)
      if (category) params.set("category", category)

      const response = await fetch(`/api/apartments?${params.toString()}`)
      const data = await response.json()

      let sortedApartments = data.apartments || []

      switch (sortBy) {
        case "price_asc":
          sortedApartments.sort(
            (a: Apartment, b: Apartment) => a.pricePerNight - b.pricePerNight
          )
          break
        case "price_desc":
          sortedApartments.sort(
            (a: Apartment, b: Apartment) => b.pricePerNight - a.pricePerNight
          )
          break
        case "popular":
          sortedApartments.sort(
            (a: Apartment, b: Apartment) =>
              (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0)
          )
          break
      }

      setApartments(sortedApartments)
      setPagination(data.pagination)
    } catch (error) {
      console.error("Error fetching apartments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchApartments()
  }

  const clearFilters = () => {
    setSearch("")
    setCategory("")
    setSortBy("popular")
    setPage(1)
  }

  const hasActiveFilters = search || category

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
            Nuestros Departamentos
          </h1>
          <p className="text-gray-200 max-w-2xl">
            Encuentra el alojamiento perfecto para tu estadía — cómodo, equipado y al mejor precio
          </p>
        </div>
      </div>

      <CatalogTabs activeTab="departamentos" />

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
                    className="text-sm hover:underline"
                    style={{ color: settings.primaryColor }}
                  >
                    Limpiar
                  </button>
                )}
              </div>

              <form onSubmit={handleSearch} className="space-y-6">
                <Input
                  label="Buscar"
                  placeholder="Nombre, ciudad..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                />

                <Select
                  label="Tipo de propiedad"
                  options={categoryOptions}
                  value={category}
                  onChange={setCategory}
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
                    placeholder="Nombre, ciudad..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    leftIcon={<Search className="h-4 w-4" />}
                  />

                  <Select
                    label="Tipo de propiedad"
                    options={categoryOptions}
                    value={category}
                    onChange={setCategory}
                  />

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
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-4">
                Mostrando {apartments.length} de {pagination.total} departamentos
              </p>
            )}

            {/* Grid */}
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="loader" />
              </div>
            ) : apartments.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {apartments.map((apartment) => (
                    <ApartmentCard key={apartment.id} apartment={apartment} />
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
                <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No se encontraron departamentos
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
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

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="loader" />
    </div>
  )
}

export default function DepartamentosPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DepartamentosContent />
    </Suspense>
  )
}
