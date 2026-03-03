"use client"

import Link from "next/link"
import { useSettingsStore } from "@/stores/settingsStore"
import { Badge } from "@/components/ui"
import { BedDouble, Bath, Users, Star, Building2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface ApartmentImage {
  id: string
  url: string
  isPrimary: boolean
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
  images: ApartmentImage[]
  isFeatured: boolean
  status: string
}

interface ApartmentCardProps {
  apartment: Apartment
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

export function ApartmentCard({ apartment }: ApartmentCardProps) {
  const { settings } = useSettingsStore()

  const primaryImage =
    apartment.images.find((img) => img.isPrimary) || apartment.images[0]

  const isAvailable = apartment.status === "AVAILABLE"

  return (
    <Link href={`/departamentos/${apartment.id}`}>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden card-hover">
        {/* Image */}
        <div className="relative aspect-[16/10] bg-gray-100 dark:bg-gray-700">
          {primaryImage ? (
            <img
              src={primaryImage.url}
              alt={apartment.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              <Building2 className="h-16 w-16" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {apartment.isFeatured && (
              <Badge variant="warning" className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                Destacado
              </Badge>
            )}
            <Badge variant="secondary">
              {categoryLabels[apartment.category] || apartment.category}
            </Badge>
          </div>

          {/* Status overlay */}
          {!isAvailable && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="danger" className="text-sm">
                No Disponible
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
            {apartment.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            {apartment.city}
          </p>

          {/* Features */}
          <div className="flex flex-wrap gap-3 mb-4 text-sm text-gray-700 dark:text-gray-300">
            <span className="flex items-center gap-1">
              <BedDouble className="h-4 w-4" />
              {apartment.rooms} {apartment.rooms === 1 ? "hab." : "habs."}
            </span>
            <span className="flex items-center gap-1">
              <Bath className="h-4 w-4" />
              {apartment.bathrooms} {apartment.bathrooms === 1 ? "baño" : "baños"}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {apartment.maxGuests} huéspedes
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Desde</span>
              <p
                className="text-xl font-bold"
                style={{ color: settings.primaryColor }}
              >
                {formatCurrency(
                  apartment.pricePerNight,
                  settings.currency,
                  settings.currencySymbol
                )}
              </p>
              <span className="text-sm text-gray-500 dark:text-gray-400">/ noche</span>
            </div>
            <button
              className="px-4 py-2 rounded-lg font-medium transition"
              style={{
                backgroundColor: isAvailable ? settings.primaryColor : "#9CA3AF",
                color: "#fff",
              }}
              disabled={!isAvailable}
            >
              {isAvailable ? "Ver Detalles" : "No Disponible"}
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}
