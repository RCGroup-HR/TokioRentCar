import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

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
    const agentId = searchParams.get("agentId")
    const status = searchParams.get("status")
    const startDate = searchParams.get("startDate") || searchParams.get("dateFrom")
    const endDate = searchParams.get("endDate") || searchParams.get("dateTo")

    const where: Record<string, unknown> = {}

    // Agents can only see their own commissions
    if (session.user.role === "AGENT") {
      where.agentId = session.user.id
    } else if (agentId) {
      where.agentId = agentId
    }

    if (status) {
      where.status = status
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(startDate)
      }
      if (endDate) {
        (where.createdAt as Record<string, Date>).lte = new Date(endDate + "T23:59:59")
      }
    }

    const [commissions, total, totals] = await Promise.all([
      prisma.commission.findMany({
        where,
        include: {
          agent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          rental: {
            include: {
              vehicle: {
                select: {
                  brand: true,
                  model: true,
                  licensePlate: true,
                },
              },
              customer: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.commission.count({ where }),
      prisma.commission.groupBy({
        by: ["status"],
        where,
        _sum: { amount: true },
      }),
    ])

    const summary = {
      pending: totals.find((t) => t.status === "PENDING")?._sum.amount || 0,
      approved: totals.find((t) => t.status === "APPROVED")?._sum.amount || 0,
      paid: totals.find((t) => t.status === "PAID")?._sum.amount || 0,
    }

    return NextResponse.json({
      commissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary,
    })
  } catch (error) {
    console.error("Error fetching commissions:", error)
    return NextResponse.json(
      { error: "Error al obtener comisiones" },
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

    if (!data.ids || !Array.isArray(data.ids)) {
      return NextResponse.json(
        { error: "IDs de comisiones requeridos" },
        { status: 400 }
      )
    }

    // Aprobar comisiones pendientes
    if (data.action === "approve") {
      await prisma.commission.updateMany({
        where: {
          id: { in: data.ids },
          status: "PENDING",
        },
        data: {
          status: "APPROVED",
        },
      })
      return NextResponse.json({ message: "Comisiones aprobadas" })
    }

    // Pagar comisiones aprobadas
    if (data.action === "pay") {
      await prisma.commission.updateMany({
        where: {
          id: { in: data.ids },
          status: "APPROVED",
        },
        data: {
          status: "PAID",
          paidAt: new Date(),
          paymentRef: data.paymentRef,
        },
      })
      return NextResponse.json({ message: "Comisiones pagadas" })
    }

    // Cancelar comisiones
    if (data.action === "cancel") {
      await prisma.commission.updateMany({
        where: {
          id: { in: data.ids },
          status: { in: ["PENDING", "APPROVED"] },
        },
        data: {
          status: "CANCELLED",
        },
      })
      return NextResponse.json({ message: "Comisiones canceladas" })
    }

    // Por defecto, marcar como pagadas (compatibilidad con código anterior)
    await prisma.commission.updateMany({
      where: {
        id: { in: data.ids },
        status: "APPROVED",
      },
      data: {
        status: "PAID",
        paidAt: new Date(),
        paymentRef: data.paymentRef,
      },
    })

    return NextResponse.json({ message: "Comisiones actualizadas" })
  } catch (error) {
    console.error("Error updating commissions:", error)
    return NextResponse.json(
      { error: "Error al actualizar comisiones" },
      { status: 500 }
    )
  }
}
