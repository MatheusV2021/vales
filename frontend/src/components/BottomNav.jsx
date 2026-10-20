import { NavLink } from 'react-router-dom';
import { House, Ticket, Heart, UserRound } from 'lucide-react';
const itens=[['/','Início',House],['/vales','Vales',Ticket],['/favoritos','Favoritos',Heart],['/perfil','Perfil',UserRound]];
export default function BottomNav(){return <nav className="bottom-nav" aria-label="Navegação principal">{itens.map(([url,nome,Icon])=><NavLink key={url} to={url} end={url==='/'} className={({isActive})=>`nav-link ${isActive?'active':''}`}><Icon size={25} strokeWidth={1.7}/><span>{nome}</span></NavLink>)}</nav>}
