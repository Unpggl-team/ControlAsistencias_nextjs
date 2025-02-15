"use client";
import { useState, useEffect } from "react";

interface Empleado {
  id: number;
  name: string;
  primer_apellido: string;
  cedula: string;
  id_departamento: number;
  id_cargo: string;
  inss: string;
}

interface Departamento {
  value: number;
  option: string;
}

// Hacemos la página pública eliminando cualquier verificación de autenticación
export default function Movimientos() {
  const [cedula, setCedula] = useState<string>('');
  const [empleado, setEmpleado] = useState<Empleado | null>(null);
  const [error, setError] = useState<string>('');
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [registrando, setRegistrando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string>('');

  const obtenerDepartamentos = async () => {
    try {
      const response = await fetch('/api/departamentos');
      const { data } = await response.json();
      setDepartamentos(data);
    } catch (error) {
      console.error('Error al obtener departamentos:', error);
    }
  };

  const buscarEmpleado = async (): Promise<void> => {
    try {
      const response = await fetch('/api/lista_empleados');
      const { data } = await response.json();
      
      const empleadoEncontrado = data.find((emp: Empleado) => 
        emp.cedula.replace(/[-\s]/g, '') === cedula.replace(/[-\s]/g, '') ||
        emp.inss === cedula
      );

      if (empleadoEncontrado) {
        setEmpleado(empleadoEncontrado);
        setError('');
      } else {
        setEmpleado(null);
        setError('Empleado no encontrado');
        // Limpiar mensaje de error después de 3 segundos
        setTimeout(() => {
          setError('');
        }, 3000);
      }
    } catch (error) {
      console.error('Error al buscar empleado:', error);
      setError('Error al buscar empleado');
      // Limpiar mensaje de error después de 3 segundos
      setTimeout(() => {
        setError('');
      }, 3000);
    }
  };

  const registrarMovimiento = async (tipo: 'entrada' | 'salida') => {
    if (!empleado) return;
    
    setRegistrando(true);
    try {
        const response = await fetch(`/api/registrar_${tipo}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id_empleado: empleado.id
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `Error al registrar ${tipo}`);
        }
        
        // Mostrar mensaje de éxito desde la respuesta de la API
        setMensajeExito(data.message || `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} registrada exitosamente`);
        
        // Limpiar el formulario después de 3 segundos
        setTimeout(() => {
            setCedula('');
            setEmpleado(null);
            setMensajeExito('');
            
            // Enfocar el input
            const input = document.getElementById('cedula-input');
            if (input) {
                input.focus();
            }
        }, 3000);

    } catch (error) {
        console.error(`Error al registrar ${tipo}:`, error);
        setError(error instanceof Error ? error.message : `Error al registrar ${tipo}`);
        // Limpiar mensaje de error después de 3 segundos
        setTimeout(() => {
          setError('');
        }, 3000);
    } finally {
        setRegistrando(false);
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
    obtenerDepartamentos();
  }, []);

  const getNombreDepartamento = (value: number) => {
    const departamento = departamentos.find(dep => dep.value === value);
    return departamento ? departamento.option : value;
  };

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
              <p><strong>Cargo:</strong> {empleado.id_cargo}</p>
              
              <div className="mt-4 flex gap-4">
                <button
                  onClick={() => registrarMovimiento('entrada')}
                  disabled={registrando}
                  className="py-2 px-4 bg-success text-white rounded hover:bg-success/80 transition-colors disabled:opacity-50"
                >
                  {registrando ? 'Registrando...' : 'Registrar Entrada'}
                </button>
                <button
                  onClick={() => registrarMovimiento('salida')}
                  disabled={registrando}
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
