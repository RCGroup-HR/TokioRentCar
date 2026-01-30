import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    // Build rental filter for date range
    const rentalWhere: Record<string, unknown> = {}
    if (dateFrom || dateTo) {
      rentalWhere.startDate = {}
      if (dateFrom) {
        (rentalWhere.startDate as Record<string, Date>).gte = new Date(dateFrom)
      }
      if (dateTo) {
        (rentalWhere.startDate as Record<string, Date>).lte = new Date(dateTo + "T23:59:59")
      }
    }

    // Get all customers with rental counts and totals
    const customers = await prisma.customer.findMany({
      where: search
        ? {
            OR: [
              { firstName: { contains: search } },
              { lastName: { contains: search } },
              { email: { contains: search } },
              { phone: { contains: search } },
              { idNumber: { contains: search } },
            ],
          }
        : undefined,
      include: {
        rentals: {
          include: {
            rental: {
              select: {
                id: true,
                status: true,
                totalAmount: true,
                startDate: true,
                expectedEndDate: true,
                actualEndDate: true,
              },
            },
          },
        },
      },
      orderBy: { firstName: "asc" },
    })

    // Transform data to include rental statistics
    const customersWithStats = customers
      .map((customer) => {
        // Filter rentals by date range if specified
        let rentals = customer.rentals.map((rc) => rc.rental)

        if (dateFrom || dateTo) {
          rentals = rentals.filter((r) => {
            const startDate = new Date(r.startDate)
            if (dateFrom && startDate < new Date(dateFrom)) return false
            if (dateTo && startDate > new Date(dateTo + "T23:59:59")) return false
            return true
          })
        }

        const totalRentals = rentals.length
        const totalSpent = rentals.reduce((sum, r) => sum + (r.totalAmount || 0), 0)
        const activeRentals = rentals.filter((r) => r.status === "ACTIVE").length
        const completedRentals = rentals.filter((r) => r.status === "COMPLETED").length
        const lastRental = rentals.length > 0
          ? rentals.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0]
          : null

        return {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
          idNumber: customer.idNumber,
          idType: customer.idType,
          isActive: customer.isActive,
          isBlacklisted: customer.isBlacklisted,
          stats: {
            totalRentals,
            totalSpent,
            activeRentals,
            completedRentals,
            lastRentalDate: lastRental?.startDate || null,
          },
        }
      })
      // Filter to only show customers with at least one rental
      .filter((c) => c.stats.totalRentals > 0)
      // Sort by total spent descending
      .sort((a, b) => b.stats.totalSpent - a.stats.totalSpent)

    // Pagination
    const total = customersWithStats.length
    const paginatedCustomers = customersWithStats.slice((page - 1) * limit, page * limit)

    // Calculate overall statistics
    const overallStats = {
      totalCustomersWithRentals: total,
      totalRevenue: customersWithStats.reduce((sum, c) => sum + c.stats.totalSpent, 0),
      totalRentals: customersWithStats.reduce((sum, c) => sum + c.stats.totalRentals, 0),
      activeRentals: customersWithStats.reduce((sum, c) => sum + c.stats.activeRentals, 0),
    }

    return NextResponse.json({
      customers: paginatedCustomers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      overallStats,
    })
  } catch (error) {
    console.error("Error fetching customer rental history:", error)
    return NextResponse.json(
      { error: "Error al obtener historial de rentas" },
      { status: 500 }
    )
  }
}
