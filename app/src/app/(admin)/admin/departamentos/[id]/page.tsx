"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useSettingsStore } from "@/stores/settingsStore"
import { useCurrency } from "@/hooks/useCurrency"
import { Button, Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import {
  ArrowLeft,
  Edit,
  Trash2,
  BedDouble,
  Bath,
  Users,
  Building2,
  MapPin,
  Check,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface Apartment {
  id: string
  name: string
  description?: string
  address: string
  city: string
  country?: string
  rooms: number
  bathrooms: number
  maxGuests: number
  floor?: number
  category: string
  amenities?: string[]
  pricePerNight: number
  pricePerWeek?: number
  pricePerMonth?: number
  depositAmount: number
  commissionAmount?: number
  status: string
  isActive: boolean
  isFeatured: boolean
  images: { id: string; url: string; isPrimary: boolean }[]
  createdAt: string
}

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

export default function AdminApartmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { settings } = useSettingsStore()
  const { formatDual } = useCurrency()
  const [apartment, setApartment] = useState<Apartment | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentImage, setCurrentImage] = useState(0)

  useEffect(() => {
    if (params.id) {
      fetchApartment()
    }
  }, [params.id])

  const fetchApartment = async () => {
    try {
      const response = await fetch(`/api/apartments/${params.id}`)
      if (response.ok) {
        setApartment(await response.json())
      }
    } catch (error) {
      console.error("Error fetching apartment:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!apartment) return
    if (!confirm(`¿Eliminar "${apartment.name}"? Esta acción no se puede deshacer.`))
      return

    try {
      const response = await fetch(`/api/apartments/${apartment.id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        router.push("/admin/departamentos")
      } else {
        alert("Error al eliminar")
      }
    } catch (error) {
      alert("Error al eliminar")
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="loader" />
      </div>
    )
  }

  if (!apartment) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Departamento no encontrado
        </h2>
        <Link href="/admin/departamentos">
          <Button>Volver</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/departamentos">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {apartment.name}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {apartment.city}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/departamentos/${apartment.id}/editar`}>
            <Button variant="outline" leftIcon={<Edit className="h-4 w-4" />}>
              Editar
            </Button>
          </Link>
          <Button
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50"
            leftIcon={<Trash2 className="h-4 w-4" />}
            onClick={handleDelete}
          >
            Eliminar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Images + Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          <Card>
            <CardContent className="p-0">
              <div className="relative aspect-[16/9] bg-gray-100 dark:bg-gray-700 rounded-t-xl overflow-hidden">
                {apartment.images.length > 0 ? (
                  <img
                    src={apartment.images[currentImage]?.url}
                    alt={apartment.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <Building2 className="h-24 w-24" />
                  </div>
                )}
              </div>
              {apartment.images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {apartment.images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setCurrentImage(i)}
                      className={`relative w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 ${
                        i === currentImage ? "border-primary" : "border-transparent"
                      }`}
                    >
                      <img
                        src={img.url}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <BedDouble className="h-5 w-5 mx-auto mb-1 text-gray-500" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Habitaciones</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {apartment.rooms}
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Bath className="h-5 w-5 mx-auto mb-1 text-gray-500" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Baños</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {apartment.bathrooms}
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Users className="h-5 w-5 mx-auto mb-1 text-gray-500" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Huéspedes</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {apartment.maxGuests}
                  </p>
                </div>
              </div>

              {apartment.description && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Descripción
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {apartment.description}
                  </p>
                </div>
              )}

              {apartment.amenities && apartment.amenities.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Amenidades
                  </h3>
                  <div className="grid grid-cols-2 gap-1">
                    {apartment.amenities.map((a, i) => (
                      <div key={i} className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <Check className="h-3 w-3 text-green-500" />
                        {a}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Estado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Estado</span>
                <Badge className={statusColors[apartment.status] || ""}>
                  {statusLabels[apartment.status] || apartment.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Tipo</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {categoryLabels[apartment.category] || apartment.category}
                </span>
              </div>
              {apartment.floor !== undefined && apartment.floor !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Piso</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {apartment.floor}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Destacado</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {apartment.isFeatured ? "Sí" : "No"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Precios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Por noche</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatDual(apartment.pricePerNight)}
                </span>
              </div>
              {apartment.pricePerWeek && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Por semana</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDual(apartment.pricePerWeek)}
                  </span>
                </div>
              )}
              {apartment.pricePerMonth && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Por mes</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDual(apartment.pricePerMonth)}
                  </span>
                </div>
              )}
              {apartment.depositAmount > 0 && (
                <div className="flex items-center justify-between border-t dark:border-gray-700 pt-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Depósito</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDual(apartment.depositAmount)}
                  </span>
                </div>
              )}
              {apartment.commissionAmount && apartment.commissionAmount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Comisión</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDual(apartment.commissionAmount)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
