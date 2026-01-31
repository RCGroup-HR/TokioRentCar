import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { withAuth, withStaffAuth } from "@/lib/auth-guard"
import { createCustomerSchema } from "@/lib/validations"
import { RATE_LIMITS, rateLimiter, getClientIdentifier } from "@/lib/rate-limit"

// GET - Requiere autenticación (staff)
export const GET = withStaffAuth(async (request, session) => {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100) // Máximo 100
    const offset = parseInt(searchParams.get("offset") || "0")
    const active = searchParams.get("active") !== "false"

    const where: any = {}

    if (active) {
      where.isActive = true
    }

    if (search) {
      // Sanitizar búsqueda - MySQL: contains es case-insensitive por defecto
      const sanitizedSearch = search.trim().slice(0, 100)
      where.OR = [
        { firstName: { contains: sanitizedSearch } },
        { lastName: { contains: sanitizedSearch } },
        { email: { contains: sanitizedSearch } },
        { phone: { contains: sanitizedSearch } },
        { idNumber: { contains: sanitizedSearch } },
        { licenseNumber: { contains: sanitizedSearch } },
      ]
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          idType: true,
          idNumber: true,
          licenseNumber: true,
          isActive: true,
          isBlacklisted: true,
          createdAt: true,
          // NO exponer: idImage, licenseImage, dateOfBirth, etc. en listados
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.customer.count({ where }),
    ])

    return NextResponse.json({
      customers,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Error fetching customers:", error)
    return NextResponse.json(
      { error: "Error al obtener clientes" },
      { status: 500 }
    )
  }
})

// POST - Requiere autenticación (staff) + validación
export const POST = withStaffAuth(async (request, session) => {
  try {
    // Rate limiting adicional para creación
    const clientId = getClientIdentifier(request)
    const { limited } = rateLimiter.isLimited(`create-customer:${clientId}`, RATE_LIMITS.API_CREATE)
    if (limited) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intente más tarde." },
        { status: 429 }
      )
    }

    const data = await request.json()

    // Validar con Zod
    const validation = createCustomerSchema.safeParse(data)
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

    // Check if email or idNumber already exists
    const existing = await prisma.customer.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { idNumber: validatedData.idNumber },
        ],
      },
    })

    if (existing) {
      if (existing.email === validatedData.email) {
        return NextResponse.json(
          { error: "Ya existe un cliente con este correo electrónico" },
          { status: 409 }
        )
      }
      if (existing.idNumber === validatedData.idNumber) {
        return NextResponse.json(
          { error: "Ya existe un cliente con este número de documento" },
          { status: 409 }
        )
      }
    }

    const customer = await prisma.customer.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phone: validatedData.phone,
        phoneSecondary: validatedData.phoneSecondary || null,
        idType: validatedData.idType || "CEDULA",
        idNumber: validatedData.idNumber,
        idExpiry: validatedData.idExpiry ? new Date(validatedData.idExpiry) : null,
        idImage: validatedData.idImage || null,
        licenseNumber: validatedData.licenseNumber || null,
        licenseExpiry: validatedData.licenseExpiry ? new Date(validatedData.licenseExpiry) : null,
        licenseImage: validatedData.licenseImage || null,
        licenseCategory: validatedData.licenseCategory || null,
        address: validatedData.address || null,
        city: validatedData.city || null,
        state: validatedData.state || null,
        country: validatedData.country || "República Dominicana",
        zipCode: validatedData.zipCode || null,
        dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : null,
        nationality: validatedData.nationality || null,
        occupation: validatedData.occupation || null,
        employer: validatedData.employer || null,
        employerPhone: validatedData.employerPhone || null,
        emergencyContact: validatedData.emergencyContact || null,
        emergencyPhone: validatedData.emergencyPhone || null,
        emergencyRelationship: validatedData.emergencyRelationship || null,
        notes: validatedData.notes || null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        idType: true,
        idNumber: true,
        createdAt: true,
      },
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error("Error creating customer:", error)
    return NextResponse.json(
      { error: "Error al crear cliente" },
      { status: 500 }
    )
  }
})
