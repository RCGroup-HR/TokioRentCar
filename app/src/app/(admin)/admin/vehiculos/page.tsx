"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSettingsStore } from "@/stores/settingsStore"
import { useLanguageStore } from "@/stores/languageStore"
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
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Car,
  MoreVertical,
} from "lucide-react"
import {
  getVehicleCategoryLabel,
  getStatusLabel,
  getStatusColor,
} from "@/lib/utils"

interface Vehicle {
  id: string
  brand: string
  model: string
  year: number
  licensePlate: string
  category: string
  status: string
  dailyRate: number
  mileage: number
  images: { id: string; url: string; isPrimary: boolean }[]
}

const statusOptions = [
  { value: "", label: "Todos los estados" },
  { value: "AVAILABLE", label: "Disponible" },
  { value: "RENTED", label: "Rentado" },
  { value: "MAINTENANCE", label: "Mantenimiento" },
  { value: "RESERVED", label: "Reservado" },
  { value: "OUT_OF_SERVICE", label: "Fuera de servicio" },
]

const categoryOptions = [
  { value: "", label: "Todas las categorías" },
  { value: "ECONOMY", label: "Económico" },
  { value: "COMPACT", label: "Compacto" },
  { value: "MIDSIZE", label: "Mediano" },
  { value: "SUV", label: "SUV" },
  { value: "LUXURY", label: "Lujo" },
  { value: "VAN", label: "Van" },
  { value: "PICKUP", label: "Pickup" },
]

export default function AdminVehiclesPage() {
  const { settings } = useSettingsStore()
  const { language, t } = useLanguageStore()
  const { formatDual } = useCurrency()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchVehicles()
  }, [statusFilter, categoryFilter, page])

  const fetchVehicles = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", page.toString())
      params.set("limit", "10")

      if (search) params.set("search", search)
      if (statusFilter) params.set("status", statusFilter)
      if (categoryFilter) params.set("category", categoryFilter)

      const response = await fetch(`/api/vehicles?${params.toString()}`)
      const data = await response.json()

      setVehicles(data.vehicles || [])
      setTotalPages(data.pagination?.totalPages || 1)
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

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este vehículo?")) {
      return
    }

    try {
      const response = await fetch(`/api/vehicles/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchVehicles()
      } else {
        alert("Error al eliminar vehículo")
      }
    } catch (error) {
      console.error("Error deleting vehicle:", error)
      alert("Error al eliminar vehículo")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("vehicles.title")}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {t("vehicles.subtitle")}
          </p>
        </div>
        <Link href="/admin/vehiculos/nuevo">
          <Button leftIcon={<Plus className="h-4 w-4" />}>
            {t("vehicles.addVehicle")}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por marca, modelo o placa..."
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
          ) : vehicles.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("vehicles.vehicle")}</TableHead>
                    <TableHead>{t("vehicles.licensePlate")}</TableHead>
                    <TableHead>{t("vehicles.category")}</TableHead>
                    <TableHead>{t("vehicles.status")}</TableHead>
                    <TableHead>{t("vehicles.dailyRate")}</TableHead>
                    <TableHead>{t("vehicles.mileage")}</TableHead>
                    <TableHead className="text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((vehicle) => {
                    const primaryImage =
                      vehicle.images.find((img) => img.isPrimary) ||
                      vehicle.images[0]

                    return (
                      <TableRow key={vehicle.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                              {primaryImage ? (
                                <img
                                  src={primaryImage.url}
                                  alt={`${vehicle.brand} ${vehicle.model}`}
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                                  <Car className="h-6 w-6" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {vehicle.brand} {vehicle.model}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {vehicle.year}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">
                            {vehicle.licensePlate}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getVehicleCategoryLabel(vehicle.category)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(vehicle.status)}>
                            {getStatusLabel(vehicle.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-gray-900 dark:text-white">
                            {formatDual(vehicle.dailyRate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {vehicle.mileage.toLocaleString()} km
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/admin/vehiculos/${vehicle.id}`}>
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/admin/vehiculos/${vehicle.id}/editar`}>
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(vehicle.id)}
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-gray-500">
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
              <Car className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t("vehicles.noVehicles")}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {t("vehicles.addFirstVehicle")}
              </p>
              <Link href="/admin/vehiculos/nuevo">
                <Button leftIcon={<Plus className="h-4 w-4" />}>
                  {t("vehicles.addVehicle")}
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
