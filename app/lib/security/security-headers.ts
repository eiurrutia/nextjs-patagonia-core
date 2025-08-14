/**
 * Cabeceras de seguridad HTTP para proteger contra ataques comunes
 */
import { NextResponse, NextRequest } from 'next/server';

// Define un conjunto de cabeceras de seguridad para añadir a todas las respuestas
export function addSecurityHeaders(req: NextRequest, res: NextResponse): NextResponse {
  // Obtiene una copia del objeto headers (que es de solo lectura)
  const responseHeaders = new Headers(res.headers);

  // Content-Security-Policy: Define fuentes de contenido permitidas
  responseHeaders.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self';"
  );

  // X-Content-Type-Options: Previene "MIME type sniffing"
  responseHeaders.set('X-Content-Type-Options', 'nosniff');

  // X-Frame-Options: Previene "clickjacking"
  responseHeaders.set('X-Frame-Options', 'DENY');

  // X-XSS-Protection: Filtros XSS adicionales
  responseHeaders.set('X-XSS-Protection', '1; mode=block');

  // Strict-Transport-Security: Fuerza HTTPS
  if (process.env.NODE_ENV === 'production') {
    responseHeaders.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Referrer-Policy: Controla la información enviada en la cabecera Referer
  responseHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions-Policy: Controla características del navegador
  responseHeaders.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // Crea una nueva respuesta con las mismas propiedades pero con las cabeceras actualizadas
  return NextResponse.next({
    request: {
      headers: req.headers,
    },
    ...res,
    headers: responseHeaders,
  });
}
