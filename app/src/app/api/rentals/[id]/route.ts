import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const { id } = await params

    const rental = await prisma.rental.findUnique({
      where: { id },
      include: {
        rentalCustomers: {
          include: {
            customer: true,
          },
        },
        agent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            signature: true,
          },
        },
        vehicle: {
          include: {
            images: true,
          },
        },
        reservation: true,
        payments: true,
        damages: true,
        commissions: true,
      },
    })

    if (!rental) {
      return NextResponse.json(
        { error: "Renta no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json(rental)
  } catch (error) {
    console.error("Error fetching rental:", error)
    return NextResponse.json(
      { error: "Error al obtener renta" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || !["SUPER_ADMIN", "ADMIN", "AGENT"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const { id } = await params
    const data = await request.json()

    const rental = await prisma.rental.findUnique({
      where: { id },
      include: { vehicle: true },
    })

    if (!rental) {
      return NextResponse.json(
        { error: "Renta no encontrada" },
        { status: 404 }
      )
    }

    const updatedRental = await prisma.rental.update({
      where: { id },
      data: {
        status: data.status,
        actualEndDate: data.actualEndDate ? new Date(data.actualEndDate) : null,
        endMileage: data.endMileage,
        dropoffLocation: data.dropoffLocation,
        returnCondition: data.returnCondition,
        fuelLevelEnd: data.fuelLevelEnd,
        extraCharges: data.extraCharges,
        totalAmount: data.totalAmount,
        depositReturned: data.depositReturned,
        notes: data.notes,
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
        payments: true,
      },
    })

    // Update vehicle status and mileage when rental is completed
    if (data.status === "COMPLETED") {
      await prisma.vehicle.update({
        where: { id: rental.vehicleId },
        data: {
          status: "AVAILABLE",
          mileage: data.endMileage || rental.vehicle.mileage,
        },
      })

      // Approve commission
      await prisma.commission.updateMany({
        where: { rentalId: id },
        data: { status: "APPROVED" },
      })
    }

    if (data.status === "CANCELLED") {
      await prisma.vehicle.update({
        where: { id: rental.vehicleId },
        data: { status: "AVAILABLE" },
      })

      // Cancel commission
      await prisma.commission.updateMany({
        where: { rentalId: id },
        data: { status: "CANCELLED" },
      })
    }

    return NextResponse.json(updatedRental)
  } catch (error) {
    console.error("Error updating rental:", error)
    return NextResponse.json(
      { error: "Error al actualizar renta" },
      { status: 500 }
    )
  }
}
