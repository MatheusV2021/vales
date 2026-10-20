import { useMemo,useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft,CalendarDays,ChevronLeft,ChevronRight,SlidersHorizontal } from 'lucide-react';
import ValeCard from '../components/ValeCard';
const dias=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
export default function Vales({vales,onValeClick,validade}){
 const navigate=useNavigate();const [filtro,setFiltro]=useState('todos');const [mes,setMes]=useState(11);const [selecionado,setSelecionado]=useState(19);
 const lista=useMemo(()=>vales.filter(v=>filtro==='todos'||(filtro==='disponiveis'?!v.usado:v.usado)),[vales,filtro]);
 const tituloMes=new Date(2026,mes,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
 const diasVisiveis=Array.from({length:5},(_,i)=>new Date(2026,mes,17+i));
 return <div className="wallet-page"><header className="wallet-top"><button className="outline-icon" onClick={()=>navigate('/')} aria-label="Voltar"><ArrowLeft size={25}/></button><span className="outline-icon static"><CalendarDays size={23}/></span></header><div className="wallet-title"><h1>Seus vales</h1><p>Válidos até <strong>{new Date(`${validade}T12:00:00`).toLocaleDateString('pt-BR',{day:'numeric',month:'long'})}</strong></p></div><div className="calendar"><div className="calendar-header"><button onClick={()=>{setMes(m=>m-1);setSelecionado(19)}} aria-label="Mês anterior"><ChevronLeft/></button><h3>{tituloMes}</h3><button onClick={()=>{setMes(m=>m+1);setSelecionado(19)}} aria-label="Próximo mês"><ChevronRight/></button></div><div className="date-strip">{diasVisiveis.map((d,i)=><button key={i} className={selecionado===d.getDate()?'selected':''} onClick={()=>setSelecionado(d.getDate())}><strong>{d.getDate()}</strong><span>{dias[d.getDay()]}</span></button>)}</div></div><div className="list-header"><h2>Próximos vales</h2><label className="filter-select"><SlidersHorizontal size={15}/><select value={filtro} onChange={e=>setFiltro(e.target.value)} aria-label="Filtrar vales"><option value="todos">Todos</option><option value="disponiveis">Disponíveis</option><option value="usados">Utilizados</option></select></label></div><div className="vales-list">{lista.length?lista.map(vale=><ValeCard key={vale.id} vale={vale} onClick={onValeClick}/>):<p className="empty-state">Nenhum vale por aqui 💜</p>}</div></div>
}
