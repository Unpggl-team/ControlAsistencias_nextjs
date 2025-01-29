"use client";
import { createContext, useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface User {
  nombres: string;
  departamento: string;
  id_user: number;
  rol: number;
  token: string;
}

interface AuthContextType {
  user: User | null;
  login: (inss: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  logout: () => {},
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const token = Cookies.get('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error al parsear datos del usuario:', error);
        handleLogout();
      }
    } else {
      handleLogout();
    }
  };

  const login = async (inss: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inss,
          password
        }),
      });

      const data = await response.json();
      console.log(data);  
      if (!response.ok) {
        console.error('Error de login:', data.message);
        return false;
      }

      const userData: User = {
        nombres: data.user.nombres,
        departamento: data.user.departamento,
        id_user: data.user.id_user,
        rol: data.user.rol,
        token: data.token
      };

      // Guardar token en cookie y datos del usuario en localStorage
      console.log(userData);
      Cookies.set('token', data.token, { expires: 7 }); // Cookie expira en 7 días
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      setIsAuthenticated(true);
      return true;

    } catch (error) {
      console.error('Error de autenticación:', error);
      return false;
    }
  };

  const handleLogout = () => {
    Cookies.remove('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const logout = () => {
    handleLogout();
    router.push('/auth/signin');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};