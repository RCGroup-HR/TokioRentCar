"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useSettingsStore } from "@/stores/settingsStore"
import { Button, Input, Badge, Card, CardContent } from "@/components/ui"
import {
  ArrowLeft,
  BedDouble,
  Bath,
  Users,
  Star,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Building2,
  Check,
  MapPin,
} from "lucide-react"
import { formatCurrency, calculateDaysBetween } from "@/lib/utils"

interface ApartmentImage {
  id: string
  url: string
  alt?: string
  isPrimary: boolean
}

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
  status: string
  images: ApartmentImage[]
  isFeatured: boolean
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

export default function ApartmentDetailPage() {
  const params = useParams()
  const { settings } = useSettingsStore()

  const [apartment, setApartment] = useState<Apartment | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const [checkIn, setCheckIn] = useState("")
  const [checkOut, setCheckOut] = useState("")
  const [guestName, setGuestName] = useState("")
  const [guestEmail, setGuestEmail] = useState("")
  const [guestPhone, setGuestPhone] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const today = new Date().toISOString().split("T")[0]

  useEffect(() => {
    if (params.id) {
      fetchApartment()
    }
  }, [params.id])

  const fetchApartment = async () => {
    try {
      const response = await fetch(`/api/apartments/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setApartment(data)
      }
    } catch (error) {
      console.error("Error fetching apartment:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTotal = () => {
    if (!apartment || !checkIn || !checkOut) return null

    const start = new Date(checkIn)
    const end = new Date(checkOut)
    const nights = calculateDaysBetween(start, end)
    if (nights <= 0) return null

    const subtotal = nights * apartment.pricePerNight
    const taxes = settings.applyTax ? subtotal * (settings.taxRate / 100) : 0
    const total = subtotal + taxes

    return { nights, subtotal, taxes, total }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!apartment) return

    setSubmitting(true)
    try {
      // Send inquiry via WhatsApp
      const message = encodeURIComponent(
        `Hola, estoy interesado en el departamento *${apartment.name}*.\n\n` +
          `📅 Check-in: ${checkIn}\n` +
          `📅 Check-out: ${checkOut}\n` +
          `👤 Nombre: ${guestName}\n` +
          `📧 Email: ${guestEmail}\n` +
          `📞 Teléfono: ${guestPhone}`
      )

      const whatsapp = settings.whatsapp || settings.phone || ""
      const phone = whatsapp.replace(/\D/g, "")

      if (phone) {
        window.open(`https://wa.me/${phone}?text=${message}`, "_blank")
      } else {
        alert("Reservación enviada. Nos pondremos en contacto contigo pronto.")
      }
      setSent(true)
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

  if (!apartment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Departamento no encontrado</h1>
          <Link href="/departamentos">
            <Button>Ver todos los departamentos</Button>
          </Link>
        </div>
      </div>
    )
  }

  const isAvailable = apartment.status === "AVAILABLE"

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <Link
          href="/departamentos"
          className="inline-flex items-center gap-2 text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white mb-6 font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a departamentos
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm">
              <div className="relative aspect-[16/9]">
                {apartment.images.length > 0 ? (
                  <img
                    src={apartment.images[currentImageIndex]?.url}
                    alt={apartment.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-400">
                    <Building2 className="h-24 w-24" />
                  </div>
                )}

                {apartment.images.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setCurrentImageIndex(
                          currentImageIndex === 0
                            ? apartment.images.length - 1
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
                          currentImageIndex === apartment.images.length - 1
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

                {apartment.isFeatured && (
                  <div className="absolute top-4 left-4">
                    <Badge variant="warning" className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      Destacado
                    </Badge>
                  </div>
                )}
              </div>

              {apartment.images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {apartment.images.map((image, index) => (
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

            {/* Apartment Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                  <div>
                    <Badge variant="secondary" className="mb-2">
                      {categoryLabels[apartment.category] || apartment.category}
                    </Badge>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                      {apartment.name}
                    </h1>
                    <p className="flex items-center gap-1 text-gray-600 dark:text-gray-400 mt-1">
                      <MapPin className="h-4 w-4" />
                      {apartment.city}
                      {apartment.country ? `, ${apartment.country}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Desde</p>
                    <p
                      className="text-3xl font-bold"
                      style={{ color: settings.primaryColor }}
                    >
                      {formatCurrency(
                        apartment.pricePerNight,
                        settings.currency,
                        settings.currencySymbol
                      )}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">/ noche</p>
                  </div>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-3 gap-4 py-6 border-y border-gray-200 dark:border-gray-700">
                  <div className="text-center">
                    <BedDouble className="h-6 w-6 mx-auto mb-2 text-gray-600 dark:text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Habitaciones</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {apartment.rooms}
                    </p>
                  </div>
                  <div className="text-center">
                    <Bath className="h-6 w-6 mx-auto mb-2 text-gray-600 dark:text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Baños</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {apartment.bathrooms}
                    </p>
                  </div>
                  <div className="text-center">
                    <Users className="h-6 w-6 mx-auto mb-2 text-gray-600 dark:text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Huéspedes</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {apartment.maxGuests}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {apartment.description && (
                  <div className="mt-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Descripción
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {apartment.description}
                    </p>
                  </div>
                )}

                {/* Amenities */}
                {apartment.amenities && apartment.amenities.length > 0 && (
                  <div className="mt-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Amenidades
                    </h2>
                    <div className="grid grid-cols-2 gap-2">
                      {apartment.amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Check
                            className="h-4 w-4 flex-shrink-0"
                            style={{ color: settings.primaryColor }}
                          />
                          <span className="text-gray-700 dark:text-gray-300 text-sm">
                            {amenity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pricing */}
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Por noche</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(
                        apartment.pricePerNight,
                        settings.currency,
                        settings.currencySymbol
                      )}
                    </p>
                  </div>
                  {apartment.pricePerWeek && (
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Por semana</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatCurrency(
                          apartment.pricePerWeek,
                          settings.currency,
                          settings.currencySymbol
                        )}
                      </p>
                    </div>
                  )}
                  {apartment.pricePerMonth && (
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Por mes</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatCurrency(
                          apartment.pricePerMonth,
                          settings.currency,
                          settings.currencySymbol
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Booking Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Consultar Disponibilidad
                </h2>

                {!isAvailable ? (
                  <div className="text-center py-8">
                    <Badge variant="danger" className="mb-4">
                      No Disponible
                    </Badge>
                    <p className="text-gray-600 dark:text-gray-400">
                      Este departamento no está disponible actualmente
                    </p>
                  </div>
                ) : sent ? (
                  <div className="text-center py-8">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{ backgroundColor: settings.primaryColor + "20" }}
                    >
                      <Check className="h-8 w-8" style={{ color: settings.primaryColor }} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      ¡Consulta enviada!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Nos pondremos en contacto contigo pronto.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                      type="date"
                      label="Check-in"
                      value={checkIn}
                      onChange={(e) => {
                        setCheckIn(e.target.value)
                        if (checkOut && e.target.value > checkOut) {
                          setCheckOut(e.target.value)
                        }
                      }}
                      min={today}
                      required
                      leftIcon={<Calendar className="h-4 w-4" />}
                    />

                    <Input
                      type="date"
                      label="Check-out"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      min={checkIn || today}
                      required
                      leftIcon={<Calendar className="h-4 w-4" />}
                    />

                    <hr className="dark:border-gray-700" />

                    <Input
                      label="Nombre completo"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      required
                    />

                    <Input
                      type="email"
                      label="Correo electrónico"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      required
                    />

                    <Input
                      type="tel"
                      label="Teléfono"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      required
                    />

                    {/* Price Summary */}
                    {calculation && (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                          <span>
                            {formatCurrency(
                              apartment.pricePerNight,
                              settings.currency,
                              settings.currencySymbol
                            )}{" "}
                            x {calculation.nights} noches
                          </span>
                          <span>
                            {formatCurrency(
                              calculation.subtotal,
                              settings.currency,
                              settings.currencySymbol
                            )}
                          </span>
                        </div>
                        {settings.applyTax && (
                          <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                            <span>ITBIS ({settings.taxRate}%)</span>
                            <span>
                              {formatCurrency(
                                calculation.taxes,
                                settings.currency,
                                settings.currencySymbol
                              )}
                            </span>
                          </div>
                        )}
                        <hr className="dark:border-gray-600" />
                        <div className="flex justify-between font-bold text-gray-900 dark:text-white">
                          <span>Total estimado</span>
                          <span style={{ color: settings.primaryColor }}>
                            {formatCurrency(
                              calculation.total,
                              settings.currency,
                              settings.currencySymbol
                            )}
                          </span>
                        </div>
                        {apartment.depositAmount > 0 && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            + Depósito de{" "}
                            {formatCurrency(
                              apartment.depositAmount,
                              settings.currency,
                              settings.currencySymbol
                            )}{" "}
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
                      Consultar Disponibilidad
                    </Button>

                    <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                      Te contactaremos vía WhatsApp para confirmar tu reservación
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
