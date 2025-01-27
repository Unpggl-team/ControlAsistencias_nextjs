"use client";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import TableThree from "@/components/Tables/TableThree";
import { useEffect, useState } from "react";

export default function Empleados() {
  const [empleados, setEmpleados] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const fetchEmpleados = async () => {
      try {
        const response = await fetch('/api/lista_empleados');
        const { data } = await response.json();
        
        // Transformar los datos al formato requerido
        const empleadosFormateados = data.map((empleado: any) => ({
          id: empleado.id,
          nombre: `${empleado.name} ${empleado.primer_apellido} ${empleado.segundo_apellido || ''}`.trim(),
          cargo: empleado.id_cargo.toString(),
          departamento: empleado.id_departamento.toString(),
          email: empleado.correo || 'No disponible',
          cedula: empleado.cedula,
          telefono: empleado.telefono || 'No disponible',
          direccion: empleado.direccion,
          inss: empleado.inss
        }));

        setEmpleados(empleadosFormateados);
      } catch (error) {
        console.error('Error al obtener los datos:', error);
      }
    };

    fetchEmpleados();
  }, []);

  // Obtener los índices del primer y último elemento de la página actual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = empleados.slice(indexOfFirstItem, indexOfLastItem);

  // Cambiar de página
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const totalPages = Math.ceil(empleados.length / itemsPerPage);

  return (
    <DefaultLayout>
      <div className="flex flex-col h-screen">
        <div className="flex-grow overflow-auto">
          <TableThree 
            columns={[
              { header: 'Id', key: 'id', minWidth: '200px' },
              { header: 'Nombre', key: 'nombre', minWidth: '200px' },
              { header: 'Cédula', key: 'cedula', minWidth: '150px' },
              { header: 'INSS', key: 'inss', minWidth: '100px' },
              { header: 'Email', key: 'email', minWidth: '200px' },
              { header: 'Teléfono', key: 'telefono', minWidth: '120px' },
              { header: 'Dirección', key: 'direccion', minWidth: '300px' }
            ]}
            data={currentItems}
          />
        </div>
        
        <div className="flex justify-center gap-2 py-4 bg-white border-t">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Anterior
          </button>
          
          <span className="px-4 py-2 text-sm font-medium text-gray-700">
            Página {currentPage} de {totalPages}
          </span>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>
    </DefaultLayout>
  );
}
