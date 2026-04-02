/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // pdf-parse/pdfjs-dist use worker files; bundling them breaks worker resolution (see .next/.../chunks/pdf.worker.mjs errors).
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist', '@napi-rs/canvas'],
}

export default nextConfig
