"use client";
import ECommerce from "@/components/Dashboard/E-commerce";
import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
const ProtectedComponent = () => {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, router]);

  

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DefaultLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-black dark:text-white">
          ¡Bienvenido, {user?.nombres}!
        </h2>
      </div>
      <ECommerce />
      
    </DefaultLayout>
  );
};

export default ProtectedComponent;
