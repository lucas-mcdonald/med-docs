import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MedDocs',
    short_name: 'MedDocs',
    description: 'Chatbot for medical staff to help them with the medical records systems',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/AppIconMarketing.png',
        sizes: '128x128 180x180 512x512 1024x1024',
        type: 'image/png',
      },
    ],
  }
}
