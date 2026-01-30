"use client"

import { useEffect, useState } from "react"
import { useSettingsStore } from "@/stores/settingsStore"
import { Button } from "@/components/ui"
import {
  MapPin,
  Clock,
  Phone,
  Navigation,
  ExternalLink,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"

interface Location {
  id: string
  name: string
  address: string
  city: string
  latitude: number | null
  longitude: number | null
  googleMapsUrl: string | null
  instructions: string | null
  businessHours: string | null
  extraCharge: number
  isDefault: boolean
  isActive: boolean
}

export default function UbicacionesPage() {
  const { settings } = useSettingsStore()
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/locations")
      .then((res) => res.json())
      .then((data) => {
        setLocations(data || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section
        className="py-16 text-white"
        style={{
          background: `linear-gradient(135deg, ${settings.secondaryColor} 0%, ${settings.accentColor} 100%)`,
        }}
      >
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Nuestras Ubicaciones
          </h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            Encuentra la ubicación más cercana para recoger o entregar tu vehículo
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="loader" />
            </div>
          ) : locations.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg">
                No hay ubicaciones disponibles en este momento
              </p>
            </div>
          ) : (
            <>
              {/* Locations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {locations.map((location) => (
                  <div
                    key={location.id}
                    className={`bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition ${
                      location.isDefault ? "ring-2" : ""
                    }`}
                    style={{
                      borderColor: location.isDefault
                        ? settings.primaryColor
                        : undefined,
                      ...(location.isDefault && {
                        ringColor: settings.primaryColor,
                      }),
                    }}
                  >
                    {/* Map placeholder */}
                    <div className="h-48 bg-gray-200 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <MapPin className="h-12 w-12 text-gray-400" />
                      </div>
                      {location.isDefault && (
                        <div
                          className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: settings.primaryColor }}
                        >
                          Principal
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {location.name}
                      </h3>

                      <div className="space-y-3 text-gray-600">
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" />
                          <div>
                            <p>{location.address}</p>
                            <p className="text-sm text-gray-500">{location.city}</p>
                          </div>
                        </div>

                        {location.businessHours && (
                          <div className="flex items-start gap-3">
                            <Clock className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <p>{location.businessHours}</p>
                          </div>
                        )}

                        {location.instructions && (
                          <div className="flex items-start gap-3">
                            <Navigation className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <p className="text-sm">{location.instructions}</p>
                          </div>
                        )}

                        {location.extraCharge > 0 && (
                          <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                            <p className="text-sm text-yellow-800">
                              Cargo adicional: {settings.currencySymbol || "RD$"}
                              {location.extraCharge.toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-6 flex gap-3">
                        {location.googleMapsUrl && (
                          <a
                            href={location.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1"
                          >
                            <Button
                              variant="outline"
                              className="w-full"
                              rightIcon={<ExternalLink className="h-4 w-4" />}
                            >
                              Ver en Mapa
                            </Button>
                          </a>
                        )}
                        <Link href="/vehiculos" className="flex-1">
                          <Button
                            className="w-full"
                            rightIcon={<ChevronRight className="h-4 w-4" />}
                          >
                            Reservar
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Additional Info */}
              <div className="mt-16 bg-white rounded-xl shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  Información Importante
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{ backgroundColor: `${settings.primaryColor}20` }}
                    >
                      <Clock
                        className="h-7 w-7"
                        style={{ color: settings.primaryColor }}
                      />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Horarios Flexibles
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Recogida y entrega en horarios adaptados a tus necesidades
                    </p>
                  </div>
                  <div className="text-center">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{ backgroundColor: `${settings.primaryColor}20` }}
                    >
                      <Navigation
                        className="h-7 w-7"
                        style={{ color: settings.primaryColor }}
                      />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Entrega a Domicilio
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Servicio de entrega y recogida donde lo necesites
                    </p>
                  </div>
                  <div className="text-center">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{ backgroundColor: `${settings.primaryColor}20` }}
                    >
                      <Phone
                        className="h-7 w-7"
                        style={{ color: settings.primaryColor }}
                      />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Soporte 24/7
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Asistencia disponible las 24 horas del día
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ¿Necesitas más información?
          </h2>
          <p className="text-gray-600 mb-6">
            Contáctanos y te ayudaremos a encontrar la mejor opción para ti
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/contacto">
              <Button variant="outline">Contáctanos</Button>
            </Link>
            <Link href="/vehiculos">
              <Button rightIcon={<ChevronRight className="h-4 w-4" />}>
                Ver Vehículos
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
