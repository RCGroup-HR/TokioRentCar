import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { generateContractNumber, calculateDaysBetween } from "@/lib/utils"
import { sendRentalNotification } from "@/lib/email"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")
    const vehicleId = searchParams.get("vehicleId")
    const customerId = searchParams.get("customerId")
    const agentId = searchParams.get("agentId")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    const where: Record<string, unknown> = {}

    if (session.user.role === "CUSTOMER") {
      where.customerId = session.user.id
    } else if (session.user.role === "AGENT") {
      where.agentId = session.user.id
    }

    if (status) {
      where.status = status
    }

    if (vehicleId) {
      where.vehicleId = vehicleId
    }

    if (customerId && session.user.role !== "CUSTOMER") {
      where.customerId = customerId
    }

    if (agentId && ["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      where.agentId = agentId
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

    const [rentals, total] = await Promise.all([
      prisma.rental.findMany({
        where,
        include: {
          rentalCustomers: {
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
            },
          },
          agent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          vehicle: {
            select: {
              id: true,
              brand: true,
              model: true,
              year: true,
              licensePlate: true,
              images: {
                where: { isPrimary: true },
                take: 1,
                select: {
                  url: true,
                  isPrimary: true,
                },
              },
            },
          },
          payments: {
            select: {
              id: true,
              amount: true,
              method: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.rental.count({ where }),
    ])

    // Transform rentals to include customer from rentalCustomers
    const transformedRentals = rentals.map((rental) => {
      const primaryCustomer = rental.rentalCustomers[0]?.customer || null
      return {
        ...rental,
        customer: primaryCustomer,
      }
    })

    return NextResponse.json({
      rentals: transformedRentals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching rentals:", error)
    return NextResponse.json(
      { error: "Error al obtener rentas" },
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

    // Helper para convertir strings vacíos a null
    const emptyToNull = (val: string | null | undefined) =>
      val === "" || val === undefined ? null : val

    // Limpiar campos opcionales
    data.licenseNumber = emptyToNull(data.licenseNumber)
    data.licenseExpiry = emptyToNull(data.licenseExpiry)
    data.idNumber = emptyToNull(data.idNumber)
    data.idType = emptyToNull(data.idType)
    data.notes = emptyToNull(data.notes)
    data.reservationId = emptyToNull(data.reservationId)
    data.dropoffLocation = emptyToNull(data.dropoffLocation)
    data.additionalDriver = emptyToNull(data.additionalDriver)

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
    })

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vehículo no encontrado" },
        { status: 404 }
      )
    }

    // Combine date and time
    const startDateTime = data.startTime
      ? new Date(`${data.startDate}T${data.startTime}:00`)
      : new Date(data.startDate)
    const expectedEndDateTime = data.expectedEndTime
      ? new Date(`${data.expectedEndDate}T${data.expectedEndTime}:00`)
      : new Date(data.expectedEndDate)

    const startDate = startDateTime
    const expectedEndDate = expectedEndDateTime
    const totalDays = calculateDaysBetween(startDate, expectedEndDate)

    // Convert fuel level string to percentage integer
    const fuelLevelMap: Record<string, number> = {
      "EMPTY": 0,
      "QUARTER": 25,
      "1/4": 25,
      "HALF": 50,
      "1/2": 50,
      "THREE_QUARTERS": 75,
      "3/4": 75,
      "FULL": 100,
    }
    const fuelLevelStart = typeof data.fuelLevelStart === "string"
      ? fuelLevelMap[data.fuelLevelStart] ?? null
      : data.fuelLevelStart
    const subtotal = totalDays * (data.dailyRate || vehicle.dailyRate)

    // Get tax settings from company settings
    const companySettings = await prisma.companySettings.findFirst()
    const applyTax = companySettings?.applyTax ?? true
    const taxRate = companySettings?.taxRate ?? 18
    const taxes = applyTax ? subtotal * (taxRate / 100) : 0
    const totalAmount = subtotal + taxes - (data.discount || 0) + (data.extraCharges || 0)

    // Use provided agentId or fallback to session user
    const agentId = data.agentId || session.user.id

    // Create rental with agent as customerId (required field references User)
    // The actual customer relationship is stored in RentalCustomer
    const rental = await prisma.rental.create({
      data: {
        contractNumber: generateContractNumber(),
        reservationId: data.reservationId || null,
        customerId: session.user.id, // Use agent's user ID as placeholder (required field)
        vehicleId: data.vehicleId,
        agentId: agentId,
        startDate,
        expectedEndDate,
        startMileage: data.startMileage || vehicle.mileage,
        pickupLocation: data.pickupLocation,
        dailyRate: data.dailyRate || vehicle.dailyRate,
        totalDays,
        subtotal,
        taxes,
        discount: data.discount || 0,
        extraCharges: data.extraCharges || 0,
        totalAmount,
        depositAmount: data.depositAmount || vehicle.depositAmount,
        pickupCondition: data.pickupCondition,
        fuelLevelStart,
        licenseNumber: data.licenseNumber,
        licenseExpiry: data.licenseExpiry ? new Date(data.licenseExpiry) : null,
        idNumber: data.idNumber,
        idType: data.idType,
        additionalDriver: data.additionalDriver,
        notes: data.notes,
        status: "ACTIVE",
        // Create RentalCustomer relationship
        rentalCustomers: {
          create: {
            customerId: data.customerId,
          },
        },
      },
      include: {
        rentalCustomers: {
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
          },
        },
        agent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        vehicle: {
          include: {
            images: true,
          },
        },
      },
    })

    // Update vehicle status
    await prisma.vehicle.update({
      where: { id: data.vehicleId },
      data: { status: "RENTED" },
    })

    // Update reservation if linked
    if (data.reservationId) {
      await prisma.reservation.update({
        where: { id: data.reservationId },
        data: { status: "COMPLETED" },
      })
    }

    // Create commission for agent
    // If vehicle has commissionAmount > 0, use it per day
    // Otherwise, fall back to agent's commissionRate percentage
    let commissionAmount = 0
    let commissionRate = 0

    if (vehicle.commissionAmount && vehicle.commissionAmount > 0) {
      // Commission is calculated per day: commissionAmount * totalDays
      commissionAmount = vehicle.commissionAmount * totalDays
    } else {
      // Fall back to agent's commission percentage
      const agent = await prisma.user.findUnique({
        where: { id: agentId },
        select: { commissionRate: true },
      })
      if (agent?.commissionRate && agent.commissionRate > 0) {
        commissionRate = agent.commissionRate
        commissionAmount = subtotal * (commissionRate / 100)
      }
    }

    if (commissionAmount > 0) {
      await prisma.commission.create({
        data: {
          agentId: agentId,
          rentalId: rental.id,
          rate: commissionRate,
          baseAmount: subtotal,
          amount: commissionAmount,
          status: "PENDING",
        },
      })
    }

    // Send email notifications (async, don't wait)
    const primaryCustomer = rental.rentalCustomers[0]?.customer
    if (primaryCustomer) {
      sendRentalNotification({
        contractNumber: rental.contractNumber,
        customerName: `${primaryCustomer.firstName} ${primaryCustomer.lastName}`.trim(),
        customerEmail: primaryCustomer.email,
        customerPhone: primaryCustomer.phone || undefined,
        vehicleName: `${rental.vehicle.brand} ${rental.vehicle.model} ${rental.vehicle.year}`,
        licensePlate: rental.vehicle.licensePlate || undefined,
        startDate: rental.startDate,
        expectedEndDate: rental.expectedEndDate,
        totalDays: rental.totalDays,
        dailyRate: rental.dailyRate,
        totalAmount: rental.totalAmount,
        depositAmount: rental.depositAmount,
        pickupLocation: rental.pickupLocation,
        agentName: rental.agent ? `${rental.agent.firstName} ${rental.agent.lastName}`.trim() : undefined,
      }).catch((error) => {
        console.error("Error sending rental notification:", error)
      })
    }

    return NextResponse.json(rental, { status: 201 })
  } catch (error) {
    console.error("Error creating rental:", error)
    return NextResponse.json(
      { error: "Error al crear renta" },
      { status: 500 }
    )
  }
}
