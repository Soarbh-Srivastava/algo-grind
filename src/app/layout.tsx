
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/auth-context'; 
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: {
    default: 'Algo Grind - Track Your DSA Consistency',
    template: '%s | Algo Grind',
  },
  description: 'A comprehensive platform for algorithm practice and coding interview preparation. Track progress, get AI recommendations, and master DSA.',
  manifest: '/manifest.json',
  keywords: ['Algorithm Practice', 'Coding Interview', 'DSA', 'Data Structures', 'Next.js', 'React', 'Programming', 'Tech Interview'],
  authors: [{ name: 'Soarbh Srivastava', url: 'https://whysoarbh.xyz/' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://algo-grind.whysoarbh.xyz/',
    title: 'Algo Grind - Master Your DSA Journey',
    description: 'The ultimate platform for practicing algorithms, tracking your progress with AI-driven insights, and preparing for coding interviews.',
    siteName: 'Algo Grind',
    images: [
      {
        url: 'https://placehold.co/1200x630.png',
        width: 1200,
        height: 630,
        alt: 'Algo Grind Application Banner',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Algo Grind - Your Personal DSA Tracker',
    description: 'Level up your coding skills with Algo Grind. Track problems, set goals, and get smart recommendations.',
    images: ['https://placehold.co/1200x630.png'],
  },
  themeColor: '#388E3C',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Belleza&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
