"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSettingsStore } from "@/stores/settingsStore"
import { Card, CardContent, Badge, Button } from "@/components/ui"
import {
  Calendar,
  Car,
  MapPin,
  Clock,
  ArrowLeft,
  AlertCircle,
} from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

interface Reservation {
  id: string
  reservationCode: string
  startDate: string
  endDate: string
  pickupLocation: string
  dropoffLocation: string
  totalAmount: number
  status: string
  createdAt: string
  vehicle: {
    id: string
    brand: string
    model: string
    year: number
    images: { url: string; isPrimary: boolean }[]
  }
}

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  COMPLETED: "Completada",
  NO_SHOW: "No Presentado",
}

const statusColors: Record<string, "warning" | "success" | "danger" | "secondary"> = {
  PENDING: "warning",
  CONFIRMED: "success",
  CANCELLED: "danger",
  COMPLETED: "secondary",
  NO_SHOW: "danger",
}

export default function MisReservacionesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { settings } = useSettingsStore()

  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/mis-reservaciones")
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.email) {
      fetchReservations()
    }
  }, [session])

  const fetchReservations = async () => {
    try {
      const response = await fetch(`/api/reservations?email=${session?.user?.email}`)
      if (response.ok) {
        const data = await response.json()
        setReservations(Array.isArray(data) ? data : data.reservations || [])
      }
    } catch (error) {
      console.error("Error fetching reservations:", error)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader" />
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Mis Reservaciones
          </h1>
          <p className="text-gray-500 mt-1">
            Consulta el estado de tus reservaciones
          </p>
        </div>

        {/* Reservations List */}
        {reservations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No tienes reservaciones
              </h2>
              <p className="text-gray-500 mb-6">
                Explora nuestra flota y reserva tu vehiculo ideal
              </p>
              <Link href="/vehiculos">
                <Button>Ver Vehiculos</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reservations.map((reservation) => {
              const primaryImage = reservation.vehicle.images?.find(
                (img) => img.isPrimary
              ) || reservation.vehicle.images?.[0]

              return (
                <Card key={reservation.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      {/* Vehicle Image */}
                      <div className="relative w-full md:w-48 h-40 md:h-auto bg-gray-100 flex-shrink-0">
                        {primaryImage ? (
                          <img
                            src={primaryImage.url}
                            alt={`${reservation.vehicle.brand} ${reservation.vehicle.model}`}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                            <Car className="h-12 w-12" />
                          </div>
                        )}
                      </div>

                      {/* Reservation Details */}
                      <div className="flex-1 p-4 md:p-6">
                        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">
                              Codigo: <span className="font-mono font-semibold">{reservation.reservationCode}</span>
                            </p>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {reservation.vehicle.brand} {reservation.vehicle.model} {reservation.vehicle.year}
                            </h3>
                          </div>
                          <Badge variant={statusColors[reservation.status] || "secondary"}>
                            {statusLabels[reservation.status] || reservation.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-400">Recogida</p>
                              <p className="font-medium">{formatDate(reservation.startDate)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-400">Devolucion</p>
                              <p className="font-medium">{formatDate(reservation.endDate)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-400">Lugar</p>
                              <p className="font-medium">{reservation.pickupLocation}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400">Total</p>
                            <p
                              className="text-lg font-bold"
                              style={{ color: settings.primaryColor }}
                            >
                              {formatCurrency(
                                reservation.totalAmount,
                                settings.currency,
                                settings.currencySymbol
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
