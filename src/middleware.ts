import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Definimos un array con todas las rutas públicas
const publicRoutes = [
  '/movimientos',
  '/api/departamentos',
  '/api/lista_empleados',
  '/api/jornadas',
  '/api/registrar_entrada',
  '/api/registrar_salida',
  // Agrega aquí más rutas públicas según necesites
];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value || '';
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
  const isPublicPage = publicRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );
  
  // Si es una página pública, permitir acceso
  if (isPublicPage) {
    return NextResponse.next();
  }

  // Si el usuario no está autenticado y no está en la página de login
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  // Si el usuario está autenticado y trata de acceder a la página de login
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Configurar las rutas que queremos proteger
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
} 