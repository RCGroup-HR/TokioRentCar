import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { generateReservationCode, calculateDaysBetween } from "@/lib/utils"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")
    const vehicleId = searchParams.get("vehicleId")
    const customerId = searchParams.get("customerId")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    const where: Record<string, unknown> = {}

    // If customer, only show their reservations
    if (session?.user.role === "CUSTOMER") {
      where.customerId = session.user.id
    } else if (customerId) {
      where.customerId = customerId
    }

    if (status) {
      where.status = status
    }

    if (vehicleId) {
      where.vehicleId = vehicleId
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.startDate = {}
      if (dateFrom) {
        (where.startDate as Record<string, Date>).gte = new Date(dateFrom)
      }
      if (dateTo) {
        (where.startDate as Record<string, Date>).lte = new Date(dateTo + "T23:59:59")
      }
    }

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          vehicle: {
            include: {
              images: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.reservation.count({ where }),
    ])

    return NextResponse.json({
      reservations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching reservations:", error)
    return NextResponse.json(
      { error: "Error al obtener reservaciones" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const session = await auth()

    // Check vehicle availability
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
    })

    if (!vehicle || vehicle.status !== "AVAILABLE") {
      return NextResponse.json(
        { error: "Vehículo no disponible" },
        { status: 400 }
      )
    }

    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    // Check for date conflicts
    const conflictingReservation = await prisma.reservation.findFirst({
      where: {
        vehicleId: data.vehicleId,
        status: { in: ["PENDING", "CONFIRMED"] },
        OR: [
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gte: startDate } },
            ],
          },
          {
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: endDate } },
            ],
          },
          {
            AND: [
              { startDate: { gte: startDate } },
              { endDate: { lte: endDate } },
            ],
          },
        ],
      },
    })

    if (conflictingReservation) {
      return NextResponse.json(
        { error: "Las fechas seleccionadas no están disponibles" },
        { status: 400 }
      )
    }

    const totalDays = calculateDaysBetween(startDate, endDate)
    const subtotal = totalDays * vehicle.dailyRate

    // Get tax settings from company settings
    const companySettings = await prisma.companySettings.findFirst()
    const applyTax = companySettings?.applyTax ?? true
    const taxRate = companySettings?.taxRate ?? 18
    const taxes = applyTax ? subtotal * (taxRate / 100) : 0
    const totalAmount = subtotal + taxes - (data.discount || 0)

    // Get or create customer
    let customerId = session?.user.id

    if (!customerId) {
      // Create guest customer
      let customer = await prisma.user.findUnique({
        where: { email: data.customerEmail },
      })

      if (!customer) {
        customer = await prisma.user.create({
          data: {
            email: data.customerEmail,
            password: "", // Guest user, no password
            firstName: data.customerFirstName || "Invitado",
            lastName: data.customerLastName || "",
            phone: data.customerPhone,
            role: "CUSTOMER",
          },
        })
      }
      customerId = customer.id
    }

    const reservation = await prisma.reservation.create({
      data: {
        reservationCode: generateReservationCode(),
        customerId,
        vehicleId: data.vehicleId,
        startDate,
        endDate,
        pickupLocation: data.pickupLocation,
        dropoffLocation: data.dropoffLocation || data.pickupLocation,
        dailyRate: vehicle.dailyRate,
        totalDays,
        subtotal,
        taxes,
        discount: data.discount || 0,
        totalAmount,
        depositAmount: vehicle.depositAmount,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        customerIdNumber: data.customerIdNumber,
        customerIdType: data.customerIdType,
        customerNotes: data.customerNotes,
        status: "PENDING",
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        vehicle: {
          include: {
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
      },
    })

    // Update vehicle status
    await prisma.vehicle.update({
      where: { id: data.vehicleId },
      data: { status: "RESERVED" },
    })

    return NextResponse.json(reservation, { status: 201 })
  } catch (error) {
    console.error("Error creating reservation:", error)
    return NextResponse.json(
      { error: "Error al crear reservación" },
      { status: 500 }
    )
  }
}
