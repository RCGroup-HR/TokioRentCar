export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Política de Privacidad</h1>

        <div className="bg-white rounded-lg shadow p-8 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Información que Recopilamos</h2>
            <p className="text-gray-600">
              Recopilamos información personal que nos proporcionas directamente, como nombre,
              correo electrónico, número de teléfono y documentos de identificación necesarios
              para el alquiler de vehículos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Uso de la Información</h2>
            <p className="text-gray-600">
              Utilizamos tu información para procesar reservaciones, gestionar alquileres,
              comunicarnos contigo sobre tu servicio y mejorar nuestra plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Protección de Datos</h2>
            <p className="text-gray-600">
              Implementamos medidas de seguridad técnicas y organizativas para proteger
              tu información personal contra acceso no autorizado, pérdida o alteración.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Contacto</h2>
            <p className="text-gray-600">
              Si tienes preguntas sobre esta política de privacidad, puedes contactarnos
              a través de nuestra página de contacto.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
