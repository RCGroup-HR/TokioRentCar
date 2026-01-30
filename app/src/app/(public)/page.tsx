"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSettingsStore } from "@/stores/settingsStore"
import { SearchForm, VehicleCard } from "@/components/public"
import { Button } from "@/components/ui"
import {
  Car,
  Shield,
  Clock,
  MapPin,
  Star,
  ChevronRight,
  CheckCircle,
} from "lucide-react"

interface Vehicle {
  id: string
  brand: string
  model: string
  year: number
  category: string
  transmission: string
  fuelType: string
  seats: number
  airConditioning: boolean
  dailyRate: number
  images: { id: string; url: string; isPrimary: boolean }[]
  isFeatured: boolean
  status: string
}

export default function HomePage() {
  const { settings } = useSettingsStore()
  const [featuredVehicles, setFeaturedVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/vehicles?featured=true&available=true&limit=6")
      .then((res) => res.json())
      .then((data) => {
        setFeaturedVehicles(data.vehicles || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const features = [
    {
      icon: Car,
      title: "Amplia Flota",
      description: "Vehículos para todas las necesidades y presupuestos",
    },
    {
      icon: Shield,
      title: "Seguro Incluido",
      description: "Todos nuestros vehículos cuentan con seguro completo",
    },
    {
      icon: Clock,
      title: "Disponibilidad 24/7",
      description: "Servicio disponible las 24 horas, los 7 días",
    },
    {
      icon: MapPin,
      title: "Entrega Flexible",
      description: "Recoge y devuelve en múltiples ubicaciones",
    },
  ]

  return (
    <div>
      {/* Hero Section */}
      <section
        className="relative min-h-[600px] flex items-center"
        style={{
          background: `linear-gradient(135deg, ${settings.secondaryColor} 0%, ${settings.accentColor} 100%)`,
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl text-white mb-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 animate-fade-in">
              Renta el Vehículo Perfecto para tu Aventura
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-8 animate-fade-in">
              {settings.slogan || "Descubre nuestra flota de vehículos y reserva de forma rápida y segura"}
            </p>
            <div className="flex flex-wrap gap-4 animate-fade-in">
              <Link href="/vehiculos">
                <Button size="lg" rightIcon={<ChevronRight className="h-5 w-5" />}>
                  Ver Vehículos
                </Button>
              </Link>
              {settings.whatsapp && (
                <a
                  href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="lg" className="bg-white/10 border-white text-white hover:bg-white hover:text-gray-900">
                    Contactar por WhatsApp
                  </Button>
                </a>
              )}
            </div>
          </div>

          {/* Search Form */}
          <div className="mt-8">
            <SearchForm />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ¿Por qué elegirnos?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Ofrecemos el mejor servicio de renta de vehículos con los precios más competitivos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition text-center"
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${settings.primaryColor}20` }}
                >
                  <feature.icon
                    className="h-7 w-7"
                    style={{ color: settings.primaryColor }}
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Vehicles Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Vehículos Destacados
              </h2>
              <p className="text-gray-600">
                Nuestros vehículos más populares
              </p>
            </div>
            <Link href="/vehiculos">
              <Button variant="outline" rightIcon={<ChevronRight className="h-4 w-4" />}>
                Ver Todos
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="loader" />
            </div>
          ) : featuredVehicles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredVehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Car className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p>No hay vehículos destacados disponibles</p>
            </div>
          )}
        </div>
      </section>

      {/* How it Works Section */}
      <section
        className="py-16"
        style={{ backgroundColor: `${settings.primaryColor}10` }}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ¿Cómo Funciona?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Rentar un vehículo nunca fue tan fácil
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "1",
                title: "Elige tu Vehículo",
                description: "Explora nuestra flota y selecciona el vehículo ideal para ti",
              },
              {
                step: "2",
                title: "Reserva en Línea",
                description: "Completa tu reservación con tus fechas y datos de contacto",
              },
              {
                step: "3",
                title: "Recoge y Disfruta",
                description: "Recoge tu vehículo en la ubicación elegida y comienza tu viaje",
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="py-16 text-white"
        style={{ backgroundColor: settings.secondaryColor }}
      >
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Listo para tu próxima aventura?
          </h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Reserva ahora y obtén las mejores tarifas. Contamos con una amplia flota de vehículos para todas tus necesidades.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/vehiculos">
              <Button size="lg" rightIcon={<Car className="h-5 w-5" />}>
                Reservar Ahora
              </Button>
            </Link>
            <Link href="/contacto">
              <Button
                variant="outline"
                size="lg"
                className="bg-transparent border-white text-white hover:bg-white hover:text-gray-900"
              >
                Contáctanos
              </Button>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" style={{ color: settings.primaryColor }} />
              <span>Sin cargos ocultos</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" style={{ color: settings.primaryColor }} />
              <span>Cancelación gratuita</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" style={{ color: settings.primaryColor }} />
              <span>Soporte 24/7</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
