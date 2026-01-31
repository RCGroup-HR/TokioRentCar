import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import cache, { CACHE_KEYS, CACHE_TTL } from "@/lib/cache"

// Force dynamic rendering to enable all HTTP methods
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get("active") !== "false"

    // Cache key based on filter
    const cacheKey = `${CACHE_KEYS.LOCATIONS}:${activeOnly ? "active" : "all"}`

    // Check cache first
    const cached = cache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const locations = await prisma.pickupLocation.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    })

    // Cache for 5 minutes
    cache.set(cacheKey, locations, CACHE_TTL.MEDIUM)

    return NextResponse.json(locations)
  } catch (error) {
    console.error("Error fetching locations:", error)
    return NextResponse.json(
      { error: "Error al obtener ubicaciones" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const data = await request.json()

    // If this is set as default, unset other defaults
    if (data.isDefault) {
      await prisma.pickupLocation.updateMany({
        data: { isDefault: false },
      })
    }

    const location = await prisma.pickupLocation.create({
      data: {
        name: data.name,
        address: data.address,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        googleMapsUrl: data.googleMapsUrl,
        instructions: data.instructions,
        businessHours: data.businessHours,
        extraCharge: data.extraCharge || 0,
        isDefault: data.isDefault || false,
        isActive: true,
      },
    })

    // Invalidate locations cache
    cache.invalidatePattern(CACHE_KEYS.LOCATIONS)

    return NextResponse.json(location, { status: 201 })
  } catch (error) {
    console.error("Error creating location:", error)
    return NextResponse.json(
      { error: "Error al crear ubicación" },
      { status: 500 }
    )
  }
}
