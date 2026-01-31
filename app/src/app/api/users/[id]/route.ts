import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        commissionRate: true,
        signature: true,
        createdAt: true,
        _count: {
          select: {
            rentals: true,
            managedRentals: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      { error: "Error al obtener usuario" },
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

    if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    // Solo SUPER_ADMIN puede modificar contraseña o estado de otros ADMIN/SUPER_ADMIN
    const targetIsAdmin = ["SUPER_ADMIN", "ADMIN"].includes(existingUser.role)
    const isSuperAdmin = session.user.role === "SUPER_ADMIN"

    if (targetIsAdmin && !isSuperAdmin) {
      // Un ADMIN no puede cambiar contraseña ni estado de otro admin
      if (data.password !== undefined || data.isActive !== undefined) {
        return NextResponse.json(
          { error: "Solo un Super Admin puede modificar contraseña o estado de administradores" },
          { status: 403 }
        )
      }
    }

    // Check if email is being changed and if it's already in use
    if (data.email && data.email !== existingUser.email) {
      const emailInUse = await prisma.user.findUnique({
        where: { email: data.email },
      })

      if (emailInUse) {
        return NextResponse.json(
          { error: "El email ya está en uso" },
          { status: 400 }
        )
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {}

    if (data.email) updateData.email = data.email
    if (data.firstName) updateData.firstName = data.firstName
    if (data.lastName) updateData.lastName = data.lastName
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.role) updateData.role = data.role
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.commissionRate !== undefined)
      updateData.commissionRate = data.commissionRate
    if (data.signature !== undefined) updateData.signature = data.signature

    // Hash password if provided
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 12)
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        commissionRate: true,
        signature: true,
        createdAt: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Error al actualizar usuario" },
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

    if (!session || !["SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params

    // Soft delete - just deactivate
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ message: "Usuario desactivado" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "Error al eliminar usuario" },
      { status: 500 }
    )
  }
}
