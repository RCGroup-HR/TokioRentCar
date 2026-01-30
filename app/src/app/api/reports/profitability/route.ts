import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get("vehicleId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const dateFilter: Record<string, Date> = {}
    if (startDate) dateFilter.gte = new Date(startDate)
    if (endDate) dateFilter.lte = new Date(endDate)

    // Get all vehicles with their rentals and expenses
    const vehicles = await prisma.vehicle.findMany({
      where: vehicleId ? { id: vehicleId } : { isActive: true },
      include: {
        rentals: {
          where: {
            status: "COMPLETED",
            ...(Object.keys(dateFilter).length > 0 && {
              actualEndDate: dateFilter,
            }),
          },
          select: {
            id: true,
            totalAmount: true,
            startDate: true,
            actualEndDate: true,
            totalDays: true,
          },
        },
        expenses: {
          where: Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {},
          select: {
            id: true,
            amount: true,
            category: true,
            date: true,
          },
        },
        images: {
          where: { isPrimary: true },
          take: 1,
        },
      },
    })

    const report = vehicles.map((vehicle) => {
      const totalRevenue = vehicle.rentals.reduce(
        (sum, rental) => sum + rental.totalAmount,
        0
      )
      const totalExpenses = vehicle.expenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      )
      const netProfit = totalRevenue - totalExpenses
      const totalRentals = vehicle.rentals.length
      const totalRentedDays = vehicle.rentals.reduce(
        (sum, rental) => sum + rental.totalDays,
        0
      )

      // Calculate expense breakdown by category
      const expensesByCategory = vehicle.expenses.reduce(
        (acc, expense) => {
          acc[expense.category] = (acc[expense.category] || 0) + expense.amount
          return acc
        },
        {} as Record<string, number>
      )

      // Calculate average daily rate
      const avgDailyRate =
        totalRentedDays > 0 ? totalRevenue / totalRentedDays : vehicle.dailyRate

      // Calculate ROI (simple)
      const roi =
        totalExpenses > 0 ? ((netProfit / totalExpenses) * 100).toFixed(2) : 0

      return {
        vehicle: {
          id: vehicle.id,
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
          licensePlate: vehicle.licensePlate,
          dailyRate: vehicle.dailyRate,
          image: vehicle.images[0]?.url,
        },
        metrics: {
          totalRevenue,
          totalExpenses,
          netProfit,
          totalRentals,
          totalRentedDays,
          avgDailyRate,
          roi,
          profitMargin:
            totalRevenue > 0
              ? ((netProfit / totalRevenue) * 100).toFixed(2)
              : 0,
        },
        expensesByCategory,
      }
    })

    // Calculate totals
    const totals = report.reduce(
      (acc, item) => {
        acc.totalRevenue += item.metrics.totalRevenue
        acc.totalExpenses += item.metrics.totalExpenses
        acc.netProfit += item.metrics.netProfit
        acc.totalRentals += item.metrics.totalRentals
        acc.totalRentedDays += item.metrics.totalRentedDays
        return acc
      },
      {
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        totalRentals: 0,
        totalRentedDays: 0,
      }
    )

    return NextResponse.json({
      vehicles: report,
      totals: {
        ...totals,
        profitMargin:
          totals.totalRevenue > 0
            ? ((totals.netProfit / totals.totalRevenue) * 100).toFixed(2)
            : 0,
        avgRevenuePerVehicle: vehicles.length
          ? totals.totalRevenue / vehicles.length
          : 0,
      },
    })
  } catch (error) {
    console.error("Error generating profitability report:", error)
    return NextResponse.json(
      { error: "Error al generar reporte" },
      { status: 500 }
    )
  }
}
