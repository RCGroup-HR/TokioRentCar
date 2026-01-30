import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const reservation = await prisma.reservation.findUnique({
      where: { id },
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
            images: true,
          },
        },
        rental: true,
      },
    })

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservación no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json(reservation)
  } catch (error) {
    console.error("Error fetching reservation:", error)
    return NextResponse.json(
      { error: "Error al obtener reservación" },
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

    if (!session) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const { id } = await params
    const data = await request.json()

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { vehicle: true },
    })

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservación no encontrada" },
        { status: 404 }
      )
    }

    // Update reservation
    const updatedReservation = await prisma.reservation.update({
      where: { id },
      data: {
        status: data.status,
        paymentStatus: data.paymentStatus,
        paymentMethod: data.paymentMethod,
        paymentReference: data.paymentReference,
        internalNotes: data.internalNotes,
        discount: data.discount,
        totalAmount: data.totalAmount,
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
            images: true,
          },
        },
      },
    })

    // Update vehicle status based on reservation status
    if (data.status === "CANCELLED" || data.status === "COMPLETED") {
      await prisma.vehicle.update({
        where: { id: reservation.vehicleId },
        data: { status: "AVAILABLE" },
      })
    } else if (data.status === "CONFIRMED") {
      await prisma.vehicle.update({
        where: { id: reservation.vehicleId },
        data: { status: "RESERVED" },
      })
    }

    return NextResponse.json(updatedReservation)
  } catch (error) {
    console.error("Error updating reservation:", error)
    return NextResponse.json(
      { error: "Error al actualizar reservación" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const { id } = await params

    const reservation = await prisma.reservation.findUnique({
      where: { id },
    })

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservación no encontrada" },
        { status: 404 }
      )
    }

    // Cancel instead of delete
    await prisma.reservation.update({
      where: { id },
      data: { status: "CANCELLED" },
    })

    // Free up vehicle
    await prisma.vehicle.update({
      where: { id: reservation.vehicleId },
      data: { status: "AVAILABLE" },
    })

    return NextResponse.json({ message: "Reservación cancelada" })
  } catch (error) {
    console.error("Error deleting reservation:", error)
    return NextResponse.json(
      { error: "Error al eliminar reservación" },
      { status: 500 }
    )
  }
}
