"use client";
import { useState, useEffect } from "react";
import { Empleado } from "../../models";
import { useEmpleados } from "../../hooks/useEmpleados";
import { jornadaService, employeeService } from "../../services";

// Hacemos la página pública eliminando cualquier verificación de autenticación
export default function Movimientos() {
  const [cedula, setCedula] = useState<string>('');
  const [empleado, setEmpleado] = useState<Empleado | null>(null);
  const [error, setError] = useState<string>('');
  const [registrando, setRegistrando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string>('');

  const { empleados, cargos, departamentos, getNombreCargo, getNombreDepartamento } = useEmpleados();


  const buscarEmpleado = async (): Promise<void> => {
    try {
      const [asignacionesResponse, jornadaResponse] = await Promise.all([
        jornadaService.getEmpleadoJornada(),
        jornadaService.getRegistroJornada(new Date().toISOString().split('T')[0])
      ]);

      const empleadoEncontrado = empleados.find((emp: Empleado) =>
        emp.cedula.replace(/[-\s]/g, '') === cedula.replace(/[-\s]/g, '') ||
        emp.inss === cedula
      );

      if (empleadoEncontrado) {
        const tieneJornadaAsignada = asignacionesResponse.some(
          (asignacion) => asignacion.id_empleado === empleadoEncontrado.id && asignacion.activo
        );

        const registroHoy = jornadaResponse.data.find(
          (registro) => registro.empleado.id === empleadoEncontrado.id
        );

        setEmpleado({
          ...empleadoEncontrado,
          tiene_jornada_asignada: tieneJornadaAsignada,
          estado: registroHoy
            ? registroHoy.salida
              ? 'Completo'
              : registroHoy.entrada
              ? 'En Jornada'
              : 'Pendiente'
            : 'Pendiente'
        });
        setError('');
      } else {
        setEmpleado(null);
        setError('Empleado no encontrado');
        setTimeout(() => {
          setError('');
        }, 3000);
      }
    } catch (error) {
      console.error('Error al buscar empleado:', error);
      setError('Error al buscar empleado');
      setTimeout(() => {
        setError('');
      }, 3000);
    }
  };

  const registrarMovimiento = async (tipo: 'entrada' | 'salida') => {
    if (!empleado) return;

    if (!empleado.tiene_jornada_asignada) {
      setError('No se puede registrar movimiento. El empleado no tiene una jornada asignada.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setRegistrando(true);
    try {
      const service = tipo === 'entrada' ? employeeService.registrarEntrada : employeeService.registrarSalida;
      const data = await service(empleado.id);

      setMensajeExito(data.message || `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} registrada exitosamente`);
    } catch (error) {
      console.error(`Error al registrar ${tipo}:`, error);
      setError(error instanceof Error ? error.message : `Error al registrar ${tipo}`);
    } finally {
      setRegistrando(false);
      setCedula('');
      setEmpleado(null);

      // Limpiar mensajes después de 3 segundos
      setTimeout(() => {
        setError('');
        setMensajeExito('');

        const input = document.getElementById('cedula-input');
        if (input) {
          input.focus();
        }
      }, 3000);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setCedula(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    buscarEmpleado();
  };

  useEffect(() => {
    const input = document.getElementById('cedula-input');
    if (input) {
      input.focus();
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-boxdark">
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark w-full max-w-xl mx-4">
        <div className="p-6.5">
          <form onSubmit={handleSubmit}>
            <div className="mb-4.5">
              <label className="mb-2.5 block text-black dark:text-white text-center">
                Escanear Cédula
              </label>
              <input
                id="cedula-input"
                type="text"
                placeholder="Escanee o ingrese el número de cédula"
                value={cedula}
                onChange={handleInputChange}
                maxLength={14}
                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                autoComplete="off"
              />
            </div>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-danger text-white rounded">
              {error}
            </div>
          )}

          {mensajeExito && (
            <div className="mt-4 p-4 bg-success text-white rounded">
              {mensajeExito}
            </div>
          )}

          {empleado && (
            <div className="mt-4 p-4 bg-success/10 rounded">
              <h3 className="text-lg font-semibold mb-2">Empleado Encontrado:</h3>
              <p><strong>Nombre:</strong> {empleado.name} {empleado.primer_apellido}</p>
              <p><strong>Cédula:</strong> {empleado.cedula}</p>
              <p><strong>Departamento:</strong> {getNombreDepartamento(empleado.id_departamento)}</p>
              <p><strong>Cargo:</strong> {getNombreCargo(empleado.id_cargo)}</p>
              <p><strong>Estado:</strong> 
                <span className={`inline-flex rounded-full bg-opacity-10 py-1 px-3 text-sm font-medium ${(empleado as any).estado === 'Completo' ? 'bg-success text-success' : (empleado as any).estado === 'En Jornada' ? 'bg-info text-info' : 'bg-warning text-warning'}`}>
                  {(empleado as any).estado}
                </span>
              </p>
              {!empleado.tiene_jornada_asignada && (
                <div className="mt-2 p-2 bg-warning/20 text-warning rounded">
                  <p className="text-sm">⚠️ Este empleado no tiene una jornada asignada. No se pueden registrar movimientos.</p>
                </div>
              )}
              <div className="mt-4 flex gap-4">
                <button
                  onClick={() => registrarMovimiento('entrada')}
                  disabled={registrando || !empleado.tiene_jornada_asignada}
                  className="py-2 px-4 bg-success text-white rounded hover:bg-success/80 transition-colors disabled:opacity-50"
                >
                  {registrando ? 'Registrando...' : 'Registrar Entrada'}
                </button>
                <button
                  onClick={() => registrarMovimiento('salida')}
                  disabled={registrando || !empleado.tiene_jornada_asignada}
                  className="py-2 px-4 bg-danger text-white rounded hover:bg-danger/80 transition-colors disabled:opacity-50"
                >
                  {registrando ? 'Registrando...' : 'Registrar Salida'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
