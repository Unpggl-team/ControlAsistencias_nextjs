'use client';
import { useState, useEffect } from 'react';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import { useRouter } from 'next/navigation';

interface ParametrosJornada {
  id?: number;
  hora_entrada_esperada: string;
  hora_salida_esperada: string;
  tolerancia_minutos: number;
  horas_laborales: number;
  activo?: boolean;
  fecha_creacion?: string;
}

export default function ParametrosJornadaPage() {
  const router = useRouter();
  const [parametros, setParametros] = useState<ParametrosJornada[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ParametrosJornada>({
    hora_entrada_esperada: '08:00',
    hora_salida_esperada: '17:00',
    tolerancia_minutos: 10,
    horas_laborales: 8
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);

  // Cargar los parámetros existentes
  useEffect(() => {
    const fetchParametros = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/parametros-jornada');
        if (!response.ok) {
          throw new Error('Error al cargar los parámetros');
        }
        const data = await response.json();
        if (data.data) {
          // Si solo hay un registro, convertirlo en array
          const parametrosArray = Array.isArray(data.data) ? data.data : [data.data];
          setParametros(parametrosArray.filter(Boolean));
        } else {
          setParametros([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        console.error('Error al cargar parámetros:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchParametros();
  }, []);

  // Manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'tolerancia_minutos' || name === 'horas_laborales' 
        ? parseFloat(value) 
        : value
    }));
  };

  // Crear nuevos parámetros
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch('/api/parametros-jornada', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Error al crear los parámetros');
      }

      const data = await response.json();
      setParametros(prev => [data.data, ...prev]);
      setFormData({
        hora_entrada_esperada: '08:00',
        hora_salida_esperada: '17:00',
        tolerancia_minutos: 10,
        horas_laborales: 8
      });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error al crear parámetros:', err);
    } finally {
      setLoading(false);
    }
  };

  // Actualizar parámetros existentes
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/parametros-jornada/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar los parámetros');
      }

      const data = await response.json();
      setParametros(prev => 
        prev.map(param => param.id === editingId ? data.data : param)
      );
      setFormData({
        hora_entrada_esperada: '08:00',
        hora_salida_esperada: '17:00',
        tolerancia_minutos: 10,
        horas_laborales: 8
      });
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error al actualizar parámetros:', err);
    } finally {
      setLoading(false);
    }
  };

  // Eliminar parámetros
  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar estos parámetros?')) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/parametros-jornada/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar los parámetros');
      }

      setParametros(prev => prev.filter(param => param.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error al eliminar parámetros:', err);
    } finally {
      setLoading(false);
    }
  };

  // Preparar formulario para edición
  const handleEdit = (parametro: ParametrosJornada) => {
    setFormData({
      hora_entrada_esperada: parametro.hora_entrada_esperada,
      hora_salida_esperada: parametro.hora_salida_esperada,
      tolerancia_minutos: parametro.tolerancia_minutos,
      horas_laborales: parametro.horas_laborales
    });
    setEditingId(parametro.id || null);
    setShowForm(true);
  };

  return (
    <DefaultLayout>
      <Breadcrumb pageName="Parámetros de Jornada" />

      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-title-md2 font-semibold text-black dark:text-white">
            Parámetros de Jornada Laboral
          </h2>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({
                hora_entrada_esperada: '08:00',
                hora_salida_esperada: '17:00',
                tolerancia_minutos: 10,
                horas_laborales: 8
              });
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-10 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
          >
            {showForm ? 'Cancelar' : 'Nuevo Parámetro'}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-danger bg-opacity-10 py-4 px-6 text-danger">
            {error}
          </div>
        )}

        {showForm && (
          <div className="mb-6 rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
            <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
              {editingId ? 'Editar Parámetro' : 'Nuevo Parámetro'}
            </h3>
            <form onSubmit={editingId ? handleUpdate : handleCreate}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2.5 block text-black dark:text-white">
                    Hora de Entrada Esperada
                  </label>
                  <input
                    type="time"
                    name="hora_entrada_esperada"
                    value={formData.hora_entrada_esperada}
                    onChange={handleChange}
                    required
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-2.5 block text-black dark:text-white">
                    Hora de Salida Esperada
                  </label>
                  <input
                    type="time"
                    name="hora_salida_esperada"
                    value={formData.hora_salida_esperada}
                    onChange={handleChange}
                    required
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-2.5 block text-black dark:text-white">
                    Tolerancia en Minutos
                  </label>
                  <input
                    type="number"
                    name="tolerancia_minutos"
                    value={formData.tolerancia_minutos}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-2.5 block text-black dark:text-white">
                    Horas Laborales
                  </label>
                  <input
                    type="number"
                    name="horas_laborales"
                    value={formData.horas_laborales}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.5"
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="inline-flex items-center justify-center rounded-md border border-stroke py-2 px-6 text-center font-medium text-black hover:bg-opacity-90 dark:border-strokedark dark:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-6 text-center font-medium text-white hover:bg-opacity-90"
                >
                  {loading ? 'Procesando...' : editingId ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="flex flex-col overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                  Hora Entrada
                </th>
                <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                  Hora Salida
                </th>
                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                  Tolerancia (min)
                </th>
                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                  Horas Laborales
                </th>
                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                  Estado
                </th>
                <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                  Fecha Creación
                </th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && !parametros.length ? (
                <tr>
                  <td colSpan={7} className="border-b border-[#eee] py-5 px-4 text-center dark:border-strokedark">
                    Cargando...
                  </td>
                </tr>
              ) : !parametros.length ? (
                <tr>
                  <td colSpan={7} className="border-b border-[#eee] py-5 px-4 text-center dark:border-strokedark">
                    No hay parámetros configurados
                  </td>
                </tr>
              ) : (
                parametros.map((parametro) => (
                  <tr key={parametro.id}>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      {parametro.hora_entrada_esperada}
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      {parametro.hora_salida_esperada}
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      {parametro.tolerancia_minutos}
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      {parametro.horas_laborales}
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <span className={`inline-block rounded py-1 px-3 text-sm font-medium ${parametro.activo ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`}>
                        {parametro.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      {parametro.fecha_creacion ? new Date(parametro.fecha_creacion).toLocaleDateString() : '-'}
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <div className="flex items-center space-x-3.5">
                        <button
                          onClick={() => handleEdit(parametro)}
                          className="hover:text-primary"
                        >
                          <svg
                            className="fill-current"
                            width="18"
                            height="18"
                            viewBox="0 0 18 18"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M8.99981 14.8219C3.43106 14.8219 0.674805 9.50624 0.562305 9.28124C0.47793 9.11249 0.47793 8.88749 0.562305 8.71874C0.674805 8.49374 3.43106 3.20624 8.99981 3.20624C14.5686 3.20624 17.3248 8.49374 17.4373 8.71874C17.5217 8.88749 17.5217 9.11249 17.4373 9.28124C17.3248 9.50624 14.5686 14.8219 8.99981 14.8219ZM1.85605 8.99999C2.4748 10.0406 4.89356 13.5562 8.99981 13.5562C13.1061 13.5562 15.5248 10.0406 16.1436 8.99999C15.5248 7.95936 13.1061 4.44374 8.99981 4.44374C4.89356 4.44374 2.4748 7.95936 1.85605 8.99999Z"
                              fill=""
                            />
                            <path
                              d="M9 11.3906C7.67812 11.3906 6.60938 10.3219 6.60938 9C6.60938 7.67813 7.67812 6.60938 9 6.60938C10.3219 6.60938 11.3906 7.67813 11.3906 9C11.3906 10.3219 10.3219 11.3906 9 11.3906ZM9 7.875C8.38125 7.875 7.875 8.38125 7.875 9C7.875 9.61875 8.38125 10.125 9 10.125C9.61875 10.125 10.125 9.61875 10.125 9C10.125 8.38125 9.61875 7.875 9 7.875Z"
                              fill=""
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(parametro.id!)}
                          className="hover:text-danger"
                        >
                          <svg
                            className="fill-current"
                            width="18"
                            height="18"
                            viewBox="0 0 18 18"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M13.7535 2.47502H11.5879V1.9969C11.5879 1.15315 10.9129 0.478149 10.0691 0.478149H7.90352C7.05977 0.478149 6.38477 1.15315 6.38477 1.9969V2.47502H4.21914C3.40352 2.47502 2.72852 3.15002 2.72852 3.96565V4.8094C2.72852 5.42815 3.09414 5.9344 3.62852 6.1594L4.07852 15.4688C4.13477 16.6219 5.09102 17.5219 6.24414 17.5219H11.7004C12.8535 17.5219 13.8098 16.6219 13.866 15.4688L14.3441 6.13127C14.8785 5.90627 15.2441 5.3719 15.2441 4.78127V3.93752C15.2441 3.15002 14.5691 2.47502 13.7535 2.47502ZM7.67852 1.9969C7.67852 1.85627 7.79102 1.74377 7.93164 1.74377H10.0973C10.2379 1.74377 10.3504 1.85627 10.3504 1.9969V2.47502H7.70664V1.9969H7.67852ZM4.02227 3.96565C4.02227 3.85315 4.10664 3.74065 4.24727 3.74065H13.7535C13.866 3.74065 13.9785 3.82502 13.9785 3.96565V4.8094C13.9785 4.9219 13.8941 5.0344 13.7535 5.0344H4.24727C4.13477 5.0344 4.02227 4.95002 4.02227 4.8094V3.96565ZM11.7285 16.2563H6.27227C5.79414 16.2563 5.40039 15.8906 5.37227 15.3844L4.95039 6.2719H13.0785L12.6566 15.3844C12.6004 15.8625 12.2066 16.2563 11.7285 16.2563Z"
                              fill=""
                            />
                            <path
                              d="M9.00039 9.11255C8.66289 9.11255 8.35352 9.3938 8.35352 9.75942V13.3313C8.35352 13.6688 8.63477 13.9782 9.00039 13.9782C9.33789 13.9782 9.64727 13.6969 9.64727 13.3313V9.75942C9.64727 9.3938 9.33789 9.11255 9.00039 9.11255Z"
                              fill=""
                            />
                            <path
                              d="M10.8789 9.7594C10.8789 9.42189 10.5977 9.11252 10.2602 9.11252C9.9227 9.11252 9.64145 9.39377 9.64145 9.7594V13.3313C9.64145 13.6688 9.9227 13.9782 10.2602 13.9782C10.5977 13.9782 10.8789 13.6969 10.8789 13.3313V9.7594Z"
                              fill=""
                            />
                            <path
                              d="M7.11855 9.7594C7.11855 9.42189 6.83731 9.11252 6.49981 9.11252C6.16231 9.11252 5.88105 9.39377 5.88105 9.7594V13.3313C5.88105 13.6688 6.16231 13.9782 6.49981 13.9782C6.83731 13.9782 7.11855 13.6969 7.11855 13.3313V9.7594Z"
                              fill=""
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DefaultLayout>
  );
}