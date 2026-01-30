/**
 * Script de Limpieza de Base de Datos - TokioRentCar
 *
 * Elimina todos los datos transaccionales manteniendo:
 * - CompanySettings (configuración de la empresa)
 * - User (usuarios del sistema)
 * - Session (sesiones de autenticación)
 * - PickupLocation (ubicaciones de recogida)
 *
 * Ejecutar con: npx ts-node prisma/clean-database.ts
 * O con: npx tsx prisma/clean-database.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanDatabase() {
  console.log('🧹 Iniciando limpieza de base de datos...\n')

  try {
    // Mostrar datos actuales antes de limpiar
    console.log('📊 Estado ANTES de la limpieza:')
    await showCounts()

    console.log('\n⚠️  Eliminando datos transaccionales...\n')

    // Orden de eliminación respetando foreign keys
    // 1. Tablas de relación (junction tables)
    const rentalCustomers = await prisma.rentalCustomer.deleteMany()
    console.log(`   ✓ RentalCustomer: ${rentalCustomers.count} registros eliminados`)

    const reservationCustomers = await prisma.reservationCustomer.deleteMany()
    console.log(`   ✓ ReservationCustomer: ${reservationCustomers.count} registros eliminados`)

    // 2. Tablas dependientes de Rental
    const payments = await prisma.payment.deleteMany()
    console.log(`   ✓ Payment: ${payments.count} registros eliminados`)

    const damages = await prisma.damage.deleteMany()
    console.log(`   ✓ Damage: ${damages.count} registros eliminados`)

    const commissions = await prisma.commission.deleteMany()
    console.log(`   ✓ Commission: ${commissions.count} registros eliminados`)

    // 3. Tablas dependientes de Vehicle
    const vehicleImages = await prisma.vehicleImage.deleteMany()
    console.log(`   ✓ VehicleImage: ${vehicleImages.count} registros eliminados`)

    const maintenances = await prisma.maintenance.deleteMany()
    console.log(`   ✓ Maintenance: ${maintenances.count} registros eliminados`)

    const expenses = await prisma.expense.deleteMany()
    console.log(`   ✓ Expense: ${expenses.count} registros eliminados`)

    // 4. Tablas principales de transacciones
    const rentals = await prisma.rental.deleteMany()
    console.log(`   ✓ Rental: ${rentals.count} registros eliminados`)

    const reservations = await prisma.reservation.deleteMany()
    console.log(`   ✓ Reservation: ${reservations.count} registros eliminados`)

    // 5. Vehículos
    const vehicles = await prisma.vehicle.deleteMany()
    console.log(`   ✓ Vehicle: ${vehicles.count} registros eliminados`)

    // 6. Clientes
    const customers = await prisma.customer.deleteMany()
    console.log(`   ✓ Customer: ${customers.count} registros eliminados`)

    // 7. Contenido de marketing
    const testimonials = await prisma.testimonial.deleteMany()
    console.log(`   ✓ Testimonial: ${testimonials.count} registros eliminados`)

    const banners = await prisma.banner.deleteMany()
    console.log(`   ✓ Banner: ${banners.count} registros eliminados`)

    // 8. Logs de auditoría
    const auditLogs = await prisma.auditLog.deleteMany()
    console.log(`   ✓ AuditLog: ${auditLogs.count} registros eliminados`)

    console.log('\n📊 Estado DESPUÉS de la limpieza:')
    await showCounts()

    console.log('\n✅ Limpieza completada exitosamente!')
    console.log('\n📝 Datos conservados:')
    console.log('   - CompanySettings (configuración)')
    console.log('   - User (usuarios)')
    console.log('   - Session (sesiones)')
    console.log('   - PickupLocation (ubicaciones)')

  } catch (error) {
    console.error('\n❌ Error durante la limpieza:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function showCounts() {
  const counts = {
    // Tablas que se mantienen
    CompanySettings: await prisma.companySettings.count(),
    User: await prisma.user.count(),
    Session: await prisma.session.count(),
    PickupLocation: await prisma.pickupLocation.count(),
    // Tablas que se limpian
    Vehicle: await prisma.vehicle.count(),
    VehicleImage: await prisma.vehicleImage.count(),
    Reservation: await prisma.reservation.count(),
    Rental: await prisma.rental.count(),
    Customer: await prisma.customer.count(),
    Payment: await prisma.payment.count(),
    Damage: await prisma.damage.count(),
    Expense: await prisma.expense.count(),
    Maintenance: await prisma.maintenance.count(),
    Commission: await prisma.commission.count(),
    Testimonial: await prisma.testimonial.count(),
    Banner: await prisma.banner.count(),
    AuditLog: await prisma.auditLog.count(),
  }

  console.log('\n   Tablas de configuración (se mantienen):')
  console.log(`     CompanySettings: ${counts.CompanySettings}`)
  console.log(`     User: ${counts.User}`)
  console.log(`     Session: ${counts.Session}`)
  console.log(`     PickupLocation: ${counts.PickupLocation}`)

  console.log('\n   Tablas transaccionales (se limpian):')
  console.log(`     Vehicle: ${counts.Vehicle}`)
  console.log(`     VehicleImage: ${counts.VehicleImage}`)
  console.log(`     Reservation: ${counts.Reservation}`)
  console.log(`     Rental: ${counts.Rental}`)
  console.log(`     Customer: ${counts.Customer}`)
  console.log(`     Payment: ${counts.Payment}`)
  console.log(`     Damage: ${counts.Damage}`)
  console.log(`     Expense: ${counts.Expense}`)
  console.log(`     Maintenance: ${counts.Maintenance}`)
  console.log(`     Commission: ${counts.Commission}`)
  console.log(`     Testimonial: ${counts.Testimonial}`)
  console.log(`     Banner: ${counts.Banner}`)
  console.log(`     AuditLog: ${counts.AuditLog}`)
}

// Ejecutar
cleanDatabase()
