import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const featured = searchParams.get("featured")
    const available = searchParams.get("available")

    const where: Record<string, unknown> = {
      isActive: true,
    }

    if (status) {
      where.status = status
    }

    if (category) {
      where.category = category
    }

    if (featured === "true") {
      where.isFeatured = true
    }

    if (available === "true") {
      // Mostrar todos los vehículos EXCEPTO los rentados
      where.status = { not: "RENTED" }
    }

    if (search) {
      // MySQL: contains es case-insensitive por defecto con collation utf8mb4_unicode_ci
      where.OR = [
        { brand: { contains: search } },
        { model: { contains: search } },
        { licensePlate: { contains: search } },
        { color: { contains: search } },
      ]
    }

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        select: {
          id: true,
          brand: true,
          model: true,
          year: true,
          licensePlate: true,
          color: true,
          category: true,
          transmission: true,
          fuelType: true,
          seats: true,
          doors: true,
          airConditioning: true,
          dailyRate: true,
          weeklyRate: true,
          monthlyRate: true,
          depositAmount: true,
          status: true,
          mileage: true,
          description: true,
          features: true,
          currentLocation: true,
          isActive: true,
          isFeatured: true,
          createdAt: true,
          images: {
            select: {
              id: true,
              url: true,
              isPrimary: true,
              order: true,
            },
            orderBy: { order: "asc" },
            take: 5, // Limitar imágenes para listado
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.vehicle.count({ where }),
    ])

    return NextResponse.json({
      vehicles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching vehicles:", error)
    return NextResponse.json(
      { error: "Error al obtener vehículos" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session || !["SUPER_ADMIN", "ADMIN", "AGENT"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const data = await request.json()

    const vehicle = await prisma.vehicle.create({
      data: {
        brand: data.brand,
        model: data.model,
        year: data.year,
        licensePlate: data.licensePlate,
        vin: data.vin,
        color: data.color,
        category: data.category,
        transmission: data.transmission,
        fuelType: data.fuelType,
        seats: data.seats || 5,
        doors: data.doors || 4,
        airConditioning: data.airConditioning ?? true,
        dailyRate: data.dailyRate,
        weeklyRate: data.weeklyRate,
        monthlyRate: data.monthlyRate,
        depositAmount: data.depositAmount || 0,
        mileage: data.mileage || 0,
        description: data.description,
        features: data.features,
        currentLocation: data.currentLocation,
        insuranceExpiry: data.insuranceExpiry ? new Date(data.insuranceExpiry) : null,
        registrationExpiry: data.registrationExpiry ? new Date(data.registrationExpiry) : null,
        isFeatured: data.isFeatured || false,
      },
      include: {
        images: true,
      },
    })

    return NextResponse.json(vehicle, { status: 201 })
  } catch (error) {
    console.error("Error creating vehicle:", error)
    return NextResponse.json(
      { error: "Error al crear vehículo" },
      { status: 500 }
    )
  }
}
