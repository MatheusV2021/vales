const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
async function requisitar(path,options={}) {
  const resposta=await fetch(`${BASE}/api${path}`,{...options,headers:{'Content-Type':'application/json',...options.headers}});
  let dados;try{dados=await resposta.json()}catch{dados={detail:'Resposta inválida da API'}}
  if(!resposta.ok)throw new Error(dados.detail||'Não foi possível completar a solicitação.');
  return dados;
}
export const valesService={listar:()=>requisitar('/vales'),resgatar:(id)=>requisitar(`/vales/${encodeURIComponent(id)}/resgatar`,{method:'POST'})};
