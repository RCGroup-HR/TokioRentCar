"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui"
import { useSettingsStore } from "@/stores/settingsStore"
import {
  formatCurrency,
  getVehicleCategoryLabel,
  getStatusLabel,
  getStatusColor,
} from "@/lib/utils"
import {
  ArrowLeft,
  Edit,
  Trash2,
  Car,
  Fuel,
  Settings,
  Users,
  Palette,
  Calendar,
  Gauge,
  Upload,
  X,
  Star,
  ImageIcon,
} from "lucide-react"

interface VehicleImage {
  id: string
  url: string
  alt: string
  isPrimary: boolean
  order: number
}

interface Vehicle {
  id: string
  brand: string
  model: string
  year: number
  licensePlate: string
  vin: string | null
  color: string | null
  category: string
  transmission: string
  fuelType: string
  seats: number
  doors: number
  airConditioning: boolean
  dailyRate: number
  weeklyRate: number | null
  monthlyRate: number | null
  depositAmount: number
  status: string
  mileage: number
  description: string | null
  features: string[]
  isFeatured: boolean
  isActive: boolean
  images: VehicleImage[]
}

export default function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { settings } = useSettingsStore()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    fetchVehicle()
  }, [id])

  const fetchVehicle = async () => {
    try {
      const res = await fetch(`/api/vehicles/${id}`)
      if (res.ok) {
        const data = await res.json()
        setVehicle(data)
      } else {
        router.push("/admin/vehiculos")
      }
    } catch (error) {
      console.error("Error fetching vehicle:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("folder", "vehicles")

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (uploadRes.ok) {
          const { url } = await uploadRes.json()

          await fetch(`/api/vehicles/${id}/images`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url,
              isPrimary: vehicle?.images.length === 0,
            }),
          })
        }
      }
      fetchVehicle()
    } catch (error) {
      console.error("Error uploading images:", error)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm("¿Eliminar esta imagen?")) return

    try {
      const res = await fetch(`/api/vehicles/${id}/images?imageId=${imageId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        fetchVehicle()
      }
    } catch (error) {
      console.error("Error deleting image:", error)
    }
  }

  const handleSetPrimary = async (imageId: string) => {
    try {
      await fetch(`/api/vehicles/${id}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId, setPrimary: true }),
      })
      fetchVehicle()
    } catch (error) {
      console.error("Error setting primary image:", error)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        fetchVehicle()
      }
    } catch (error) {
      console.error("Error updating status:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="loader" />
      </div>
    )
  }

  if (!vehicle) {
    return null
  }

  const primaryImage =
    vehicle.images.find((img) => img.isPrimary) || vehicle.images[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/vehiculos">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {vehicle.brand} {vehicle.model} {vehicle.year}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">Placa: {vehicle.licensePlate}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/vehiculos/${id}/editar`}>
            <Button variant="outline" leftIcon={<Edit className="h-4 w-4" />}>
              Editar
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Images */}
        <div className="lg:col-span-2 space-y-4">
          {/* Main Image */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="relative aspect-video bg-gray-100 dark:bg-gray-700">
              {primaryImage ? (
                <Image
                  src={selectedImage || primaryImage.url}
                  alt={vehicle.brand}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Car className="h-24 w-24 text-gray-300" />
                </div>
              )}
            </div>
          </div>

          {/* Image Gallery */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold dark:text-white">Galería de Imágenes</h3>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-50 cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {uploading ? (
                    <div className="loader-sm" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {uploading ? "Subiendo..." : "Subir Fotos"}
                </span>
              </label>
            </div>

            {vehicle.images.length > 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {vehicle.images.map((image) => (
                  <div
                    key={image.id}
                    className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer group ${
                      (selectedImage || primaryImage?.url) === image.url
                        ? "ring-2 ring-amber-500"
                        : ""
                    }`}
                    onClick={() => setSelectedImage(image.url)}
                  >
                    <Image
                      src={image.url}
                      alt={image.alt}
                      fill
                      className="object-cover"
                    />
                    {image.isPrimary && (
                      <div className="absolute top-1 left-1 bg-amber-500 text-white text-xs px-1 rounded">
                        <Star className="h-3 w-3" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      {!image.isPrimary && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSetPrimary(image.id)
                          }}
                          className="p-1 bg-white rounded text-amber-600 hover:bg-amber-50"
                          title="Establecer como principal"
                        >
                          <Star className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteImage(image.id)
                        }}
                        className="p-1 bg-white rounded text-red-600 hover:bg-red-50"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p>No hay imágenes</p>
                <p className="text-sm">Sube fotos del vehículo</p>
              </div>
            )}
          </div>

          {/* Description */}
          {vehicle.description && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <h3 className="font-semibold mb-2 dark:text-white">Descripción</h3>
              <p className="text-gray-600 dark:text-gray-300">{vehicle.description}</p>
            </div>
          )}

          {/* Features */}
          {vehicle.features && vehicle.features.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <h3 className="font-semibold mb-3 dark:text-white">Características</h3>
              <div className="flex flex-wrap gap-2">
                {vehicle.features.map((feature, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm dark:text-gray-300"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Info */}
        <div className="space-y-4">
          {/* Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <h3 className="font-semibold mb-3 dark:text-white">Estado del Vehículo</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Estado actual:</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    vehicle.status
                  )}`}
                >
                  {getStatusLabel(vehicle.status)}
                </span>
              </div>
              <select
                value={vehicle.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="AVAILABLE">Disponible</option>
                <option value="RENTED">Rentado</option>
                <option value="MAINTENANCE">En Mantenimiento</option>
                <option value="RESERVED">Reservado</option>
                <option value="OUT_OF_SERVICE">Fuera de Servicio</option>
              </select>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <h3 className="font-semibold mb-3 dark:text-white">Precios</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Por día:</span>
                <span className="font-semibold text-amber-600">
                  {formatCurrency(
                    vehicle.dailyRate,
                    settings.currency,
                    settings.currencySymbol
                  )}
                </span>
              </div>
              {vehicle.weeklyRate && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Por semana:</span>
                  <span className="font-medium dark:text-gray-300">
                    {formatCurrency(
                      vehicle.weeklyRate,
                      settings.currency,
                      settings.currencySymbol
                    )}
                  </span>
                </div>
              )}
              {vehicle.monthlyRate && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Por mes:</span>
                  <span className="font-medium dark:text-gray-300">
                    {formatCurrency(
                      vehicle.monthlyRate,
                      settings.currency,
                      settings.currencySymbol
                    )}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Depósito:</span>
                <span className="font-medium dark:text-gray-300">
                  {formatCurrency(
                    vehicle.depositAmount,
                    settings.currency,
                    settings.currencySymbol
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <h3 className="font-semibold mb-3 dark:text-white">Especificaciones</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Car className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Categoría</p>
                  <p className="font-medium dark:text-white">
                    {getVehicleCategoryLabel(vehicle.category)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Settings className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Transmisión</p>
                  <p className="font-medium dark:text-white">
                    {vehicle.transmission === "AUTOMATIC"
                      ? "Automática"
                      : "Manual"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Fuel className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Combustible</p>
                  <p className="font-medium dark:text-white">
                    {vehicle.fuelType === "GASOLINE"
                      ? "Gasolina"
                      : vehicle.fuelType === "DIESEL"
                      ? "Diésel"
                      : vehicle.fuelType === "ELECTRIC"
                      ? "Eléctrico"
                      : "Híbrido"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Capacidad</p>
                  <p className="font-medium dark:text-white">
                    {vehicle.seats} pasajeros, {vehicle.doors} puertas
                  </p>
                </div>
              </div>
              {vehicle.color && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <Palette className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Color</p>
                    <p className="font-medium dark:text-white">{vehicle.color}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Gauge className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Kilometraje</p>
                  <p className="font-medium dark:text-white">
                    {vehicle.mileage.toLocaleString()} km
                  </p>
                </div>
              </div>
              {vehicle.vin && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">VIN</p>
                    <p className="font-medium font-mono text-xs dark:text-white">{vehicle.vin}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <h3 className="font-semibold mb-3 dark:text-white">Acciones Rápidas</h3>
            <div className="space-y-2">
              <Link href={`/admin/rentas/nueva?vehicleId=${vehicle.id}`}>
                <Button variant="outline" className="w-full justify-start">
                  Crear Renta
                </Button>
              </Link>
              <Link href={`/admin/gastos?vehicleId=${vehicle.id}`}>
                <Button variant="outline" className="w-full justify-start">
                  Ver Gastos
                </Button>
              </Link>
              <Link href={`/admin/reportes?vehicleId=${vehicle.id}`}>
                <Button variant="outline" className="w-full justify-start">
                  Ver Reportes
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
