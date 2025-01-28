import ECommerce from "@/components/Dashboard/E-commerce";
import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title:
    "Asistencia de Empleados",
  description: "Asistencia de Empleados UNCPGGL",
};

export default function Home() {
  if (typeof window !== 'undefined') {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    
    if (!isAuthenticated) {
      redirect('/auth/signin');
    }
  }

  return (
    <>
      <DefaultLayout>
        <ECommerce />
      </DefaultLayout>
    </>
  );
}
