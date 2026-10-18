
// =====================================================================
// EDITAR O QUADRO GERAL COM O MOUSE: Editar → arrastar → conferir → Salvar
// Nada muda na grade de verdade até clicar em Salvar.
// =====================================================================
var EDG=null, EDARR=null;
function edTempo(t,s){ var n=nA(t), a=s%n, h=tipoDe(t).aulas[a]||["00:00","00:00"]; return {d:(s/n)|0,a:a,ini:toMin(h[0]),fim:toMin(h[1]),txt:h[0]+"–"+h[1]}; }
function edOnde(t,s){ var x=edTempo(t,s); return ST.turmas[t].nome+", "+DIAS[x.d]+" "+(x.a+1)+"ª ("+x.txt+")"; }
// confere a grade do rascunho: professor em dois lugares, aula sobrando, aula faltando e horário em que o professor não pode
function edVerificar(G){
  var cel={}, itens=[], falta={};
  var marca=function(t,s,m){ var k=t+"|"+s; (cel[k]=cel[k]||[]).push(m); };
  var porP={};
  ST.turmas.forEach(function(T,t){ if(T.excluida) return; (G[t]||[]).forEach(function(k,s){ if(!k) return; var x=edTempo(t,s); [parseK(k).p,p2De(t,k)].forEach(function(p){ if(p<0) return; var key=p+"|"+x.d; (porP[key]=porP[key]||[]).push({t:t,s:s,ini:x.ini,fim:x.fim,txt:x.txt}); }); }); });
  Object.keys(porP).forEach(function(key){ var L=porP[key], p=+key.split("|")[0], d=+key.split("|")[1];
    for(var i=0;i<L.length;i++) for(var j=i+1;j<L.length;j++){ var A=L[i], B=L[j]; if(A.t===B.t) continue;
      if(A.ini<B.fim&&B.ini<A.fim){ marca(A.t,A.s,"BATENDO: "+pnome(p)+" também está na "+ST.turmas[B.t].nome); marca(B.t,B.s,"BATENDO: "+pnome(p)+" também está na "+ST.turmas[A.t].nome);
        itens.push({tipo:"Batendo",txt:pnome(p)+" está em duas turmas ao mesmo tempo: "+ST.turmas[A.t].nome+" ("+A.txt+") e "+ST.turmas[B.t].nome+" ("+B.txt+") — "+DIAS[d],t:A.t,s:A.s}); } } });
  var need={}, have={};
  ST.matriz.forEach(function(r){ if(!ST.turmas[r.t]||ST.turmas[r.t].excluida) return; var k=r.t+"|"+kOf(r.disc,r.p,r.doc2); need[k]=(need[k]||0)+r.n; });
  G.forEach(function(row,t){ if(!ST.turmas[t]||ST.turmas[t].excluida) return; row.forEach(function(k,s){ if(k){ var kk=t+"|"+k; (have[kk]=have[kk]||[]).push(s); } }); });
  Object.keys(Object.assign({},need,have)).forEach(function(kk){ var bar=kk.indexOf("|"), t=+kk.slice(0,bar), k=kk.slice(bar+1), n=need[kk]||0, H=have[kk]||[], T=ST.turmas[t].nome;
    if(H.length>n){ H.forEach(function(s){ marca(t,s,"SOBRANDO: "+T+" tem "+H.length+" aula(s) de "+descK(k)+(n?", o certo é "+n:", e essa aula não é desta turma")); });
      itens.push({tipo:"Sobrando",txt:T+": "+H.length+" aula(s) de "+descK(k)+(n?" — o certo é "+n+" (sobra "+(H.length-n)+")":" — essa aula não é desta turma"),t:t,s:H[0]}); }
    else if(H.length<n){ (falta[t]=falta[t]||[]).push({k:k,q:n-H.length}); itens.push({tipo:"Faltando",txt:T+": falta"+(n-H.length>1?"m ":" ")+(n-H.length)+" aula(s) de "+descK(k)+" (tem "+H.length+" de "+n+")",t:t,s:null}); } });
  G.forEach(function(row,t){ if(!ST.turmas[t]||ST.turmas[t].excluida) return; row.forEach(function(k,s){ if(!k) return; var x=edTempo(t,s); [parseK(k).p,p2De(t,k)].forEach(function(p){ if(p<0) return; var v=blkVal(p,x.d,x.ini,x.fim);
    if(v>=2){ marca(t,s,"NÃO PODE: "+pnome(p)+" marcou que "+(v===3?"está em formação":"não pode")+" nesse horário"); itens.push({tipo:"Não pode",txt:pnome(p)+" marcou que "+(v===3?"está em formação":"não pode")+" — "+edOnde(t,s),t:t,s:s}); } }); }); });
  var ordem={"Batendo":0,"Sobrando":1,"Faltando":2,"Não pode":3}; itens.sort(function(a,b){ return ordem[a.tipo]-ordem[b.tipo]; });
  return {cel:cel,itens:itens,falta:falta};
}
// ---------- sessão de edição: toda mudança na grade só acontece depois de clicar em Editar ----------
// Enquanto edita, a grade muda de verdade na tela (o gerador confere tudo na hora), mas só vale depois de Salvar.
// Cancelar devolve tudo como estava. A sessão fica guardada: se fechar a página, continua ao abrir de novo.
var ED_PILHA=[], ED_SEL=null, EDCANC=false, ED_ABRE=false;
function edFoto(){ return {grid:deep(ST.grid),ha:deep(ST.ha),eq:deep(ST.eq),aus:deep(ST.ausencias),nome:ST.gridNome,locks:deep(ST.locks),inds:ST.profs.map(function(p){ return deep(p.ind||{}); }),maxDia:ST.profs.map(function(p){ return p.maxDia; }),pares:deep(ST.pares),pvistos:deep(ST.pvistos||{})}; }
function edVoltarFoto(F){ ST.grid=deep(F.grid); ST.ha=deep(F.ha); ST.eq=deep(F.eq); ST.ausencias=deep(F.aus); ST.gridNome=F.nome; ST.locks=deep(F.locks); F.inds.forEach(function(ind,i){ if(ST.profs[i]) ST.profs[i].ind=deep(ind); }); F.maxDia.forEach(function(v,i){ if(ST.profs[i]) ST.profs[i].maxDia=v; }); ST.pares=deep(F.pares); ST.pvistos=deep(F.pvistos||{}); _TM=null; CACHE=null; }
function edCarregar(){ var E=ST.edicao; if(!E||typeof E!=="object"||!E.orig||!Array.isArray(E.orig.grid)||!Array.isArray(E.orig.inds)){ ST.edicao=null; EDG=null; return; } EDG=E; }
function edMudou(){ if(!EDG) return false; var F=edFoto(), O=EDG.orig; return JSON.stringify([F.grid,F.locks,F.inds,F.maxDia,F.pares,F.aus,F.ha])!==JSON.stringify([O.grid,O.locks,O.inds,O.maxDia,O.pares,O.aus,O.ha]); }
function edMudancas(){ if(!EDG) return 0; var n=0, O=EDG.orig.grid; ST.grid.forEach(function(row,t){ row.forEach(function(k,s){ if((k||"")!==((O[t]||[])[s]||"")) n++; }); }); return n; }
function edToast(html,botaoEditar){ var t=document.getElementById("edToast"); if(t) t.remove(); t=document.createElement("div"); t.id="edToast"; t.setAttribute("role","alert");
  t.innerHTML='<div>'+html+'</div><div class="row" style="margin-top:6px">'+(botaoEditar?'<button class="btn sm pri" id="edToastEd">✏️ Editar agora</button>':"")+'<button class="btn sm" id="edToastX">Fechar</button></div>'; document.body.appendChild(t);
  var b=document.getElementById("edToastEd"); if(b) b.onclick=function(){ t.remove(); edIniciar(); }; document.getElementById("edToastX").onclick=function(){ t.remove(); };
  clearTimeout(edToast._t); edToast._t=setTimeout(function(){ if(t.isConnected) t.remove(); },9000); }
// porteiro: qualquer mudança na grade passa por aqui
function edPrecisa(){ if(EDG) return true; edToast("Para mudar a grade, clique primeiro em <b>✏️ Editar</b>. Depois das mudanças, clique em <b>Salvar</b> (o gerador confere tudo antes).",true); return false; }
function edIniciar(){ if(RUN) return; if(EDG){ edRedesenhar(); return; }
  if(SEMANA){ SEMANA=null; var gs=document.getElementById("gSemana"); if(gs) gs.value=""; }
  ST.edicao={ts:agora(),quem:ST.ctx.quem||"",orig:edFoto(),histLen:ST.hist.length}; EDG=ST.edicao; ED_PILHA=[]; ED_SEL=null; EDCANC=false; save(); edRedesenhar(); }
function edGuardarPasso(){ if(!EDG) return; ED_PILHA.push(edFoto()); if(ED_PILHA.length>40) ED_PILHA.shift(); }
function edTravada(t,s){ return !!ST.locks[t+"|"+s]; }
function edAviso(txt,cls){ var el=document.getElementById(cur==="inicio"?"progTxt":"gMsg"); if(!el) return; if(cur==="inicio"){ el.innerHTML=txt||""; return; } el.innerHTML=txt?'<div class="msg '+(cls||"warn")+'">'+txt+"</div>":""; }
function edRedesenhar(){ CACHE=null; if(cur==="grade") renderGrade(); else if(cur==="inicio") renderInicio(); else if(cur==="hist") renderHist(); edBarraGlobal(); }
function edDepois(){ save(); edRedesenhar(); }
function edTrocar(a,b){ if(a.t===b.t&&a.s===b.s) return;
  if(edTravada(a.t,a.s)||edTravada(b.t,b.s)){ edAviso("Uma das aulas está travada (🔒). Para mexer nela, destrave primeiro (botão direito › Destravar)."); return; }
  edGuardarPasso(); var G=ST.grid, x=G[a.t][a.s]; G[a.t][a.s]=G[b.t][b.s]; G[b.t][b.s]=x; edAviso(""); edDepois(); }
function edColocar(ch,t,s){ if(ch.t!==t){ edAviso("Essa aula é da turma <b>"+esc(ST.turmas[ch.t].nome)+"</b>. Solte numa aula dessa turma."); return; }
  if(edTravada(t,s)){ edAviso("Essa aula está travada (🔒)."); return; }
  edGuardarPasso(); ST.grid[t][s]=ch.k; edAviso(""); edDepois(); }
function edVagar(a){ if(edTravada(a.t,a.s)){ edAviso("Essa aula está travada (🔒)."); return; } if(!ST.grid[a.t][a.s]) return;
  edGuardarPasso(); ST.grid[a.t][a.s]=""; edAviso("A aula foi para “Aulas que faltam colocar” (na faixa amarela). Arraste de lá para outro horário.","info"); edDepois(); }
function edTravar(t,s){ if(!edPrecisa()) return; edGuardarPasso(); var k=t+"|"+s; if(ST.locks[k]) delete ST.locks[k]; else ST.locks[k]=true; logar("Aula travada",(ST.locks[k]?"Travou ":"Destravou ")+lugarTS(t,s)+": "+descK(ST.grid[t][s])); edDepois(); }
// quadro geral no modo Editar
function edRender(out,per){ out.innerHTML=geralHTML(per,"EDITANDO — ainda não foi salvo",false,null,null); if(ST.compacto) out.querySelectorAll("table.g").forEach(function(tb){ tb.classList.add("compacto"); }); ajustarDias(out); edDecorar(out); }
// marca os erros em amarelo e liga arrastar, clicar e botão direito nas aulas
function edDecorar(out){ var V=edVerificar(ST.grid), O=EDG.orig.grid;
  out.querySelectorAll(".c.conf").forEach(function(el){ el.classList.remove("conf"); });
  out.querySelectorAll(".c[data-t][data-s]").forEach(function(el){ var t=+el.dataset.t, s=+el.dataset.s, er=V.cel[t+"|"+s];
    if(er){ el.classList.add("ederr"); el.title=er.join("\n"); }
    if((ST.grid[t][s]||"")!==((O[t]||[])[s]||"")) el.classList.add("edmud");
    if(ED_SEL&&ED_SEL.t===t&&ED_SEL.s===s) el.classList.add("sel");
    el.classList.add("clk"); el.tabIndex=0; el.onclick=null;
    el.addEventListener("contextmenu",function(e){ e.preventDefault(); e.stopPropagation(); EDARR=null; edMenu(t,s,e.clientX,e.clientY); });
    if(typeof MODO_TRAVAR!=="undefined"&&MODO_TRAVAR&&cur==="grade"&&document.getElementById("gView").value==="turma"){ el.addEventListener("click",function(){ edTravar(t,s); }); return; }
    el.draggable=!edTravada(t,s);
    el.addEventListener("dragstart",function(e){ EDARR={t:t,s:s}; el.classList.add("arrastando"); try{ e.dataTransfer.effectAllowed="move"; e.dataTransfer.setData("text/plain","a"); }catch(x){} });
    el.addEventListener("dragend",function(){ EDARR=null; el.classList.remove("arrastando"); document.querySelectorAll(".alvo").forEach(function(z){ z.classList.remove("alvo"); }); });
    el.addEventListener("dragover",function(e){ if(EDARR){ e.preventDefault(); el.classList.add("alvo"); } });
    el.addEventListener("dragleave",function(){ el.classList.remove("alvo"); });
    el.addEventListener("drop",function(e){ e.preventDefault(); var A=EDARR; EDARR=null; if(!A) return; ED_SEL=null; if(A.chip) edColocar(A.chip,t,s); else edTrocar(A,{t:t,s:s}); });
    var clique=function(){ var S=ED_SEL; if(!S){ ED_SEL={t:t,s:s}; edRedesenhar(); edAviso("Agora clique em outra aula para trocar, ou em “Solte aqui para deixar vago”. Botão direito: mais opções.","info"); return; }
      ED_SEL=null; if(S.chip) edColocar(S.chip,t,s); else if(S.t===t&&S.s===s){ edAviso(""); edRedesenhar(); } else edTrocar(S,{t:t,s:s}); };
    el.addEventListener("click",clique); el.addEventListener("keydown",function(e){ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); clique(); } }); }); }
// faixa amarela no alto enquanto edita: Salvar, Cancelar, Desfazer, problemas e aulas que faltam
function edBarraGlobal(){ var b=document.getElementById("edBarra"); if(!b) return; document.body.classList.toggle("editando",!!EDG);
  if(!EDG){ b.innerHTML=""; b.hidden=true; return; } b.hidden=false;
  var V=edVerificar(ST.grid), nm=edMudancas(), pr=cache().pr, nRig=pr.filter(function(x){ return x.tipo==="rígida"; }).length, nReg=pr.filter(function(x){ return x.tipo==="regra"; }).length, ft=Object.keys(V.falta);
  var h='<div class="row" style="justify-content:space-between;gap:8px"><div class="row" style="gap:6px"><b class="edtit">✏️ EDITANDO A GRADE</b><span class="small">as mudanças só valem depois de <b>Salvar</b></span></div><div class="row" style="gap:6px">'+
    '<button class="btn sm pri" id="edSalvar">💾 Salvar</button><button class="btn sm" id="edCancelar">'+(EDCANC?"Clique de novo para descartar tudo":"Cancelar")+'</button><button class="btn sm" id="edDesfazer"'+(ED_PILHA.length?"":" disabled")+'>↶ Desfazer</button>'+
    '<div class="edvaga" id="edVaga" tabindex="0" role="button" title="Solte aqui uma aula para deixar o horário vago">🗑 Solte aqui para deixar vago</div></div></div>';
  h+='<div class="row small" style="margin-top:4px;gap:12px"><span><b>'+nm+"</b> aula(s) mudada(s)</span>"+(V.itens.length?'<span class="edno">⚠ '+V.itens.length+" erro(s) na grade</span>":'<span class="edok">✓ ninguém batendo, nada sobrando ou faltando</span>')+
    "<span>Gerador: "+(nRig?'<b class="edno">'+nRig+" conflito(s) rígido(s)</b>":"0 conflitos rígidos")+" · "+nReg+" regra(s) quebrada(s)</span><span>Dica: arraste uma aula até outra para trocar; <b>botão direito</b> numa aula: deixar vago, incluir quem pode ou ver possibilidades.</span></div>";
  if(V.itens.length) h+='<details class="ederros"'+(ED_ABRE?" open":"")+' id="edErrDet"><summary><b>Ver os '+V.itens.length+" erro(s)</b> (clique para ir até a aula)</summary><ul>"+V.itens.slice(0,40).map(function(x,i){ return '<li><a href="#" data-edi="'+i+'"><b>'+x.tipo+":</b> "+esc(x.txt)+"</a></li>"; }).join("")+(V.itens.length>40?"<li>… e mais "+(V.itens.length-40)+"</li>":"")+"</ul></details>";
  if(ft.length) h+='<div class="edbandeja"><b>Aulas que faltam colocar</b> <span class="small">(arraste para um horário da mesma turma)</span> '+ft.map(function(t){ return V.falta[t].map(function(f){ var x=parseK(f.k), pr2=ST.profs[x.p]||{cor:"#eee"};
      return '<span class="edchip'+(ED_SEL&&ED_SEL.chip&&ED_SEL.chip.t===+t&&ED_SEL.chip.k===f.k?" sel":"")+'" draggable="true" tabindex="0" role="button" data-cht="'+t+'" data-chk="'+esc(f.k)+'" style="background:'+pr2.cor+'"><b>'+esc(ST.turmas[t].nome)+"</b> · "+esc(descK(f.k))+(f.q>1?" ×"+f.q:"")+"</span>"; }).join(""); }).join("")+"</div>";
  b.innerHTML=h; var nav=document.getElementById("nav"); b.style.top=(nav?nav.offsetHeight:0)+"px";
  var dt=document.getElementById("edErrDet"); if(dt) dt.ontoggle=function(){ ED_ABRE=dt.open; };
  b.querySelectorAll(".edchip").forEach(function(ch){ var C={t:+ch.dataset.cht,k:ch.dataset.chk};
    ch.addEventListener("dragstart",function(e){ EDARR={chip:C}; try{ e.dataTransfer.effectAllowed="move"; e.dataTransfer.setData("text/plain","c"); }catch(x){} });
    ch.addEventListener("dragend",function(){ EDARR=null; });
    var cl=function(){ ED_SEL={chip:C}; edBarraGlobal(); if(cur!=="grade") show("grade"); edAviso("Agora clique no horário da "+esc(ST.turmas[C.t].nome)+" onde quer colocar essa aula.","info"); };
    ch.addEventListener("click",cl); ch.addEventListener("keydown",function(e){ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); cl(); } }); });
  var vz=document.getElementById("edVaga");
  vz.addEventListener("dragover",function(e){ if(EDARR&&!EDARR.chip){ e.preventDefault(); vz.classList.add("alvo"); } });
  vz.addEventListener("dragleave",function(){ vz.classList.remove("alvo"); });
  vz.addEventListener("drop",function(e){ e.preventDefault(); var A=EDARR; EDARR=null; if(A&&!A.chip) edVagar(A); });
  var vc=function(){ var S=ED_SEL; if(S&&!S.chip){ ED_SEL=null; edVagar(S); } else edAviso("Primeiro clique na aula que quer deixar vaga (ou arraste a aula até aqui).","info"); };
  vz.addEventListener("click",vc); vz.addEventListener("keydown",function(e){ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); vc(); } });
  b.querySelectorAll("[data-edi]").forEach(function(a){ a.onclick=function(e){ e.preventDefault(); var x=V.itens[+a.dataset.edi]; if(x.s==null) return; edIrPara(x.t,x.s); }; });
  document.getElementById("edDesfazer").onclick=function(){ if(RUN||!ED_PILHA.length) return; edVoltarFoto(ED_PILHA.pop()); ED_SEL=null; edAviso(""); edDepois(); };
  document.getElementById("edCancelar").onclick=function(){ if(RUN) return; if(edMudou()&&!EDCANC){ EDCANC=true; edBarraGlobal(); setTimeout(function(){ if(EDCANC){ EDCANC=false; edBarraGlobal(); } },5000); return; } edCancelar(); };
  document.getElementById("edSalvar").onclick=edSalvar; }
function edIrPara(t,s){ if(cur!=="grade") show("grade"); var gv=document.getElementById("gView");
  if(gv.value==="prof"){ gv.value="geral"; } if(gv.value==="turma"){ document.getElementById("gTurma").value=String(t); } else document.getElementById("gPer").value=perDe(t); renderGrade();
  var el=document.querySelector('#gOut .c[data-t="'+t+'"][data-s="'+s+'"]'); if(!el) return; el.scrollIntoView({behavior:"smooth",block:"center",inline:"center"}); el.classList.add("pisca"); setTimeout(function(){ el.classList.remove("pisca"); },1600); }
function edCancelar(){ var mudou=edMudou(); edVoltarFoto(EDG.orig); var extra=ST.hist.length-(EDG.histLen||0); if(extra>0) ST.hist.splice(0,extra);
  if(mudou) logar("Edição","Edição da grade cancelada: as mudanças foram descartadas e tudo voltou como estava.");
  ST.edicao=null; EDG=null; ED_PILHA=[]; ED_SEL=null; EDCANC=false; save(); edRedesenhar(); edAviso(mudou?"Edição cancelada. Tudo voltou como estava.":"Edição encerrada. Nada foi mudado.","info"); }
// Salvar: confere tudo; se houver erro ou regra quebrada, só salva com ciência
function edSalvar(){ if(RUN||!EDG) return;
  if(!edMudou()){ ST.edicao=null; EDG=null; ED_PILHA=[]; save(); edRedesenhar(); edAviso("Nada mudou. Edição encerrada.","info"); return; }
  var V=edVerificar(ST.grid), pr=cache().pr, chave=function(x){ return x.tipo+"|"+x.txt; }, antes={};
  var g0=ST.grid; try{ var F=edFoto(); edVoltarFoto(EDG.orig); analisar().pr.forEach(function(x){ antes[chave(x)]=1; }); edVoltarFoto(F); }catch(e){ ST.grid=g0; } CACHE=null; pr=cache().pr;
  var regras=pr.filter(function(x){ return x.tipo!=="preferência"; }), nPref=pr.length-regras.length;
  var lista=V.itens.map(function(x){ return {g:"Erro na grade",tipo:x.tipo,txt:x.txt}; }).concat(regras.map(function(x){ return {g:x.tipo==="rígida"?"Conflito rígido":"Regra da escola quebrada",tipo:x.tipo,txt:x.txt,novo:!antes[chave(x)]}; }));
  if(!lista.length){ edGravar([],nPref); return; }
  var novos=lista.filter(function(x){ return x.novo||x.g==="Erro na grade"; }).length;
  var d=document.createElement("div"); d.id="edDlgFundo"; document.body.appendChild(d);
  var dl=document.createElement("div"); dl.id="edDlg"; dl.setAttribute("role","alertdialog"); dl.setAttribute("aria-modal","true"); dl.setAttribute("aria-labelledby","edDlgT");
  dl.innerHTML='<div class="edpergunta"><p id="edDlgT" style="margin:0 0 6px;font-size:16px"><b>⚠ A grade não está cumprindo todas as regras.</b></p><p style="margin:0 0 8px">Foram encontrados <b>'+lista.length+" ponto(s)</b>"+(novos?", <b>"+novos+" criado(s) nesta edição</b>":"")+'. O certo é corrigir antes de salvar. Se precisar salvar assim mesmo, marque que está ciente.</p><div class="eddlglista" tabindex="0" aria-label="Lista dos pontos encontrados"><ul>'+
    lista.slice(0,60).map(function(x){ return "<li>"+(x.novo||x.g==="Erro na grade"?'<b class="ednovo">NOVO</b> ':"")+"<b>"+esc(x.g)+":</b> "+esc(x.txt)+"</li>"; }).join("")+(lista.length>60?"<li>… e mais "+(lista.length-60)+"</li>":"")+"</ul></div>"+
    '<label style="display:block;margin:10px 0"><input type="checkbox" id="edCiente"> <b>Estou ciente</b> de que a grade vai ficar com estes '+lista.length+' ponto(s) e assumo a decisão de salvar assim.</label>'+
    '<div class="row"><button class="btn pri" id="edVoltar">Voltar e corrigir</button><button class="btn danger" id="edMesmo" disabled>Salvar mesmo assim</button></div></div>';
  document.body.appendChild(dl);
  var fechar=function(){ dl.remove(); d.remove(); }; document.getElementById("edVoltar").focus();
  document.getElementById("edVoltar").onclick=function(){ fechar(); ED_ABRE=true; edBarraGlobal(); };
  dl.addEventListener("keydown",function(e){ if(e.key==="Escape") fechar(); });
  document.getElementById("edCiente").onchange=function(e){ document.getElementById("edMesmo").disabled=!e.target.checked; };
  document.getElementById("edMesmo").onclick=function(){ if(!document.getElementById("edCiente").checked) return; fechar(); edGravar(lista,nPref); }; }
function edGravar(lista,nPref){
  var O=EDG.orig, nm=edMudancas(), envolvidos={};
  ST.grid.forEach(function(row,t){ row.forEach(function(k,s){ var o=(O.grid[t]||[])[s]||""; if((k||"")!==o){ if(k) envolvidos[parseK(k).p]=1; if(o) envolvidos[parseK(o).p]=1; } }); });
  ST.snaps.unshift({id:Date.now()+"-"+Math.random().toString(36).slice(2,6),ts:agora(),nome:"Antes da edição de "+fmtData(EDG.ts)+" — "+(O.nome||""),grid:deep(O.grid),quem:ST.ctx.quem||"",motivo:ST.ctx.motivo||""}); if(ST.snaps.length>(ST.histLimite||15)) ST.snaps.length=ST.histLimite||15;
  if(nm){ if(!/^Gerada|^Ajustada em|^Restaurada/.test(ST.gridNome)||ST.gridNome===O.nome) ST.gridNome="Ajustada à mão em "+new Date().toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}); if(JSON.stringify(ST.eq)===JSON.stringify(O.eq)) ST.eq=null; }
  var ps=Object.keys(envolvidos).map(Number), haTirada=nm?haConferir(ps):0, nAus=nm?reconciliarAusencias(O.grid):0;
  logar("Edição salva","Grade salva: "+nm+" aula(s) mudaram de lugar."+(lista.length?" SALVA COM CIÊNCIA de "+lista.length+" ponto(s) fora das regras: "+lista.slice(0,6).map(function(x){ return x.g+" — "+x.txt; }).join("; ")+(lista.length>6?"…":""):" Conferida: sem erros e sem regras quebradas."));
  if(haTirada) logar("Hora-atividade",haTirada+" HA saíram porque ficaram em cima de aula ("+ps.map(pnome).join(", ")+").");
  ST.edicao=null; EDG=null; ED_PILHA=[]; ED_SEL=null; EDCANC=false; save(); edRedesenhar();
  edAviso((lista.length?"Grade salva <b>com "+lista.length+" ponto(s) fora das regras</b> (ficou registrado no Histórico que você estava ciente).":"✓ Grade salva e conferida: sem erros e sem regras quebradas.")+" "+nm+" aula(s) mudaram. A grade de antes ficou guardada em Grades anteriores."+(haTirada?" "+haTirada+" HA saíram por ficarem em cima de aula: gere a hora-atividade de novo.":"")+(ST.eq===null&&nm?" Gere os equipamentos de novo.":"")+(nAus?" "+nAus+" aula(s) vaga(s) marcada(s) foram conferidas.":"")+(nPref?" ("+nPref+" preferência(s) não atendida(s) — veja em Gerar.)":""),lista.length?"warn":"ok"); }
// botões “Editar” na Grade e em Gerar
function edBotoes(){ ["gEdBar","iEdBar"].forEach(function(id){ var b=document.getElementById(id); if(!b) return;
    if(EDG){ b.innerHTML='<span class="small"><b>✏️ Editando.</b> Use a faixa amarela no alto para <b>Salvar</b> ou <b>Cancelar</b>.</span>'; return; }
    b.innerHTML='<button class="btn pri" data-editar="1">✏️ Editar</button> <span class="small">Toda mudança na grade (arrastar aulas, tirar professor, gerar de novo, travar) começa aqui. Nada vale até clicar em <b>Salvar</b>, e o gerador confere todas as regras antes.</span>';
    b.querySelector("[data-editar]").onclick=edIniciar; });
  ["gSemana","gSemAnt","gSemProx"].forEach(function(id){ var el=document.getElementById(id); if(el) el.disabled=!!EDG; }); }
function edBarra(){ edBotoes(); }
window.addEventListener("beforeunload",function(e){ if(EDG&&edMudou()){ e.preventDefault(); e.returnValue=""; } });
// ---------- botão direito na aula (no modo Editar): deixar vago ou incluir quem pode ----------
function edLivre(p,t,s){ var x=edTempo(t,s), bate=[];
  ST.grid.forEach(function(row,t2){ if(!ST.turmas[t2]||ST.turmas[t2].excluida) return; row.forEach(function(k,s2){ if(!k||(t2===t&&s2===s)||parseK(k).p!==p) return; var y=edTempo(t2,s2); if(y.d===x.d&&y.ini<x.fim&&x.ini<y.fim) bate.push(ST.turmas[t2].nome); }); });
  var b=blkVal(p,x.d,x.ini,x.fim), e=extVal(p,x.d,x.ini,x.fim,true);
  return {bate:bate,naoPode:b>=2?(b===3?"está em formação":"marcou que não pode"):"",evitar:b===1,ext:e===4?"tem aula em outra escola":(e===5?"pouco tempo para vir da outra escola":"")}; }
function edCandidatos(t,s){ var G=ST.grid, atual=G[t][s]||"", cont={}, da={}, L=[];
  G[t].forEach(function(k){ if(k) cont[k]=(cont[k]||0)+1; });
  ST.matriz.forEach(function(r){ if(r.t!==t) return; var k=kOf(r.disc,r.p,r.doc2); da[k]=(da[k]||0)+r.n; });
  Object.keys(da).forEach(function(k){ if(k===atual) return; var p=parseK(k).p, f=edLivre(p,t,s), falta=da[k]-(cont[k]||0);
    var ok=!f.bate.length&&!f.naoPode&&!f.ext; L.push({k:k,p:p,falta:falta,f:f,ok:ok,daTurma:true}); });
  var ja={}; Object.keys(da).forEach(function(k){ ja[parseK(k).p]=1; });
  var outros=[]; profsOrdem().forEach(function(p){ if(ja[p]) return; var f=edLivre(p,t,s); if(f.bate.length||f.naoPode||f.ext) return;
    var ds={}; ST.matriz.forEach(function(r){ if(r.p===p) ds[r.disc]=1; }); Object.keys(ds).sort().forEach(function(d){ outros.push({k:kOf(d,p,false),p:p,f:f,ok:true,daTurma:false}); }); });
  L.sort(function(a,b){ return (b.ok-a.ok)||((b.falta>0)-(a.falta>0))||pnome(a.p).localeCompare(pnome(b.p)); });
  return {daTurma:L,outros:outros}; }
function edFecharMenu(){ var m=document.getElementById("edMenu"); if(m) m.remove(); document.removeEventListener("pointerdown",edForaMenu,true); document.removeEventListener("keydown",edTeclaMenu,true); }
function edForaMenu(e){ if(!e.target.closest("#edMenu")) edFecharMenu(); }
function edTeclaMenu(e){ var m=document.getElementById("edMenu"); if(!m) return; if(e.key==="Escape"){ e.preventDefault(); edFecharMenu(); return; }
  if(e.key==="ArrowDown"||e.key==="ArrowUp"){ e.preventDefault(); var its=[].slice.call(m.querySelectorAll("button:not([disabled])")), i=its.indexOf(document.activeElement); i=e.key==="ArrowDown"?(i+1)%its.length:(i-1+its.length)%its.length; its[i].focus(); } }
function edMenu(t,s,x,y){ edFecharMenu(); var G=ST.grid, k=G[t][s]||"", C=edCandidatos(t,s), trav=edTravada(t,s);
  var desc=function(c){ var st=c.ok?'<span class="edok">✓ livre neste horário</span>':'<span class="edno">✗ '+esc([c.f.bate.length?"ficaria batendo com a "+c.f.bate.join(", "):"",c.f.naoPode,c.f.ext].filter(Boolean).join("; "))+"</span>";
    return '<b>'+esc(descK(c.k))+"</b> "+(c.daTurma?(c.falta>0?'<span class="edfalta">falta'+(c.falta>1?"m "+c.falta:" 1")+" desta</span> ":'<span class="small">(já completa: vai sobrar)</span> '):'<span class="small">(não é desta turma: vai sobrar)</span> ')+st+(c.f.evitar?' <span class="small">· prefere evitar este horário</span>':""); };
  var h='<div class="edmtit">'+esc(edOnde(t,s))+"<br><span>"+(k?"Agora: "+esc(descK(k)):"Horário vago")+"</span></div>";
  if(trav) h+='<div class="small" style="padding:6px 10px">🔒 Esta aula está travada (não muda ao gerar nem ao arrastar).</div><button data-m="trava">🔓 Destravar esta aula</button>';
  else {
    if(k) h+='<button data-m="tirar">💡 Tirar daqui — ver possibilidades</button>';
    h+='<button data-m="vago"'+(k?"":" disabled")+'>🗑 Deixar vago</button>';
    h+='<div class="edmsec">Incluir aqui — quem pode:</div>'+(C.daTurma.length?C.daTurma.map(function(c,i){ return '<button data-m="inc" data-i="'+i+'" class="'+(c.ok?"":"ednok")+'" style="border-left:6px solid '+((ST.profs[c.p]||{}).cor||"#ccc")+'">'+desc(c)+"</button>"; }).join(""):'<div class="small" style="padding:4px 10px">Esta turma não tem outras disciplinas cadastradas.</div>');
    if(C.outros.length) h+='<details class="edmout"><summary>Outros professores livres neste horário ('+C.outros.length+')</summary>'+C.outros.slice(0,60).map(function(c,i){ return '<button data-m="out" data-i="'+i+'" style="border-left:6px solid '+((ST.profs[c.p]||{}).cor||"#ccc")+'">'+desc(c)+"</button>"; }).join("")+"</details>";
    if(k) h+='<div class="small" style="padding:6px 10px">Se incluir outra aula aqui, a que está agora vai para “Aulas que faltam colocar”.</div><button data-m="trava">🔒 Travar esta aula (não muda ao gerar)</button>'; }
  var m=document.createElement("div"); m.id="edMenu"; m.setAttribute("role","dialog"); m.setAttribute("aria-label","Opções desta aula"); m.innerHTML=h; document.body.appendChild(m);
  var r=m.getBoundingClientRect(); m.style.left=Math.max(4,Math.min(x,innerWidth-r.width-8))+"px"; m.style.top=Math.max(4,Math.min(y,innerHeight-r.height-8))+"px";
  m.addEventListener("click",function(e){ var b=e.target.closest("button[data-m]"); if(!b||b.disabled) return; var tipo=b.dataset.m; edFecharMenu(); ED_SEL=null;
    if(tipo==="vago"){ edVagar({t:t,s:s}); return; }
    if(tipo==="tirar"){ tdAbrir(t,s); return; }
    if(tipo==="trava"){ edTravar(t,s); return; }
    var c=(tipo==="inc"?C.daTurma:C.outros)[+b.dataset.i]; edGuardarPasso(); G[t][s]=c.k;
    edAviso("Incluída "+esc(descK(c.k))+" em "+esc(edOnde(t,s))+"."+(c.ok?"":" <b>Atenção:</b> isso criou problema — veja em amarelo.")+(k?" A aula que estava aqui foi para “Aulas que faltam colocar”.":""),c.ok?"info":"warn"); edDepois(); });
  setTimeout(function(){ document.addEventListener("pointerdown",edForaMenu,true); document.addEventListener("keydown",edTeclaMenu,true); var f=m.querySelector("button:not([disabled])"); if(f) f.focus(); },0); }
