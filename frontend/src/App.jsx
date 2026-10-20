import { useCallback,useEffect,useState } from 'react';
import { BrowserRouter,Routes,Route,useNavigate } from 'react-router-dom';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import Home from './pages/Home';import Vales from './pages/Vales';import SimplePage from './pages/SimplePage';
import BottomNav from './components/BottomNav';import ValeModal from './components/ValeModal';
import { VALIDADE } from './data/valesDemo';import {valesService} from './services/valesService';
import './styles/global.css';import './styles/pages.css';
function Shell(){
 const [vales,setVales]=useState([]),[validade,setValidade]=useState(VALIDADE),[demo,setDemo]=useState(false),[loading,setLoading]=useState(true),[selecionado,setSelecionado]=useState(null),[resgatando,setResgatando]=useState(false),[erro,setErro]=useState(''),[menu,setMenu]=useState(false);
 const navigate=useNavigate();
 const carregar=useCallback(async()=>{try{const data=await valesService.listar();setVales(data.vales);setValidade(data.validade||VALIDADE);setDemo(false)}catch{setVales([]);setDemo(true)}finally{setLoading(false)}},[]);
 useEffect(()=>{carregar()},[carregar]);
 const resgatar=async id=>{setResgatando(true);try{await valesService.resgatar(id);setSelecionado(null);await carregar()}catch(e){setErro(e.message);await carregar()}finally{setResgatando(false)}};
 if(loading)return <div className="loading-screen"><RefreshCw className="spin"/> Preparando seus vales...</div>;
 return <main className="app-shell"><div className="app-content"><Routes><Route path="/" element={<Home vales={vales} validade={validade} onValeClick={setSelecionado} onMenu={()=>setMenu(true)}/>}/><Route path="/vales" element={<Vales vales={vales} validade={validade} onValeClick={setSelecionado}/>}/><Route path="/favoritos" element={<SimplePage tipo="favoritos" vales={vales} onValeClick={setSelecionado}/>}/><Route path="/perfil" element={<SimplePage tipo="perfil" validade={validade}/>}/><Route path="*" element={<Home vales={vales} validade={validade} onValeClick={setSelecionado} onMenu={()=>setMenu(true)}/>}/></Routes></div><BottomNav/>{demo&&<div className="demo-chip"><AlertCircle size={13}/> API indisponível — sem dados <button onClick={carregar} aria-label="Tentar conectar"><RefreshCw size={13}/></button></div>}{erro&&<div className="error-toast" role="alert">{erro}<button onClick={()=>setErro('')}><X size={16}/></button></div>}{menu&&<div className="menu-overlay" onClick={()=>setMenu(false)}><aside onClick={e=>e.stopPropagation()}><button className="menu-close" onClick={()=>setMenu(false)}><X/></button><h2>Minha carteira 💜</h2><button onClick={()=>{navigate('/');setMenu(false)}}>Início</button><button onClick={()=>{navigate('/vales');setMenu(false)}}>Ver todos os vales</button><button onClick={()=>{navigate('/perfil');setMenu(false)}}>Sobre a carteira</button></aside></div>}<ValeModal key={selecionado?.id||'none'} vale={selecionado?vales.find(v=>v.id===selecionado.id)||selecionado:null} validade={validade} modoDemo={demo} busy={resgatando} onClose={()=>setSelecionado(null)} onResgatar={resgatar}/></main>
}
export default function App(){return <BrowserRouter><Shell/></BrowserRouter>}
