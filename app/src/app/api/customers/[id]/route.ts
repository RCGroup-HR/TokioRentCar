import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { withStaffAuth, withAdminAuth } from "@/lib/auth-guard"
import { updateCustomerSchema } from "@/lib/validations"

// GET - Requiere autenticación (staff)
export const GET = withStaffAuth(async (
  request,
  session,
  context
) => {
  try {
    const { id } = await context!.params

    // Validar UUID
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json(
        { error: "ID de cliente inválido" },
        { status: 400 }
      )
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
    })

    if (!customer) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error("Error fetching customer:", error)
    return NextResponse.json(
      { error: "Error al obtener cliente" },
      { status: 500 }
    )
  }
})

// PUT - Requiere autenticación (staff) + validación
export const PUT = withStaffAuth(async (
  request,
  session,
  context
) => {
  try {
    const { id } = await context!.params

    // Validar UUID
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json(
        { error: "ID de cliente inválido" },
        { status: 400 }
      )
    }

    const data = await request.json()

    // Validar con Zod
    const validation = updateCustomerSchema.safeParse(data)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: validation.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    // Check if customer exists
    const existing = await prisma.customer.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      )
    }

    // Check for duplicate email/idNumber with other customers
    if (validatedData.email && validatedData.email !== existing.email) {
      const emailExists = await prisma.customer.findFirst({
        where: { email: validatedData.email, id: { not: id } },
      })
      if (emailExists) {
        return NextResponse.json(
          { error: "Ya existe otro cliente con este correo electrónico" },
          { status: 409 }
        )
      }
    }

    if (validatedData.idNumber && validatedData.idNumber !== existing.idNumber) {
      const idExists = await prisma.customer.findFirst({
        where: { idNumber: validatedData.idNumber, id: { not: id } },
      })
      if (idExists) {
        return NextResponse.json(
          { error: "Ya existe otro cliente con este número de documento" },
          { status: 409 }
        )
      }
    }

    // Construir objeto de actualización solo con campos proporcionados
    const updateData: any = {}

    if (validatedData.firstName !== undefined) updateData.firstName = validatedData.firstName
    if (validatedData.lastName !== undefined) updateData.lastName = validatedData.lastName
    if (validatedData.email !== undefined) updateData.email = validatedData.email
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone
    if (validatedData.phoneSecondary !== undefined) updateData.phoneSecondary = validatedData.phoneSecondary || null
    if (validatedData.idType !== undefined) updateData.idType = validatedData.idType
    if (validatedData.idNumber !== undefined) updateData.idNumber = validatedData.idNumber
    if (validatedData.idExpiry !== undefined) updateData.idExpiry = validatedData.idExpiry ? new Date(validatedData.idExpiry) : null
    if (validatedData.idImage !== undefined) updateData.idImage = validatedData.idImage || null
    if (validatedData.licenseNumber !== undefined) updateData.licenseNumber = validatedData.licenseNumber || null
    if (validatedData.licenseExpiry !== undefined) updateData.licenseExpiry = validatedData.licenseExpiry ? new Date(validatedData.licenseExpiry) : null
    if (validatedData.licenseImage !== undefined) updateData.licenseImage = validatedData.licenseImage || null
    if (validatedData.licenseCategory !== undefined) updateData.licenseCategory = validatedData.licenseCategory || null
    if (validatedData.address !== undefined) updateData.address = validatedData.address || null
    if (validatedData.city !== undefined) updateData.city = validatedData.city || null
    if (validatedData.state !== undefined) updateData.state = validatedData.state || null
    if (validatedData.country !== undefined) updateData.country = validatedData.country
    if (validatedData.zipCode !== undefined) updateData.zipCode = validatedData.zipCode || null
    if (validatedData.dateOfBirth !== undefined) updateData.dateOfBirth = validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : null
    if (validatedData.nationality !== undefined) updateData.nationality = validatedData.nationality || null
    if (validatedData.occupation !== undefined) updateData.occupation = validatedData.occupation || null
    if (validatedData.employer !== undefined) updateData.employer = validatedData.employer || null
    if (validatedData.employerPhone !== undefined) updateData.employerPhone = validatedData.employerPhone || null
    if (validatedData.emergencyContact !== undefined) updateData.emergencyContact = validatedData.emergencyContact || null
    if (validatedData.emergencyPhone !== undefined) updateData.emergencyPhone = validatedData.emergencyPhone || null
    if (validatedData.emergencyRelationship !== undefined) updateData.emergencyRelationship = validatedData.emergencyRelationship || null
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes || null
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive
    if (validatedData.isBlacklisted !== undefined) updateData.isBlacklisted = validatedData.isBlacklisted
    if (validatedData.blacklistReason !== undefined) updateData.blacklistReason = validatedData.blacklistReason || null

    const customer = await prisma.customer.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(customer)
  } catch (error) {
    console.error("Error updating customer:", error)
    return NextResponse.json(
      { error: "Error al actualizar cliente" },
      { status: 500 }
    )
  }
})

// DELETE - Requiere autenticación de admin
export const DELETE = withAdminAuth(async (
  request,
  session,
  context
) => {
  try {
    const { id } = await context!.params

    // Validar UUID
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json(
        { error: "ID de cliente inválido" },
        { status: 400 }
      )
    }

    // Verificar que existe
    const existing = await prisma.customer.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      )
    }

    // Soft delete - mark as inactive
    await prisma.customer.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ message: "Cliente eliminado" })
  } catch (error) {
    console.error("Error deleting customer:", error)
    return NextResponse.json(
      { error: "Error al eliminar cliente" },
      { status: 500 }
    )
  }
})
