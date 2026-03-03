"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSettingsStore } from "@/stores/settingsStore"
import { SearchForm, VehicleCard, ApartmentCard } from "@/components/public"
import { Button } from "@/components/ui"
import {
  Car,
  Shield,
  Clock,
  MapPin,
  ChevronRight,
  CheckCircle,
  Bike,
  Building2,
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

interface Apartment {
  id: string
  name: string
  city: string
  rooms: number
  bathrooms: number
  maxGuests: number
  category: string
  pricePerNight: number
  images: { id: string; url: string; isPrimary: boolean }[]
  isFeatured: boolean
  status: string
}

export default function HomePage() {
  const { settings } = useSettingsStore()
  const [featuredVehicles, setFeaturedVehicles] = useState<Vehicle[]>([])
  const [allMotores, setAllMotores] = useState<Vehicle[]>([])
  const [allApartments, setAllApartments] = useState<Apartment[]>([])
  const [loadingVehicles, setLoadingVehicles] = useState(true)
  const [loadingMotores, setLoadingMotores] = useState(true)
  const [loadingApartments, setLoadingApartments] = useState(true)

  useEffect(() => {
    // Vehículos destacados
    fetch("/api/vehicles?featured=true&available=true&limit=6&vehicleType=CAR")
      .then((res) => res.json())
      .then((data) => setFeaturedVehicles(data.vehicles || []))
      .catch(() => {})
      .finally(() => setLoadingVehicles(false))

    // Todos los motores disponibles (máx 6)
    fetch("/api/vehicles?available=true&limit=6&vehicleType=MOTOR")
      .then((res) => res.json())
      .then((data) => setAllMotores(data.vehicles || []))
      .catch(() => {})
      .finally(() => setLoadingMotores(false))

    // Todos los departamentos disponibles (máx 6)
    fetch("/api/apartments?available=true&limit=6")
      .then((res) => res.json())
      .then((data) => setAllApartments(data.apartments || []))
      .catch(() => {})
      .finally(() => setLoadingApartments(false))
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

      {/* Categories Quick Access */}
      <section className="py-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Vehículos */}
            <Link href="/vehiculos">
              <div
                className="flex items-center gap-4 p-5 rounded-xl border-2 hover:shadow-md transition-all group cursor-pointer"
                style={{ borderColor: `${settings.primaryColor}40` }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${settings.primaryColor}20` }}
                >
                  <Car className="h-7 w-7" style={{ color: settings.primaryColor }} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:underline">
                    Vehículos
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Carros y SUVs para alquilar
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Motores */}
            <Link href="/motores">
              <div
                className="flex items-center gap-4 p-5 rounded-xl border-2 hover:shadow-md transition-all group cursor-pointer"
                style={{ borderColor: `${settings.primaryColor}40` }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${settings.primaryColor}20` }}
                >
                  <Bike className="h-7 w-7" style={{ color: settings.primaryColor }} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:underline">
                    Motores
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Motocicletas para alquilar
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Departamentos */}
            <Link href="/departamentos">
              <div
                className="flex items-center gap-4 p-5 rounded-xl border-2 hover:shadow-md transition-all group cursor-pointer"
                style={{ borderColor: `${settings.primaryColor}40` }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${settings.primaryColor}20` }}
                >
                  <Building2 className="h-7 w-7" style={{ color: settings.primaryColor }} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:underline">
                    Departamentos
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Propiedades en alquiler
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              ¿Por qué elegirnos?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Ofrecemos el mejor servicio de renta con los precios más competitivos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-sm hover:shadow-md transition text-center"
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Vehicles Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                <Car className="h-8 w-8" style={{ color: settings.primaryColor }} />
                Vehículos
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Carros y SUVs disponibles para alquilar
              </p>
            </div>
            <Link href="/vehiculos">
              <Button variant="outline" rightIcon={<ChevronRight className="h-4 w-4" />}>
                Ver Todos
              </Button>
            </Link>
          </div>

          {loadingVehicles ? (
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
            <div className="text-center py-12">
              <Car className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">No hay vehículos disponibles actualmente</p>
              <Link href="/vehiculos">
                <Button variant="outline">Ver catálogo completo</Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Motores Section — siempre visible */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                <Bike className="h-8 w-8" style={{ color: settings.primaryColor }} />
                Motores
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Motocicletas disponibles para alquilar
              </p>
            </div>
            <Link href="/motores">
              <Button variant="outline" rightIcon={<ChevronRight className="h-4 w-4" />}>
                Ver Todos
              </Button>
            </Link>
          </div>

          {loadingMotores ? (
            <div className="flex justify-center py-12">
              <div className="loader" />
            </div>
          ) : allMotores.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allMotores.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} basePath="/motores" />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bike className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">No hay motores disponibles actualmente</p>
              <Link href="/motores">
                <Button variant="outline">Ver catálogo completo</Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Departamentos Section — siempre visible */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                <Building2 className="h-8 w-8" style={{ color: settings.primaryColor }} />
                Departamentos
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Propiedades disponibles para alquilar
              </p>
            </div>
            <Link href="/departamentos">
              <Button variant="outline" rightIcon={<ChevronRight className="h-4 w-4" />}>
                Ver Todos
              </Button>
            </Link>
          </div>

          {loadingApartments ? (
            <div className="flex justify-center py-12">
              <div className="loader" />
            </div>
          ) : allApartments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allApartments.map((apartment) => (
                <ApartmentCard key={apartment.id} apartment={apartment} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">No hay departamentos disponibles actualmente</p>
              <Link href="/departamentos">
                <Button variant="outline">Ver catálogo completo</Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16 bg-amber-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              ¿Cómo Funciona?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Rentar nunca fue tan fácil
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "1",
                title: "Elige lo que necesitas",
                description: "Explora vehículos, motores o departamentos y selecciona el ideal para ti",
              },
              {
                step: "2",
                title: "Reserva en Línea",
                description: "Completa tu reservación con tus fechas y datos de contacto",
              },
              {
                step: "3",
                title: "Recoge y Disfruta",
                description: "Recoge tu vehículo o accede a tu departamento y comienza tu experiencia",
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{item.description}</p>
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
            Reserva ahora y obtén las mejores tarifas. Contamos con vehículos, motores y departamentos para todas tus necesidades.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/vehiculos">
              <Button size="lg" rightIcon={<Car className="h-5 w-5" />}>
                Ver Vehículos
              </Button>
            </Link>
            <Link href="/motores">
              <Button
                size="lg"
                rightIcon={<Bike className="h-5 w-5" />}
                variant="outline"
                className="bg-transparent border-white text-white hover:bg-white hover:text-gray-900"
              >
                Ver Motores
              </Button>
            </Link>
            <Link href="/departamentos">
              <Button
                size="lg"
                rightIcon={<Building2 className="h-5 w-5" />}
                variant="outline"
                className="bg-transparent border-white text-white hover:bg-white hover:text-gray-900"
              >
                Ver Departamentos
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
