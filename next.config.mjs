/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,  // ✅ ข้าม TypeScript errors ทั้งหมด
  },
  eslint: {
    ignoreDuringBuilds: true, // ✅ ข้าม ESLint warnings ทั้งหมด
  },
};

export default nextConfig;
