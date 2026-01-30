"use client"

import { useState } from "react"
import { useSettingsStore } from "@/stores/settingsStore"
import { Button, Input, TextArea } from "@/components/ui"
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageCircle,
  Send,
  CheckCircle,
} from "lucide-react"

export default function ContactoPage() {
  const { settings } = useSettingsStore()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulación de envío - en producción conectar con API de email
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setSubmitted(true)
    setIsSubmitting(false)
  }

  const contactInfo = [
    {
      icon: MapPin,
      title: "Dirección",
      content: settings.address || "Av. Pedro A. Rivera Km 1, La Vega",
      subContent: settings.city || "República Dominicana",
    },
    {
      icon: Phone,
      title: "Teléfono",
      content: settings.phone || "809-786-8457",
      link: `tel:${settings.phone?.replace(/\D/g, "") || "8097868457"}`,
    },
    {
      icon: Mail,
      title: "Email",
      content: settings.email || "info@tokiorentcar.com",
      link: `mailto:${settings.email || "info@tokiorentcar.com"}`,
    },
    {
      icon: Clock,
      title: "Horario",
      content: "Lunes - Sábado: 8:00 AM - 6:00 PM",
      subContent: "Domingo: 9:00 AM - 2:00 PM",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section
        className="py-16 text-white"
        style={{
          background: `linear-gradient(135deg, ${settings.secondaryColor} 0%, ${settings.accentColor} 100%)`,
        }}
      >
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contáctanos</h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            Estamos aquí para ayudarte. Contáctanos por cualquier consulta sobre nuestros servicios.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Información de Contacto
              </h2>

              <div className="space-y-6">
                {contactInfo.map((item, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${settings.primaryColor}20` }}
                    >
                      <item.icon
                        className="h-6 w-6"
                        style={{ color: settings.primaryColor }}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      {item.link ? (
                        <a
                          href={item.link}
                          className="text-gray-600 hover:text-gray-900 transition"
                        >
                          {item.content}
                        </a>
                      ) : (
                        <p className="text-gray-600">{item.content}</p>
                      )}
                      {item.subContent && (
                        <p className="text-gray-500 text-sm">{item.subContent}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* WhatsApp Button */}
              {settings.whatsapp && (
                <div className="mt-8">
                  <a
                    href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}?text=Hola, me gustaría obtener información sobre sus servicios de renta de vehículos.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Escríbenos por WhatsApp
                  </a>
                </div>
              )}

              {/* Map placeholder */}
              <div className="mt-8">
                <h3 className="font-semibold text-gray-900 mb-4">Ubicación</h3>
                <div className="w-full h-64 bg-gray-200 rounded-xl flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MapPin className="h-12 w-12 mx-auto mb-2" />
                    <p>Mapa de ubicación</p>
                    {settings.googleMapsUrl && (
                      <a
                        href={settings.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:underline"
                        style={{ color: settings.primaryColor }}
                      >
                        Ver en Google Maps
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Envíanos un Mensaje
                </h2>

                {submitted ? (
                  <div className="text-center py-12">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{ backgroundColor: `${settings.primaryColor}20` }}
                    >
                      <CheckCircle
                        className="h-8 w-8"
                        style={{ color: settings.primaryColor }}
                      />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      ¡Mensaje Enviado!
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Gracias por contactarnos. Te responderemos lo antes posible.
                    </p>
                    <Button onClick={() => setSubmitted(false)}>
                      Enviar otro mensaje
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Nombre completo"
                        placeholder="Tu nombre"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                      <Input
                        label="Teléfono"
                        placeholder="809-000-0000"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    </div>

                    <Input
                      label="Email"
                      type="email"
                      placeholder="tu@email.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />

                    <Input
                      label="Asunto"
                      placeholder="¿En qué podemos ayudarte?"
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      required
                    />

                    <TextArea
                      label="Mensaje"
                      placeholder="Escribe tu mensaje aquí..."
                      rows={5}
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      required
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      isLoading={isSubmitting}
                      rightIcon={<Send className="h-4 w-4" />}
                    >
                      Enviar Mensaje
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
