"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useSettingsStore } from "@/stores/settingsStore"
import { Button, Card, CardContent } from "@/components/ui"
import { CheckCircle, Car, Phone } from "lucide-react"

function ReservationSuccessContent() {
  const searchParams = useSearchParams()
  const { settings } = useSettingsStore()

  const reservationCode = searchParams.get("code")

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-lg mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ backgroundColor: `${settings.primaryColor}20` }}
              >
                <CheckCircle
                  className="h-12 w-12"
                  style={{ color: settings.primaryColor }}
                />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Reservación Exitosa!
              </h1>
              <p className="text-gray-600 mb-6">
                Tu reservación ha sido registrada correctamente
              </p>

              {reservationCode && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-500 mb-1">
                    Código de reservación
                  </p>
                  <p
                    className="text-2xl font-bold"
                    style={{ color: settings.primaryColor }}
                  >
                    {reservationCode}
                  </p>
                </div>
              )}

              <div className="text-left bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Próximos pasos:
                </h3>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li>
                    1. Recibirás un correo de confirmación con los detalles
                  </li>
                  <li>2. Nuestro equipo te contactará para confirmar la reservación</li>
                  <li>
                    3. Presenta tu identificación y licencia de conducir al recoger el vehículo
                  </li>
                </ul>
              </div>

              <div className="space-y-4 mb-8">
                <p className="text-gray-600 text-sm">
                  ¿Tienes preguntas? Contáctanos:
                </p>
                <div className="flex justify-center gap-4">
                  {settings.phone && (
                    <a
                      href={`tel:${settings.phone}`}
                      className="flex items-center gap-2 text-gray-600 hover:text-primary"
                    >
                      <Phone className="h-4 w-4" />
                      {settings.phone}
                    </a>
                  )}
                  {settings.whatsapp && (
                    <a
                      href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Link href="/vehiculos">
                  <Button className="w-full" leftIcon={<Car className="h-4 w-4" />}>
                    Ver más vehículos
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full">
                    Volver al inicio
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
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

export default function ReservationSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ReservationSuccessContent />
    </Suspense>
  )
}
