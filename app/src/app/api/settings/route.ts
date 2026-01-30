import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import cache, { CACHE_KEYS, CACHE_TTL } from "@/lib/cache"

export async function GET() {
  try {
    // Check cache first
    const cached = cache.get(CACHE_KEYS.SETTINGS)
    if (cached) {
      return NextResponse.json(cached)
    }

    let settings = await prisma.companySettings.findFirst()

    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.companySettings.create({
        data: {
          companyName: "Rent Car",
          slogan: "Tu mejor opción en alquiler de vehículos",
          primaryColor: "#F59E0B",
          secondaryColor: "#1F2937",
          accentColor: "#000000",
          currency: "DOP",
          currencySymbol: "RD$",
          timezone: "America/Santo_Domingo",
          defaultLanguage: "es",
        },
      })
    }

    // Cache for 5 minutes
    cache.set(CACHE_KEYS.SETTINGS, settings, CACHE_TTL.MEDIUM)

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json(
      { error: "Error al obtener configuración" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()

    if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const data = await request.json()

    let settings = await prisma.companySettings.findFirst()

    if (settings) {
      settings = await prisma.companySettings.update({
        where: { id: settings.id },
        data,
      })
    } else {
      settings = await prisma.companySettings.create({
        data,
      })
    }

    // Invalidate cache after update
    cache.delete(CACHE_KEYS.SETTINGS)

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json(
      { error: "Error al actualizar configuración" },
      { status: 500 }
    )
  }
}
