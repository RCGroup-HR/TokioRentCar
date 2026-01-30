"use client"

import Image from "next/image"
import Link from "next/link"
import { useSettingsStore } from "@/stores/settingsStore"
import { Badge } from "@/components/ui"
import {
  Users,
  Fuel,
  Cog,
  Snowflake,
  Star,
} from "lucide-react"
import {
  formatCurrency,
  getVehicleCategoryLabel,
  getTransmissionLabel,
  getFuelTypeLabel,
} from "@/lib/utils"

interface VehicleImage {
  id: string
  url: string
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
  airConditioning: boolean
  dailyRate: number
  images: VehicleImage[]
  isFeatured: boolean
  status: string
}

interface VehicleCardProps {
  vehicle: Vehicle
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const { settings } = useSettingsStore()

  const primaryImage = vehicle.images.find((img) => img.isPrimary) || vehicle.images[0]

  const isAvailable = vehicle.status === "AVAILABLE"

  return (
    <Link href={`/vehiculos/${vehicle.id}`}>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden card-hover">
        {/* Image */}
        <div className="relative aspect-[16/10] bg-gray-100">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={`${vehicle.brand} ${vehicle.model}`}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              <svg
                className="h-16 w-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {vehicle.isFeatured && (
              <Badge variant="warning" className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                Destacado
              </Badge>
            )}
            <Badge variant="secondary">
              {getVehicleCategoryLabel(vehicle.category)}
            </Badge>
          </div>

          {/* Status */}
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
          <h3 className="text-lg font-semibold text-gray-900">
            {vehicle.brand} {vehicle.model}
          </h3>
          <p className="text-sm text-gray-500 mb-3">{vehicle.year}</p>

          {/* Features */}
          <div className="flex flex-wrap gap-3 mb-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {vehicle.seats}
            </span>
            <span className="flex items-center gap-1">
              <Cog className="h-4 w-4" />
              {getTransmissionLabel(vehicle.transmission)}
            </span>
            <span className="flex items-center gap-1">
              <Fuel className="h-4 w-4" />
              {getFuelTypeLabel(vehicle.fuelType)}
            </span>
            {vehicle.airConditioning && (
              <span className="flex items-center gap-1">
                <Snowflake className="h-4 w-4" />
                A/C
              </span>
            )}
          </div>

          {/* Price */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div>
              <span className="text-sm text-gray-500">Desde</span>
              <p
                className="text-xl font-bold"
                style={{ color: settings.primaryColor }}
              >
                {formatCurrency(vehicle.dailyRate, settings.currency, settings.currencySymbol)}
              </p>
              <span className="text-sm text-gray-500">/ día</span>
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
