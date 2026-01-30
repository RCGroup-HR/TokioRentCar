import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Iniciando seed de la base de datos...")

  // Create default company settings
  const settings = await prisma.companySettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      companyName: "Tokio Rent Car",
      slogan: "Tu mejor opción en alquiler de vehículos",
      primaryColor: "#F59E0B",
      secondaryColor: "#1F2937",
      accentColor: "#000000",
      phone: "809-786-8457",
      whatsapp: "8097868457",
      email: "info@tokiorentcar.com",
      address: "Avenida Pedro A. Rivera km. 5, Camino de La Ciudad",
      city: "La Vega",
      country: "República Dominicana",
      currency: "DOP",
      currencySymbol: "RD$",
      timezone: "America/Santo_Domingo",
      defaultLanguage: "es",
      termsAndConditions: "Términos y condiciones del servicio de alquiler de vehículos...",
      privacyPolicy: "Política de privacidad y manejo de datos personales...",
      cancellationPolicy: "Política de cancelación y reembolsos...",
    },
  })
  console.log("Configuración creada:", settings.companyName)

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 12)
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@tokiorentcar.com" },
    update: {},
    create: {
      email: "admin@tokiorentcar.com",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "Sistema",
      phone: "809-786-8457",
      role: "SUPER_ADMIN",
      isActive: true,
    },
  })
  console.log("Usuario admin creado:", adminUser.email)

  // Create agent user
  const agentUser = await prisma.user.upsert({
    where: { email: "agente@tokiorentcar.com" },
    update: {},
    create: {
      email: "agente@tokiorentcar.com",
      password: hashedPassword,
      firstName: "Juan",
      lastName: "Pérez",
      phone: "809-555-0001",
      role: "AGENT",
      commissionRate: 10,
      isActive: true,
    },
  })
  console.log("Usuario agente creado:", agentUser.email)

  // Create default pickup location
  const location = await prisma.pickupLocation.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      name: "Oficina Principal - Tokio",
      address: "Avenida Pedro A. Rivera km. 5, Camino de La Ciudad",
      city: "La Vega",
      instructions: "Ubicado frente a la estación de gasolina. Estacionamiento disponible.",
      isActive: true,
      isDefault: true,
    },
  })
  console.log("Ubicación creada:", location.name)

  // Create sample vehicles
  const vehicles = [
    {
      brand: "Toyota",
      model: "Corolla",
      year: 2023,
      licensePlate: "A123456",
      color: "Blanco",
      category: "COMPACT" as const,
      transmission: "AUTOMATIC" as const,
      fuelType: "GASOLINE" as const,
      seats: 5,
      doors: 4,
      airConditioning: true,
      dailyRate: 2500,
      weeklyRate: 15000,
      monthlyRate: 50000,
      depositAmount: 10000,
      mileage: 15000,
      description: "Toyota Corolla 2023, excelente vehículo para viajes familiares y de negocios.",
      features: ["Bluetooth", "Cámara de reversa", "Control crucero", "Sensores de parqueo"],
      isFeatured: true,
      status: "AVAILABLE" as const,
    },
    {
      brand: "Honda",
      model: "CR-V",
      year: 2022,
      licensePlate: "B789012",
      color: "Negro",
      category: "SUV" as const,
      transmission: "AUTOMATIC" as const,
      fuelType: "GASOLINE" as const,
      seats: 5,
      doors: 4,
      airConditioning: true,
      dailyRate: 4000,
      weeklyRate: 24000,
      monthlyRate: 80000,
      depositAmount: 15000,
      mileage: 25000,
      description: "Honda CR-V 2022, SUV espaciosa ideal para aventuras y viajes largos.",
      features: ["Bluetooth", "Android Auto", "Apple CarPlay", "Techo panorámico", "Sensores de parqueo"],
      isFeatured: true,
      status: "AVAILABLE" as const,
    },
    {
      brand: "Hyundai",
      model: "Accent",
      year: 2023,
      licensePlate: "C345678",
      color: "Rojo",
      category: "ECONOMY" as const,
      transmission: "AUTOMATIC" as const,
      fuelType: "GASOLINE" as const,
      seats: 5,
      doors: 4,
      airConditioning: true,
      dailyRate: 2000,
      weeklyRate: 12000,
      monthlyRate: 40000,
      depositAmount: 8000,
      mileage: 10000,
      description: "Hyundai Accent 2023, económico y eficiente, perfecto para la ciudad.",
      features: ["Bluetooth", "Radio AM/FM", "USB"],
      isFeatured: false,
      status: "AVAILABLE" as const,
    },
    {
      brand: "Toyota",
      model: "Hilux",
      year: 2022,
      licensePlate: "D901234",
      color: "Gris",
      category: "PICKUP" as const,
      transmission: "MANUAL" as const,
      fuelType: "DIESEL" as const,
      seats: 5,
      doors: 4,
      airConditioning: true,
      dailyRate: 4500,
      weeklyRate: 27000,
      monthlyRate: 90000,
      depositAmount: 20000,
      mileage: 35000,
      description: "Toyota Hilux 2022, pickup resistente para trabajo y aventura.",
      features: ["4x4", "Bluetooth", "Tracción integral", "Barra antivuelco"],
      isFeatured: true,
      status: "AVAILABLE" as const,
    },
    {
      brand: "Kia",
      model: "Sportage",
      year: 2023,
      licensePlate: "E567890",
      color: "Azul",
      category: "SUV" as const,
      transmission: "AUTOMATIC" as const,
      fuelType: "GASOLINE" as const,
      seats: 5,
      doors: 4,
      airConditioning: true,
      dailyRate: 3500,
      weeklyRate: 21000,
      monthlyRate: 70000,
      depositAmount: 12000,
      mileage: 18000,
      description: "Kia Sportage 2023, SUV moderna con tecnología de punta.",
      features: ["Pantalla táctil", "Bluetooth", "Android Auto", "Apple CarPlay", "Sensores 360"],
      isFeatured: true,
      status: "AVAILABLE" as const,
    },
  ]

  for (const vehicleData of vehicles) {
    const vehicle = await prisma.vehicle.upsert({
      where: { licensePlate: vehicleData.licensePlate },
      update: {},
      create: vehicleData,
    })
    console.log(`Vehículo creado: ${vehicle.brand} ${vehicle.model}`)
  }

  console.log("Seed completado exitosamente!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
