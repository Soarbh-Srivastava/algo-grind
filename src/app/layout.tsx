
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/auth-context'; 
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: {
    default: 'Algo Grind by Soarbh Srivastava - AI-Powered DSA Progress Tracker',
    template: '%s | Algo Grind by Soarbh Srivastava',
  },
  description: 'Algo Grind is a coding progress tracker and algorithm practice app created by Soarbh Srivastava, a full stack developer from India. Improve your DSA skills with AI-powered recommendations and a coding buddy. View Soarbh Srivastava\'s portfolio and other projects.',
  manifest: '/manifest.json',
  keywords: [
    'Soarbh Srivastava', 'Soarbh Srivastava portfolio', 'Soarbh Srivastava developer', 
    'Full stack developer', 'Web developer portfolio', 'Software engineer India', 
    'Algo Grind', 'Algo Grind app', 'coding progress tracker', 'algorithm practice app', 
    'Schema markup', 'Structured data', 'GitHub Soarbh Srivastava', 'About Soarbh Srivastava', 
    'Projects', 'Algo Grind project', 'Contact', 'DSA', 'Data Structures', 'Algorithms', 
    'Coding Interview', 'Next.js', 'React', 'Firebase', 'Genkit'
  ],
  authors: [{ name: 'Soarbh Srivastava', url: 'https://whysoarbh.xyz/' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://algo-grind.whysoarbh.xyz/',
    title: 'Algo Grind by Soarbh Srivastava - AI-Powered DSA Progress Tracker',
    description: 'The ultimate platform for practicing algorithms and tracking your progress, built by Soarbh Srivastava. Features AI-driven insights, structured data, and schema markup.',
    siteName: 'Algo Grind',
    images: [
      {
        url: 'https://placehold.co/1200x630.png',
        width: 1200,
        height: 630,
        alt: 'Algo Grind Application Banner - DSA progress tracker by Soarbh Srivastava',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Algo Grind - Your Personal DSA Tracker by Soarbh Srivastava',
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Algo Grind',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    description: 'Algo Grind is a coding progress tracker and algorithm practice app created by Soarbh Srivastava. It helps users prepare for coding interviews by tracking solved problems, setting goals, and providing AI-powered assistance.',
    author: {
      '@type': 'Person',
      name: 'Soarbh Srivastava',
      url: 'https://whysoarbh.xyz/',
      sameAs: [
        'https://whysoarbh.xyz/',
        'https://github.com/soarbhsrivastava'
      ]
    },
    keywords: metadata.keywords ? (Array.isArray(metadata.keywords) ? metadata.keywords.join(', ') : metadata.keywords) : undefined,
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
