"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSettingsStore } from "@/stores/settingsStore"
import { useCurrency } from "@/hooks/useCurrency"
import {
  Button,
  Input,
  Select,
  Card,
  CardContent,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui"
import { Plus, Search, Edit, Trash2, Eye, Building2 } from "lucide-react"

interface Apartment {
  id: string
  name: string
  city: string
  category: string
  status: string
  pricePerNight: number
  rooms: number
  images: { id: string; url: string; isPrimary: boolean }[]
}

const statusOptions = [
  { value: "", label: "Todos los estados" },
  { value: "AVAILABLE", label: "Disponible" },
  { value: "RENTED", label: "Rentado" },
  { value: "MAINTENANCE", label: "Mantenimiento" },
  { value: "OUT_OF_SERVICE", label: "Fuera de servicio" },
]

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

const categoryLabels: Record<string, string> = {
  STUDIO: "Estudio",
  ONE_BEDROOM: "1 Habitación",
  TWO_BEDROOM: "2 Habitaciones",
  THREE_BEDROOM: "3 Habitaciones",
  PENTHOUSE: "Penthouse",
  VILLA: "Villa",
  OTHER: "Otro",
}

const statusLabels: Record<string, string> = {
  AVAILABLE: "Disponible",
  RENTED: "Rentado",
  MAINTENANCE: "Mantenimiento",
  OUT_OF_SERVICE: "Fuera de servicio",
}

const statusColors: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  RENTED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  MAINTENANCE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  OUT_OF_SERVICE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

export default function AdminDepartamentosPage() {
  const { settings } = useSettingsStore()
  const { formatDual } = useCurrency()
  const [apartments, setApartments] = useState<Apartment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchApartments()
  }, [statusFilter, categoryFilter, page])

  const fetchApartments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", page.toString())
      params.set("limit", "10")

      if (search) params.set("search", search)
      if (statusFilter) params.set("status", statusFilter)
      if (categoryFilter) params.set("category", categoryFilter)

      const response = await fetch(`/api/apartments?${params.toString()}`)
      const data = await response.json()

      setApartments(data.apartments || [])
      setTotalPages(data.pagination?.totalPages || 1)
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

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este departamento?")) return

    try {
      const response = await fetch(`/api/apartments/${id}`, { method: "DELETE" })
      if (response.ok) {
        fetchApartments()
      } else {
        alert("Error al eliminar departamento")
      }
    } catch (error) {
      console.error("Error deleting apartment:", error)
      alert("Error al eliminar departamento")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Departamentos
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gestiona tus propiedades en alquiler
          </p>
        </div>
        <Link href="/admin/departamentos/nuevo">
          <Button leftIcon={<Plus className="h-4 w-4" />}>Nuevo Departamento</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre o ciudad..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={setStatusFilter}
              className="w-full md:w-48"
            />
            <Select
              options={categoryOptions}
              value={categoryFilter}
              onChange={setCategoryFilter}
              className="w-full md:w-48"
            />
            <Button type="submit">Buscar</Button>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="loader" />
            </div>
          ) : apartments.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Ciudad</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Precio/Noche</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apartments.map((apartment) => {
                    const primaryImage =
                      apartment.images.find((img) => img.isPrimary) ||
                      apartment.images[0]

                    return (
                      <TableRow key={apartment.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                              {primaryImage ? (
                                <img
                                  src={primaryImage.url}
                                  alt={apartment.name}
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                                  <Building2 className="h-6 w-6" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {apartment.name}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {apartment.rooms}{" "}
                                {apartment.rooms === 1 ? "habitación" : "habitaciones"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-300">
                          {apartment.city}
                        </TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-300">
                          {categoryLabels[apartment.category] || apartment.category}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              statusColors[apartment.status] ||
                              "bg-gray-100 text-gray-800"
                            }
                          >
                            {statusLabels[apartment.status] || apartment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-gray-900 dark:text-white">
                            {formatDual(apartment.pricePerNight)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/admin/departamentos/${apartment.id}`}>
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/admin/departamentos/${apartment.id}/editar`}>
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(apartment.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

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
          ) : (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No hay departamentos registrados
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Agrega tu primera propiedad en alquiler
              </p>
              <Link href="/admin/departamentos/nuevo">
                <Button leftIcon={<Plus className="h-4 w-4" />}>
                  Nuevo Departamento
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
