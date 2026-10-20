import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
export const dynamic = 'force-dynamic';
const reply=(data:any,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
async function access(req:Request) {
 const token=new URL(req.url).searchParams.get('carteira');
 if(token) { const w=await env.DB!.prepare('SELECT * FROM wallets WHERE token = ?').bind(token).first<any>();return w?{w,admin:false}:null; }
 const u=await getChatGPTUser(); if(!u)return null;
 let w=await env.DB!.prepare('SELECT * FROM wallets WHERE owner = ?').bind(u.userId).first<any>();
 if(!w){await env.DB!.prepare('INSERT OR IGNORE INTO wallets (id,owner,token) VALUES (?,?,?)').bind(crypto.randomUUID(),u.userId,crypto.randomUUID()+crypto.randomUUID()).run();w=await env.DB!.prepare('SELECT * FROM wallets WHERE owner = ?').bind(u.userId).first<any>();}
 return {w,admin:true};
}
export async function GET(req:Request){try {const a=await access(req);if(!a)return reply({error:'Entre na sua conta para abrir a carteira.'},401);const rows=await env.DB!.prepare('SELECT * FROM vouchers WHERE wallet = ? ORDER BY created DESC').bind(a.w.id).all();return reply({vales:rows.results,admin:a.admin,token:a.admin?a.w.token:undefined});}catch{return reply({error:'Não foi possível carregar a carteira. Tente novamente.'},500);}}
export async function POST(req:Request){
 try {
 if(req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'Origem inválida.'},403);
 const a=await access(req);if(!a)return reply({error:'Acesso não autorizado.'},401);
 const b=await req.json();
 if(b.action==='redeem'){
 if(typeof b.id!=='string')return reply({error:'Vale inválido.'},400);
 const date=new Date().toISOString();
 const r=await env.DB!.prepare('UPDATE vouchers SET used = ? WHERE id = ? AND wallet = ? AND used IS NULL AND expires >= ? RETURNING id').bind(date,b.id,a.w.id,date).first();
 if(!r)return reply({error:'Este vale já foi usado, venceu ou não está disponível.'},409);
 return reply({ok:true});
 }
 if(!a.admin)return reply({error:'Apenas quem criou a carteira pode cadastrar vales.'},403);
 if(b.action==='create'){
 const title=typeof b.title==='string'?b.title.trim():'';const description=typeof b.description==='string'?b.description.trim():'';
 if(!title||title.length>90||description.length>500||!/^\d{4}-\d{2}-\d{2}$/.test(b.expires||''))return reply({error:'Confira o título e a validade do vale.'},400);
 const expiration=new Date(b.expires+'T23:59:59-03:00');
 if(!Number.isFinite(expiration.getTime())||expiration.getTime()<Date.now())return reply({error:'Escolha uma validade a partir de hoje.'},400);
 const icons=['heart','bike','sparkles','film','game','coffee','hand'];const colors=['pink','lavender','peach','mint'];
 await env.DB!.prepare('INSERT INTO vouchers (id,wallet,title,description,icon,color,expires,created) VALUES (?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),a.w.id,title,description,icons.includes(b.icon)?b.icon:'heart',colors.includes(b.color)?b.color:'pink',expiration.toISOString(),new Date().toISOString()).run();return reply({ok:true},201);
 }
 return reply({error:'Ação inválida.'},400);
 }catch{return reply({error:'Não foi possível salvar. Tente novamente.'},500);}
}
