
// =====================================================================
// AJUSTAR UMA AULA SÓ: "tirar o professor daqui" — o gerador mostra as possibilidades antes de mudar
// Na Grade (botão direito numa aula) e em Gerar (escolher professor, dia e aula).
// =====================================================================
var TD_RUN=null;
function tdTitulo(t,s){ var k=ST.grid[t][s]; return "Tirar "+pnome(parseK(k).p)+" de "+edOnde(t,s)+" · "+descK(k); }
// trocas dentro da turma, testadas uma a uma e ordenadas (as que não criam problema primeiro)
function tdTrocas(t,s,max){ var c=cache(), M=c.md.M, base=c.md.grid, lock=c.md.locked, row=base[t], cand=[], p=parseK(ST.grid[t][s]).p;
  for(var s2=0;s2<row.length;s2++){ if(s2===s||lock[t][s2]) continue; var a=row[s], b=row[s2];
    if(b>=0&&a>=0&&M.L[a].d===M.L[b].d&&M.L[a].p===M.L[b].p) continue; if(b>=0&&M.L[b].p===p) continue;
    var g=base.map(function(r,ti){ return ti===t?r.slice():r; }); g[t][s]=b; g[t][s2]=a; cand.push({s2:s2,g:g,custo:Motor.totalCost(M,Motor.initState(M,g))}); }
  cand.sort(function(x,y){ return x.custo-y.custo; }); cand=cand.slice(0,Math.max(14,max*2));
  var antes=contaTipos(c.pr);
  cand.forEach(function(o){ o.cont=contaTipos(Motor.problemas(M,o.g)); o.bom=o.cont.rig<=antes.rig&&o.cont.reg<=antes.reg; o.otimo=o.bom&&o.cont.pref<=antes.pref; });
  cand.sort(function(x,y){ return (y.otimo-x.otimo)||(y.bom-x.bom)||(x.cont.rig-y.cont.rig)||(x.cont.reg-y.cont.reg)||(x.cont.pref-y.cont.pref)||(x.custo-y.custo); });
  return {lista:cand.slice(0,max),antes:antes}; }
function tdFechar(){ var d=document.getElementById("tdPainel"); if(d) d.remove(); var f=document.getElementById("tdFundo"); if(f) f.remove(); if(TD_RUN) TD_RUN.parar=true; TD_RUN=null; }
function tdRedesenhar(){ CACHE=null; analisar(); if(cur==="grade") renderGrade(); else if(cur==="inicio") renderInicio(); if(typeof edBarraGlobal==="function") edBarraGlobal(); }
function tdDesfazer(){ var D=DESFAZER; if(!D) return; ST.grid=D.grid; ST.ha=D.ha; ST.eq=D.eq; ST.ausencias=D.aus; ST.gridNome=D.nome; D.inds.forEach(function(ind,i){ if(ST.profs[i]) ST.profs[i].ind=ind; });
  logar("Ajuste sugerido","Desfeito: "+D.txt); DESFAZER=null; save(); tdRedesenhar(); tdAviso("Pronto: voltou como estava antes.","ok",false); }
function tdAviso(txt,cls,comDesfazer){ var box=document.getElementById(cur==="grade"?"gMsg":"tdMsgG"); if(!box) return;
  box.innerHTML='<div class="msg '+(cls||"ok")+'">'+txt+(comDesfazer&&DESFAZER?' <button class="btn sm" id="tdDesf">Desfazer</button>':"")+"</div>"; var b=document.getElementById("tdDesf"); if(b) b.onclick=tdDesfazer; }
function tdAbrir(t,s){ tdFechar(); var k=ST.grid[t]&&ST.grid[t][s]; if(!k) return; if(RUN){ return; }
  var fundo=document.createElement("div"); fundo.id="tdFundo"; fundo.onclick=tdFechar; document.body.appendChild(fundo);
  var d=document.createElement("div"); d.id="tdPainel"; d.setAttribute("role","dialog"); d.setAttribute("aria-modal","true"); d.setAttribute("aria-labelledby","tdTit");
  d.innerHTML='<div class="tdtit"><span id="tdTit">💡 '+esc(tdTitulo(t,s))+'</span><button class="btn sm" id="tdX" aria-label="Fechar">✕</button></div><div class="tdcorpo">'+
    (ST.locks[t+"|"+s]?'<div class="msg warn">Esta aula está travada (🔒). Destrave primeiro (Grade › Por turma › Modo travar).</div>':'<p class="small" style="margin:0 0 8px">O gerador testou as possibilidades. Nada muda até você clicar em <b>Aplicar</b> — e depois ainda dá para desfazer.</p><div id="tdLista"><div class="msg info">Calculando as possibilidades…</div></div>')+"</div>";
  document.body.appendChild(d); document.getElementById("tdX").onclick=tdFechar; document.getElementById("tdX").focus();
  d.addEventListener("keydown",function(e){ if(e.key==="Escape") tdFechar(); });
  if(ST.locks[t+"|"+s]) return;
  setTimeout(function(){ var lst=document.getElementById("tdLista"); if(!lst) return; var p=parseK(k).p, n=nA(t), R, ops=[];
    try{ R=tdTrocas(t,s,6); }catch(e){ R={lista:[],antes:contaTipos(cache().pr)}; }
    R.lista.forEach(function(o){ var k2=ST.grid[t][o.s2], p2=k2?parseK(k2).p:null;
      ops.push({tipo:"troca",bom:o.otimo,ok:o.bom,tit:"Trocar com "+DIAS[(o.s2/n)|0]+" "+(o.s2%n+1)+"ª ("+horA(t,o.s2%n)+")",
        txt:pnome(p)+" vai para "+DIAS[(o.s2/n)|0]+" "+(o.s2%n+1)+"ª; "+(k2?descK(k2)+" vem para "+DIAS[(s/n)|0]+" "+(s%n+1)+"ª":"o horário de "+DIAS[(s/n)|0]+" "+(s%n+1)+"ª fica vago")+". "+(o.otimo?"Não cria nenhum problema.":o.bom?"Não quebra regra; "+resumoEfeito(o,R.antes)+".":"⚠ "+resumoEfeito(o,R.antes)+"."),
        fazer:function(){ var r=aplicarTroca(t,s,o.s2); return "Troca feita na "+ST.turmas[t].nome+"."+r; }}); });
    ops.push({tipo:"local",tit:"Deixar o gerador rearrumar (só a "+ST.turmas[t].nome+" e as turmas de "+pnome(p)+")",txt:"Ele procura o melhor jeito sem "+pnome(p)+" nesse horário, mexendo o mínimo; o resto da grade fica igual. Mostra o que muda antes de aplicar."});
    ops.push({tipo:"local",lembrar:true,tit:"Marcar que "+pnome(p)+" não pode nesse horário e rearrumar",txt:"Igual à anterior, e o horário fica marcado como “não pode” no cadastro dele (vale para as próximas vezes que gerar)."});
    ops.push({tipo:"vago",tit:"Só tirar e deixar o horário vago",txt:"A turma fica com 1 aula de "+descK(k)+" faltando. Use se for colocar outra coisa à mão depois.",fazer:function(){ var gAnt=deep(ST.grid); guardarDesfazer("tirar "+pnome(p)+" de "+edOnde(t,s)); ST.grid[t][s]=""; ST.gridNome="Ajustada à mão"; var tinhaEq=!!ST.eq; ST.eq=null; reconciliarAusencias(gAnt); logar("Ajuste sugerido","Aula tirada e horário deixado vago: "+edOnde(t,s)+" — "+descK(k)); save(); return "Horário deixado vago."+(tinhaEq?" Gere os equipamentos de novo.":""); }});
    lst.innerHTML=(R.lista.length?"":'<div class="msg warn">Nenhuma troca simples dentro da turma tira '+esc(pnome(p))+" daqui sem travar outra aula. Veja as outras opções.</div>")+ops.map(function(o,j){ return '<div class="popt'+(o.bom?" bom":"")+(o.tipo==="troca"&&!o.ok?" ruim":"")+'"><div><b>'+(j+1)+". "+esc(o.tit)+'</b><br><span class="small">'+esc(o.txt)+'</span></div><button class="btn sm'+(j===0?" pri":"")+'" data-td="'+j+'">'+(o.tipo==="local"?"Procurar":"Aplicar")+"</button></div>"; }).join("")+'<div id="tdLocal"></div>';
    lst.querySelectorAll("[data-td]").forEach(function(b){ b.onclick=function(){ var o=ops[+b.dataset.td]; if(o.tipo==="local"){ tdRearrumar(t,s,!!o.lembrar,document.getElementById("tdLocal")); return; }
      if(!edPrecisa()) return; var r=o.fazer(); tdFechar(); tdRedesenhar(); tdAviso(esc(r)+(EDG?" (Ainda não foi salvo: clique em Salvar na faixa amarela.)":""),"ok",true); }; }); },30); }
// o gerador rearruma só as turmas ligadas, sem o professor naquele horário
function tdRearrumar(t,s,lembrar,box){ if(TD_RUN) return; var k=ST.grid[t][s], p=parseK(k).p, x=edTempo(t,s), chave=x.d+"|"+hmP(x.ini)+"-"+hmP(x.fim);
  var ind=ST.profs[p].ind=ST.profs[p].ind||{}, velho=ind[chave], md;
  ind[chave]=2; _TM=null; try{ md=buildModelData(); } finally { if(velho==null) delete ind[chave]; else ind[chave]=velho; _TM=null; }
  var ts={}; ts[t]=1; ST.turmas.forEach(function(T,tt){ if(!T.excluida&&(ST.grid[tt]||[]).some(function(kk){ return kk&&parseK(kk).p===p; })) ts[tt]=1; });
  var lock=md.locked.map(function(r,tt){ return ts[tt]?r:r.map(function(){ return true; }); });
  var S=new Motor.Solver(md.M,md.grid.map(function(r){ return r.slice(); }),{iters:1500000,T0:20,locked:lock,estavel:true,wMove:300}), antes=contaTipos(cache().pr), nomes=Object.keys(ts).map(function(z){ return ST.turmas[z].nome; }).join(", ");
  TD_RUN={parar:false}; var run=TD_RUN; box.innerHTML='<div class="msg info">Procurando nas turmas '+esc(nomes)+"…</div>";
  (function loop(){ if(run.parar) return; var fim=S.step(60000); if(!fim){ var m=box.querySelector(".msg"); if(m) m.textContent="Procurando nas turmas "+nomes+"… "+Math.round(100*S.done/S.total)+"%"; setTimeout(loop,0); return; }
    TD_RUN=null; var r=S.result(), nova=gridFromIdx(md.lessons,r.grade), saiu=!(nova[t][s]&&parseK(nova[t][s]).p===p), pr=Motor.problemas(md.M,r.grade), o={cont:contaTipos(pr)};
    var dif=[]; nova.forEach(function(row,tt){ row.forEach(function(kk,ss){ var a=(ST.grid[tt]||[])[ss]||null; if((kk||null)!==a) dif.push({t:tt,s:ss,antes:a,depois:kk}); }); });
    if(!saiu||!dif.length){ box.innerHTML='<div class="msg warn">O gerador não achou um jeito de tirar '+esc(pnome(p))+" desse horário mexendo só nessas turmas. Tente uma troca da lista acima.</div>"; return; }
    var piorou=o.cont.rig>antes.rig;
    box.innerHTML='<div class="msg '+(piorou?"warn":"ok")+'">Achou: '+dif.length+" aula(s) mudam de lugar · "+esc(resumoEfeito(o,antes))+"."+(piorou?" ⚠ Cria conflito rígido.":"")+'</div><div class="scroll"><table class="t" style="margin:6px 0"><tr><th>Onde</th><th>Antes</th><th>Depois</th></tr>'+
      dif.slice(0,40).map(function(z){ return "<tr><td>"+esc(lugarTS(z.t,z.s))+"</td><td>"+esc(descK(z.antes))+"</td><td><b>"+esc(descK(z.depois))+"</b></td></tr>"; }).join("")+'</table></div><div class="row"><button class="btn sm pri" id="tdAplicarL">Aplicar estas mudanças</button><button class="btn sm" id="tdNaoL">Não aplicar</button></div>';
    document.getElementById("tdNaoL").onclick=function(){ box.innerHTML=""; };
    document.getElementById("tdAplicarL").onclick=function(){ if(!edPrecisa()) return; var gAnt=deep(ST.grid); guardarDesfazer("tirar "+pnome(p)+" de "+edOnde(t,s));
      if(lembrar){ ST.profs[p].ind=ST.profs[p].ind||{}; ST.profs[p].ind[chave]=2; _TM=null; logar("Ajuste sugerido","Marcado que "+pnome(p)+" não pode: "+DIAS[x.d]+" "+x.txt); }
      ST.grid=nova; ST.gridNome="Ajustada à mão"; var env={}; dif.forEach(function(z){ [z.antes,z.depois].forEach(function(kk){ if(kk) env[parseK(kk).p]=1; }); }); var tinhaEq=!!ST.eq; ST.eq=null;
      var nh=haConferir(Object.keys(env).map(Number)), na=reconciliarAusencias(gAnt);
      logar("Ajuste sugerido","Tirar "+pnome(p)+" de "+edOnde(t,s)+": "+dif.length+" aula(s) mudaram de lugar (turmas "+nomes+")"); save(); tdFechar(); tdRedesenhar();
      tdAviso("Mudanças aplicadas: "+dif.length+" aula(s) mudaram de lugar."+(nh?" "+nh+" hora(s)-atividade saíram; gere a HA de novo.":"")+(tinhaEq?" Gere os equipamentos de novo.":"")+(na?" Confira "+na+" aula(s) vaga(s).":""),"ok",true); }; })(); }
// menu do botão direito na Grade (fora do modo Editar)
function tdMenuGrade(e){ if(EDG||SEMANA) return; var c=e.target.closest(".c[data-t][data-s]"); if(!c) return; var t=+c.dataset.t, s=+c.dataset.s; if(!(ST.grid[t]||[])[s]) return;
  e.preventDefault(); if(typeof edFecharMenu==="function") edFecharMenu(); var trav=!!ST.locks[t+"|"+s];
  var m=document.createElement("div"); m.id="edMenu"; m.setAttribute("role","dialog"); m.setAttribute("aria-label","Opções desta aula"); m.innerHTML='<div class="edmtit">'+esc(edOnde(t,s))+"<br><span>"+esc(descK(ST.grid[t][s]))+'</span></div><button data-g="editar">✏️ Editar (para mudar a grade)</button><button data-g="tirar">💡 Ver possibilidades para tirar daqui</button><button data-g="trava">'+(trav?"🔓 Destravar esta aula":"🔒 Travar esta aula (não muda ao gerar)")+'</button><div class="small" style="padding:6px 10px">Para aplicar qualquer mudança, é preciso clicar em Editar e depois Salvar.</div>';
  document.body.appendChild(m); var r=m.getBoundingClientRect(); m.style.left=Math.max(4,Math.min(e.clientX,innerWidth-r.width-8))+"px"; m.style.top=Math.max(4,Math.min(e.clientY,innerHeight-r.height-8))+"px";
  m.addEventListener("click",function(ev){ var b=ev.target.closest("button[data-g]"); if(!b) return; edFecharMenu(); var g=b.dataset.g;
    if(g==="tirar") tdAbrir(t,s); else if(g==="trava") edTravar(t,s);  else edIniciar(); });
  setTimeout(function(){ document.addEventListener("pointerdown",edForaMenu,true); document.addEventListener("keydown",edTeclaMenu,true); m.querySelector("button").focus(); },0); }
document.getElementById("gOut").addEventListener("contextmenu",tdMenuGrade);
// em Gerar: escolher professor, dia e a aula
function tdRenderGerar(){ var box=document.getElementById("tdGerar"); if(!box) return; var pSel=document.getElementById("tdProf"), dSel=document.getElementById("tdDia");
  if(!pSel){ box.innerHTML='<div class="row"><label>Professor<br><select id="tdProf"></select></label><label>Dia<br><select id="tdDia">'+DIAS.map(function(d,i){ return '<option value="'+i+'">'+d+"</option>"; }).join("")+'</select></label></div><div id="tdAulas" style="margin-top:8px"></div><div id="tdMsgG"></div>';
    pSel=document.getElementById("tdProf"); dSel=document.getElementById("tdDia"); pSel.onchange=tdRenderGerar; dSel.onchange=tdRenderGerar; }
  var v=pSel.value; pSel.innerHTML='<option value="">— escolha —</option>'+profsOrdem().map(function(p){ return '<option value="'+p+'">'+esc(ST.profs[p].nome)+"</option>"; }).join(""); pSel.value=v;
  var out=document.getElementById("tdAulas"); if(pSel.value===""){ out.innerHTML='<span class="small">Escolha o professor e o dia para ver as aulas dele.</span>'; return; }
  var p=+pSel.value, d=+dSel.value, L=[];
  ST.turmas.forEach(function(T,t){ if(T.excluida) return; var n=nA(t); (ST.grid[t]||[]).forEach(function(k,s){ if(k&&parseK(k).p===p&&((s/n)|0)===d){ var x=edTempo(t,s); L.push({t:t,s:s,ini:x.ini,txt:(x.a+1)+"ª ("+x.txt+") · "+T.nome+" · "+parseK(k).disc}); } }); });
  L.sort(function(a,b){ return a.ini-b.ini; });
  out.innerHTML=L.length?'<div class="chiplist">'+L.map(function(a,i){ return '<button class="btn sm" data-tda="'+i+'">'+(ST.locks[a.t+"|"+a.s]?"🔒 ":"")+esc(a.txt)+" — tirar daqui</button>"; }).join("")+"</div>":'<span class="small">'+esc(pnome(p))+" não tem aula na "+DIAS[d].toLowerCase()+".</span>";
  out.querySelectorAll("[data-tda]").forEach(function(b){ b.onclick=function(){ var a=L[+b.dataset.tda]; tdAbrir(a.t,a.s); }; }); }
