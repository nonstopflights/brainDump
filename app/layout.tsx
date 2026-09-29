import type {Metadata,Viewport} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Daybook · A place for your thoughts',description:'Your private idea inbox and bullet journal.',icons:{icon:'/icon.svg',apple:'/icon.svg'},manifest:'/manifest.webmanifest',appleWebApp:{capable:true,statusBarStyle:'default',title:'Daybook'}};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#f8f8f8'};
export default function Layout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>;}
