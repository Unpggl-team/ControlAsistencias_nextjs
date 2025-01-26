"use client";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import TableThree from "@/components/Tables/TableThree";
import { useEffect, useState } from "react";

export default function Empleados() {
  const [empleados, setEmpleados] = useState([]);

  useEffect(() => {
    const fetchEmpleados = async () => {
      try {
        const response = await fetch('http://test.uncpggl.edu.ni:3011/api/Datos_personal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            'Authorization': 'Bearer 13217|q0Sl6X9kuRCbK9NhpH3ZcZSXapbyBQcVWUceIYY7'

          }) // Envía un objeto vacío o los parámetros necesarios
        });
        const data = await response.json();
        setEmpleados(data);
      } catch (error) {
        console.error('Error al obtener los datos:', error);
      }
    };

    fetchEmpleados();
  }, []);

  return (
    <DefaultLayout>
     <TableThree 
       columns={[
         { header: 'Nombre', key: 'nombre', minWidth: '150px' },
         { header: 'Cargo', key: 'cargo', minWidth: '120px' },
         { header: 'Departamento', key: 'departamento', minWidth: '150px' },
         { header: 'Email', key: 'email', minWidth: '200px' }
       ]}
       data={empleados}
     />
    </DefaultLayout>
  );
}
