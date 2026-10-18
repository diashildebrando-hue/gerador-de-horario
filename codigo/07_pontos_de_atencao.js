
// =====================================================================
// PONTOS DE ATENÇÃO: clicar abre o que é, onde está e pelo menos 3 opções de ajuste
// =====================================================================
var PABERTO=null, DESTAQUE=null, DESFAZER=null, PLOCAL=null;
function chaveProb(x){ return x.tipo+"|"+x.txt; }
function sobrepoe(k1,k2){ return k1===k2||TM().OVL[k1].indexOf(k2)>=0; }
// aulas (turma e posição) ligadas a um ponto de atenção
function aulasDoProblema(x){
  var L=x.loc||{}, out=[], tm=TM(), vis={};
  var add=function(t,s){ var k=t+"|"+s; if(vis[k]) return; vis[k]=1; out.push({t:t,s:s}); };
  var cada=function(f){ ST.turmas.forEach(function(T,t){ if(T.excluida) return; var row=ST.grid[t]||[], n=nA(t); for(var s=0;s<row.length&&s<n*5;s++){ var k=row[s]; if(!k) continue; var y=parseK(k); f(t,s,y,(s/n)|0,tm.tsOf[t][s%n]); } }); };
  if(L.turmaCad!=null) return out;
  if(L.p!=null){ var ps=[L.p]; if(L.q!=null) ps.push(L.q);
    cada(function(t,s,y,d,kk){ if(ps.indexOf(y.p)<0) return; if(L.d!=null&&d!==L.d) return; if(L.k!=null&&!sobrepoe(L.k,kk)) return; if(L.ha){ var h=haParse(L.ha), T=tm.TS[kk]; if(!(T[0]<h.fim&&h.ini<T[1])) return; } add(t,s); }); }
  else if(L.t!=null){ var n=nA(L.t), row=ST.grid[L.t]||[]; for(var s=0;s<row.length;s++){ if(!row[s]) continue; var y=parseK(row[s]); if(L.disc&&y.disc!==L.disc) continue; if(L.d!=null&&((s/n)|0)!==L.d) continue; add(L.t,s); } }
  else if(L.disc&&L.d!=null&&L.k!=null) cada(function(t,s,y,d,kk){ if(y.disc===L.disc&&d===L.d&&sobrepoe(L.k,kk)) add(t,s); });
  return out; }
// explicação simples de cada tipo de ponto
function oQueE(x){ var t=x.txt, L=x.loc||{};
  if(L.turmaCad!=null) return "A turma tem mais aulas cadastradas do que cabem no horário dela. Algumas aulas ficaram sem lugar.";
  if(L.ha) return /outra escola/.test(t)?"A hora-atividade caiu num horário em que o professor está em outra escola.":"A hora-atividade ficou no mesmo horário de uma aula do professor.";
  if(/dois lugares|sobreposto/.test(t)) return "O professor aparece em duas turmas ao mesmo tempo. Isso não pode acontecer: uma das aulas precisa mudar de lugar.";
  if(/outra escola nesse horário/.test(t)) return "Nesse horário o professor está dando aula em outra escola (aba Relatórios › Importar/Exportar).";
  if(/pouco tempo para chegar/.test(t)) return "Entre a aula da outra escola e a daqui sobra pouco tempo para o professor chegar.";
  if(/que não pode/.test(t)) return "O professor marcou na aba Cadastro › Professores que não pode dar aula nesse horário.";
  if(/prefere evitar/.test(t)) return "O professor pediu para evitar esse horário, se der. É uma preferência, não uma proibição.";
  if(/2 aulas de .* no mesmo dia/.test(t)) return "Disciplina com só 2 aulas na semana deve ficar em dias diferentes, e aqui as duas caíram no mesmo dia.";
  if(/aulas de .* na /.test(t)) return "A turma tem mais aulas da mesma disciplina num dia do que a regra permite.";
  if(/regra de dias/.test(t)) return "Uma regra adicional diz que essa disciplina só pode ter aula em alguns dias da semana, e esta aula caiu num dia de fora.";
  if(/regra de posição/.test(t)) return "Uma regra adicional diz que essa disciplina não pode ficar nessa aula do dia.";
  if(/só .* dia\(s\) \(mínimo/.test(t)) return "Uma regra adicional pede para espalhar essa disciplina em mais dias da semana.";
  if(/aulas na .*\(máximo/.test(t)) return "O professor ficou com mais aulas nesse dia do que o máximo combinado.";
  if(/seguidas/.test(t)&&!/vagas/.test(t)) return "O professor ficou com mais aulas seguidas do que a regra permite.";
  if(/1 hora entre/.test(t)) return "Quem dá a última aula da manhã não deveria pegar a primeira da tarde (pelo menos 1 hora de almoço).";
  if(/janela/.test(t)) return "O professor ficou com muitas aulas vagas seguidas no meio do dia (janela longa).";
  if(/sem intervalo/.test(t)) return "O professor dá aula antes e depois do recreio sem ficar livre o tempo mínimo de intervalo.";
  if(/5 dias/.test(t)) return "Uma regra pede pelo menos 1 dia sem aula para esse professor.";
  if(/Recomposição/.test(t)) return "Os dois professores da recomposição (1ª e 2ª docência) não deveriam dar aula ao mesmo tempo nas turmas escolhidas.";
  if(/Não podem coincidir/.test(t)) return "Estes dois professores foram marcados (em Cadastro › Regras) para não darem aula ao mesmo tempo nas turmas, aulas e dias escolhidos.";
  if(/turmas com .* ao mesmo tempo/.test(t)) return "Mais turmas do que o permitido com essa disciplina no mesmo horário (ex.: quadra ou laboratório).";
  return "Ponto em que a grade não segue todas as regras ou preferências."; }
function descAula(t,s){ var n=nA(t), k=ST.grid[t][s]; return ST.turmas[t].nome+" · "+DIAS[(s/n)|0]+" "+(s%n+1)+"ª ("+horA(t,s%n)+")"+(k?" · "+descK(k):" · vaga"); }
function contaTipos(pr){ var r={rig:0,reg:0,pref:0}; pr.forEach(function(x){ if(x.tipo==="rígida") r.rig++; else if(x.tipo==="regra") r.reg++; else r.pref++; }); return r; }
// trocas de lugar dentro da turma que resolvem (ou melhoram) este ponto, as melhores primeiro
function trocasPara(x,max){
  var c=cache(), M=c.md.M, base=c.md.grid, lock=c.md.locked, alvo=chaveProb(x), aulas=aulasDoProblema(x), cand=[], vis={};
  aulas.forEach(function(a){ var row=base[a.t]; for(var s2=0;s2<row.length;s2++){ if(s2===a.s||lock[a.t][s2]||lock[a.t][a.s]) continue; var k=a.t+"|"+Math.min(a.s,s2)+"|"+Math.max(a.s,s2); if(vis[k]) continue; vis[k]=1;
    if(row[s2]>=0&&row[a.s]>=0&&M.L[row[s2]].d===M.L[row[a.s]].d&&M.L[row[s2]].p===M.L[row[a.s]].p) continue;
    var g=base.map(function(r,ti){ return ti===a.t?r.slice():r; }); var tmp=g[a.t][a.s]; g[a.t][a.s]=g[a.t][s2]; g[a.t][s2]=tmp;
    cand.push({t:a.t,s1:a.s,s2:s2,g:g,custo:Motor.totalCost(M,Motor.initState(M,g))}); } });
  cand.sort(function(a,b){ return a.custo-b.custo; }); cand=cand.slice(0,24);
  var antes=contaTipos(c.pr);
  cand.forEach(function(o){ var pr=Motor.problemas(M,o.g); o.resolve=!pr.some(function(y){ return chaveProb(y)===alvo; }); o.cont=contaTipos(pr); o.n=pr.length; });
  cand.forEach(function(o){ o.limpo=o.cont.rig<=antes.rig&&o.cont.reg<=antes.reg; o.bom=o.resolve&&o.limpo; });
  cand.sort(function(a,b){ return (b.bom-a.bom)||(b.resolve-a.resolve)||(a.cont.rig-b.cont.rig)||(a.cont.reg-b.cont.reg)||(a.cont.pref-b.cont.pref)||(a.custo-b.custo); });
  return cand.filter(function(o){ return o.resolve||o.cont.rig<antes.rig||(o.cont.rig===antes.rig&&o.cont.reg<antes.reg); }).slice(0,max||4); }
function resumoEfeito(o,antes){ var d=o.cont, f=function(a,b,nome){ return a===b?"":nome+" "+a+" → "+b; };
  return [f(antes.rig,d.rig,"conflitos rígidos"),f(antes.reg,d.reg,"regras quebradas"),f(antes.pref,d.pref,"preferências")].filter(Boolean).join(" · ")||"sem mudar os outros pontos"; }
// aplica uma troca (o mesmo que trocar na mão na aba Grade)
function guardarDesfazer(txt){ if(typeof edGuardarPasso==="function") edGuardarPasso(); DESFAZER={txt:txt,grid:deep(ST.grid),ha:deep(ST.ha),eq:deep(ST.eq),aus:deep(ST.ausencias),nome:ST.gridNome,inds:ST.profs.map(function(p){ return deep(p.ind||{}); }),maxDia:ST.profs.map(function(p){ return p.maxDia; }),pares:deep(ST.pares)}; }
function aplicarTroca(t,s1,s2){
  var row=ST.grid[t], n=nA(t), gAnt=deep(ST.grid); guardarDesfazer("troca na "+ST.turmas[t].nome);
  logar("Ajuste sugerido","Troca na "+ST.turmas[t].nome+": "+DIAS[(s1/n)|0]+" "+(s1%n+1)+"ª "+descK(row[s1])+" ⇄ "+DIAS[(s2/n)|0]+" "+(s2%n+1)+"ª "+descK(row[s2]),{t:t});
  var env=[row[s1],row[s2]].filter(Boolean).map(function(k){ return parseK(k).p; }), x=row[s1]; row[s1]=row[s2]; row[s2]=x;
  ST.gridNome="Ajustada à mão"; var tinhaEq=!!ST.eq; ST.eq=null; var nh=haConferir(env), na=reconciliarAusencias(gAnt);
  save(); analisar();
  return (nh?" "+nh+" hora(s)-atividade saíram por ficar em cima de aula; gere a HA de novo.":"")+(tinhaEq?" Gere os equipamentos de novo.":"")+(na?" Confira "+na+" aula(s) vaga(s).":""); }
function desfazerAjuste(){ var D=DESFAZER; if(!D) return; ST.grid=D.grid; ST.ha=D.ha; ST.eq=D.eq; ST.ausencias=D.aus; ST.gridNome=D.nome; D.inds.forEach(function(ind,i){ if(ST.profs[i]) ST.profs[i].ind=ind; }); D.maxDia.forEach(function(v,i){ if(ST.profs[i]) ST.profs[i].maxDia=v; }); ST.pares=D.pares;
  logar("Ajuste sugerido","Desfeito: "+D.txt); DESFAZER=null; CACHE=null; save(); PABERTO=null; renderInicio(); }
// ajuste automático só nas turmas ligadas ao ponto (o resto da grade não mexe)
function ajusteLocal(x,box){
  if(RUN||PLOCAL) return; var aulas=aulasDoProblema(x), ts={}; aulas.forEach(function(a){ ts[a.t]=1; });
  var L=x.loc||{}; if(L.p!=null) ST.turmas.forEach(function(T,t){ if((ST.grid[t]||[]).some(function(k){ return k&&parseK(k).p===L.p; })) ts[t]=1; });
  var md=buildModelData(), lock=md.locked.map(function(r,t){ return ts[t]?r:r.map(function(){ return true; }); });
  var S=new Motor.Solver(md.M,md.grid.map(function(r){ return r.slice(); }),{iters:1500000,T0:20,locked:lock}), alvo=chaveProb(x), antes=contaTipos(cache().pr);
  PLOCAL={S:S}; box.innerHTML='<div class="msg info">Procurando uma solução nas turmas '+esc(Object.keys(ts).map(function(t){ return ST.turmas[t].nome; }).join(", "))+"…</div>";
  (function loop(){ var fim=S.step(60000); if(!fim){ box.querySelector(".msg").textContent="Procurando uma solução… "+Math.round(100*S.done/S.total)+"%"; setTimeout(loop,0); return; }
    var r=S.result(), pr=Motor.problemas(md.M,r.grade), nova=gridFromIdx(md.lessons,r.grade), dif=diffGrids(ST.grid,nova), resolve=!pr.some(function(y){ return chaveProb(y)===alvo; }), o={cont:contaTipos(pr)}; PLOCAL=null;
    var melhora=resolve||o.cont.rig<antes.rig||(o.cont.rig===antes.rig&&(o.cont.reg<antes.reg||(o.cont.reg===antes.reg&&o.cont.pref<antes.pref)));
    if(!dif.length||!melhora){ box.innerHTML='<div class="msg warn">O gerador não achou um jeito melhor mexendo só nessas turmas. Tente outra opção.</div>'; return; }
    box.innerHTML='<div class="msg '+(resolve?"ok":"warn")+'">'+(resolve?"Achou uma solução":"Achou uma melhora, mas este ponto continua")+": "+dif.length+" aula(s) mudam de lugar · "+esc(resumoEfeito(o,antes))+'.</div><div class="scroll"><table class="t" style="margin:6px 0"><tr><th>Onde</th><th>Antes</th><th>Depois</th></tr>'+
      dif.slice(0,30).map(function(z){ return "<tr><td>"+esc(lugarTS(z.t,z.s))+"</td><td>"+esc(descK(z.antes))+"</td><td><b>"+esc(descK(z.depois))+"</b></td></tr>"; }).join("")+'</table></div><div class="row"><button class="btn sm pri" data-ok="1">Aplicar estas mudanças</button><button class="btn sm" data-no="1">Não aplicar</button></div>';
    box.querySelector("[data-no]").onclick=function(){ box.innerHTML=""; };
    box.querySelector("[data-ok]").onclick=function(){ if(!edPrecisa()) return; var gAnt=deep(ST.grid); guardarDesfazer("ajuste automático nas turmas "+Object.keys(ts).map(function(t){ return ST.turmas[t].nome; }).join(", "));
      ST.grid=nova; ST.gridNome="Ajustada à mão"; var env={}; dif.forEach(function(z){ [z.antes,z.depois].forEach(function(k){ if(k) env[parseK(k).p]=1; }); }); var tinhaEq=!!ST.eq; ST.eq=null;
      var nh=haConferir(Object.keys(env).map(Number)), na=reconciliarAusencias(gAnt);
      logar("Ajuste sugerido","Ajuste automático para resolver: "+x.txt+" — "+dif.length+" aula(s) mudaram de lugar"); save(); PABERTO=null; renderInicio();
      mostrarAplicado("Mudanças aplicadas ("+dif.length+" aula(s))."+(nh?" "+nh+" hora(s)-atividade saíram; gere a HA de novo.":"")+(tinhaEq?" Gere os equipamentos de novo.":"")+(na?" Confira "+na+" aula(s) vaga(s).":"")); }; })(); }
// outras saídas, conforme o tipo de ponto
function opcoesExtras(x){ var L=x.loc||{}, o=[], tm=TM();
  if(L.ha) o.push({tit:"Tirar só esta hora-atividade",txt:"A HA sai desse horário; depois é só gerar a HA de novo para completar.",fazer:function(){ guardarDesfazer("tirar HA"); var h=ST.ha[L.p]; if(h){ h.slots=h.slots.filter(function(k){ return k!==L.ha; }); if(h.locais) delete h.locais[L.ha]; } logar("Ajuste sugerido","HA tirada: "+pnome(L.p)+" "+haOnde(L.ha)); save(); return "HA tirada."; }});
  if(L.ha) o.push({tit:"Gerar de novo a HA de "+pnome(L.p),txt:"O gerador encaixa a HA dele nos horários livres, sem bater com aulas nem com outra escola.",abre:1,fazer:function(){ guardarDesfazer("gerar HA de "+pnome(L.p)); show("ha"); document.getElementById("haProf").value=String(L.p); document.getElementById("bHA").click(); return null; }});
  if(L.p!=null&&L.k!=null&&(L.b===1||L.b===2||L.b===3)) o.push({tit:"Liberar esse horário na disponibilidade de "+pnome(L.p),txt:"Use só se o professor concordar: o horário deixa de ser “"+(L.b===1?"evitar":L.b===2?"não pode":"formador")+"”.",fazer:function(){ guardarDesfazer("liberar horário de "+pnome(L.p)); var T=tm.TS[L.k]; setBlkFaixa(L.p,L.d,T[0],T[1],0); logar("Ajuste sugerido","Disponibilidade de "+pnome(L.p)+" liberada: "+DIAS[L.d]+" "+hmP(T[0])+"–"+hmP(T[1])); save(); return "Horário liberado."; }});
  if(L.maxDia!=null) o.push({tit:"Aumentar o máximo de aulas por dia de "+pnome(L.p)+" para "+(L.maxDia+1),txt:"Use só se o professor concordar.",fazer:function(){ guardarDesfazer("máximo por dia de "+pnome(L.p)); ST.profs[L.p].maxDia=L.maxDia+1; logar("Ajuste sugerido","Máximo de aulas por dia de "+pnome(L.p)+": "+L.maxDia+" → "+(L.maxDia+1)); save(); return "Máximo aumentado."; }});
  if(L.q!=null) o.push({tit:"Tirar o par "+pnome(L.p)+" × "+pnome(L.q)+" (não podem coincidir)",txt:"Use se os dois já não precisam ficar separados.",fazer:function(){ guardarDesfazer("par de recomposição"); ST.pares=ST.pares.filter(function(z){ return !((z.a===L.p&&z.b===L.q)||(z.a===L.q&&z.b===L.p)); }); logar("Ajuste sugerido","Par de recomposição retirado: "+pnome(L.p)+" × "+pnome(L.q)); save(); return "Par retirado."; }});
  if(L.b===4||L.b===5) o.push({tit:"Ver o horário da outra escola",txt:"Confira se o horário guardado da outra escola está certo.",abre:1,fazer:function(){ show("externo"); return null; }});
  if(L.turmaCad!=null) o.push({tit:"Abrir as disciplinas da turma",txt:"Confira as aulas por semana de cada disciplina para fechar com o horário da turma.",abre:1,fazer:function(){ show("turmas"); document.getElementById("tSel").value=String(L.turmaCad); renderTurmas(); return null; }});
  return o; }
function verNaGrade(x){ var a=aulasDoProblema(x)[0], L=x.loc||{};
  if(a){ DESTAQUE={t:a.t,s:a.s}; SEMANA=null; document.getElementById("gView").value="turma"; fillSelectsOnce(); document.getElementById("gTurma").value=String(a.t); show("grade");
    setTimeout(function(){ var el=document.querySelector('#gOut .c[data-t="'+a.t+'"][data-s="'+a.s+'"]'); if(el) el.scrollIntoView({behavior:"smooth",block:"center"}); },60); return; }
  if(L.p!=null){ document.getElementById("gView").value="prof"; fillSelectsOnce(); document.getElementById("gProf").value=String(L.p); show("grade"); } }
function mostrarAplicado(t){ var el=document.getElementById("pAplicado"); if(!el) return; el.innerHTML='<div class="msg ok">'+esc(t)+(DESFAZER?' <button class="btn sm" id="pDesfazer">Desfazer</button>':"")+"</div>"; var b=document.getElementById("pDesfazer"); if(b) b.onclick=desfazerAjuste; el.scrollIntoView({behavior:"smooth",block:"nearest"}); }
function abrirProblema(i,box){
  var x=CACHE.pr[i]; if(!x){ box.innerHTML=""; return; }
  var aulas=aulasDoProblema(x), L=x.loc||{};
  var h='<div class="pdet"><p style="margin:4px 0"><b>O que é:</b> '+esc(oQueE(x))+"</p>";
  if(aulas.length) h+='<p style="margin:4px 0"><b>Onde:</b></p><ul style="margin:0 0 6px 18px;padding:0">'+aulas.slice(0,8).map(function(a){ return "<li>"+esc(descAula(a.t,a.s))+(ST.locks[a.t+"|"+a.s]?" 🔒":"")+"</li>"; }).join("")+(aulas.length>8?"<li>… e mais "+(aulas.length-8)+"</li>":"")+"</ul>";
  h+='<div class="row" style="margin:4px 0 8px"><button class="btn sm" data-ver="1">Ver na grade</button></div><b>Opções de ajuste</b> <span class="small">(escolha uma; dá para desfazer)</span><div class="popc"><div class="msg info">Calculando as opções…</div></div><div class="ploc"></div></div>';
  box.innerHTML=h; box.querySelector("[data-ver]").onclick=function(){ verNaGrade(x); };
  setTimeout(function(){ var lista=[], antes=contaTipos(CACHE.pr);
    try{ trocasPara(x,4).forEach(function(o){ var n=nA(o.t);
      lista.push({tit:"Trocar de lugar na "+ST.turmas[o.t].nome+": "+DIAS[(o.s1/n)|0]+" "+(o.s1%n+1)+"ª ⇄ "+DIAS[(o.s2/n)|0]+" "+(o.s2%n+1)+"ª",
        txt:descK(ST.grid[o.t][o.s1])+" ⇄ "+descK(ST.grid[o.t][o.s2])+" — "+(o.resolve?"resolve este ponto":"melhora a grade, mas este ponto continua")+"; "+resumoEfeito(o,antes)+"."+(o.cont.rig>antes.rig?" ⚠ Atenção: cria outro conflito rígido.":""),bom:o.bom,ruim:o.cont.rig>antes.rig,
        fazer:function(){ return "Troca feita."+aplicarTroca(o.t,o.s1,o.s2); }}); }); }catch(e){}
    if(aulas.length) lista.push({tit:"Deixar o gerador procurar uma solução só nas turmas envolvidas",txt:"Mexe só nessas turmas (o resto da grade fica igual) e mostra o que mudaria antes de aplicar.",local:true});
    lista=lista.concat(opcoesExtras(x));
    if(aulas.length) lista.push({tit:"Trocar na mão",txt:"Abre a grade da turma com a aula destacada; clique nela e depois na aula com que quer trocar.",abre:1,fazer:function(){ verNaGrade(x); return null; }});
    lista.push({tit:"Rodar “Ajustar a grade atual” (a grade toda)",abre:1,txt:"O gerador tenta resolver todos os pontos de uma vez, mexendo o mínimo possível.",fazer:function(){ rodar(false); return null; }});
    if(x.tipo!=="rígida") lista.push({tit:"Manter assim",semEditar:1,txt:"Às vezes não há jeito melhor. O ponto continua na lista só como aviso.",fazer:function(){ ST.pvistos=ST.pvistos||{}; ST.pvistos[chaveProb(x)]=1; save(); return "Mantido como está."; }});
    var oc=box.querySelector(".popc"); if(!oc) return;
    oc.innerHTML=lista.map(function(o,j){ return '<div class="popt'+(o.bom?" bom":"")+(o.ruim?" ruim":"")+'"><div><b>'+(j+1)+". "+esc(o.tit)+'</b><br><span class="small">'+esc(o.txt)+'</span></div><button class="btn sm'+(j===0?" pri":"")+'" data-op="'+j+'">'+(o.local?"Procurar":o.abre?"Abrir":"Aplicar")+"</button></div>"; }).join("");
    oc.querySelectorAll("[data-op]").forEach(function(b){ b.onclick=function(){ var o=lista[+b.dataset.op]; if(o.local){ ajusteLocal(x,box.querySelector(".ploc")); return; } if(!o.abre&&!o.semEditar&&!edPrecisa()) return; var r=o.fazer(); if(r===null) return; CACHE=null; PABERTO=null; renderInicio(); mostrarAplicado(r); }; });
  },30); }
function renderPList(){
  var pr=CACHE?CACHE.pr:[], f={"rígida":document.getElementById("fR").checked,"regra":document.getElementById("fG").checked,"preferência":document.getElementById("fP").checked}, vist=ST.pvistos||{};
  var ids=pr.map(function(x,i){ return i; }).filter(function(i){ return f[pr[i].tipo]; }).sort(function(a,b){ return (vist[chaveProb(pr[a])]?1:0)-(vist[chaveProb(pr[b])]?1:0)||a-b; });
  var el=document.getElementById("plist");
  el.innerHTML=ids.length?ids.map(function(i){ var x=pr[i], cl=x.tipo==="rígida"?"rigida":x.tipo==="regra"?"regra":"preferencia";
    return '<div class="pitem'+(PABERTO===chaveProb(x)?" on":"")+(vist[chaveProb(x)]?" visto":"")+'"><button class="plink" data-pi="'+i+'" aria-expanded="'+(PABERTO===chaveProb(x))+'"><span class="tag '+cl+'">'+x.tipo+"</span>"+esc(x.txt)+(vist[chaveProb(x)]?' <span class="small">(mantido)</span>':"")+'<span class="pseta">'+(PABERTO===chaveProb(x)?"▲":"▼ ver opções")+'</span></button><div class="pbox"></div></div>'; }).join(""):'<div class="msg ok" style="margin:6px">Nenhum ponto de atenção.</div>';
  el.classList.toggle("aberta",!!PABERTO);
  el.querySelectorAll("[data-pi]").forEach(function(b){ var i=+b.dataset.pi, x=pr[i];
    b.onclick=function(){ PABERTO=PABERTO===chaveProb(x)?null:chaveProb(x); renderPList(); };
    if(PABERTO===chaveProb(x)) abrirProblema(i,b.parentNode.querySelector(".pbox")); });
}
