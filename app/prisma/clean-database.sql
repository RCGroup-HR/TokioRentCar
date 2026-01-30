-- =============================================================================
-- Script de Limpieza de Base de Datos - TokioRentCar
-- =============================================================================
-- Este script elimina todos los datos transaccionales manteniendo:
-- - CompanySettings (configuración de la empresa)
-- - User (usuarios del sistema)
-- - Session (sesiones de autenticación)
-- - PickupLocation (ubicaciones de recogida)
-- =============================================================================
-- IMPORTANTE: Ejecutar este script antes de subir al VPS
-- Hacer backup primero: mysqldump -u usuario -p rentcar_db > backup.sql
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Limpiar tablas de relaciones (junction tables) primero
TRUNCATE TABLE `RentalCustomer`;
TRUNCATE TABLE `ReservationCustomer`;

-- Limpiar tablas dependientes
TRUNCATE TABLE `Payment`;
TRUNCATE TABLE `Damage`;
TRUNCATE TABLE `Commission`;

-- Limpiar tablas de vehículos
TRUNCATE TABLE `VehicleImage`;
TRUNCATE TABLE `Maintenance`;
TRUNCATE TABLE `Expense`;

-- Limpiar tablas principales de transacciones
TRUNCATE TABLE `Rental`;
TRUNCATE TABLE `Reservation`;

-- Limpiar vehículos
TRUNCATE TABLE `Vehicle`;

-- Limpiar clientes
TRUNCATE TABLE `Customer`;

-- Limpiar contenido de marketing
TRUNCATE TABLE `Testimonial`;
TRUNCATE TABLE `Banner`;

-- Limpiar logs de auditoría
TRUNCATE TABLE `AuditLog`;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- Verificar que se mantuvieron los datos importantes
-- =============================================================================
SELECT 'CompanySettings' as tabla, COUNT(*) as registros FROM `CompanySettings`
UNION ALL
SELECT 'User' as tabla, COUNT(*) as registros FROM `User`
UNION ALL
SELECT 'Session' as tabla, COUNT(*) as registros FROM `Session`
UNION ALL
SELECT 'PickupLocation' as tabla, COUNT(*) as registros FROM `PickupLocation`;

-- =============================================================================
-- Verificar que se limpiaron las tablas transaccionales
-- =============================================================================
SELECT 'Vehicle' as tabla, COUNT(*) as registros FROM `Vehicle`
UNION ALL
SELECT 'Reservation' as tabla, COUNT(*) as registros FROM `Reservation`
UNION ALL
SELECT 'Rental' as tabla, COUNT(*) as registros FROM `Rental`
UNION ALL
SELECT 'Customer' as tabla, COUNT(*) as registros FROM `Customer`
UNION ALL
SELECT 'Payment' as tabla, COUNT(*) as registros FROM `Payment`;
