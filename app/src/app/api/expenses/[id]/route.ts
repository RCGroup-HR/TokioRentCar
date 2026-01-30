import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const expense = await prisma.expense.findUnique({
      where: { id },
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

    if (!expense) {
      return NextResponse.json(
        { error: "Gasto no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(expense)
  } catch (error) {
    console.error("Error fetching expense:", error)
    return NextResponse.json(
      { error: "Error al obtener gasto" },
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

    // Only SUPER_ADMIN and ADMIN can edit expenses
    if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "No autorizado. Solo administradores pueden editar gastos." },
        { status: 401 }
      )
    }

    const { id } = await params
    const data = await request.json()

    // Check if expense exists
    const existing = await prisma.expense.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Gasto no encontrado" },
        { status: 404 }
      )
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        vehicleId: data.vehicleId,
        category: data.category,
        description: data.description,
        amount: data.amount,
        date: new Date(data.date),
        vendor: data.vendor || null,
        invoiceNumber: data.invoiceNumber || null,
        mileageAtExpense: data.mileageAtExpense || null,
        notes: data.notes || null,
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

    return NextResponse.json(expense)
  } catch (error) {
    console.error("Error updating expense:", error)
    return NextResponse.json(
      { error: "Error al actualizar gasto" },
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

    // Only SUPER_ADMIN and ADMIN can delete expenses
    if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "No autorizado. Solo administradores pueden eliminar gastos." },
        { status: 401 }
      )
    }

    const { id } = await params

    // Check if expense exists
    const existing = await prisma.expense.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Gasto no encontrado" },
        { status: 404 }
      )
    }

    await prisma.expense.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Gasto eliminado exitosamente" })
  } catch (error) {
    console.error("Error deleting expense:", error)
    return NextResponse.json(
      { error: "Error al eliminar gasto" },
      { status: 500 }
    )
  }
}
