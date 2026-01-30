import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || !["SUPER_ADMIN", "ADMIN", "AGENT"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const vehicleId = searchParams.get("vehicleId")
    const category = searchParams.get("category")
    const startDate = searchParams.get("startDate") || searchParams.get("dateFrom")
    const endDate = searchParams.get("endDate") || searchParams.get("dateTo")

    const where: Record<string, unknown> = {}

    if (vehicleId) {
      where.vehicleId = vehicleId
    }

    if (category) {
      where.category = category
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        (where.date as Record<string, Date>).gte = new Date(startDate)
      }
      if (endDate) {
        (where.date as Record<string, Date>).lte = new Date(endDate + "T23:59:59")
      }
    }

    const [expenses, total, totalAmount] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          vehicle: {
            select: {
              id: true,
              brand: true,
              model: true,
              licensePlate: true,
            },
          },
          registeredBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.expense.count({ where }),
      prisma.expense.aggregate({
        where,
        _sum: { amount: true },
      }),
    ])

    return NextResponse.json({
      expenses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      totalAmount: totalAmount._sum.amount || 0,
    })
  } catch (error) {
    console.error("Error fetching expenses:", error)
    return NextResponse.json(
      { error: "Error al obtener gastos" },
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

    const expense = await prisma.expense.create({
      data: {
        vehicleId: data.vehicleId,
        category: data.category,
        description: data.description,
        amount: data.amount,
        date: data.date ? new Date(data.date) : new Date(),
        receipt: data.receipt,
        invoiceNumber: data.invoiceNumber,
        vendor: data.vendor,
        mileageAtExpense: data.mileageAtExpense,
        registeredById: session.user.id,
        notes: data.notes,
      },
      include: {
        vehicle: {
          select: {
            id: true,
            brand: true,
            model: true,
            licensePlate: true,
          },
        },
        registeredBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    // Update vehicle mileage if provided
    if (data.vehicleId && data.mileageAtExpense) {
      await prisma.vehicle.update({
        where: { id: data.vehicleId },
        data: { mileage: data.mileageAtExpense },
      })
    }

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error("Error creating expense:", error)
    return NextResponse.json(
      { error: "Error al crear gasto" },
      { status: 500 }
    )
  }
}
