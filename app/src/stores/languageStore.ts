import { create } from "zustand"
import { persist } from "zustand/middleware"

type Language = "es" | "en"

// Translations dictionary
export const translations = {
  es: {
    // Navigation
    "nav.dashboard": "Panel",
    "nav.vehicles": "Vehículos",
    "nav.reservations": "Reservaciones",
    "nav.rentals": "Rentas",
    "nav.customers": "Clientes",
    "nav.users": "Usuarios",
    "nav.expenses": "Gastos",
    "nav.commissions": "Comisiones",
    "nav.reports": "Reportes",
    "nav.locations": "Ubicaciones",
    "nav.settings": "Configuración",
    "nav.logout": "Cerrar Sesión",

    // Common
    "common.search": "Buscar",
    "common.add": "Agregar",
    "common.edit": "Editar",
    "common.delete": "Eliminar",
    "common.save": "Guardar",
    "common.cancel": "Cancelar",
    "common.confirm": "Confirmar",
    "common.loading": "Cargando...",
    "common.noData": "No hay datos",
    "common.actions": "Acciones",
    "common.status": "Estado",
    "common.active": "Activo",
    "common.inactive": "Inactivo",
    "common.all": "Todos",
    "common.new": "Nuevo",
    "common.view": "Ver",
    "common.close": "Cerrar",
    "common.yes": "Sí",
    "common.no": "No",
    "common.date": "Fecha",
    "common.from": "Desde",
    "common.to": "Hasta",
    "common.total": "Total",
    "common.subtotal": "Subtotal",
    "common.taxes": "Impuestos",
    "common.notes": "Notas",
    "common.details": "Detalles",

    // Dashboard
    "dashboard.title": "Panel de Control",
    "dashboard.welcome": "Bienvenido",
    "dashboard.activeRentals": "Rentas Activas",
    "dashboard.monthlyRevenue": "Ingresos del Mes",
    "dashboard.availableVehicles": "Vehículos Disponibles",
    "dashboard.pendingReservations": "Reservaciones Pendientes",
    "dashboard.recentActivity": "Actividad Reciente",
    "dashboard.quickActions": "Acciones Rápidas",

    // Vehicles
    "vehicles.title": "Vehículos",
    "vehicles.subtitle": "Gestiona tu flota de vehículos",
    "vehicles.addNew": "Nuevo Vehículo",
    "vehicles.addVehicle": "Agregar Vehículo",
    "vehicles.vehicle": "Vehículo",
    "vehicles.brand": "Marca",
    "vehicles.model": "Modelo",
    "vehicles.year": "Año",
    "vehicles.plate": "Placa",
    "vehicles.licensePlate": "Placa",
    "vehicles.dailyRate": "Precio/Día",
    "vehicles.status": "Estado",
    "vehicles.available": "Disponible",
    "vehicles.rented": "Rentado",
    "vehicles.maintenance": "Mantenimiento",
    "vehicles.reserved": "Reservado",
    "vehicles.category": "Categoría",
    "vehicles.transmission": "Transmisión",
    "vehicles.fuel": "Combustible",
    "vehicles.seats": "Asientos",
    "vehicles.doors": "Puertas",
    "vehicles.mileage": "Kilometraje",
    "vehicles.deposit": "Depósito",
    "vehicles.noVehicles": "No hay vehículos",
    "vehicles.addFirstVehicle": "Comienza agregando tu primer vehículo",
    "vehicles.searchPlaceholder": "Buscar por marca, modelo o placa...",

    // Customers
    "customers.title": "Clientes",
    "customers.addNew": "Nuevo Cliente",
    "customers.firstName": "Nombre",
    "customers.lastName": "Apellido",
    "customers.email": "Email",
    "customers.phone": "Teléfono",
    "customers.idType": "Tipo de Documento",
    "customers.idNumber": "Número de Documento",
    "customers.license": "Licencia",
    "customers.licenseExpiry": "Vencimiento Licencia",
    "customers.address": "Dirección",
    "customers.city": "Ciudad",
    "customers.country": "País",
    "customers.emergencyContact": "Contacto de Emergencia",

    // Rentals
    "rentals.title": "Rentas",
    "rentals.newRental": "Nueva Renta",
    "rentals.contract": "Contrato",
    "rentals.customer": "Cliente",
    "rentals.vehicle": "Vehículo",
    "rentals.startDate": "Fecha Inicio",
    "rentals.endDate": "Fecha Fin",
    "rentals.pickup": "Recogida",
    "rentals.dropoff": "Entrega",
    "rentals.days": "Días",
    "rentals.active": "Activa",
    "rentals.completed": "Completada",
    "rentals.cancelled": "Cancelada",
    "rentals.overdue": "Vencida",

    // Settings
    "settings.title": "Configuración",
    "settings.company": "Información de Empresa",
    "settings.contact": "Contacto",
    "settings.social": "Redes Sociales",
    "settings.business": "Negocio",
    "settings.policies": "Políticas",
    "settings.appearance": "Apariencia",
    "settings.language": "Idioma",
    "settings.theme": "Tema",
    "settings.light": "Claro",
    "settings.dark": "Oscuro",
    "settings.system": "Sistema",
    "settings.currency": "Moneda",

    // Messages
    "msg.saved": "Guardado exitosamente",
    "msg.deleted": "Eliminado exitosamente",
    "msg.error": "Ocurrió un error",
    "msg.confirmDelete": "¿Estás seguro de eliminar?",
    "msg.required": "Este campo es requerido",
    "msg.invalidEmail": "Email inválido",
    "msg.selectCustomer": "Por favor seleccione un cliente",
    "msg.selectVehicle": "Por favor seleccione un vehículo",
  },
  en: {
    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.vehicles": "Vehicles",
    "nav.reservations": "Reservations",
    "nav.rentals": "Rentals",
    "nav.customers": "Customers",
    "nav.users": "Users",
    "nav.expenses": "Expenses",
    "nav.commissions": "Commissions",
    "nav.reports": "Reports",
    "nav.locations": "Locations",
    "nav.settings": "Settings",
    "nav.logout": "Logout",

    // Common
    "common.search": "Search",
    "common.add": "Add",
    "common.edit": "Edit",
    "common.delete": "Delete",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.confirm": "Confirm",
    "common.loading": "Loading...",
    "common.noData": "No data",
    "common.actions": "Actions",
    "common.status": "Status",
    "common.active": "Active",
    "common.inactive": "Inactive",
    "common.all": "All",
    "common.new": "New",
    "common.view": "View",
    "common.close": "Close",
    "common.yes": "Yes",
    "common.no": "No",
    "common.date": "Date",
    "common.from": "From",
    "common.to": "To",
    "common.total": "Total",
    "common.subtotal": "Subtotal",
    "common.taxes": "Taxes",
    "common.notes": "Notes",
    "common.details": "Details",

    // Dashboard
    "dashboard.title": "Dashboard",
    "dashboard.welcome": "Welcome",
    "dashboard.activeRentals": "Active Rentals",
    "dashboard.monthlyRevenue": "Monthly Revenue",
    "dashboard.availableVehicles": "Available Vehicles",
    "dashboard.pendingReservations": "Pending Reservations",
    "dashboard.recentActivity": "Recent Activity",
    "dashboard.quickActions": "Quick Actions",

    // Vehicles
    "vehicles.title": "Vehicles",
    "vehicles.subtitle": "Manage your vehicle fleet",
    "vehicles.addNew": "New Vehicle",
    "vehicles.addVehicle": "Add Vehicle",
    "vehicles.vehicle": "Vehicle",
    "vehicles.brand": "Brand",
    "vehicles.model": "Model",
    "vehicles.year": "Year",
    "vehicles.plate": "Plate",
    "vehicles.licensePlate": "License Plate",
    "vehicles.dailyRate": "Daily Rate",
    "vehicles.status": "Status",
    "vehicles.available": "Available",
    "vehicles.rented": "Rented",
    "vehicles.maintenance": "Maintenance",
    "vehicles.reserved": "Reserved",
    "vehicles.category": "Category",
    "vehicles.transmission": "Transmission",
    "vehicles.fuel": "Fuel",
    "vehicles.seats": "Seats",
    "vehicles.doors": "Doors",
    "vehicles.mileage": "Mileage",
    "vehicles.deposit": "Deposit",
    "vehicles.noVehicles": "No vehicles",
    "vehicles.addFirstVehicle": "Start by adding your first vehicle",
    "vehicles.searchPlaceholder": "Search by brand, model or plate...",

    // Customers
    "customers.title": "Customers",
    "customers.addNew": "New Customer",
    "customers.firstName": "First Name",
    "customers.lastName": "Last Name",
    "customers.email": "Email",
    "customers.phone": "Phone",
    "customers.idType": "ID Type",
    "customers.idNumber": "ID Number",
    "customers.license": "License",
    "customers.licenseExpiry": "License Expiry",
    "customers.address": "Address",
    "customers.city": "City",
    "customers.country": "Country",
    "customers.emergencyContact": "Emergency Contact",

    // Rentals
    "rentals.title": "Rentals",
    "rentals.newRental": "New Rental",
    "rentals.contract": "Contract",
    "rentals.customer": "Customer",
    "rentals.vehicle": "Vehicle",
    "rentals.startDate": "Start Date",
    "rentals.endDate": "End Date",
    "rentals.pickup": "Pickup",
    "rentals.dropoff": "Dropoff",
    "rentals.days": "Days",
    "rentals.active": "Active",
    "rentals.completed": "Completed",
    "rentals.cancelled": "Cancelled",
    "rentals.overdue": "Overdue",

    // Settings
    "settings.title": "Settings",
    "settings.company": "Company Information",
    "settings.contact": "Contact",
    "settings.social": "Social Media",
    "settings.business": "Business",
    "settings.policies": "Policies",
    "settings.appearance": "Appearance",
    "settings.language": "Language",
    "settings.theme": "Theme",
    "settings.light": "Light",
    "settings.dark": "Dark",
    "settings.system": "System",
    "settings.currency": "Currency",

    // Messages
    "msg.saved": "Saved successfully",
    "msg.deleted": "Deleted successfully",
    "msg.error": "An error occurred",
    "msg.confirmDelete": "Are you sure you want to delete?",
    "msg.required": "This field is required",
    "msg.invalidEmail": "Invalid email",
    "msg.selectCustomer": "Please select a customer",
    "msg.selectVehicle": "Please select a vehicle",
  },
}

type TranslationKey = keyof typeof translations.es

interface LanguageState {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: TranslationKey) => string
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: "es",

      setLanguage: (language) => {
        set({ language })
      },

      t: (key) => {
        const { language } = get()
        return translations[language][key] || key
      },
    }),
    {
      name: "language-storage",
    }
  )
)
