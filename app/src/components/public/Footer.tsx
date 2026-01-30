"use client"

import Link from "next/link"
import Image from "next/image"
import { useSettingsStore } from "@/stores/settingsStore"
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
} from "lucide-react"

export function Footer() {
  const { settings } = useSettingsStore()

  const currentYear = new Date().getFullYear()

  return (
    <footer
      className="text-white"
      style={{ backgroundColor: settings.secondaryColor }}
    >
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            {settings.logo ? (
              <img
                src={settings.logo}
                alt={settings.companyName}
                className="h-12 w-auto object-contain mb-4 brightness-0 invert"
              />
            ) : (
              <h3
                className="text-2xl font-bold mb-4"
                style={{ color: settings.primaryColor }}
              >
                {settings.companyName}
              </h3>
            )}
            {settings.slogan && (
              <p className="text-gray-300 mb-4">{settings.slogan}</p>
            )}
            <div className="flex gap-3">
              {settings.facebook && (
                <a
                  href={settings.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {settings.instagram && (
                <a
                  href={settings.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {settings.twitter && (
                <a
                  href={settings.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition"
                >
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {settings.youtube && (
                <a
                  href={settings.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition"
                >
                  <Youtube className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/vehiculos"
                  className="text-gray-300 hover:text-white transition"
                >
                  Nuestros Vehículos
                </Link>
              </li>
              <li>
                <Link
                  href="/ubicaciones"
                  className="text-gray-300 hover:text-white transition"
                >
                  Puntos de Entrega
                </Link>
              </li>
              <li>
                <Link
                  href="/terminos"
                  className="text-gray-300 hover:text-white transition"
                >
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link
                  href="/privacidad"
                  className="text-gray-300 hover:text-white transition"
                >
                  Política de Privacidad
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Servicios</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/vehiculos?category=ECONOMY"
                  className="text-gray-300 hover:text-white transition"
                >
                  Vehículos Económicos
                </Link>
              </li>
              <li>
                <Link
                  href="/vehiculos?category=SUV"
                  className="text-gray-300 hover:text-white transition"
                >
                  SUVs y Camionetas
                </Link>
              </li>
              <li>
                <Link
                  href="/vehiculos?category=LUXURY"
                  className="text-gray-300 hover:text-white transition"
                >
                  Vehículos de Lujo
                </Link>
              </li>
              <li>
                <Link
                  href="/vehiculos?category=VAN"
                  className="text-gray-300 hover:text-white transition"
                >
                  Vans y Minibuses
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contacto</h4>
            <ul className="space-y-3">
              {settings.phone && (
                <li>
                  <a
                    href={`tel:${settings.phone}`}
                    className="flex items-center gap-2 text-gray-300 hover:text-white transition"
                  >
                    <Phone className="h-4 w-4" style={{ color: settings.primaryColor }} />
                    {settings.phone}
                  </a>
                </li>
              )}
              {settings.email && (
                <li>
                  <a
                    href={`mailto:${settings.email}`}
                    className="flex items-center gap-2 text-gray-300 hover:text-white transition"
                  >
                    <Mail className="h-4 w-4" style={{ color: settings.primaryColor }} />
                    {settings.email}
                  </a>
                </li>
              )}
              {settings.address && (
                <li className="flex items-start gap-2 text-gray-300">
                  <MapPin
                    className="h-4 w-4 mt-1 flex-shrink-0"
                    style={{ color: settings.primaryColor }}
                  />
                  <span>
                    {settings.address}
                    {settings.city && `, ${settings.city}`}
                    {settings.country && `, ${settings.country}`}
                  </span>
                </li>
              )}
            </ul>
            {settings.whatsapp && (
              <a
                href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2 text-sm text-gray-400">
            <p>
              &copy; {currentYear} {settings.companyName}. Todos los derechos
              reservados.
            </p>
            <p>
              Sistema desarrollado con tecnología moderna
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
