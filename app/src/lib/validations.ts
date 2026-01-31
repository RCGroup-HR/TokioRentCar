/**
 * Esquemas de validación con Zod
 * Validación de todos los inputs de la API
 */

import { z } from "zod"

// ==================== UTILIDADES ====================

// Validación de email
const emailSchema = z
  .string()
  .email("Email inválido")
  .toLowerCase()
  .max(255, "Email muy largo")

// Validación de contraseña fuerte
const passwordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .max(128, "Máximo 128 caracteres")
  .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
  .regex(/[a-z]/, "Debe contener al menos una minúscula")
  .regex(/[0-9]/, "Debe contener al menos un número")

// Validación de teléfono (flexible para RD y otros)
const phoneSchema = z
  .string()
  .min(7, "Teléfono muy corto")
  .max(20, "Teléfono muy largo")
  .regex(/^[\d\s\-+()]+$/, "Formato de teléfono inválido")

// Validación de nombre
const nameSchema = z
  .string()
  .min(2, "Mínimo 2 caracteres")
  .max(50, "Máximo 50 caracteres")
  .trim()

// Validación de UUID
const uuidSchema = z.string().uuid("ID inválido")

// ==================== USUARIOS ====================

export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneSchema.optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "AGENT", "CUSTOMER"]),
  commissionRate: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional().default(true),
})

export const updateUserSchema = z.object({
  email: emailSchema.optional(),
  password: passwordSchema.optional(),
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  phone: phoneSchema.optional().nullable(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "AGENT", "CUSTOMER"]).optional(),
  commissionRate: z.number().min(0).max(100).optional().nullable(),
  isActive: z.boolean().optional(),
  avatar: z.string().url().optional().nullable(),
  signature: z.string().max(500 * 1024).optional().nullable(), // 500KB max para firma base64
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Contraseña requerida").max(128),
})

// ==================== CLIENTES ====================

// Helper: convierte string vacío a null
const emptyToNull = (val: string | null | undefined) =>
  val === "" || val === undefined ? null : val

// Schema flexible para fechas: acepta YYYY-MM-DD, ISO datetime o vacío
const flexibleDateSchema = z
  .string()
  .optional()
  .nullable()
  .transform((val) => {
    if (!val || val === "") return null
    // Si es formato YYYY-MM-DD, convertir a ISO
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      return `${val}T00:00:00.000Z`
    }
    return val
  })

// Schema para strings opcionales que pueden venir vacíos
const optionalString = (maxLength: number) => z
  .string()
  .max(maxLength)
  .optional()
  .nullable()
  .transform(emptyToNull)

// Schema para teléfonos opcionales que pueden venir vacíos
const optionalPhone = z
  .string()
  .optional()
  .nullable()
  .transform((val) => {
    if (!val || val === "") return null
    return val
  })
  .refine(
    (val) => {
      if (val === null) return true
      return val.length >= 7 && val.length <= 20 && /^[\d\s\-+()]+$/.test(val)
    },
    { message: "Formato de teléfono inválido" }
  )

export const createCustomerSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  phoneSecondary: optionalPhone,
  idType: z.enum(["CEDULA", "PASSPORT", "LICENSE"]).default("CEDULA"),
  idNumber: z
    .string()
    .min(5, "Documento muy corto")
    .max(30, "Documento muy largo")
    .regex(/^[\d\-A-Za-z]+$/, "Formato de documento inválido"),
  idExpiry: flexibleDateSchema,
  idImage: optionalString(500),
  licenseNumber: optionalString(30),
  licenseExpiry: flexibleDateSchema,
  licenseImage: optionalString(500),
  licenseCategory: optionalString(10),
  address: optionalString(255),
  city: optionalString(100),
  state: optionalString(100),
  country: z.string().max(100).optional().nullable().transform((val) => val || "República Dominicana"),
  zipCode: optionalString(20),
  dateOfBirth: flexibleDateSchema,
  nationality: optionalString(100),
  occupation: optionalString(100),
  employer: optionalString(100),
  employerPhone: optionalPhone,
  emergencyContact: optionalString(100),
  emergencyPhone: optionalPhone,
  emergencyRelationship: optionalString(50),
  notes: optionalString(2000),
})

export const updateCustomerSchema = createCustomerSchema.partial().extend({
  isActive: z.boolean().optional(),
  isBlacklisted: z.boolean().optional(),
  blacklistReason: z.string().max(500).optional().nullable(),
})

// ==================== VEHÍCULOS ====================

export const createVehicleSchema = z.object({
  brand: z.string().min(1).max(50),
  model: z.string().min(1).max(50),
  year: z.number().int().min(1990).max(new Date().getFullYear() + 2),
  licensePlate: z
    .string()
    .min(4)
    .max(15)
    .regex(/^[A-Z0-9\-]+$/i, "Formato de placa inválido"),
  vin: z.string().length(17).optional().nullable(),
  color: z.string().min(2).max(30),
  category: z.enum([
    "ECONOMY", "COMPACT", "MIDSIZE", "FULLSIZE",
    "SUV", "LUXURY", "VAN", "PICKUP", "CONVERTIBLE", "SPORTS"
  ]),
  transmission: z.enum(["AUTOMATIC", "MANUAL"]),
  fuelType: z.enum(["GASOLINE", "DIESEL", "ELECTRIC", "HYBRID"]),
  seats: z.number().int().min(2).max(15).default(5),
  doors: z.number().int().min(2).max(6).default(4),
  airConditioning: z.boolean().default(true),
  dailyRate: z.number().positive().max(100000),
  weeklyRate: z.number().positive().max(500000).optional().nullable(),
  monthlyRate: z.number().positive().max(2000000).optional().nullable(),
  depositAmount: z.number().min(0).max(500000).default(0),
  commissionAmount: z.number().min(0).max(10000).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  features: z.array(z.string().max(100)).max(50).optional().nullable(),
  currentLocation: z.string().max(255).optional().nullable(),
  insuranceExpiry: z.string().datetime().optional().nullable(),
  registrationExpiry: z.string().datetime().optional().nullable(),
  mileage: z.number().int().min(0).max(10000000).default(0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
})

export const updateVehicleSchema = createVehicleSchema.partial().extend({
  status: z.enum([
    "AVAILABLE", "RENTED", "MAINTENANCE", "RESERVED", "OUT_OF_SERVICE"
  ]).optional(),
})

// ==================== RESERVACIONES ====================

export const createReservationSchema = z.object({
  customerId: uuidSchema,
  vehicleId: uuidSchema,
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  pickupLocation: z.string().min(1).max(255),
  dropoffLocation: z.string().min(1).max(255),
  dailyRate: z.number().positive(),
  totalDays: z.number().int().positive().max(365),
  subtotal: z.number().min(0),
  taxes: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  totalAmount: z.number().positive(),
  depositAmount: z.number().min(0).default(0),
  customerNotes: z.string().max(1000).optional().nullable(),
  internalNotes: z.string().max(1000).optional().nullable(),
  customerPhone: phoneSchema.optional().nullable(),
  customerEmail: emailSchema.optional().nullable(),
  customerIdNumber: z.string().max(30).optional().nullable(),
  customerIdType: z.string().max(20).optional().nullable(),
  paymentMethod: z.string().max(50).optional().nullable(),
  paymentReference: z.string().max(100).optional().nullable(),
})

export const updateReservationSchema = createReservationSchema.partial().extend({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]).optional(),
  paymentStatus: z.enum(["PENDING", "PARTIAL", "PAID", "REFUNDED"]).optional(),
})

// ==================== RENTAS ====================

export const createRentalSchema = z.object({
  reservationId: uuidSchema.optional().nullable(),
  customerId: uuidSchema,
  vehicleId: uuidSchema,
  agentId: uuidSchema.optional().nullable(),
  startDate: z.string().datetime(),
  expectedEndDate: z.string().datetime(),
  startMileage: z.number().int().min(0),
  pickupLocation: z.string().min(1).max(255),
  dropoffLocation: z.string().max(255).optional().nullable(),
  dailyRate: z.number().positive(),
  totalDays: z.number().int().positive().max(365),
  subtotal: z.number().min(0),
  taxes: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  extraCharges: z.number().min(0).default(0),
  totalAmount: z.number().positive(),
  depositAmount: z.number().min(0).default(0),
  fuelLevelStart: z.number().int().min(0).max(100).optional().nullable(),
  licenseNumber: z.string().max(30).optional().nullable(),
  licenseExpiry: z.string().datetime().optional().nullable(),
  idNumber: z.string().max(30).optional().nullable(),
  idType: z.string().max(20).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
})

export const updateRentalSchema = createRentalSchema.partial().extend({
  actualEndDate: z.string().datetime().optional().nullable(),
  endMileage: z.number().int().min(0).optional().nullable(),
  fuelLevelEnd: z.number().int().min(0).max(100).optional().nullable(),
  depositReturned: z.number().min(0).optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "EXTENDED", "CANCELLED", "OVERDUE"]).optional(),
})

// ==================== FIRMAS ====================

export const signRentalSchema = z.object({
  customerSignature: z.string().max(500 * 1024).optional(), // 500KB max base64
  agentSignature: z.string().max(500 * 1024).optional(),
})

// ==================== PAGOS ====================

export const createPaymentSchema = z.object({
  rentalId: uuidSchema,
  amount: z.number().positive().max(10000000),
  method: z.enum(["CASH", "CREDIT_CARD", "DEBIT_CARD", "TRANSFER", "CHECK", "OTHER"]),
  reference: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  receivedBy: z.string().max(100).optional().nullable(),
})

// ==================== GASTOS ====================

export const createExpenseSchema = z.object({
  vehicleId: uuidSchema.optional().nullable(),
  category: z.enum([
    "FUEL", "MAINTENANCE", "REPAIR", "INSURANCE", "REGISTRATION",
    "TAXES", "CLEANING", "PARKING", "TOLL", "FINE", "ACCESSORIES", "OTHER"
  ]),
  description: z.string().min(1).max(255),
  amount: z.number().positive().max(10000000),
  date: z.string().datetime().optional(),
  receipt: z.string().url().optional().nullable(),
  invoiceNumber: z.string().max(50).optional().nullable(),
  vendor: z.string().max(100).optional().nullable(),
  mileageAtExpense: z.number().int().min(0).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
})

// ==================== UBICACIONES ====================

export const createLocationSchema = z.object({
  name: z.string().min(1).max(100),
  address: z.string().min(1).max(255),
  city: z.string().max(100).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  googleMapsUrl: z.string().url().max(500).optional().nullable(),
  instructions: z.string().max(1000).optional().nullable(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  extraCharge: z.number().min(0).max(10000).default(0),
})

// ==================== CONFIGURACIÓN ====================

export const updateSettingsSchema = z.object({
  companyName: z.string().min(1).max(100).optional(),
  slogan: z.string().max(200).optional().nullable(),
  logo: z.string().url().optional().nullable(),
  favicon: z.string().url().optional().nullable(),
  contractHeaderImage: z.string().url().optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  phone: phoneSchema.optional().nullable(),
  whatsapp: phoneSchema.optional().nullable(),
  email: emailSchema.optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  googleMapsUrl: z.string().url().max(500).optional().nullable(),
  facebook: z.string().url().max(255).optional().nullable(),
  instagram: z.string().url().max(255).optional().nullable(),
  twitter: z.string().url().max(255).optional().nullable(),
  youtube: z.string().url().max(255).optional().nullable(),
  tiktok: z.string().url().max(255).optional().nullable(),
  currency: z.string().length(3).optional(),
  currencySymbol: z.string().max(5).optional(),
  secondaryCurrency: z.string().length(3).optional(),
  secondaryCurrencySymbol: z.string().max(5).optional(),
  exchangeRate: z.number().positive().max(1000).optional(),
  showDualCurrency: z.boolean().optional(),
  applyTax: z.boolean().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  termsAndConditions: z.string().max(50000).optional().nullable(),
  privacyPolicy: z.string().max(50000).optional().nullable(),
  cancellationPolicy: z.string().max(50000).optional().nullable(),
  metaTitle: z.string().max(100).optional().nullable(),
  metaDescription: z.string().max(500).optional().nullable(),
  metaKeywords: z.string().max(500).optional().nullable(),
})

// ==================== TIPOS EXPORTADOS ====================

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>
export type CreateReservationInput = z.infer<typeof createReservationSchema>
export type UpdateReservationInput = z.infer<typeof updateReservationSchema>
export type CreateRentalInput = z.infer<typeof createRentalSchema>
export type UpdateRentalInput = z.infer<typeof updateRentalSchema>
export type SignRentalInput = z.infer<typeof signRentalSchema>
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
export type CreateLocationInput = z.infer<typeof createLocationSchema>
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>
