import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id },
    })

    if (!customer) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      )
    }

    // Get all rentals for this customer
    const rentalCustomers = await prisma.rentalCustomer.findMany({
      where: { customerId: id },
      include: {
        rental: {
          include: {
            vehicle: {
              select: {
                id: true,
                brand: true,
                model: true,
                year: true,
                licensePlate: true,
                color: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Transform the data to a cleaner format
    const rentals = rentalCustomers.map((rc) => ({
      id: rc.rental.id,
      contractNumber: rc.rental.contractNumber,
      status: rc.rental.status,
      startDate: rc.rental.startDate,
      expectedEndDate: rc.rental.expectedEndDate,
      actualEndDate: rc.rental.actualEndDate,
      totalDays: rc.rental.totalDays,
      dailyRate: rc.rental.dailyRate,
      totalAmount: rc.rental.totalAmount,
      vehicle: rc.rental.vehicle,
    }))

    return NextResponse.json({
      rentals,
      total: rentals.length,
    })
  } catch (error) {
    console.error("Error fetching customer rentals:", error)
    return NextResponse.json(
      { error: "Error al obtener rentas del cliente" },
      { status: 500 }
    )
  }
}
