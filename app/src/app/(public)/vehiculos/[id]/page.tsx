"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useSettingsStore } from "@/stores/settingsStore"
import { Button, Input, Badge, Card, CardContent } from "@/components/ui"
import {
  ArrowLeft,
  Users,
  Fuel,
  Cog,
  Snowflake,
  Check,
  Calendar,
  MapPin,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import {
  formatCurrency,
  getVehicleCategoryLabel,
  getTransmissionLabel,
  getFuelTypeLabel,
  calculateDaysBetween,
} from "@/lib/utils"

interface VehicleImage {
  id: string
  url: string
  alt?: string
  isPrimary: boolean
}

interface Vehicle {
  id: string
  brand: string
  model: string
  year: number
  category: string
  transmission: string
  fuelType: string
  seats: number
  doors: number
  airConditioning: boolean
  dailyRate: number
  weeklyRate?: number
  monthlyRate?: number
  depositAmount: number
  description?: string
  features?: string[]
  images: VehicleImage[]
  isFeatured: boolean
  status: string
  reservations?: {
    id: string
    startDate: string
    endDate: string
    status: string
  }[]
}

interface Location {
  id: string
  name: string
  address: string
}

export default function VehicleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { settings } = useSettingsStore()

  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Reservation form state
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [pickupLocation, setPickupLocation] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const today = new Date().toISOString().split("T")[0]

  useEffect(() => {
    if (params.id) {
      fetchVehicle()
      fetchLocations()
    }
  }, [params.id])

  const fetchVehicle = async () => {
    try {
      const response = await fetch(`/api/vehicles/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setVehicle(data)
      }
    } catch (error) {
      console.error("Error fetching vehicle:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLocations = async () => {
    try {
      const response = await fetch("/api/locations")
      if (response.ok) {
        const data = await response.json()
        setLocations(data)
        // Pre-select default location if available
        if (data.length > 0) {
          const defaultLocation = data.find((l: Location & { isDefault: boolean }) => l.isDefault)
          if (defaultLocation) {
            setPickupLocation(defaultLocation.name)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching locations:", error)
    }
  }

  const calculateTotal = () => {
    if (!vehicle || !startDate || !endDate) return null

    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = calculateDaysBetween(start, end)

    const subtotal = days * vehicle.dailyRate
    const taxes = settings.applyTax ? subtotal * (settings.taxRate / 100) : 0
    const total = subtotal + taxes

    return { days, subtotal, taxes, total }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vehicle) return

    setSubmitting(true)
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          startDate,
          endDate,
          pickupLocation,
          dropoffLocation: pickupLocation,
          customerFirstName: customerName.split(" ")[0],
          customerLastName: customerName.split(" ").slice(1).join(" "),
          customerEmail,
          customerPhone,
        }),
      })

      if (response.ok) {
        const reservation = await response.json()
        router.push(`/reservacion-exitosa?code=${reservation.reservationCode}`)
      } else {
        const error = await response.json()
        alert(error.error || "Error al crear reservación")
      }
    } catch (error) {
      console.error("Error creating reservation:", error)
      alert("Error al crear reservación")
    } finally {
      setSubmitting(false)
    }
  }

  const calculation = calculateTotal()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader" />
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Vehículo no encontrado</h1>
          <Link href="/vehiculos">
            <Button>Ver todos los vehículos</Button>
          </Link>
        </div>
      </div>
    )
  }

  const isAvailable = vehicle.status === "AVAILABLE"

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Back button */}
        <Link
          href="/vehiculos"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a vehículos
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              <div className="relative aspect-[16/9]">
                {vehicle.images.length > 0 ? (
                  <img
                    src={vehicle.images[currentImageIndex]?.url}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
                    <span>Sin imagen</span>
                  </div>
                )}

                {vehicle.images.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setCurrentImageIndex(
                          currentImageIndex === 0
                            ? vehicle.images.length - 1
                            : currentImageIndex - 1
                        )
                      }
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white transition"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() =>
                        setCurrentImageIndex(
                          currentImageIndex === vehicle.images.length - 1
                            ? 0
                            : currentImageIndex + 1
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white transition"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                {/* Featured badge */}
                {vehicle.isFeatured && (
                  <div className="absolute top-4 left-4">
                    <Badge variant="warning" className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      Destacado
                    </Badge>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {vehicle.images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {vehicle.images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 ${
                        index === currentImageIndex
                          ? "border-primary"
                          : "border-transparent"
                      }`}
                    >
                      <img
                        src={image.url}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Vehicle Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                  <div>
                    <Badge variant="secondary" className="mb-2">
                      {getVehicleCategoryLabel(vehicle.category)}
                    </Badge>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                      {vehicle.brand} {vehicle.model}
                    </h1>
                    <p className="text-gray-500">{vehicle.year}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Desde</p>
                    <p
                      className="text-3xl font-bold"
                      style={{ color: settings.primaryColor }}
                    >
                      {formatCurrency(vehicle.dailyRate, settings.currency, settings.currencySymbol)}
                    </p>
                    <p className="text-sm text-gray-500">/ día</p>
                  </div>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-gray-200">
                  <div className="text-center">
                    <Users className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">Pasajeros</p>
                    <p className="font-semibold">{vehicle.seats}</p>
                  </div>
                  <div className="text-center">
                    <Cog className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">Transmisión</p>
                    <p className="font-semibold">
                      {getTransmissionLabel(vehicle.transmission)}
                    </p>
                  </div>
                  <div className="text-center">
                    <Fuel className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">Combustible</p>
                    <p className="font-semibold">
                      {getFuelTypeLabel(vehicle.fuelType)}
                    </p>
                  </div>
                  <div className="text-center">
                    <Snowflake className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">Aire Acond.</p>
                    <p className="font-semibold">
                      {vehicle.airConditioning ? "Sí" : "No"}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {vehicle.description && (
                  <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-2">Descripción</h2>
                    <p className="text-gray-600">{vehicle.description}</p>
                  </div>
                )}

                {/* Features */}
                {vehicle.features && vehicle.features.length > 0 && (
                  <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-3">Características</h2>
                    <div className="grid grid-cols-2 gap-2">
                      {vehicle.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Check
                            className="h-4 w-4"
                            style={{ color: settings.primaryColor }}
                          />
                          <span className="text-gray-600">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prices */}
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Por día</p>
                    <p className="text-lg font-bold">
                      {formatCurrency(vehicle.dailyRate, settings.currency, settings.currencySymbol)}
                    </p>
                  </div>
                  {vehicle.weeklyRate && (
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Por semana</p>
                      <p className="text-lg font-bold">
                        {formatCurrency(vehicle.weeklyRate, settings.currency, settings.currencySymbol)}
                      </p>
                    </div>
                  )}
                  {vehicle.monthlyRate && (
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Por mes</p>
                      <p className="text-lg font-bold">
                        {formatCurrency(vehicle.monthlyRate, settings.currency, settings.currencySymbol)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Reservation Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-6">Reservar Vehículo</h2>

                {!isAvailable ? (
                  <div className="text-center py-8">
                    <Badge variant="danger" className="mb-4">
                      No Disponible
                    </Badge>
                    <p className="text-gray-500">
                      Este vehículo no está disponible actualmente
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                      type="date"
                      label="Fecha de recogida"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value)
                        if (endDate && e.target.value > endDate) {
                          setEndDate(e.target.value)
                        }
                      }}
                      min={today}
                      required
                      leftIcon={<Calendar className="h-4 w-4" />}
                    />

                    <Input
                      type="date"
                      label="Fecha de devolución"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || today}
                      required
                      leftIcon={<Calendar className="h-4 w-4" />}
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Lugar de recogida
                      </label>
                      <select
                        value={pickupLocation}
                        onChange={(e) => setPickupLocation(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                        required
                      >
                        <option value="">Seleccionar ubicación</option>
                        {locations.map((location) => (
                          <option key={location.id} value={location.name}>
                            {location.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <hr className="my-4" />

                    <Input
                      label="Nombre completo"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                    />

                    <Input
                      type="email"
                      label="Correo electrónico"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      required
                    />

                    <Input
                      type="tel"
                      label="Teléfono"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      required
                    />

                    {/* Price Summary */}
                    {calculation && (
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>
                            {formatCurrency(vehicle.dailyRate, settings.currency, settings.currencySymbol)} x{" "}
                            {calculation.days} días
                          </span>
                          <span>
                            {formatCurrency(calculation.subtotal, settings.currency, settings.currencySymbol)}
                          </span>
                        </div>
                        {settings.applyTax && (
                          <div className="flex justify-between text-sm">
                            <span>ITBIS ({settings.taxRate}%)</span>
                            <span>
                              {formatCurrency(calculation.taxes, settings.currency, settings.currencySymbol)}
                            </span>
                          </div>
                        )}
                        <hr />
                        <div className="flex justify-between font-bold">
                          <span>Total</span>
                          <span style={{ color: settings.primaryColor }}>
                            {formatCurrency(calculation.total, settings.currency, settings.currencySymbol)}
                          </span>
                        </div>
                        {vehicle.depositAmount > 0 && (
                          <p className="text-xs text-gray-500">
                            + Depósito de{" "}
                            {formatCurrency(vehicle.depositAmount, settings.currency, settings.currencySymbol)}{" "}
                            (reembolsable)
                          </p>
                        )}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      isLoading={submitting}
                    >
                      Reservar Ahora
                    </Button>

                    <p className="text-xs text-gray-500 text-center">
                      Al reservar, aceptas nuestros términos y condiciones
                    </p>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
