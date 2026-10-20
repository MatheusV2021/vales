import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Para nós • Carteira de vales',description:'Pequenos vales para grandes momentos juntos.',referrer:'no-referrer'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>}
