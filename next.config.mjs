/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permitir acceso al servidor de desarrollo desde la IP local (para pruebas en móvil/red local)
  // Sin esto, Next.js 15+ bloquea los chunks de JS desde orígenes distintos a localhost
  allowedDevOrigins: [
    'localhost',
    '10.241.193.188',
    '192.168.*',
    '172.*',
  ],
};

export default nextConfig;
