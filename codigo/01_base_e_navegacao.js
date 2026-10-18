"use strict";
var BASE = /*DATA*/;
var DIAS = ["Segunda","Terça","Quarta","Quinta","Sexta"];
var DIAS_C = ["Seg","Ter","Qua","Qui","Sex"];
var DIAS_F = ["SEGUNDA-FEIRA","TERÇA-FEIRA","QUARTA-FEIRA","QUINTA-FEIRA","SEXTA-FEIRA"];
var PERIODOS = ["Manhã","Tarde","Noite","Integral"];
var KEY = "gerador29abril_v2", KEY1 = "gerador29abril_v1";
var DEF_PRI = [["ROB","todas"],["T. I.","todas"],["E.D.P ROB","todas"],["FIS3","todas"],["PROG. IA","todas"],["PORT","1"],["MAT","1"],["ING","1"],["RAM","1"],["RAP","1"],["L.RAP","1"],["R.LEIT","1"]];
var ST;

// ---------- utilidades ----------
function deep(o){ return JSON.parse(JSON.stringify(o)); }
function kOf(disc,p,doc2){ return disc+"§"+p+"§"+(doc2?1:0); }
function parseK(k){ var a=k.split("§"); return {disc:a[0],p:+a[1],doc2:a[2]==="1"}; }
function pad2(n){ return ("0"+n).slice(-2); }
function toMin(x){ var a=String(x).split(":"); return (+a[0])*60+(+a[1]||0); }
function hmP(m){ return pad2(Math.floor(m/60))+":"+pad2(m%60); }
function okHora(v){ if(!/^\d{1,2}:\d{2}$/.test(v)) return false; var a=v.split(":"); return +a[0]<24 && +a[1]<60; }
function normHora(v){ return hmP(toMin(v)); }
function kOfH(h){ return hmP(toMin(h[0]))+"-"+hmP(toMin(h[1])); }
function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];}); }
function pnome(p){ return ST.profs[p]?ST.profs[p].nome:"?"; }
function agora(){ return new Date().toISOString(); }
function fmtData(iso){ var d=new Date(iso); return d.toLocaleDateString("pt-BR")+" "+d.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}); }
// datas (sempre no fuso local, formato AAAA-MM-DD)
function ymd(dt){ return dt.getFullYear()+"-"+pad2(dt.getMonth()+1)+"-"+pad2(dt.getDate()); }
function parseYmd(s){ var a=String(s).split("-"); return new Date(+a[0],(+a[1])-1,+a[2]); }
function addDias(s,n){ var x=parseYmd(s); x.setDate(x.getDate()+n); return ymd(x); }
function segundaDe(s){ var x=parseYmd(s), w=x.getDay(); x.setDate(x.getDate()+(w===0?1:(w===6?2:1-w))); return ymd(x); }
function hoje(){ return ymd(new Date()); }
function fmtDM(s){ return s.slice(8,10)+"/"+s.slice(5,7); }
function fmtDMA(s){ return fmtDM(s)+"/"+s.slice(0,4); }
var DIAS_SEM = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
function nomeDia(date){ return DIAS_SEM[parseYmd(date).getDay()]; }
function wdIdx(date){ return parseYmd(date).getDay()-1; }
function diaUtilOuProx(s){ var w=parseYmd(s).getDay(); return w===0?addDias(s,1):w===6?addDias(s,2):s; }
function diasUteis(de,ate){ var out=[], x=parseYmd(de), f=parseYmd(ate), n=0; while(x<=f && n<400){ var w=x.getDay(); if(w>=1&&w<=5) out.push(ymd(x)); x.setDate(x.getDate()+1); n++; } return out; }
function semanaDatas(seg){ return [0,1,2,3,4].map(function(i){ return addDias(seg,i); }); }

// ---------- estado ----------
function sortearCoresSeed(n){ var x=2026; var rnd=function(){ x=(x*1103515245+12345)%2147483648; return x/2147483648; }; var keep=Math.random; Math.random=rnd; try{ return sortearCores(n); } finally { Math.random=keep; } }
function freshState1(){
  var agg = {};
  BASE.lessons.forEach(function(l){ var k=l.t+"|"+kOf(l.disc,l.p,l.doc2); agg[k]=(agg[k]||0)+1; });
  var matriz = Object.keys(agg).map(function(k){ var i=k.indexOf("|"); var x=parseK(k.slice(i+1)); return {t:+k.slice(0,i),disc:x.disc,p:x.p,doc2:x.doc2,n:agg[k]}; });
  var grid = BASE.atual.map(function(row){ return row.map(function(li){ var l=BASE.lessons[li]; return kOf(l.disc,l.p,l.doc2); }); });
  var profs0=deep(BASE.profs); var cc=sortearCoresSeed(profs0.length); profs0.forEach(function(p,i){ p.cor=cc[i]; });
  return {
    v:1, turmas:deep(BASE.turmas), profs:profs0, matriz:matriz, pares:deep(BASE.pares), siglas:deep(BASE.siglas),
    regras:{max:2,two:true,par:true,late:true,cross:true,gap:true,sep:false,intervalo:true,minBreak:15},
    horarios:deep(BASE.horarios), extras:deep(BASE.extras||[]), locks:{}, hist:[], snaps:[], histLimite:15, ctx:{quem:"",motivo:""},
    haLocais:["Sala dos professores","Biblioteca","Laboratório de informática","Sala de planejamento","Em casa (formador)"], haLocPad:{},
    aviso:{base:null, baseTs:null, msg:null, edits:{}, enviados:{}, anexos:{indiv:true,ha:true,turmas:false,gerais:{},eq:false}, rem:"Equipe pedagógica", data:""},
    equip:{chrome:"",tablet:"",robo:11,inf:"M",bib:"M",tbBib:false,chBib:false,pri:DEF_PRI.map(function(x){return {disc:x[0],regra:x[1]};}),robo_d:["ROB","E.D.P ROB"]},
    grid:grid, gridNome:"Grade oficial (planilha de "+(BASE.versao||"28/09")+")", ha:null, eq:null,
    externo:{usar:true, margem:20, escolas:[]}, inst:null
  };
}
// converte o formato antigo (horário fixo de 6 aulas, manhã/tarde) para o novo (tipos de horário livres)
function conv1(o){
  var H=o.horarios||BASE.horarios;
  var defs=[["MED",0,"Tipo 1 — Manhã 9º ao 3º"],["FUND",0,"Tipo 2 — Manhã 6º ao 8º"],["MEDT",1,"Tipo 3 — Tarde 9º ao 3º"],["FUNDT",1,"Tipo 4 — Tarde 6º ao 8º"]];
  o.tipos=defs.map(function(x,i){ return {id:"T"+(i+1),nome:x[2],periodo:PERIODOS[x[1]],aulas:H[x[0]].map(function(h){ return [normHora(h[0]),normHora(h[1])]; })}; });
  function keyDe(tm){ return (tm.horario==="FUND"?"FUND":"MED")+(tm.turno?"T":""); }
  function idDe(key){ for(var i=0;i<defs.length;i++) if(defs[i][0]===key) return "T"+(i+1); return "T1"; }
  var tKey=o.turmas.map(keyDe);
  o.turmas.forEach(function(tm,t){ tm.tipo=idDe(tKey[t]); delete tm.turno; delete tm.horario; });
  // indisponibilidade do professor: por horário real
  o.profs.forEach(function(p){
    var ind={};
    if(p.bloq) for(var tu=0;tu<2;tu++) for(var d=0;d<5;d++) for(var a=0;a<6;a++){ var v=p.bloq[tu*30+d*6+a]; if(!v) continue;
      var F=H["FUND"+(tu?"T":"")][a], M=H["MED"+(tu?"T":"")][a];
      var ini=Math.min(toMin(F[0]),toMin(M[0])), fim=Math.max(toMin(F[1]),toMin(M[1]));
      ind[d+"|"+hmP(ini)+"-"+hmP(fim)]=v; }
    p.ind=p.ind||ind; delete p.bloq;
    if(p.email==null) p.email=""; if(p.cel==null) p.cel="";
  });
  // HA: converte para horário real, usando o horário das turmas em que o professor mais dá aula naquele turno
  if(o.ha){ var nh={};
    Object.keys(o.ha).forEach(function(p){ var h=o.ha[p]; p=+p; var cnt=[{},{}];
      o.grid.forEach(function(row,t){ (row||[]).forEach(function(k){ if(k&&parseK(k).p===p){ var key=tKey[t], tu=key.slice(-1)==="T"?1:0; cnt[tu][key]=(cnt[tu][key]||0)+1; } }); });
      var slots=[], locais={};
      (h.slots||[]).forEach(function(k){ var tu=(k/30)|0, s=k%30, d=(s/6)|0, a=s%6; var best="FUND"+(tu?"T":""), bn=-1; Object.keys(cnt[tu]).forEach(function(x){ if(cnt[tu][x]>bn){ bn=cnt[tu][x]; best=x; } });
        var hh=H[best][a], key=d+"|"+kOfH(hh); slots.push(key); if(h.locais&&h.locais[k]) locais[key]=h.locais[k]; });
      nh[p]={slots:slots,need:h.need,aulas:h.aulas,locais:locais}; });
    o.ha=nh; }
  if(o.aviso&&o.aviso.anexos){ var an=o.aviso.anexos; an.gerais=an.gerais||{}; if(an.gm) an.gerais["Manhã"]=true; if(an.gt) an.gerais["Tarde"]=true; delete an.gm; delete an.gt; }
  delete o.horarios; o.v=2; o.ausencias=o.ausencias||[];
  return o;
}
function freshState(){ return conv1(freshState1()); }
// salvar: se o navegador não deixar (armazenamento cheio ou bloqueado), avisa na tela em vez de perder em silêncio
var SAVE_OK=true, LOAD_AVISO="";
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(ST)); if(!SAVE_OK){ SAVE_OK=true; avisoSalvar(); } }catch(e){ SAVE_OK=false; avisoSalvar(); } }
function avisoSalvar(){ var el=document.getElementById("salvarBanner"); if(!el) return;
  el.innerHTML=(!SAVE_OK?'<div class="avb alerta">⚠️ <b>Não foi possível salvar as últimas mudanças neste navegador</b> (armazenamento cheio ou bloqueado). Para não perder o trabalho, vá em Relatórios › Backup e clique em “Baixar backup agora”.</div>':"")+
    (LOAD_AVISO?'<div class="avb alerta">⚠️ '+esc(LOAD_AVISO)+' <button class="btn sm" id="bLoadOk">Entendi</button></div>':"");
  var b=document.getElementById("bLoadOk"); if(b) b.onclick=function(){ LOAD_AVISO=""; avisoSalvar(); }; }
// confere e conserta um estado vindo do navegador ou de um arquivo; devolve false se não der para usar
function sanear(o){
  if(!o||typeof o!=="object") return false;
  var arr=function(x){ return Array.isArray(x); };
  if(!arr(o.turmas)||!arr(o.profs)||!arr(o.matriz)||!arr(o.grid)||!arr(o.tipos)||!o.tipos.length) return false;
  if(!o.regras||typeof o.regras!=="object"||arr(o.regras)) o.regras={};
  if(o.grid.length<o.turmas.length) return false;
  var hora=/^\d{1,2}:\d{2}$/, cor=/^#[0-9a-fA-F]{6}$/, num=function(v){ return v===null||v===""||v===undefined?null:(isFinite(+v)?+v:null); };
  var ids={};
  o.tipos=o.tipos.filter(function(tp){ return tp&&arr(tp.aulas)&&tp.aulas.length&&tp.aulas.every(function(h){ return arr(h)&&hora.test(h[0])&&hora.test(h[1]); }); });
  if(!o.tipos.length) return false;
  o.tipos.forEach(function(tp,i){ tp.id=String(tp.id||"T"+(i+1)).replace(/[^A-Za-z0-9_-]/g,"")||("T"+(i+1)); if(ids[tp.id]) tp.id=tp.id+"_"+i; ids[tp.id]=1; tp.nome=String(tp.nome||tp.id); if(PERIODOS.indexOf(tp.periodo)<0) tp.periodo="Manhã"; tp.aulas=tp.aulas.map(function(h){ return [normHora(h[0]),normHora(h[1])]; }); });
  o.turmas.forEach(function(t){ t.nome=String(t.nome||"?"); if(!ids[t.tipo]) t.tipo=o.tipos[0].id; t.nivel=t.nivel==="F"?"F":"M"; t.alunos=num(t.alunos)||0; });
  var P=o.profs.length, Tn=o.turmas.length;
  o.profs.forEach(function(p){ p.nome=String(p.nome||"?"); p.completo=String(p.completo||""); p.cor=cor.test(p.cor||"")?p.cor:"#dddddd"; p.email=String(p.email||""); p.cel=String(p.cel||""); p.obs=String(p.obs||"");
    p.maxDia=num(p.maxDia); p.haManual=num(p.haManual); p.concentrar=!!p.concentrar;
    var ind={}; if(p.ind&&typeof p.ind==="object") Object.keys(p.ind).forEach(function(k){ if(/^[0-4]\|\d{2}:\d{2}-\d{2}:\d{2}$/.test(k)&&[1,2,3].indexOf(+p.ind[k])>=0) ind[k]=+p.ind[k]; }); p.ind=ind; });
  var chave=function(k){ if(typeof k!=="string") return null; var a=k.split("§"); if(a.length!==3||!(+a[1]>=0&&+a[1]<P)) return null; return k; };
  o.matriz=o.matriz.filter(function(r){ return r&&+r.t>=0&&+r.t<Tn&&+r.p>=0&&+r.p<P&&+r.n>0&&r.disc; }).map(function(r){ return {t:+r.t,disc:String(r.disc),p:+r.p,doc2:!!r.doc2,n:Math.min(40,+r.n)}; });
  o.grid=o.grid.slice(0,Tn).map(function(row){ return arr(row)?row.map(chave):[]; });
  o.pares=(arr(o.pares)?o.pares:[]).map(function(x){ return normPar(x,P,o.turmas.length); }).filter(Boolean);
  var lk={}; if(o.locks&&typeof o.locks==="object") Object.keys(o.locks).forEach(function(k){ if(/^\d+\|\d+$/.test(k)&&+k.split("|")[0]<Tn) lk[k]=true; }); o.locks=lk;
  o.extras=arr(o.extras)?o.extras.filter(function(r){ return r&&typeof r.tipo==="string"; }):[];
  o.ausencias=(arr(o.ausencias)?o.ausencias:[]).filter(function(a){ return a&&+a.p>=0&&+a.p<P&&/^\d{4}-\d{2}-\d{2}$/.test(a.de)&&/^\d{4}-\d{2}-\d{2}$/.test(a.ate); });
  o.ausencias.forEach(function(a,i){ a.id=String(a.id||("a"+i)).replace(/[^A-Za-z0-9_-]/g,"")||("a"+i); a.p=+a.p; a.motivo=String(a.motivo||""); a.quem=String(a.quem||""); a.fora=a.fora&&typeof a.fora==="object"?a.fora:{};
    var sb={}; if(a.subs&&typeof a.subs==="object") Object.keys(a.subs).forEach(function(k){ if(+a.subs[k]>=0&&+a.subs[k]<P) sb[k]=+a.subs[k]; }); a.subs=sb; if(a.so&&!arr(a.so)) a.so=null; });
  if(o.ha&&typeof o.ha==="object"){ var h2={}; Object.keys(o.ha).forEach(function(p){ var h=o.ha[p]; if(!(+p>=0&&+p<P)||!h||!arr(h.slots)) return; h2[p]={slots:h.slots.filter(function(k){ return /^[0-4]\|\d{2}:\d{2}-\d{2}:\d{2}$/.test(k); }),need:num(h.need)||0,aulas:num(h.aulas)||0,locais:h.locais&&typeof h.locais==="object"?h.locais:{}}; }); o.ha=h2; } else o.ha=null;
  if(o.eq&&(!arr(o.eq.aloc)||!arr(o.eq.falta))) o.eq=null;
  if(o.eq) o.eq.aloc=o.eq.aloc.filter(function(x){ return x&&+x.t>=0&&+x.t<Tn&&+x.p>=0&&+x.p<P; });
  var E=o.externo&&typeof o.externo==="object"&&!arr(o.externo)?o.externo:{};
  o.externo={usar:E.usar!==false, margem:Math.max(0,Math.min(180,num(E.margem)==null?20:num(E.margem))), escolas:(arr(E.escolas)?E.escolas:[]).filter(function(e){ return e&&typeof e==="object"&&arr(e.itens); }).map(function(e,i){
    return {id:String(e.id||("e"+i)).replace(/[^A-Za-z0-9_-]/g,"")||("e"+i), nome:String(e.nome||"Outra escola").slice(0,120), cenario:String(e.cenario||"").slice(0,60), arquivo:String(e.arquivo||"").slice(0,160), origem:String(e.origem||"").slice(0,60), ts:String(e.ts||""), quem:String(e.quem||"").slice(0,120),
      itens:e.itens.filter(function(x){ return x&&+x.p>=0&&+x.p<P&&(+x.p)%1===0&&+x.d>=0&&+x.d<=4&&(+x.d)%1===0&&hora.test(String(x.ini||""))&&hora.test(String(x.fim||""))&&toMin(x.fim)>toMin(x.ini); }).map(function(x){ return {p:+x.p,d:+x.d,ini:normHora(x.ini),fim:normHora(x.fim),nomeLa:String(x.nomeLa||"").slice(0,120),txt:String(x.txt||"").slice(0,160)}; })}; }) };
  sanearInst(o); if(!o.pvistos||typeof o.pvistos!=="object"||arr(o.pvistos)) o.pvistos={};
  if(!arr(o.hist)) o.hist=[]; if(!arr(o.snaps)) o.snaps=[];
  o.snaps=o.snaps.filter(function(sn){ return sn&&arr(sn.grid); });
  return true;
}
function load(){
  var s=null; try{ s=localStorage.getItem(KEY); }catch(e){ LOAD_AVISO="O navegador não deixou ler os dados salvos (armazenamento bloqueado). O gerador abriu com a grade oficial."; return null; }
  if(s){ try{ var o=JSON.parse(s); if(o && o.v===2 && sanear(o)) return o; throw 0; }
    catch(e){ try{ localStorage.setItem(KEY+"_com_problema", s); }catch(e2){} LOAD_AVISO="Os dados salvos neste navegador estavam com problema e não puderam ser abertos; uma cópia deles foi guardada à parte. O gerador abriu com a grade oficial. Se você tiver um backup, recupere em Relatórios › Backup."; return null; } }
  try{ var s1=localStorage.getItem(KEY1); if(s1){ var o1=JSON.parse(s1); if(o1 && o1.v===1){ conv1(o1); if(!sanear(o1)) return null; o1.hist=o1.hist||[]; o1.hist.unshift({ts:agora(),tipo:"Dados",txt:"Dados passados para a versão nova do gerador (horários livres por tipo e aulas vagas).",quem:"",motivo:""}); return o1; } } }catch(e){}
  return null;
}
ST = load() || freshState();
(function migrar(){ var f=freshState();
  if(ST.baseVersao!==(BASE.versao||"28/09")){
    // depois de começar um ano letivo novo, uma grade guardada no arquivo que é do ano anterior não substitui a do ano novo
    if(ST.novoAno&&!naBaseMaisNova()){ ST.baseVersao=BASE.versao||"28/09"; }
    else if(ST.baseVersao!==undefined || ST.gridNome!==f.gridNome){
      ST.snaps=ST.snaps||[]; ST.snaps.unshift({id:"v"+Date.now(),ts:agora(),nome:"Antes da atualização — "+(ST.gridNome||""),grid:deep(ST.grid),quem:"",motivo:"Atualização da grade oficial"});
      // os professores da planilha nova são ligados aos já cadastrados pelo nome (assim e-mail, celular e horários não se perdem)
      var mapa=f.profs.map(function(bp){ var i=-1; ST.profs.forEach(function(q,j){ if(i<0&&q.nome===bp.nome) i=j; }); if(i<0){ ST.profs.push(bp); i=ST.profs.length-1; } return i; });
      var rk=function(k){ if(!k) return k; var x=parseK(k); return kOf(x.disc,mapa[x.p],x.doc2); };
      f.matriz.forEach(function(r){ r.p=mapa[r.p]; }); f.grid=f.grid.map(function(row){ return row.map(rk); });
      var gAnt=deep(ST.grid);
      var dif=0; f.grid.forEach(function(row,t){ row.forEach(function(k,s){ if((ST.grid[t]||[])[s]!==k) dif++; }); });
      ST.matriz=f.matriz; ST.grid=f.grid; ST.turmas=f.turmas; ST.tipos=f.tipos; ST.gridNome=f.gridNome; ST.ha=null; ST.eq=null; ST.locks={};
      if(ST.ausencias&&ST.ausencias.length) ST._reconciliar=gAnt;
      // regras novas que vieram junto com a planilha (não duplica as que já existem)
      ST.extras=ST.extras||[]; (BASE.extras||[]).forEach(function(r){ var j=JSON.stringify(r); if(!ST.extras.some(function(e){ return JSON.stringify(e)===j; })) ST.extras.push(deep(r)); });
      ST.hist=ST.hist||[]; ST.hist.unshift({ts:agora(),tipo:"Grade atualizada",txt:"Grade oficial atualizada com a planilha de "+(BASE.versao||"")+": "+dif+" aulas diferentes da grade que estava em uso (a anterior ficou guardada em Grades anteriores).",quem:"",motivo:"Planilha enviada pela coordenação"});
    }
    ST.baseVersao=BASE.versao||"28/09";
  }
  ["tipos","extras","locks","hist","snaps","histLimite","ctx","aviso","haLocais","haLocPad","ausencias","externo"].forEach(function(k){ if(ST[k]==null) ST[k]=f[k]; });
  if(!ST.aviso.base){ ST.aviso.base=deep(ST.grid); ST.aviso.baseTs=agora(); }
  if(!ST.aviso.anexos.gerais) ST.aviso.anexos.gerais={};
  ST.profs.forEach(function(p){ if(p.email==null) p.email=""; if(p.cel==null) p.cel=""; if(!p.ind) p.ind={}; if(/^#[0-9a-fA-F]{6}$/.test(p.cor||"")&&corContraste(p.cor)<4.5) p.cor=corLegivel(p.cor); });
  ST.turmas.forEach(function(tm){ if(!tm.tipo||!tipoById(tm.tipo,true)) tm.tipo=ST.tipos[0].id; });
  Object.keys(f.regras).forEach(function(k){ if(ST.regras[k]==null) ST.regras[k]=f.regras[k]; });
  ST.turmas.forEach(function(tm,t){ ajustarTamanho(t); });
  if(!ST.aviso.baseP) ST.aviso.baseP=basePorProf(ST.aviso.base||ST.grid);
  ST.pares=(ST.pares||[]).map(function(x){ return normPar(x,ST.profs.length,ST.turmas.length); }).filter(Boolean);
})();

// ---------- tipos de horário ----------
function tipoById(id,soChecar){ for(var i=0;i<ST.tipos.length;i++) if(ST.tipos[i].id===id) return ST.tipos[i]; return soChecar?null:ST.tipos[0]; }
function tipoDe(t){ return tipoById(ST.turmas[t].tipo); }
function nA(t){ return tipoDe(t).aulas.length; }
function perDe(t){ return tipoDe(t).periodo; }
function horA(t,a){ var h=tipoDe(t).aulas[a]; return h?h[0]+"–"+h[1]:""; }
function pausas(tp){ var r=[]; for(var a=0;a<tp.aulas.length-1;a++){ var e=toMin(tp.aulas[a][1]), s=toMin(tp.aulas[a+1][0]); if(s>e) r.push({apos:a,ini:hmP(e),fim:hmP(s),min:s-e,nome:s-e>=45?"Almoço":"Intervalo"}); } return r; }
function pausaApos(tp,a){ var ps=pausas(tp); for(var i=0;i<ps.length;i++) if(ps[i].apos===a) return ps[i]; return null; }
function resumoTipo(tp){ var ps=pausas(tp); return tp.periodo+" · "+tp.aulas.length+" aulas · "+tp.aulas[0][0]+"–"+tp.aulas[tp.aulas.length-1][1]+(ps.length?" · "+ps.map(function(p){ return p.nome.toLowerCase()+" após a "+(p.apos+1)+"ª"; }).join(", "):" · sem intervalo"); }
function periodosEmUso(){ var u={}; ST.turmas.forEach(function(tm){ if(!tm.excluida) u[tipoById(tm.tipo).periodo]=1; }); return PERIODOS.filter(function(p){ return u[p]; }); }
// garante que a linha da grade da turma tem o tamanho do horário (aulas por dia × 5)
function ajustarTamanho(t){
  var row=ST.grid[t]||[], n=nA(t); if(row.length===n*5) return false;
  var old=row.length/5|0 || 6; resizeTurma(t,old,n); return true;
}
function resizeTurma(t,oldN,newN){
  var row=ST.grid[t]||[], out=new Array(newN*5).fill(null), sobra=[];
  for(var d=0;d<5;d++) for(var a=0;a<oldN;a++){ var k=row[d*oldN+a]; if(!k) continue; if(a<newN) out[d*newN+a]=k; else sobra.push(k); }
  for(var i=0;i<out.length && sobra.length;i++) if(!out[i]) out[i]=sobra.shift();
  ST.grid[t]=out;
  var nl={}; Object.keys(ST.locks||{}).forEach(function(k){ var q=k.split("|"); if(+q[0]!==t){ nl[k]=ST.locks[k]; return; } var s=+q[1], d=(s/oldN)|0, a=s%oldN; if(a<newN) nl[t+"|"+(d*newN+a)]=true; }); ST.locks=nl;
}

// ---------- modelo de tempo (horários reais) ----------
var _TM=null,_TMsig="";
function TM(){
  var sig=JSON.stringify(ST.tipos)+"|"+ST.turmas.map(function(t){return t.tipo+(t.excluida?"x":"");}).join(",");
  if(_TM&&sig===_TMsig) return _TM;
  var seen={}, TS=[];
  ST.tipos.forEach(function(tp){ tp.aulas.forEach(function(h){ var k=kOfH(h); if(!seen[k]){ seen[k]=1; TS.push([toMin(h[0]),toMin(h[1])]); } }); });
  TS.sort(function(a,b){ return a[0]-b[0]||a[1]-b[1]; });
  var idx={}; TS.forEach(function(x,k){ idx[hmP(x[0])+"-"+hmP(x[1])]=k; });
  var K=TS.length;
  var OVL=TS.map(function(x){ var o=[]; TS.forEach(function(y,j){ if(x[0]<y[1]&&y[0]<x[1]) o.push(j); }); return o; });
  var tsOf=ST.turmas.map(function(tm){ return tipoById(tm.tipo).aulas.map(function(h){ return idx[kOfH(h)]; }); });
  var usedTipo={}; ST.turmas.forEach(function(tm){ if(!tm.excluida) usedTipo[tm.tipo]=1; });
  var nonInt=TS.map(function(){ return 99; }), tiposK=TS.map(function(){ return []; }), usedK={};
  ST.tipos.forEach(function(tp){ var pi=PERIODOS.indexOf(tp.periodo); if(pi<0) pi=0;
    tp.aulas.forEach(function(h){ var k=idx[kOfH(h)]; if(pi!==3) nonInt[k]=Math.min(nonInt[k],pi); if(tiposK[k].indexOf(tp.id)<0) tiposK[k].push(tp.id); if(usedTipo[tp.id]) usedK[k]=1; }); });
  // cada horário real é uma linha; o período da linha vem dos tipos (manhã/tarde/noite) ou, se só existe em horário integral, da hora do dia
  var secK=nonInt.map(function(v,k){ if(v<99) return v; var m=TS[k][0]; return m<12*60?0:m<18*60?1:2; });
  var CL=[], clOfK=[];
  TS.forEach(function(x,k){ CL.push({ini:x[0],fim:x[1],ks:[k],sec:secK[k],i:k}); clOfK[k]=k; });
  CL.forEach(function(c){ c.label=hmP(c.ini)+"–"+hmP(c.fim); c.labelTxt=c.label; });
  var SEC=[]; var algumUso=Object.keys(usedK).length>0; CL.forEach(function(c){ if(algumUso && !usedK[c.i]) return; var s=null; for(var i=0;i<SEC.length;i++) if(SEC[i].per===c.sec) s=SEC[i]; if(!s){ s={per:c.sec,nome:PERIODOS[c.sec],cls:[]}; SEC.push(s); } s.cls.push(c.i); });
  SEC.sort(function(a,b){ return a.per-b.per; });
  var recess=[], rs={}, brk={};
  ST.tipos.forEach(function(tp){ if(!usedTipo[tp.id]) return; pausas(tp).forEach(function(pz){ var key=pz.ini+"-"+pz.fim;
    if(!rs[key]){ rs[key]=1; recess.push([toMin(pz.ini),toMin(pz.fim)]); }
    var ci=clOfK[idx[kOfH(tp.aulas[pz.apos])]]; var L=brk[ci]=brk[ci]||[]; var ex=null; L.forEach(function(x){ if(x.ini===pz.ini&&x.fim===pz.fim) ex=x; });
    if(ex) ex.tipos.push(tp.nome); else L.push({nome:pz.nome,ini:pz.ini,fim:pz.fim,tipos:[tp.nome]}); }); });
  // faixas de recreio: intervalos próximos (de horários diferentes) formam uma faixa só;
  // o professor precisa de intervalo quando dá aula antes do começo e depois do fim da faixa
  recess.sort(function(a,b){ return a[0]-b[0]; });
  var zonas=[]; recess.forEach(function(w){ var z=zonas[zonas.length-1]; if(z && w[0]-z[1]<60) z[1]=Math.max(z[1],w[1]); else zonas.push([w[0],w[1]]); });
  recess=zonas;
  _TM={TS:TS,K:K,OVL:OVL,idx:idx,tsOf:tsOf,CL:CL,clOfK:clOfK,SEC:SEC,recess:recess,brk:brk,usedTipo:usedTipo,tiposK:tiposK,usedK:Object.keys(usedK).map(Number)};
  _TMsig=sig; return _TM;
}
function brkTxt(b,html){ var vistos={}; return b.map(function(x){ return x.nome+" "+x.ini+"–"+x.fim; }).filter(function(t){ if(vistos[t]) return false; vistos[t]=1; return true; }).map(function(t){ return html?esc(t):t; }).join(html?" · ":"   ·   "); }
// linhas para tabelas por horário de uma turma
function linhasTurma(t){ var tp=tipoDe(t), L=[]; tp.aulas.forEach(function(h,a){ L.push({a:a,label:(a+1)+"ª<br>"+h[0]+"–"+h[1],txt:(a+1)+"ª  "+h[0]+"–"+h[1]}); var pz=pausaApos(tp,a); if(pz) L.push({brk:pz.nome+" "+pz.ini+"–"+pz.fim,brkLabel:pz.nome}); }); return L; }
// linhas para tabelas do professor: faixas de horário (aulas parecidas de tipos diferentes juntas) de um período
function linhasSecao(sec,filtro){ var tm=TM(), L=[]; sec.cls.forEach(function(ci,j){ if(filtro && !filtro(ci)) return; var c=tm.CL[ci]; L.push({ci:ci,label:c.label,txt:c.labelTxt}); var b=tm.brk[ci]; if(b&&b.length) L.push({brk:brkTxt(b,true),brkPlain:brkTxt(b,false),brkLabel:b.length===1?b[0].nome:"Intervalos"}); }); return L; }
function tabelaDias(linhas,cellFn,heads){
  var h='<table class="g"><tr><th></th>'+heads.map(function(d){ return "<th>"+d+"</th>"; }).join("")+"</tr>";
  linhas.forEach(function(ln){ if(ln.brk!=null){ h+='<tr class="brk"><th class="tm">'+esc(ln.brkLabel)+'</th><td colspan="5"><div class="brkc">'+ln.brk+"</div></td></tr>"; return; }
    h+='<tr><th class="tm">'+ln.label+"</th>"; for(var d=0;d<5;d++) h+="<td>"+cellFn(d,ln)+"</td>"; h+="</tr>"; });
  return h+"</table>";
}
function headsDias(datas){ return DIAS.map(function(d,i){ return datas?d+" "+fmtDM(datas[i]):d; }); }

// ---------- disponibilidade do professor (por horário real) ----------
function blkVal(p,d,ini,fim){ var ind=ST.profs[p].ind||{}, v=0;
  for(var key in ind){ var x=ind[key]; if(!x) continue; var bar=key.indexOf("|"); if(+key.slice(0,bar)!==d) continue; var r=key.slice(bar+1).split("-"), a=toMin(r[0]), b=toMin(r[1]);
    var ov=Math.min(fim,b)-Math.max(ini,a); if(ov>10||(ov>0&&ov>=(fim-ini)/2)) v=Math.max(v,x); }
  return v; }
function setBlkFaixa(p,d,ini,fim,v){ var ind=ST.profs[p].ind=ST.profs[p].ind||{};
  Object.keys(ind).forEach(function(key){ var bar=key.indexOf("|"); if(+key.slice(0,bar)!==d) return; var r=key.slice(bar+1).split("-"), a=toMin(r[0]), b=toMin(r[1]); var ov=Math.min(fim,b)-Math.max(ini,a); if(ov>10||(ov>0&&ov>=(b-a)/2)) delete ind[key]; });
  if(v) ind[d+"|"+hmP(ini)+"-"+hmP(fim)]=v; }

// ---------- horários em outras escolas (aba Relatórios › Importar/Exportar) ----------
// 4 = o professor está em outra escola nesse horário (rígido); 5 = pouco tempo para chegar de uma escola à outra (preferência)
var _EXT=null;
function extIdx(){ if(_EXT) return _EXT; var I={}, E=ST.externo;
  if(E&&E.escolas) E.escolas.forEach(function(e,ei){ (e.itens||[]).forEach(function(x,xi){ if(!(x.d>=0&&x.d<=4&&x.d%1===0)) return; var L=(I[x.p]=I[x.p]||[[],[],[],[],[]])[x.d]; L.push([toMin(x.ini),toMin(x.fim),ei,xi]); }); });
  _EXT=I; return I; }
function extVal(p,d,ini,fim,sempre){ var E=ST.externo; if(!E||!E.escolas||!E.escolas.length||(!sempre&&!E.usar)) return 0;
  var L=(extIdx()[p]||[])[d]; if(!L||!L.length) return 0; var mg=+E.margem||0, v=0;
  for(var i=0;i<L.length;i++){ var x=L[i]; if(x[0]<fim && ini<x[1]) return 4; if(Math.max(x[0]-fim,ini-x[1])<mg) v=5; }
  return v; }
// o que o professor tem na outra escola nesse horário (para mostrar)
function extInfo(p,d,ini,fim){ var E=ST.externo, out=[]; if(!E||!E.escolas) return out; var L=(extIdx()[p]||[])[d]||[];
  L.forEach(function(x){ if(x[0]<fim && ini<x[1]){ var e=E.escolas[x[2]], it=e.itens[x[3]]; out.push({escola:e.nome, ini:x[0], fim:x[1], txt:it.txt}); } }); return out; }
function extDaAula(t,s){ var k=(ST.grid[t]||[])[s]; if(!k) return null; var n=nA(t), tm=TM(), kk=tm.tsOf[t][s%n]; if(kk==null) return null; var T=tm.TS[kk], ei=extInfo(parseK(k).p,(s/n)|0,T[0],T[1]); return ei.length?ei[0]:null; }
function marcaExt(html,e){ if(!e) return html; return html.replace(/<\/div>$/,'<span class="tmx extw" title="'+esc("Em outra escola nesse horário: "+e.escola+" "+hmP(e.ini)+"–"+hmP(e.fim)+(e.txt?" ("+e.txt+")":""))+'">⚠ outra escola</span></div>'); }
function temExt(p){ var I=extIdx()[p]; return !!I && I.some(function(L){ return L.length>0; }); }
function blkComb(p,d,ini,fim){ var v=blkVal(p,d,ini,fim), e=extVal(p,d,ini,fim); if(e===4&&v<2) return 4; if(e===5&&v===0) return 5; return v; }

// ---------- aulas por professor ----------
function idxAulas(grid){ grid=grid||ST.grid; var tm=TM(), out=ST.profs.map(function(){ return []; });
  ST.turmas.forEach(function(T,t){ if(T.excluida) return; var row=grid[t]||[], n=nA(t);
    for(var s=0;s<row.length && s<n*5;s++){ var k=row[s]; if(!k) continue; var x=parseK(k); if(!out[x.p]) continue; var a=s%n, kk=tm.tsOf[t][a];
      out[x.p].push({p:x.p,t:t,s:s,d:(s/n)|0,a:a,k:kk,ini:tm.TS[kk][0],fim:tm.TS[kk][1],disc:x.disc,key:k}); } });
  return out; }
function haParse(key){ var bar=key.indexOf("|"), r=key.slice(bar+1).split("-"); return {d:+key.slice(0,bar),ini:toMin(r[0]),fim:toMin(r[1]),txt:r[0]+"–"+r[1]}; }
// linha (horário) em que uma HA aparece: o horário exato dela, ou o primeiro que se sobrepõe
function linhaDaHA(key){ var tm=TM(), x=haParse(key), k=tm.idx[hmP(x.ini)+"-"+hmP(x.fim)]; if(k!=null) return tm.clOfK[k];
  for(var i=0;i<tm.CL.length;i++){ var cl=tm.CL[i]; if(x.ini<cl.fim && cl.ini<x.fim) return i; } return -1; }
// aulas de cada professor com o horário real (para comparar "o que mudou" mesmo se o horário da turma mudar)
function basePorProf(grid){ var out={};
  ST.turmas.forEach(function(T,t){ var row=grid[t]||[], n=(row.length/5)|0, tp=tipoDe(t); if(!n) return;
    row.forEach(function(k,s){ if(!k) return; var x=parseK(k), a=s%n, h=tp.aulas[a]; if(!h) return; (out[x.p]=out[x.p]||[]).push(t+"|"+((s/n)|0)+"|"+h[0]+"-"+h[1]+"|"+x.disc); }); });
  return out; }
function lugarTS(t,s){ var n=nA(t); return ST.turmas[t].nome+", "+DIAS[(s/n)|0]+" "+(s%n+1)+"ª ("+horA(t,s%n)+")"; }

// ---------- modelo para o motor ----------
function buildModelData(){
  var tm=TM(), lessons=[], byT=ST.turmas.map(function(){ return {}; });
  ST.matriz.forEach(function(r){ for(var i=0;i<r.n;i++){ lessons.push({t:r.t,disc:r.disc,p:r.p,doc2:r.doc2}); var k=kOf(r.disc,r.p,r.doc2); (byT[r.t][k]=byT[r.t][k]||[]).push(lessons.length-1); } });
  var erros=[], grid=[];
  ST.turmas.forEach(function(T,t){
    var N=nA(t)*5, arr=new Array(N).fill(-1), pool={}; Object.keys(byT[t]).forEach(function(k){ pool[k]=byT[t][k].slice(); });
    var g=(ST.grid[t]||[]);
    for(var s=0;s<N;s++){ var k=g[s]; if(k && pool[k] && pool[k].length) arr[s]=pool[k].pop(); }
    var rest=[]; Object.keys(pool).forEach(function(k){ rest=rest.concat(pool[k]); });
    var vazios=[]; for(var s2=0;s2<N;s2++) if(arr[s2]<0) vazios.push(s2);
    if(rest.length>vazios.length) erros.push(T.nome+" tem "+(N+rest.length-vazios.length)+" aulas cadastradas (o horário dela tem "+N+").");
    for(var i=0;i<rest.length && i<vazios.length;i++) arr[vazios[i]]=rest[i];
    grid.push(arr);
  });
  var R=ST.regras, W={};
  W.sep=R.sep?30:0; W.intervalo=R.intervalo?800:0;
  if(!R.two) W.twoSameDay=0; if(!R.par){W.single=0;W.split=0;} if(!R.late) W.gemLate=0; if(!R.cross) W.cross=0; if(!R.gap){ W.gap=0; W.janLonga=0; }
  var turmas=ST.turmas.map(function(T,t){ return {nome:T.nome,nA:nA(t),ts:tm.tsOf[t],per:Math.max(0,PERIODOS.indexOf(perDe(t))),nivel:T.nivel,alunos:T.alunos}; });
  var profs=ST.profs.map(function(p,i){ var blk=new Array(5*tm.K); for(var d=0;d<5;d++) for(var k=0;k<tm.K;k++) blk[d*tm.K+k]=blkComb(i,d,tm.TS[k][0],tm.TS[k][1]);
    return {nome:p.nome,blk:blk,maxDia:p.maxDia,concentrar:p.concentrar,haManual:p.haManual}; });
  var D={turmas:turmas,profs:profs,lessons:lessons,pares:ST.pares,K:tm.K,TS:tm.TS,OVL:tm.OVL,recess:tm.recess,secTS:tm.CL.map(function(c){ return c.sec; })};
  var M=Motor.buildModel(D,{weights:W,maxSamePerDay:+R.max||2,minBreak:+R.minBreak||15,extras:ST.extras});
  var locked=ST.turmas.map(function(T,t){ var N=nA(t)*5, a=new Array(N).fill(false); for(var s=0;s<N;s++) if(ST.locks[t+"|"+s]) a[s]=true; return a; });
  return {M:M, grid:grid, erros:erros, lessons:lessons, locked:locked};
}
function gridFromIdx(lessons, g){ return g.map(function(row){ return row.map(function(li){ if(li<0) return null; var l=lessons[li]; return kOf(l.disc,l.p,l.doc2); }); }); }

var CACHE=null;
function analisar(){
  var md=buildModelData(); var pr=Motor.problemas(md.M, md.grid);
  md.erros.forEach(function(e){ var t=-1; ST.turmas.forEach(function(T,i){ if(t<0&&e.indexOf(T.nome+" tem ")===0) t=i; }); pr.unshift({tipo:"rígida",txt:e,loc:t>=0?{turmaCad:t}:null}); });
  haConflitos().forEach(function(x){ pr.push({tipo:"rígida",txt:x.txt,loc:x.loc}); });
  CACHE={md:md, pr:pr, S:Motor.initState(md.M, md.grid)};
  var nb=pr.filter(function(x){return x.tipo==="rígida";}).length;
  var b=document.querySelector('nav button[data-s="inicio"]');
  b.innerHTML="Gerar"+(nb?'<span class="badge">'+nb+'</span>':"");
  var ne=0; try{ if(ST.externo&&ST.externo.escolas.length) ne=exConflitos(exItensGuardados(),0).length; }catch(e){}
  NEXT=ne; var be=document.querySelector('#subnav button[data-s="externo"]'); if(be) be.innerHTML="Importar/Exportar"+(ne?'<span class="badge" title="professores em dois lugares">'+ne+"</span>":"");
  var br=document.querySelector('nav button[data-s="rel"]'); if(br) br.innerHTML="Relatórios"+(ne?'<span class="badge" title="professores em dois lugares (Importar/Exportar)">'+ne+"</span>":"");
  var nv=vagasDoDia(hoje()).length; NVAG=nv; var bv=document.querySelector('#subnav button[data-s="vagas"]'); if(bv) bv.innerHTML="Aulas vagas"+(nv?'<span class="badge vg" title="aulas vagas hoje">'+nv+"</span>":"");
  var bg=document.querySelector('nav button[data-s="grade"]'); if(bg) bg.innerHTML="Grade"+(nv?'<span class="badge vg" title="aulas vagas hoje (Grade › Aulas vagas)">'+nv+"</span>":"");
  return CACHE;
}
function cache(){ return CACHE||analisar(); }
// HA que ficou em cima de uma aula (por exemplo, depois de mudar um horário)
function haConflitos(){ var out=[]; if(!ST.ha) return out; var AP=idxAulas();
  Object.keys(ST.ha).forEach(function(p){ p=+p; if(!ST.profs[p]) return; (ST.ha[p].slots||[]).forEach(function(key){ var x=haParse(key);
    (AP[p]||[]).forEach(function(a){ if(a.d===x.d && a.ini<x.fim && x.ini<a.fim) out.push({loc:{p:p,d:x.d,ha:key},txt:"Hora-atividade de "+ST.profs[p].nome+" em cima de uma aula — "+DIAS[x.d]+", "+x.txt+" ("+ST.turmas[a.t].nome+" "+a.disc+"). Tire essa HA ou gere a HA de novo."}); });
    if(extVal(p,x.d,x.ini,x.fim)===4) out.push({loc:{p:p,d:x.d,ha:key},txt:"Hora-atividade de "+ST.profs[p].nome+" num horário em que ele está em outra escola — "+DIAS[x.d]+", "+x.txt+". Gere a HA de novo."}); }); });
  return out; }
// depois de uma troca, tira só as HAs que ficaram em cima de aula dos professores envolvidos
function haConferir(ps){ if(!ST.ha) return 0; var AP=idxAulas(), n=0;
  ps.forEach(function(p){ var h=ST.ha[p]; if(!h) return; h.slots=h.slots.filter(function(key){ var x=haParse(key), bate=(AP[p]||[]).some(function(a){ return a.d===x.d && a.ini<x.fim && x.ini<a.fim; })||extVal(p,x.d,x.ini,x.fim)===4; if(bate){ n++; if(h.locais) delete h.locais[key]; } return !bate; }); });
  return n; }
// aulas em conflito (professor em dois lugares ou em horário que não pode)
function conflitosSet(){
  var c=cache(), M=c.md.M, S=c.S, tm=TM(), set={};
  ST.turmas.forEach(function(T,t){ var n=nA(t), row=ST.grid[t]||[];
    for(var s=0;s<row.length;s++){ var k=row[s]; if(!k) continue; var p=parseK(k).p, d=(s/n)|0, kk=tm.tsOf[t][s%n], base=p*M.DK+d*M.K;
      var bb=M.blk[base+kk], bad=S.occ[base+kk]>1 || (bb>=2&&bb!==5);
      if(!bad) tm.OVL[kk].forEach(function(k2){ if(k2!==kk && S.occ[base+k2]>0) bad=true; });
      if(bad) set[t+"|"+s]=1; } });
  return set;
}

// ---------- histórico ----------
function logar(tipo,txt,extra){
  ST.hist.unshift(Object.assign({ts:agora(),tipo:tipo,txt:txt,quem:ST.ctx.quem||"",motivo:ST.ctx.motivo||""},extra||{}));
  if(ST.hist.length>1000) ST.hist.length=1000;
  save();
}
function guardarGrade(nome){
  ST.snaps.unshift({id:Date.now()+"-"+Math.random().toString(36).slice(2,6),ts:agora(),nome:nome||ST.gridNome,grid:deep(ST.grid),quem:ST.ctx.quem||"",motivo:ST.ctx.motivo||""});
  var lim=+ST.histLimite||15; if(ST.snaps.length>lim) ST.snaps.length=lim;
  save();
}
function diffGrids(a,b){ var out=[]; ST.turmas.forEach(function(tm,t){ var N=Math.max((a[t]||[]).length,(b[t]||[]).length); for(var s=0;s<N;s++){ var x=(a[t]||[])[s]||null, y=(b[t]||[])[s]||null; if(x!==y) out.push({t:t,s:s,antes:x,depois:y}); } }); return out; }
function descK(k){ if(!k) return "vago"; var x=parseK(k); return x.disc+" ("+pnome(x.p)+")"; }

// ---------- navegação ----------
var cur="inicio";
// abas que ficam agrupadas: Cadastro e Relatórios mostram uma barra com as partes logo abaixo do menu
var GRUPOS={grade:{nome:"Grade",abas:[["grade","Grade de aulas"],["vagas","Aulas vagas"]]},cad:{nome:"Cadastro",abas:[["inst","Instituição"],["profs","Professores"],["turmas","Turmas e aulas"],["horarios","Horários"],["ha","Hora-atividade"],["regras","Regras"],["equip","Equipamentos"]]},
  rel:{nome:"Relatórios",abas:[["dados","Imprimir e Baixar"],["backup","Backup"],["externo","Importar/Exportar"]]}};
var NVAG=0, ULTIMA={grade:"grade",cad:"inst",rel:"dados"}, NEXT=0;
function grupoDe(s){ for(var g in GRUPOS) if(GRUPOS[g].abas.some(function(a){ return a[0]===s; })) return g; return null; }
document.getElementById("nav").addEventListener("click",function(e){ var b=e.target.closest("button"); if(!b) return; var s=b.dataset.s; show(GRUPOS[s]?ULTIMA[s]:s); });
document.getElementById("subnav").addEventListener("click",function(e){ var b=e.target.closest("button"); if(!b) return; show(b.dataset.s); });
function renderSubnav(s){ var g=grupoDe(s), el=document.getElementById("subnav");
  if(!g){ el.hidden=true; el.innerHTML=""; return; }
  el.hidden=false; el.innerHTML='<span class="sntit">'+GRUPOS[g].nome+':</span>'+GRUPOS[g].abas.map(function(a){ var bd=a[0]==="vagas"&&NVAG?'<span class="badge vg" title="aulas vagas hoje">'+NVAG+"</span>":a[0]==="externo"&&NEXT?'<span class="badge" title="professores em dois lugares">'+NEXT+"</span>":"";
    return '<button data-s="'+a[0]+'"'+(a[0]===s?' class="on" aria-current="page"':"")+">"+a[1]+bd+"</button>"; }).join("");
  centralizar(el); }
// no celular a barra rola de lado: deixa o botão escolhido à vista
function centralizar(el){ var on=el.querySelector("button.on"); if(on&&el.scrollWidth>el.clientWidth) el.scrollLeft=Math.max(0,on.offsetLeft-(el.clientWidth-on.offsetWidth)/2); }
function show(s){
  if(RUN && s!=="inicio"){ document.getElementById("progTxt").textContent="Aguarde terminar (ou clique em Parar) antes de mudar de aba."; return; }
  if(typeof EDG!=="undefined" && EDG && ["inicio","grade","hist"].indexOf(s)<0){ edToast("Você está <b>editando a grade</b>. Clique em <b>Salvar</b> ou <b>Cancelar</b> na faixa amarela antes de ir para outra aba. (Durante a edição dá para usar Gerar, Grade e Histórico.)"); return; }
  if(typeof PEDIT!=="undefined" && PEDIT && s!=="profs"){ var m=document.getElementById("pfMsg"); if(m) m.innerHTML='<div class="msg warn">Você está editando um professor. Clique em <b>Salvar</b> ou <b>Cancelar</b> antes de sair desta aba.</div>'; return; }
  var g=grupoDe(s); if(g) ULTIMA[g]=s;
  cur=s; document.querySelectorAll("nav button").forEach(function(b){ var on=b.dataset.s===s||b.dataset.s===g; b.classList.toggle("on",on); if(on) b.setAttribute("aria-current","page"); else b.removeAttribute("aria-current"); });
  renderSubnav(s); centralizar(document.getElementById("nav"));
  document.querySelectorAll("main section").forEach(function(x){ x.classList.toggle("on",x.id==="s-"+s); });
  renderBanner(); if(typeof edBarraGlobal==="function") edBarraGlobal();
  ({avisos:renderAvisos,hist:renderHist,inicio:renderInicio,grade:renderGrade,vagas:renderVagas,ha:renderHA,equip:renderEquipCfg,profs:renderProfs,externo:renderExterno,inst:renderInst,turmas:renderTurmas,horarios:renderHorarios,regras:renderRegras,dados:renderDados,backup:renderBackup}[s])();
}
function alertBox(sec,txt,cls){ var el=document.getElementById({inicio:"progTxt",grade:"gMsg",ha:"haMsg",equip:"eqMsg",dados:"xMsg"}[sec]); if(sec==="inicio"){ el.textContent=txt; return;} el.innerHTML='<div class="msg '+(cls||"warn")+'">'+esc(txt)+'</div>'; }
function printSec(id){ var el=document.getElementById(id); el.classList.add("print"); window.print(); setTimeout(function(){ el.classList.remove("print"); },500); }

// ---------- GERAR ----------
function renderInicio(){
  var c=analisar(), pr=c.pr;
  var nAulas=c.md.lessons.length, nr=0,ng=0,np=0;
  pr.forEach(function(x){ if(x.tipo==="rígida")nr++; else if(x.tipo==="regra")ng++; else np++; });
  var nv=vagasDoDia(hoje());
  document.getElementById("stats").innerHTML=
    st(ST.gridNome,"grade em uso","")+st(ST.turmas.filter(function(t){return !t.excluida;}).length,"turmas","")+st(ST.profs.filter(function(p){return p.nome!=="(excluído)";}).length,"professores","")+st(nAulas,"aulas na semana","")+
    st(nr,"conflitos rígidos",nr?"bad":"ok")+st(ng,"regras quebradas",ng?"warn":"ok")+st(np,"preferências não atendidas",np?"warn":"ok")+
    st(nv.length,"aulas vagas hoje"+(nv.length?" ("+nv.filter(function(x){return x.sub!=null;}).length+" com substituto)":""),nv.length?"warn":"");
  renderPList();
  if(typeof tdRenderGerar==="function") tdRenderGerar();
  if(typeof edBotoes==="function"){ edBotoes(); edBarraGlobal(); }
}
function st(v,l,cls){ return '<div class="stat '+cls+'"><b>'+esc(v)+'</b><span>'+l+'</span></div>'; }
["fR","fG","fP"].forEach(function(id){ document.getElementById(id).addEventListener("change",renderPList); });

var RUN=null;
function rodar(zero){
  if(RUN) return; if(!edPrecisa()) return; edGuardarPasso();
  var md=buildModelData();
  if(md.erros.length){ alertBox("inicio",md.erros.join(" ")); }
  var g=md.grid.map(function(r){ return r.slice(); });
  if(zero) g=g.map(function(r,t){ var a=r.slice(), free=[]; for(var s=0;s<a.length;s++) if(!md.locked[t][s]) free.push(s);
    for(var i=free.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var x=a[free[i]];a[free[i]]=a[free[j]];a[free[j]]=x; } return a; });
  guardarGrade("Antes de "+(zero?"gerar do zero":"ajustar")+" — "+ST.gridNome);
  var gridAntes=deep(ST.grid), custoAntes=Motor.totalCost(md.M,Motor.initState(md.M,md.grid));
  var S=new Motor.Solver(md.M,g,{iters:zero?6000000:2500000,T0:zero?50:5,locked:md.locked,estavel:!zero,wMove:4});
  RUN={S:S,stop:false};
  setBusy(true);
  var t0=Date.now();
  (function loop(){
    if(RUN.stop){ fim(); return; }
    var done=S.step(60000);
    var pct=Math.round(100*S.done/S.total);
    document.getElementById("progBar").style.width=pct+"%";
    document.getElementById("progTxt").textContent=pct+"% · "+Math.round((Date.now()-t0)/1000)+" s";
    if(done) fim(); else setTimeout(loop,0);
  })();
  function fim(){
    var r=S.result(), parou=RUN.stop;
    // se parou no meio e o resultado ficou pior que a grade que estava em uso, mantém a anterior
    if(parou && Motor.totalCost(md.M,Motor.initState(md.M,r.grade))>=custoAntes){
      logar("Grade gerada",(zero?"Geração do zero":"Ajuste")+" interrompido antes de terminar; a grade anterior foi mantida.");
      setBusy(false); RUN=null; renderInicio(); document.getElementById("progTxt").textContent="Interrompido: a grade anterior foi mantida."; return; }
    ST.grid=gridFromIdx(md.lessons,r.grade);
    ST.gridNome=(zero?"Gerada do zero":"Ajustada")+" em "+new Date().toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
    var tinhaHA=!!ST.ha, tinhaEq=!!ST.eq; ST.ha=null; ST.eq=null;
    var nAus=reconciliarAusencias(gridAntes);
    var dif=diffGrids(gridAntes,ST.grid); var pr=analisar().pr;
    logar("Grade gerada",(zero?"Grade gerada do zero":"Grade ajustada")+": "+dif.length+" aulas mudaram de lugar. Resultado: "+pr.filter(function(x){return x.tipo==="rígida";}).length+" conflitos rígidos, "+pr.filter(function(x){return x.tipo==="regra";}).length+" regras quebradas, "+pr.filter(function(x){return x.tipo==="preferência";}).length+" preferências não atendidas.");
    guardarGrade(ST.gridNome);
    save(); setBusy(false); RUN=null; PABERTO=null;
    var pend=pr.filter(function(x){ return x.tipo!=="preferência"; }); if(pend.length) PABERTO=chaveProb(pend[0]);
    renderInicio(); renderBanner();
    var avisos=[]; if(tinhaHA) avisos.push("gere a hora-atividade de novo"); if(tinhaEq) avisos.push("gere os equipamentos de novo"); if(nAus) avisos.push("confira "+nAus+" aula(s) vaga(s) que mudaram de lugar");
    document.getElementById("progTxt").textContent=(parou?"Interrompido, mas a grade melhorou e foi salva. ":"Pronto. ")+(avisos.length?"A grade mudou: "+avisos.join("; ")+". ":"")+(pend.length?"Ficaram "+pend.length+" ponto(s) para resolver: o primeiro já está aberto abaixo com as opções de ajuste; clique nos outros para ver as opções de cada um.":"");
    if(pend.length) setTimeout(function(){ var el=document.querySelector("#plist .pitem.on"); if(el) el.scrollIntoView({behavior:"smooth",block:"center"}); },120);
  }
}
function setBusy(b){ document.getElementById("bAjustar").disabled=b; document.getElementById("bZero").disabled=b; document.getElementById("bParar").disabled=!b; document.body.classList.toggle("ocupado",b); }
document.getElementById("bAjustar").onclick=function(){ rodar(false); };
document.getElementById("bZero").onclick=function(){ rodar(true); };
document.getElementById("bParar").onclick=function(){ if(RUN) RUN.stop=true; };

// =====================================================================
// AULAS VAGAS (ausências): não mudam a grade oficial; valem só nas datas marcadas
// aus = {id,p,de,ate,motivo,quem,ts, so:[chaves]|null, fora:{chave:1}, subs:{chave:prof}, cancelada}
// chave de uma aula numa data = "AAAA-MM-DD|turma|posição"
// =====================================================================
function novoId(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
function itensAus(a,AP,ignorarFora){
  AP=AP||idxAulas(); var out=[]; if(a.cancelada) return out; var L=AP[a.p]||[];
  diasUteis(a.de,a.ate).forEach(function(date){ var d=wdIdx(date);
    L.forEach(function(x){ if(x.d!==d) return; var key=date+"|"+x.t+"|"+x.s;
      if(a.so&&a.so.indexOf(key)<0) return; if(!ignorarFora&&a.fora&&a.fora[key]) return;
      out.push(Object.assign({chave:key,date:date,aus:a,sub:(a.subs&&a.subs[key]!=null)?a.subs[key]:null,fora:!!(a.fora&&a.fora[key])},x)); }); });
  out.sort(function(x,y){ return x.date<y.date?-1:x.date>y.date?1:x.ini-y.ini; });
  return out;
}
// quando a grade muda (troca, ajuste, mudança de horário), as marcações de aula vaga seguem a aula do professor:
// procura a mesma aula (mesma disciplina e professor) na mesma turma e no mesmo dia; se não achar, a marcação sai
function reconciliarAusencias(gAntes){
  if(!ST.ausencias||!ST.ausencias.length||!gAntes) return 0;
  var mudou=0, perdidas=[];
  ST.ausencias.forEach(function(a){ if(a.cancelada) return;
    var usados={};
    function novaChave(key){ var q=key.split("|"), date=q[0], t=+q[1], s=+q[2], rowA=gAntes[t]||[], nAnt=(rowA.length/5)|0;
      if(!ST.turmas[t]||ST.turmas[t].excluida||!nAnt) return null;
      var k=rowA[s]; if(!k) return null; var n=nA(t), d=(s/nAnt)|0, row=ST.grid[t]||[];
      if(nAnt===n && row[s]===k && !usados[t+"|"+s]){ usados[t+"|"+s]=1; return key; }
      for(var a2=0;a2<n;a2++){ var s2=d*n+a2; if(row[s2]===k && !usados[t+"|"+s2]){ usados[t+"|"+s2]=1; return date+"|"+t+"|"+s2; } }
      return null; }
    var trocas={};
    var todas=[].concat(a.so||[],Object.keys(a.fora||{}),Object.keys(a.subs||{}));
    todas.forEach(function(key){ if(key in trocas) return; trocas[key]=novaChave(key); });
    var aplica=function(key){ return trocas[key]; };
    if(a.so){ var so=a.so.map(aplica).filter(Boolean); if(so.length!==a.so.length||so.some(function(x,i){ return x!==a.so[i]; })) mudou++; if(so.length<a.so.length) perdidas.push(pnome(a.p)); a.so=so; if(!so.length) a.cancelada=true; }
    var fora={}; Object.keys(a.fora||{}).forEach(function(k){ var nk=aplica(k); if(nk) fora[nk]=1; if(nk!==k) mudou++; }); a.fora=fora;
    var subs={}; Object.keys(a.subs||{}).forEach(function(k){ var nk=aplica(k); if(nk) subs[nk]=a.subs[k]; else perdidas.push(pnome(a.p)+" (substituto "+pnome(a.subs[k])+")"); if(nk!==k) mudou++; }); a.subs=subs;
  });
  if(mudou||perdidas.length) logar("Aula vaga","A grade mudou e as marcações de aula vaga foram conferidas"+(perdidas.length?". Precisam de nova conferência: "+uniq(perdidas).join(", "):"")+".");
  return perdidas.length;
}
function vagaMapa(datas){
  var AP=idxAulas(), set={}, ini=datas[0], fim=datas[datas.length-1], M={cell:{},subs:{},aus:{}};
  datas.forEach(function(d){ set[d]=1; });
  ST.ausencias.forEach(function(a){ if(a.cancelada||a.ate<ini||a.de>fim) return;
    itensAus(a,AP).forEach(function(it){ if(!set[it.date]) return; M.cell[it.chave]=it; if(it.sub!=null)(M.subs[it.sub]=M.subs[it.sub]||[]).push(it); (M.aus[a.p]=M.aus[a.p]||{})[it.date]=1; }); });
  return M;
}
function vagasDoDia(date){ var w=parseYmd(date).getDay(); if(w===0||w===6) return []; var m=vagaMapa([date]); return Object.keys(m.cell).map(function(k){ return m.cell[k]; }).sort(function(a,b){ return a.ini-b.ini||ST.turmas[a.t].nome.localeCompare(ST.turmas[b.t].nome); }); }
// o professor q pode cobrir uma aula nessa data e horário? null = livre; senão o motivo
function ocupacao(q,date,ini,fim,ignorarAus,AP){
  AP=AP||idxAulas(); var d=wdIdx(date);
  for(var i=0;i<ST.ausencias.length;i++){ var a=ST.ausencias[i]; if(a.cancelada||a.p!==q||date<a.de||date>a.ate) continue; if(!a.so) return "ausente"; }
  var L=AP[q]||[];
  for(var j=0;j<L.length;j++){ var x=L[j]; if(x.d===d && x.ini<fim && ini<x.fim) return "aula"; }
  for(var i2=0;i2<ST.ausencias.length;i2++){ var b=ST.ausencias[i2]; if(b.cancelada||b.id===ignorarAus||!b.subs) continue;
    for(var key in b.subs){ if(b.subs[key]!==q||key.indexOf(date+"|")!==0) continue; var q2=key.split("|"), t=+q2[1], s=+q2[2], n=nA(t), kk=TM().tsOf[t][s%n], T=TM().TS[kk]; if(T[0]<fim && ini<T[1]) return "substituindo"; } }
  if(ST.ha&&ST.ha[q]) for(var h=0;h<ST.ha[q].slots.length;h++){ var y=haParse(ST.ha[q].slots[h]); if(y.d===d && y.ini<fim && ini<y.fim) return "HA"; }
  var bv=blkVal(q,d,ini,fim); if(bv===3) return "formador"; if(bv===2) return "não pode";
  if(extVal(q,d,ini,fim,true)===4) return "em outra escola";
  return null;
}
function profsOrdem(){ return ST.profs.map(function(p,i){return i;}).filter(function(i){ return ST.profs[i].nome!=="(excluído)"; }).sort(function(a,b){ return ST.profs[a].nome.localeCompare(ST.profs[b].nome); }); }
function opcoesSub(it,ausId,cur,AP){
  var livres=[], emHA=[];
  profsOrdem().forEach(function(q){ if(q===it.p) return; var o=ocupacao(q,it.date,it.ini,it.fim,ausId,AP); if(o===null) livres.push(q); else if(o==="HA") emHA.push(q); });
  var h='<option value="">— Aula vaga (ninguém) —</option>';
  if(cur!=null && cur!=="" && livres.indexOf(cur)<0 && emHA.indexOf(cur)<0) h+='<option value="'+cur+'" selected>'+esc(pnome(cur))+" (agora está ocupado)</option>";
  h+='<optgroup label="Livres nesse horário">'+livres.map(function(q){ return '<option value="'+q+'"'+(q===cur?" selected":"")+">"+esc(pnome(q))+"</option>"; }).join("")+"</optgroup>";
  if(emHA.length) h+='<optgroup label="Em hora-atividade nesse horário">'+emHA.map(function(q){ return '<option value="'+q+'"'+(q===cur?" selected":"")+">"+esc(pnome(q))+" (em HA)</option>"; }).join("")+"</optgroup>";
  return h;
}
function statusAus(a){ var h0=hoje();
  if(a.cancelada) return {txt:"Cancelada",cls:"background:#EEF2F6;color:#5A6878",enc:true};
  if(a.ate<h0) return {txt:"Encerrada",cls:"background:#EEF2F6;color:#5A6878",enc:true};
  if(a.de<=h0) return {txt:"Acontecendo agora",cls:"background:#FDE8E6;color:#B42318"};
  if(a.de===diaUtilOuProx(addDias(h0,1))) return {txt:"Próximo dia de aula",cls:"background:#FDE8E6;color:#B42318"};
  return {txt:"Agendada",cls:"background:#FCEBDD;color:#9A4513"};
}
function periodoTxt(a){ return a.de===a.ate?DIAS_C[wdIdx(a.de)]+" "+fmtDM(a.de):fmtDM(a.de)+" a "+fmtDM(a.ate); }

// ---- formulário ----
var FORM=null;
function novoForm(p){ var d=diaUtilOuProx(hoje()); FORM={id:null,p:p==null?"":p,de:d,ate:d,motivo:"",quem:ST.ctx.quem||"",fora:{},subs:{},modo:"nenhum",subUm:""}; }
function editarAus(id){ var a=ST.ausencias.filter(function(x){return x.id===id;})[0]; if(!a) return; FORM=deep(a); FORM.modo=Object.keys(a.subs||{}).length?"cada":"nenhum"; FORM.subUm=""; FORM.fora=FORM.fora||{}; FORM.subs=FORM.subs||{}; }
function formItens(AP){ if(!FORM||FORM.p===""||!FORM.de||!FORM.ate||FORM.ate<FORM.de) return []; var a={p:+FORM.p,de:FORM.de,ate:FORM.ate,so:FORM.so||null,fora:FORM.fora,subs:FORM.subs}; return itensAus(a,AP,true); }
function renderVagaForm(){
  if(!FORM) novoForm();
  var box=document.getElementById("vForm"), AP=idxAulas(), its=formItens(AP), ativos=its.filter(function(x){ return !FORM.fora[x.chave]; });
  var h='<div class="row" style="justify-content:space-between"><h3 style="font-size:14px;margin:0">'+(FORM.id?"Editando ausência de "+esc(pnome(+FORM.p)):"Marcar ausência — Aula Vaga")+"</h3>"+(FORM.id?'<button class="btn sm" id="vfNovo">+ Marcar outra ausência</button>':"")+"</div>";
  h+='<div class="row end" style="margin-top:8px"><label>Professor<br><select id="vfP"><option value="">(escolha o professor)</option>'+profsOrdem().map(function(i){ return '<option value="'+i+'"'+(String(i)===String(FORM.p)?" selected":"")+">"+esc(ST.profs[i].nome)+"</option>"; }).join("")+"</select></label>"+
    '<label>De<br><input type="date" id="vfDe" value="'+FORM.de+'"></label><label>Até<br><input type="date" id="vfAte" value="'+FORM.ate+'"></label>'+
    '<button class="btn sm" id="vfSem" title="De segunda a sexta da semana escolhida">Semana inteira</button>'+
    '<label>Motivo (opcional)<br><input type="text" id="vfMot" value="'+esc(FORM.motivo)+'" placeholder="ex.: atestado, curso" style="width:170px"></label>'+
    '<label>Solicitado por<br><input type="text" id="vfQuem" value="'+esc(FORM.quem)+'" style="width:140px"></label></div>';
  if(FORM.p!==""){
    if(FORM.ate<FORM.de) h+='<div class="msg bad">A data final está antes da inicial.</div>';
    else if(!its.length) h+='<div class="msg info">'+esc(pnome(+FORM.p))+" não tem aulas nesses dias"+(FORM.so?" (ou a aula escolhida mudou de lugar na grade)":"")+".</div>";
    else {
      var datas=[]; its.forEach(function(x){ if(datas.indexOf(x.date)<0) datas.push(x.date); });
      var horas=[]; its.forEach(function(x){ var k=hmP(x.ini)+"–"+hmP(x.fim); if(horas.indexOf(k)<0) horas.push(k); }); horas.sort();
      h+='<p style="margin:12px 0 6px;font-weight:600">Aulas de '+esc(pnome(+FORM.p))+' nesse período <span class="small" style="font-weight:400">(clique para tirar ou incluir)</span>:</p>';
      h+='<div class="scroll"><table class="g vgrid"><tr><th></th>'+datas.map(function(d){ return "<th>"+DIAS_C[wdIdx(d)]+" "+fmtDM(d)+"</th>"; }).join("")+"</tr>";
      horas.forEach(function(hh){ h+='<tr><th class="tm">'+hh+"</th>"+datas.map(function(d){ var L=its.filter(function(x){ return x.date===d && hmP(x.ini)+"–"+hmP(x.fim)===hh; });
        return "<td>"+(L.length?L.map(function(x){ return '<span class="vchip '+(FORM.fora[x.chave]?"off":"on")+'" data-ch="'+x.chave+'">'+esc(ST.turmas[x.t].nome)+"<br><small>"+esc(x.disc)+"</small></span>"; }).join(""):'<span class="small">—</span>')+"</td>"; }).join("")+"</tr>"; });
      h+="</table></div>";
      h+='<div class="row end" style="margin-top:12px"><label>Quem cobre?<br><select id="vfModo"><option value="nenhum"'+(FORM.modo==="nenhum"?" selected":"")+'>Ninguém — fica AULA VAGA</option><option value="cada"'+(FORM.modo==="cada"?" selected":"")+'>Escolher substituto por aula</option><option value="um"'+(FORM.modo==="um"?" selected":"")+'>Um substituto para todas</option></select></label>';
      if(FORM.modo==="um"){ h+='<label>Substituto<br><select id="vfUm"><option value="">(escolher)</option>'+profsOrdem().filter(function(q){ return q!==+FORM.p; }).map(function(q){ return '<option value="'+q+'"'+(String(q)===String(FORM.subUm)?" selected":"")+">"+esc(pnome(q))+"</option>"; }).join("")+"</select></label>";
        if(FORM.subUm!==""){ var q=+FORM.subUm, ok=ativos.filter(function(x){ return ocupacao(q,x.date,x.ini,x.fim,FORM.id,AP)===null; }).length; h+='<span class="small">'+esc(pnome(q))+" está livre em <b>"+ok+" de "+ativos.length+"</b> aulas"+(ok<ativos.length?" (nas outras ele tem aula, HA ou não pode; essas ficam como aula vaga)":"")+".</span>"; } }
      h+="</div>";
      if(FORM.modo==="cada"){ h+='<table class="t" style="margin-top:8px"><tr><th>Dia</th><th>Horário</th><th>Turma</th><th>Disciplina</th><th>Substituto</th></tr>'+ativos.map(function(x){ var cur=FORM.subs[x.chave]; return "<tr><td>"+DIAS_C[wdIdx(x.date)]+" "+fmtDM(x.date)+"</td><td>"+hmP(x.ini)+"–"+hmP(x.fim)+"</td><td>"+esc(ST.turmas[x.t].nome)+"</td><td>"+esc(x.disc)+'</td><td><select data-sub="'+x.chave+'">'+opcoesSub(x,FORM.id,cur==null?null:cur,AP)+"</select></td></tr>"; }).join("")+"</table>"; }
      var nSub=FORM.modo==="cada"?ativos.filter(function(x){ return FORM.subs[x.chave]!=null; }).length:FORM.modo==="um"&&FORM.subUm!==""?ativos.filter(function(x){ return ocupacao(+FORM.subUm,x.date,x.ini,x.fim,FORM.id,AP)===null; }).length:0;
      h+='<div class="row" style="margin-top:12px"><button class="btn red" id="vfSalvar"'+(ativos.length?"":" disabled")+">"+(FORM.id?"Salvar alterações":"Marcar "+ativos.length+" aula"+(ativos.length===1?"":"s")+" como vaga"+(ativos.length===1?"":"s"))+(nSub?" ("+nSub+" com substituto)":"")+'</button><button class="btn" id="vfCancelar">'+(FORM.id?"Cancelar edição":"Limpar")+"</button></div>";
      h+='<div class="msg ok">Dica: em “Escolher substituto por aula”, aparecem primeiro só os professores <b>livres naquele horário</b> (sem aula, sem HA e sem bloqueio); depois, os que estão em hora-atividade.</div>';
    }
  }
  h+='<div id="vfMsg"></div>';
  box.innerHTML=h;
  function upd(f,v){ FORM[f]=v; renderVagaForm(); }
  document.getElementById("vfP").onchange=function(e){ FORM.fora={}; FORM.subs={}; FORM.so=null; upd("p",e.target.value); };
  document.getElementById("vfDe").onchange=function(e){ var v=e.target.value; if(!v) return; FORM.de=v; if(!FORM.ate||FORM.ate<v) FORM.ate=v; FORM.so=null; renderVagaForm(); };
  document.getElementById("vfAte").onchange=function(e){ if(e.target.value){ FORM.so=null; upd("ate",e.target.value); } };
  document.getElementById("vfSem").onclick=function(){ var s=segundaDe(FORM.de||hoje()); FORM.de=s; FORM.ate=addDias(s,4); FORM.so=null; renderVagaForm(); };
  document.getElementById("vfMot").onchange=function(e){ FORM.motivo=e.target.value; };
  document.getElementById("vfQuem").onchange=function(e){ FORM.quem=e.target.value; };
  var nv=document.getElementById("vfNovo"); if(nv) nv.onclick=function(){ novoForm(); renderVagaForm(); };
  box.querySelectorAll("[data-ch]").forEach(function(el){ el.onclick=function(){ var k=el.dataset.ch; if(FORM.fora[k]) delete FORM.fora[k]; else FORM.fora[k]=1; renderVagaForm(); }; });
  var md=document.getElementById("vfModo"); if(md) md.onchange=function(e){ upd("modo",e.target.value); };
  var um=document.getElementById("vfUm"); if(um) um.onchange=function(e){ upd("subUm",e.target.value); };
  box.querySelectorAll("[data-sub]").forEach(function(sel){ sel.onchange=function(){ if(sel.value==="") delete FORM.subs[sel.dataset.sub]; else FORM.subs[sel.dataset.sub]=+sel.value; renderVagaForm(); }; });
  var sv=document.getElementById("vfSalvar"); if(sv) sv.onclick=salvarAus;
  var cc=document.getElementById("vfCancelar"); if(cc) cc.onclick=function(){ novoForm(); renderVagaForm(); };
}
function salvarAus(){
  var AP=idxAulas(), its=formItens(AP).filter(function(x){ return !FORM.fora[x.chave]; });
  if(!its.length) return;
  var subs={};
  if(FORM.modo==="cada") its.forEach(function(x){ if(FORM.subs[x.chave]!=null) subs[x.chave]=FORM.subs[x.chave]; });
  else if(FORM.modo==="um" && FORM.subUm!=="") its.forEach(function(x){ if(ocupacao(+FORM.subUm,x.date,x.ini,x.fim,FORM.id,AP)===null) subs[x.chave]=+FORM.subUm; });
  var fora={}; Object.keys(FORM.fora).forEach(function(k){ fora[k]=1; });
  var a={id:FORM.id||novoId(),p:+FORM.p,de:FORM.de,ate:FORM.ate,so:FORM.so||null,fora:fora,subs:subs,motivo:(FORM.motivo||"").trim(),quem:(FORM.quem||"").trim(),ts:FORM.ts||agora()};
  var nS=Object.keys(subs).length, txt=pnome(a.p)+" — "+periodoTxt(a)+": "+its.length+" aula(s) vaga(s)"+(nS?", "+nS+" com substituto ("+uniq(Object.keys(subs).map(function(k){ return pnome(subs[k]); })).join(", ")+")":"")+(a.motivo?". Motivo: "+a.motivo:"");
  var ctxQ=ST.ctx.quem, ctxM=ST.ctx.motivo; ST.ctx.quem=a.quem||ctxQ; ST.ctx.motivo=a.motivo||ctxM;
  if(FORM.id){ ST.ausencias=ST.ausencias.map(function(x){ return x.id===a.id?a:x; }); logar("Aula vaga","Ausência alterada: "+txt); }
  else { ST.ausencias.unshift(a); logar("Aula vaga","Ausência marcada: "+txt); }
  ST.ctx.quem=ctxQ; ST.ctx.motivo=ctxM;
  save(); var p=a.p; novoForm(); renderVagas(); analisar();
  document.getElementById("vfMsg").innerHTML='<div class="msg ok">Pronto: '+esc(txt)+'. Veja na aba Grade escolhendo a semana, ou avise a equipe abaixo.</div>';
}
function nomeCurto(p){ var pr=ST.profs[p]; if(!pr) return "?"; var n=(pr.completo&&pr.completo.indexOf("?")<0?pr.completo.split(" ")[0]:pr.nome.split(" ")[0]); return n.charAt(0)+n.slice(1).toLowerCase(); }
function uniq(a){ var s={}; return a.filter(function(x){ if(s[x]) return false; s[x]=1; return true; }); }
function renderVagas(){
  if(!document.getElementById("vDia").value) document.getElementById("vDia").value=diaUtilOuProx(hoje());
  renderVagaForm(); renderVagaLista(); renderVagaDia();
}
function renderVagaLista(){
  var AP=idxAulas(), verEnc=document.getElementById("vVerEnc").checked;
  var L=ST.ausencias.slice().sort(function(a,b){ return a.de<b.de?1:a.de>b.de?-1:0; }).filter(function(a){ return verEnc||!statusAus(a).enc; });
  document.getElementById("vLista").innerHTML="<tr><th>Professor</th><th>Período</th><th class='right'>Aulas</th><th>Cobertas por</th><th>Motivo</th><th>Situação</th><th></th></tr>"+(L.length?L.map(function(a){
    var its=itensAus(a,AP), sb=its.filter(function(x){ return x.sub!=null; }), s=statusAus(a);
    return '<tr><td><span class="dot" style="display:inline-block;vertical-align:-2px;background:'+ST.profs[a.p].cor+'"></span> <b>'+esc(pnome(a.p))+"</b></td><td>"+periodoTxt(a)+(a.so?' <span class="small">(só '+a.so.length+" aula"+(a.so.length>1?"s":"")+")</span>":"")+'</td><td class="right num">'+its.length+"</td><td>"+(sb.length?sb.length+" ("+esc(uniq(sb.map(function(x){ return pnome(x.sub); })).join(", "))+")":"—")+"</td><td>"+esc(a.motivo||"—")+'</td><td><span class="pill" style="'+s.cls+'">'+s.txt+'</span></td><td class="right" style="white-space:nowrap">'+
      '<button class="btn sm" data-vver="'+a.id+'">Ver na grade</button> '+(a.cancelada?"":'<button class="btn sm" data-ved="'+a.id+'">Editar</button> ')+(s.enc?"":'<button class="btn sm" data-venc="'+a.id+'">Encerrar</button> ')+'<button class="btn sm" data-vdel="'+a.id+'">Excluir</button></td></tr>'; }).join(""):'<tr><td colspan="7" class="small">Nenhuma ausência marcada'+(verEnc?"":" em andamento ou agendada")+".</td></tr>");
  var byId=function(id){ return ST.ausencias.filter(function(x){ return x.id===id; })[0]; };
  document.querySelectorAll("[data-ved]").forEach(function(b){ b.onclick=function(){ editarAus(b.dataset.ved); renderVagaForm(); document.getElementById("vForm").scrollIntoView({behavior:"smooth"}); }; });
  document.querySelectorAll("[data-vver]").forEach(function(b){ b.onclick=function(){ var a=byId(b.dataset.vver); SEMANA=segundaDe(a.de); document.getElementById("gView").value="prof"; fillSelectsOnce(); document.getElementById("gProf").value=String(a.p); show("grade"); }; });
  document.querySelectorAll("[data-venc]").forEach(function(b){ b.onclick=function(){
    if(b.dataset.arm!=="1"){ b.dataset.arm="1"; b.textContent="Confirmar?"; return; }
    var a=byId(b.dataset.venc), ontem=addDias(hoje(),-1);
    if(a.de>ontem){ a.cancelada=true; logar("Aula vaga","Ausência cancelada: "+pnome(a.p)+" — "+periodoTxt(a)); }
    else { a.ate=ontem; logar("Aula vaga","Ausência encerrada antes do previsto: "+pnome(a.p)+" — agora "+periodoTxt(a)); }
    save(); analisar(); renderVagas(); }; });
  document.querySelectorAll("[data-vdel]").forEach(function(b){ b.onclick=function(){
    if(b.dataset.arm!=="1"){ b.dataset.arm="1"; b.textContent="Confirmar exclusão?"; return; }
    var a=byId(b.dataset.vdel); ST.ausencias=ST.ausencias.filter(function(x){ return x.id!==a.id; }); logar("Aula vaga","Registro de ausência excluído: "+pnome(a.p)+" — "+periodoTxt(a)); if(FORM&&FORM.id===a.id) novoForm(); save(); analisar(); renderVagas(); }; });
}
function textoEquipe(date){
  var L=vagasDoDia(date); if(!L.length) return "";
  return "Aulas vagas — "+nomeDia(date)+", "+fmtDMA(date)+"\n\n"+L.map(function(x){ return "• "+hmP(x.ini)+"–"+hmP(x.fim)+" · "+ST.turmas[x.t].nome+" · "+x.disc+" ("+pnome(x.p)+") — "+(x.sub!=null?"substituto: "+pnome(x.sub):"AULA VAGA"); }).join("\n")+"\n\n"+(ST.aviso.rem||"");
}
function textoSubst(q,date){
  var L=vagasDoDia(date).filter(function(x){ return x.sub===q; }); if(!L.length) return "";
  var pr=ST.profs[q], nome=(pr.completo&&pr.completo.indexOf("?")<0?pr.completo.split(" ")[0]:pr.nome); nome=nome.charAt(0)+nome.slice(1).toLowerCase();
  var ausentes=uniq(L.map(function(x){ return nomeCurto(x.p); }));
  return "Olá, "+nome+"! Tudo bem?\n\nNa "+nomeDia(date).toLowerCase()+" ("+fmtDM(date)+"), "+(ausentes.length>1?"os professores "+ausentes.join(" e ")+" não poderão vir":"o professor "+ausentes[0]+" não poderá vir")+". Combinamos que você vai cobrir:\n"+L.map(function(x){ return "• "+hmP(x.ini)+"–"+hmP(x.fim)+" — "+ST.turmas[x.t].nome+" ("+x.disc+")"; }).join("\n")+"\n\nMuito obrigado pela parceria e pelo cuidado com as turmas!\n"+(ST.aviso.rem||"");
}
function renderVagaDia(){
  var date=document.getElementById("vDia").value||hoje(), w=parseYmd(date).getDay(), box=document.getElementById("vDiaOut");
  if(w===0||w===6){ box.innerHTML='<div class="msg info">Fim de semana: não há aulas.</div>'; return; }
  var L=vagasDoDia(date);
  if(!L.length){ box.innerHTML='<div class="msg ok">Nenhuma aula vaga em '+nomeDia(date).toLowerCase()+", "+fmtDMA(date)+".</div>"; return; }
  var subs=uniq(L.filter(function(x){ return x.sub!=null; }).map(function(x){ return x.sub; }));
  box.innerHTML='<table class="t"><tr><th>Horário</th><th>Turma</th><th>Disciplina</th><th>Professor ausente</th><th>Situação</th></tr>'+L.map(function(x){ return "<tr><td class='num'>"+hmP(x.ini)+"–"+hmP(x.fim)+"</td><td><b>"+esc(ST.turmas[x.t].nome)+"</b></td><td>"+esc(x.disc)+"</td><td>"+esc(pnome(x.p))+"</td><td>"+(x.sub!=null?'<span class="pill" style="background:#FFF4CC;color:#7a5a00">Substituto: '+esc(pnome(x.sub))+"</span>":'<span class="pill" style="background:#FDE8E6;color:#B42318">AULA VAGA</span>')+"</td></tr>"; }).join("")+"</table>"+
    (subs.length?'<div class="row" style="margin-top:8px"><span class="small">Avisar quem vai substituir:</span>'+subs.map(function(q){ return '<button class="btn sm" data-wsub="'+q+'"'+(ST.profs[q].cel?"":' disabled title="sem celular cadastrado"')+">WhatsApp — "+esc(pnome(q))+'</button><button class="btn sm" data-esub="'+q+'"'+(ST.profs[q].email?"":' disabled title="sem e-mail cadastrado"')+">E-mail — "+esc(pnome(q))+"</button>"; }).join("")+"</div>":"");
  box.querySelectorAll("[data-wsub]").forEach(function(b){ b.onclick=function(){ var q=+b.dataset.wsub, t=textoSubst(q,date);
    enviarComPdf({canal:"whatsapp",doc:docVagas([date]),arquivo:"aulas-vagas-"+date+".pdf",texto:t,assunto:"Substituição em "+fmtDMA(date),url:urlWa(ST.profs[q].cel,t),box:"vEnvMsg",ok:function(c){ logar("Aula vaga","Aviso de substituição por WhatsApp — "+pnome(q)+" ("+fmtDM(date)+", "+c+")"); }}); }; });
  box.querySelectorAll("[data-esub]").forEach(function(b){ b.onclick=function(){ var q=+b.dataset.esub, t=textoSubst(q,date), as="Substituição em "+fmtDMA(date)+" — "+instCurto();
    enviarComPdf({canal:"email",doc:docVagas([date]),arquivo:"aulas-vagas-"+date+".pdf",texto:t,assunto:as,url:urlGmail(ST.profs[q].email,as,t),box:"vEnvMsg",ok:function(c){ logar("Aula vaga","Aviso de substituição por e-mail — "+pnome(q)+" ("+fmtDM(date)+", "+c+")"); }}); }; });
}
document.getElementById("vDia").onchange=renderVagaDia;
document.getElementById("vVerEnc").onchange=renderVagaLista;
document.getElementById("vWa").onclick=function(){ var d=document.getElementById("vDia").value, t=textoEquipe(d); if(!t){ renderVagaDia(); return; }
  enviarComPdf({canal:"whatsapp",doc:docVagas([d]),arquivo:"aulas-vagas-"+d+".pdf",texto:t,assunto:"Aulas vagas — "+fmtDMA(d),url:"https://wa.me/?text="+encodeURIComponent(t),box:"vEnvMsg",ok:function(c){ logar("Aula vaga","Lista de aulas vagas de "+fmtDM(d)+" enviada à equipe (WhatsApp, "+c+")"); }}); };
document.getElementById("vEm").onclick=function(){ var d=document.getElementById("vDia").value, t=textoEquipe(d), as="Aulas vagas — "+fmtDMA(d); if(!t){ renderVagaDia(); return; }
  enviarComPdf({canal:"email",doc:docVagas([d]),arquivo:"aulas-vagas-"+d+".pdf",texto:t,assunto:as,url:urlGmail("",as,t),box:"vEnvMsg",ok:function(c){ logar("Aula vaga","Lista de aulas vagas de "+fmtDM(d)+" enviada à equipe (e-mail, "+c+")"); }}); };
document.getElementById("vPdfDia").onclick=function(){ var d=document.getElementById("vDia").value||hoje(); var doc=novoPdf(); pdfVagas(doc,[d]); salvarPdf(doc,"aulas-vagas-"+d+".pdf"); };
document.getElementById("vPdfSem").onclick=function(){ var d=document.getElementById("vDia").value||hoje(), s=segundaDe(d); var doc=novoPdf(); pdfVagas(doc,semanaDatas(s)); salvarPdf(doc,"aulas-vagas-semana-"+s+".pdf"); };
