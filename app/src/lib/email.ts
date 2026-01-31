import nodemailer from "nodemailer"
import prisma from "./prisma"

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })
}

// Get company settings for email templates
const getCompanySettings = async () => {
  const settings = await prisma.companySettings.findFirst()
  return settings || {
    companyName: "Rent Car",
    email: "",
    phone: "",
    primaryColor: "#F59E0B",
    currencySymbol: "RD$",
  }
}

// Format currency
const formatCurrency = (amount: number, symbol: string = "RD$") => {
  return `${symbol}${amount.toLocaleString("es-DO", { minimumFractionDigits: 2 })}`
}

// Format date
const formatDate = (date: Date | string) => {
  const d = new Date(date)
  return d.toLocaleDateString("es-DO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

// Base email template
const getEmailTemplate = (content: string, settings: Awaited<ReturnType<typeof getCompanySettings>>) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${settings.companyName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: ${settings.primaryColor}; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">${settings.companyName}</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; padding: 20px; text-align: center;">
              <p style="color: #9ca3af; margin: 0; font-size: 14px;">
                ${settings.companyName}
              </p>
              ${settings.phone ? `<p style="color: #9ca3af; margin: 5px 0; font-size: 14px;">Tel: ${settings.phone}</p>` : ""}
              ${settings.email ? `<p style="color: #9ca3af; margin: 5px 0; font-size: 14px;">${settings.email}</p>` : ""}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

// Send email to company admin
const sendToAdmin = async (subject: string, html: string) => {
  const settings = await getCompanySettings()

  if (!settings.email) {
    console.log("No company email configured, skipping admin notification")
    return false
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.log("SMTP not configured, skipping email notification")
    return false
  }

  try {
    const transporter = createTransporter()
    await transporter.sendMail({
      from: `"${settings.companyName}" <${process.env.SMTP_USER}>`,
      to: settings.email,
      subject,
      html: getEmailTemplate(html, settings),
    })
    console.log(`Email sent to admin: ${subject}`)
    return true
  } catch (error) {
    console.error("Error sending email to admin:", error)
    return false
  }
}

// Send email to customer
const sendToCustomer = async (customerEmail: string, subject: string, html: string) => {
  const settings = await getCompanySettings()

  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.log("SMTP not configured, skipping email notification")
    return false
  }

  try {
    const transporter = createTransporter()
    await transporter.sendMail({
      from: `"${settings.companyName}" <${process.env.SMTP_USER}>`,
      to: customerEmail,
      subject,
      html: getEmailTemplate(html, settings),
    })
    console.log(`Email sent to customer: ${subject}`)
    return true
  } catch (error) {
    console.error("Error sending email to customer:", error)
    return false
  }
}

// Notification for new reservation
export const sendReservationNotification = async (reservation: {
  reservationCode: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  vehicleName: string
  startDate: Date | string
  endDate: Date | string
  totalDays: number
  totalAmount: number
  pickupLocation: string
}) => {
  const settings = await getCompanySettings()
  const currencySymbol = settings.currencySymbol || "RD$"

  // Email content for admin
  const adminContent = `
    <h2 style="color: #1f2937; margin-top: 0;">Nueva Reservacion</h2>
    <p style="color: #4b5563;">Se ha recibido una nueva reservacion con los siguientes detalles:</p>

    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280; width: 40%;">Codigo:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-weight: bold;">${reservation.reservationCode}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Cliente:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${reservation.customerName}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Email:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${reservation.customerEmail}</td>
      </tr>
      ${reservation.customerPhone ? `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Telefono:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${reservation.customerPhone}</td>
      </tr>
      ` : ""}
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Vehiculo:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${reservation.vehicleName}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Fecha de recogida:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${formatDate(reservation.startDate)}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Fecha de devolucion:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${formatDate(reservation.endDate)}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Duracion:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${reservation.totalDays} dia(s)</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Lugar de recogida:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${reservation.pickupLocation}</td>
      </tr>
      <tr>
        <td style="padding: 10px; color: #6b7280; font-weight: bold;">Total:</td>
        <td style="padding: 10px; color: ${settings.primaryColor}; font-weight: bold; font-size: 18px;">${formatCurrency(reservation.totalAmount, currencySymbol)}</td>
      </tr>
    </table>

    <p style="color: #4b5563; margin-bottom: 0;">Ingresa al panel de administracion para gestionar esta reservacion.</p>
  `

  // Email content for customer
  const customerContent = `
    <h2 style="color: #1f2937; margin-top: 0;">Confirmacion de Reservacion</h2>
    <p style="color: #4b5563;">Hola ${reservation.customerName},</p>
    <p style="color: #4b5563;">Tu reservacion ha sido recibida exitosamente. Aqui estan los detalles:</p>

    <div style="background-color: #fef3c7; border-left: 4px solid ${settings.primaryColor}; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #1f2937; font-weight: bold;">Codigo de Reservacion:</p>
      <p style="margin: 5px 0 0; color: ${settings.primaryColor}; font-size: 24px; font-weight: bold;">${reservation.reservationCode}</p>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280; width: 40%;">Vehiculo:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-weight: bold;">${reservation.vehicleName}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Fecha de recogida:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${formatDate(reservation.startDate)}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Fecha de devolucion:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${formatDate(reservation.endDate)}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Duracion:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${reservation.totalDays} dia(s)</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Lugar de recogida:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${reservation.pickupLocation}</td>
      </tr>
      <tr>
        <td style="padding: 10px; color: #6b7280; font-weight: bold;">Total a pagar:</td>
        <td style="padding: 10px; color: ${settings.primaryColor}; font-weight: bold; font-size: 18px;">${formatCurrency(reservation.totalAmount, currencySymbol)}</td>
      </tr>
    </table>

    <p style="color: #4b5563;">Nos pondremos en contacto contigo para confirmar tu reservacion.</p>
    <p style="color: #4b5563; margin-bottom: 0;">Gracias por elegirnos!</p>
  `

  // Send both emails
  await Promise.all([
    sendToAdmin(`Nueva Reservacion - ${reservation.reservationCode}`, adminContent),
    sendToCustomer(reservation.customerEmail, `Confirmacion de Reservacion - ${reservation.reservationCode}`, customerContent),
  ])
}

// Notification for new rental
export const sendRentalNotification = async (rental: {
  contractNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  vehicleName: string
  licensePlate?: string
  startDate: Date | string
  expectedEndDate: Date | string
  totalDays: number
  dailyRate: number
  totalAmount: number
  depositAmount: number
  pickupLocation: string
  agentName?: string
}) => {
  const settings = await getCompanySettings()
  const currencySymbol = settings.currencySymbol || "RD$"

  // Email content for admin
  const adminContent = `
    <h2 style="color: #1f2937; margin-top: 0;">Nueva Renta Registrada</h2>
    <p style="color: #4b5563;">Se ha registrado una nueva renta con los siguientes detalles:</p>

    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280; width: 40%;">No. Contrato:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-weight: bold;">${rental.contractNumber}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Cliente:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${rental.customerName}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Email:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${rental.customerEmail}</td>
      </tr>
      ${rental.customerPhone ? `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Telefono:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${rental.customerPhone}</td>
      </tr>
      ` : ""}
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Vehiculo:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${rental.vehicleName}</td>
      </tr>
      ${rental.licensePlate ? `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Placa:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${rental.licensePlate}</td>
      </tr>
      ` : ""}
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Fecha de inicio:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${formatDate(rental.startDate)}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Fecha de devolucion:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${formatDate(rental.expectedEndDate)}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Duracion:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${rental.totalDays} dia(s)</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Tarifa diaria:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${formatCurrency(rental.dailyRate, currencySymbol)}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Deposito:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${formatCurrency(rental.depositAmount, currencySymbol)}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Lugar de recogida:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${rental.pickupLocation}</td>
      </tr>
      ${rental.agentName ? `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Agente:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${rental.agentName}</td>
      </tr>
      ` : ""}
      <tr>
        <td style="padding: 10px; color: #6b7280; font-weight: bold;">Total:</td>
        <td style="padding: 10px; color: ${settings.primaryColor}; font-weight: bold; font-size: 18px;">${formatCurrency(rental.totalAmount, currencySymbol)}</td>
      </tr>
    </table>
  `

  // Email content for customer
  const customerContent = `
    <h2 style="color: #1f2937; margin-top: 0;">Contrato de Renta</h2>
    <p style="color: #4b5563;">Hola ${rental.customerName},</p>
    <p style="color: #4b5563;">Tu renta ha sido registrada exitosamente. Aqui estan los detalles de tu contrato:</p>

    <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #1f2937; font-weight: bold;">Numero de Contrato:</p>
      <p style="margin: 5px 0 0; color: #10b981; font-size: 24px; font-weight: bold;">${rental.contractNumber}</p>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280; width: 40%;">Vehiculo:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-weight: bold;">${rental.vehicleName}</td>
      </tr>
      ${rental.licensePlate ? `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Placa:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${rental.licensePlate}</td>
      </tr>
      ` : ""}
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Fecha de inicio:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${formatDate(rental.startDate)}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Fecha de devolucion:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${formatDate(rental.expectedEndDate)}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Duracion:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${rental.totalDays} dia(s)</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Tarifa diaria:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${formatCurrency(rental.dailyRate, currencySymbol)}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Deposito:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${formatCurrency(rental.depositAmount, currencySymbol)}</td>
      </tr>
      <tr>
        <td style="padding: 10px; color: #6b7280; font-weight: bold;">Total:</td>
        <td style="padding: 10px; color: ${settings.primaryColor}; font-weight: bold; font-size: 18px;">${formatCurrency(rental.totalAmount, currencySymbol)}</td>
      </tr>
    </table>

    <p style="color: #4b5563;">Recuerda devolver el vehiculo en la fecha acordada para evitar cargos adicionales.</p>
    <p style="color: #4b5563; margin-bottom: 0;">Gracias por tu preferencia!</p>
  `

  // Send both emails
  await Promise.all([
    sendToAdmin(`Nueva Renta - ${rental.contractNumber}`, adminContent),
    sendToCustomer(rental.customerEmail, `Contrato de Renta - ${rental.contractNumber}`, customerContent),
  ])
}
