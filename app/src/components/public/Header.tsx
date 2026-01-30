"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useSettingsStore } from "@/stores/settingsStore"
import { Button } from "@/components/ui"
import {
  Menu,
  X,
  Phone,
  User,
  LogOut,
  Car,
  Calendar,
  Settings,
} from "lucide-react"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { data: session } = useSession()
  const { settings } = useSettingsStore()

  const isAdmin = session?.user?.role && ["SUPER_ADMIN", "ADMIN", "AGENT"].includes(session.user.role)

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Top bar */}
      <div
        className="hidden md:block py-2 text-sm text-white"
        style={{ backgroundColor: settings.secondaryColor }}
      >
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {settings.phone && (
              <a
                href={`tel:${settings.phone}`}
                className="flex items-center gap-1 hover:opacity-80 transition"
              >
                <Phone className="h-3.5 w-3.5" />
                {settings.phone}
              </a>
            )}
            {settings.email && (
              <a href={`mailto:${settings.email}`} className="hover:opacity-80 transition">
                {settings.email}
              </a>
            )}
          </div>
          <div className="flex items-center gap-4">
            {settings.whatsapp && (
              <a
                href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition"
              >
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            {settings.logo ? (
              <img
                src={settings.logo}
                alt={settings.companyName}
                className="h-10 md:h-12 w-auto object-contain"
              />
            ) : (
              <span
                className="text-2xl md:text-3xl font-bold"
                style={{ color: settings.primaryColor }}
              >
                {settings.companyName}
              </span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-gray-700 hover:text-primary transition font-medium"
            >
              Inicio
            </Link>
            <Link
              href="/vehiculos"
              className="text-gray-700 hover:text-primary transition font-medium"
            >
              Vehículos
            </Link>
            <Link
              href="/ubicaciones"
              className="text-gray-700 hover:text-primary transition font-medium"
            >
              Ubicaciones
            </Link>
            <Link
              href="/contacto"
              className="text-gray-700 hover:text-primary transition font-medium"
            >
              Contacto
            </Link>
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            {session ? (
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm" leftIcon={<Settings className="h-4 w-4" />}>
                      Admin
                    </Button>
                  </Link>
                )}
                <div className="relative group">
                  <button className="flex items-center gap-2 text-gray-700 hover:text-primary transition">
                    <User className="h-5 w-5" />
                    <span className="text-sm font-medium">{session.user.name}</span>
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <Link
                      href="/mis-reservaciones"
                      className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Calendar className="h-4 w-4" />
                      Mis Reservaciones
                    </Link>
                    <button
                      onClick={() => signOut()}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-gray-50 w-full"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm" leftIcon={<User className="h-4 w-4" />}>
                  Iniciar Sesión
                </Button>
              </Link>
            )}
            <Link href="/vehiculos">
              <Button leftIcon={<Car className="h-4 w-4" />}>Reservar Ahora</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-gray-700" />
            ) : (
              <Menu className="h-6 w-6 text-gray-700" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <nav className="container mx-auto px-4 py-4 space-y-2">
            <Link
              href="/"
              className="block py-2 text-gray-700 hover:text-primary transition"
              onClick={() => setIsMenuOpen(false)}
            >
              Inicio
            </Link>
            <Link
              href="/vehiculos"
              className="block py-2 text-gray-700 hover:text-primary transition"
              onClick={() => setIsMenuOpen(false)}
            >
              Vehículos
            </Link>
            <Link
              href="/ubicaciones"
              className="block py-2 text-gray-700 hover:text-primary transition"
              onClick={() => setIsMenuOpen(false)}
            >
              Ubicaciones
            </Link>
            <Link
              href="/contacto"
              className="block py-2 text-gray-700 hover:text-primary transition"
              onClick={() => setIsMenuOpen(false)}
            >
              Contacto
            </Link>
            <div className="pt-4 border-t space-y-2">
              {session ? (
                <>
                  {isAdmin && (
                    <Link href="/admin" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" className="w-full" leftIcon={<Settings className="h-4 w-4" />}>
                        Panel Admin
                      </Button>
                    </Link>
                  )}
                  <Link href="/mis-reservaciones" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full" leftIcon={<Calendar className="h-4 w-4" />}>
                      Mis Reservaciones
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full text-red-600"
                    leftIcon={<LogOut className="h-4 w-4" />}
                    onClick={() => signOut()}
                  >
                    Cerrar Sesión
                  </Button>
                </>
              ) : (
                <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" className="w-full" leftIcon={<User className="h-4 w-4" />}>
                    Iniciar Sesión
                  </Button>
                </Link>
              )}
              <Link href="/vehiculos" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full" leftIcon={<Car className="h-4 w-4" />}>
                  Reservar Ahora
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
