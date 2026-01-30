export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Términos y Condiciones</h1>

        <div className="bg-white rounded-lg shadow p-8 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Aceptación de Términos</h2>
            <p className="text-gray-600">
              Al utilizar nuestros servicios de alquiler de vehículos, aceptas estos términos
              y condiciones en su totalidad. Si no estás de acuerdo, no utilices nuestros servicios.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Requisitos del Conductor</h2>
            <p className="text-gray-600">
              El conductor debe tener al menos 21 años de edad, poseer una licencia de conducir
              válida y presentar documentación de identificación vigente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Uso del Vehículo</h2>
            <p className="text-gray-600">
              El vehículo debe ser utilizado únicamente para fines legales. Está prohibido
              conducir bajo la influencia de alcohol o drogas, y el vehículo no puede ser
              subarrendado a terceros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Responsabilidad</h2>
            <p className="text-gray-600">
              El arrendatario es responsable de cualquier daño al vehículo durante el período
              de alquiler, así como de las multas de tránsito incurridas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Cancelaciones</h2>
            <p className="text-gray-600">
              Las cancelaciones realizadas con más de 24 horas de anticipación recibirán
              reembolso completo. Cancelaciones tardías pueden estar sujetas a cargos.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
