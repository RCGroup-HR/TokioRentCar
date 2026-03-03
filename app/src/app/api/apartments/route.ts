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
      where.status = { not: "RENTED" }
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { city: { contains: search } },
        { address: { contains: search } },
      ]
    }

    const [apartments, total] = await Promise.all([
      prisma.apartment.findMany({
        where,
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          country: true,
          rooms: true,
          bathrooms: true,
          maxGuests: true,
          category: true,
          amenities: true,
          pricePerNight: true,
          pricePerWeek: true,
          pricePerMonth: true,
          depositAmount: true,
          status: true,
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
            take: 5,
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.apartment.count({ where }),
    ])

    return NextResponse.json({
      apartments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching apartments:", error)
    return NextResponse.json(
      { error: "Error al obtener departamentos" },
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

    const apartment = await prisma.apartment.create({
      data: {
        name: data.name,
        description: data.description,
        address: data.address,
        city: data.city,
        country: data.country || "República Dominicana",
        rooms: data.rooms || 1,
        bathrooms: data.bathrooms || 1,
        maxGuests: data.maxGuests || 2,
        floor: data.floor ? parseInt(data.floor) : null,
        category: data.category || "ONE_BEDROOM",
        amenities: data.amenities || [],
        pricePerNight: parseFloat(data.pricePerNight),
        pricePerWeek: data.pricePerWeek ? parseFloat(data.pricePerWeek) : null,
        pricePerMonth: data.pricePerMonth ? parseFloat(data.pricePerMonth) : null,
        depositAmount: data.depositAmount ? parseFloat(data.depositAmount) : 0,
        commissionAmount: data.commissionAmount ? parseFloat(data.commissionAmount) : null,
        isFeatured: data.isFeatured || false,
      },
      include: {
        images: true,
      },
    })

    return NextResponse.json(apartment, { status: 201 })
  } catch (error) {
    console.error("Error creating apartment:", error)
    return NextResponse.json(
      { error: "Error al crear departamento" },
      { status: 500 }
    )
  }
}
