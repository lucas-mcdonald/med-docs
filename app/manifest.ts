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
        src: '/AppIconSmall.png',
        sizes: '76x76',
        type: 'image/png',
      },
      {
        src: '/AppIconMarketing.png',
        sizes: '1024x1024',
        type: 'image/png',
      },
    ],
  }
}
