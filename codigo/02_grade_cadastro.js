
// =====================================================================
// GRADE
// =====================================================================
var SEL=null, MODO_TRAVAR=false, SEMANA=null, ACAO=null;
function fillSelects(){
  var tS=document.getElementById("gTurma");
  tS.innerHTML=ST.turmas.map(function(t,i){ return t.excluida?"":'<option value="'+i+'">'+esc(t.nome)+" ("+tipoById(t.tipo).periodo+")</option>"; }).join("");
  var opts=profsOrdem().map(function(i){ return '<option value="'+i+'">'+esc(ST.profs[i].nome)+"</option>"; }).join("");
  var keep={}; ["gProf","haProf","tNovoProf"].forEach(function(id){ if(id==="haProf"){ var v0=document.getElementById(id).value; document.getElementById(id).innerHTML='<option value="all">Todos os professores</option>'+opts; document.getElementById(id).value=v0||"all"; if(!document.getElementById(id).value) document.getElementById(id).value="all"; return; } keep[id]=document.getElementById(id).value; document.getElementById(id).innerHTML=opts; if(keep[id]!=="") document.getElementById(id).value=keep[id]; });
}
var _filled=false; function fillSelectsOnce(){ if(!_filled){ fillSelects(); _filled=true; } }
["gView","gPer","gTurma","gProf"].forEach(function(id){ document.getElementById(id).addEventListener("change",function(){ SEL=null; ACAO=null; document.getElementById("gMsg").innerHTML=""; renderGrade(); }); });
document.getElementById("gSemana").onchange=function(e){ SEMANA=e.target.value||null; SEL=null; ACAO=null; document.getElementById("gMsg").innerHTML=""; renderGrade(); };
document.getElementById("gCompacto").onchange=function(e){ ST.compacto=e.target.checked; save(); renderGrade(); };
document.getElementById("gSemAnt").onclick=function(){ SEMANA=addDias(SEMANA||segundaDe(hoje()),-7); ACAO=null; renderGrade(); };
document.getElementById("gSemProx").onclick=function(){ SEMANA=addDias(SEMANA||segundaDe(hoje()),SEMANA?7:0); ACAO=null; renderGrade(); };
function fillSemanas(){
  var s0=segundaDe(hoje()), L=[s0,addDias(s0,7)], lim=addDias(s0,-28);
  ST.ausencias.forEach(function(a){ if(a.cancelada||a.ate<lim) return; var s=segundaDe(a.de); for(var i=0;i<12 && s<=a.ate;i++){ if(L.indexOf(s)<0) L.push(s); s=addDias(s,7); } });
  if(SEMANA && L.indexOf(SEMANA)<0) L.push(SEMANA);
  L.sort();
  var cnt={}; ST.ausencias.forEach(function(a){ if(a.cancelada) return; L.forEach(function(s){ if(a.de<=addDias(s,4)&&a.ate>=s) cnt[s]=(cnt[s]||0)+1; }); });
  document.getElementById("gSemana").innerHTML='<option value="">Grade oficial</option>'+L.map(function(s){ return '<option value="'+s+'"'+(s===SEMANA?" selected":"")+">Semana de "+fmtDM(s)+" a "+fmtDM(addDias(s,4))+(s===s0?" (esta semana)":"")+(cnt[s]?" · "+cnt[s]+" ausência"+(cnt[s]>1?"s":""):"")+"</option>"; }).join("");
}
function cellK(k,label,extra){
  if(!k) return '<div class="c" '+(extra||"")+'><small style="color:var(--x)">—</small></div>';
  var x=parseK(k), pr=ST.profs[x.p]||{cor:"#eee",nome:"?"};
  return '<div class="c" style="background:'+pr.cor+'" '+(extra||"")+'><b>'+esc(x.disc)+'</b><small>'+esc(label==null?pr.nome:label)+'</small></div>';
}
function cellVaga(it,extra,comTurma){ return '<div class="c vg" '+(extra||"")+' title="Aula vaga: '+esc(pnome(it.p))+' ausente"><b>AULA VAGA</b><small>'+(comTurma?esc(ST.turmas[it.t].nome)+" · ":"")+esc(it.disc)+" · "+esc(pnome(it.p))+"</small></div>"; }
function cellSub(it,extra,comTurma){ return '<div class="c sb" '+(extra||"")+'><b>'+(comTurma?esc(ST.turmas[it.t].nome)+" · ":"")+esc(it.disc)+" · "+esc(pnome(it.sub))+"</b><small>substitui "+esc(pnome(it.p))+"</small></div>"; }
function addCls(html,cls){ return html.replace('class="c','class="c'+cls); }
function legendaSemana(){ return '<div class="legend"><span><span class="sw" style="background:repeating-linear-gradient(45deg,#FDE8E6,#FDE8E6 6px,#F9D3CF 6px,#F9D3CF 12px)"></span>Aula vaga (sem professor)</span><span><span class="sw" style="background:#FFF4CC;outline:1px dashed #B58B00"></span>Aula com substituto</span></div>'; }
function renderGrade(){
  fillSelectsOnce(); fillSemanas();
  var pers=periodosEmUso(), gp=document.getElementById("gPer"), curP=gp.value;
  gp.innerHTML=pers.map(function(p){ return "<option"+(p===curP?" selected":"")+">"+p+"</option>"; }).join("");
  var v=document.getElementById("gView").value;
  gp.style.display=v==="geral"?"":"none";
  document.getElementById("gTurma").style.display=v==="turma"?"":"none";
  document.getElementById("gProf").style.display=v==="prof"?"":"none";
  var gc=document.getElementById("gCompacto"); gc.checked=!!ST.compacto; gc.parentNode.style.display=v==="geral"?"":"none";
  var out=document.getElementById("gOut"), datas=SEMANA?semanaDatas(SEMANA):null, wk=datas?vagaMapa(datas):null;
  var topo=datas?'<div class="msg warn noprint" style="margin-top:0">Mostrando a <b>semana de '+fmtDM(datas[0])+" a "+fmtDM(datas[4])+"</b> com as aulas vagas e substitutos. A grade oficial não muda."+(v==="turma"?" Clique numa aula para marcar ou desfazer uma aula vaga.":"")+"</div>"+legendaSemana():"";
  edBarra(v);
  if(v==="geral"&&EDG){ edRender(out,gp.value||pers[0]); return; }
  if(v==="geral"){
    out.innerHTML=topo+geralHTML(gp.value||pers[0],null,false,datas,wk); if(ST.compacto) out.querySelectorAll("table.g").forEach(function(tb){ tb.classList.add("compacto"); }); ajustarDias(out);
  } else if(v==="turma"){
    var t=+document.getElementById("gTurma").value, T=ST.turmas[t], tp=tipoDe(t), n=nA(t), conf=conflitosSet();
    out.innerHTML=topo+(datas?"":'<div class="row noprint" style="margin-bottom:8px"><label class="small"><input type="checkbox" id="modoTravar"'+(MODO_TRAVAR?" checked":"")+'> Modo travar: clique numa aula para travar ou destravar (aula travada não muda ao gerar)</label></div>')+
      '<h3 style="margin:0 0 8px;font-size:15px">'+esc(T.nome)+" — "+tp.periodo+' <span class="small">('+esc(tp.nome)+")</span></h3>"+
      tabelaDias(linhasTurma(t),function(d,ln){ var s=d*n+ln.a, k=ST.grid[t][s], ex='data-s="'+s+'" data-t="'+t+'"';
        if(wk){ var it=wk.cell[datas[d]+"|"+t+"|"+s]; var x=it?(it.sub!=null?cellSub(it,ex):cellVaga(it,ex)):cellK(k,null,ex); return addCls(x," clk"+(ACAO&&ACAO.t===t&&ACAO.s===s?" sel":"")); }
        return marcaExt(addCls(cellK(k,null,ex)," clk"+((SEL&&SEL.t===t&&SEL.s===s)||(DESTAQUE&&DESTAQUE.t===t&&DESTAQUE.s===s)?" sel":"")+(conf[t+"|"+s]?" conf":"")+(ST.locks[t+"|"+s]?" lock":"")),extDaAula(t,s)); },headsDias(datas));
    var mt=document.getElementById("modoTravar"); if(mt) mt.onchange=function(e){ MODO_TRAVAR=e.target.checked; SEL=null; };
    if(EDG&&!datas) edDecorar(out);
    else out.querySelectorAll(".c[data-s]").forEach(function(el){ el.onclick=function(){ var tt=+el.dataset.t, ss=+el.dataset.s;
      if(datas){ acaoSemana(tt,ss,datas); return; }
      if(MODO_TRAVAR){ edTravar(tt,ss); return; }
      clickSwap(tt,ss); }; });
  } else {
    var p=+document.getElementById("gProf").value;
    out.innerHTML=topo+profTable(p,{ha:true,datas:datas,wk:wk});
  }
}
// nome do dia em letras empilhadas, o maior que couber na célula
function ajustarDias(box){ box.querySelectorAll("th.dayhead .vt").forEach(function(el){ var th=el.parentNode, vd=th.querySelector(".vd"), n=el.textContent.length;
  var hDisp=th.clientHeight-14-(vd?vd.offsetHeight+4:0); var fs=Math.max(10,Math.min(34,Math.floor(hDisp/n/1.02))); el.style.fontSize=Math.max(8,Math.round(fs*escalaDia()))+"px"; }); }
// tamanho do nome do dia: fixo em 60% do maior que cabe no espaço do dia
function escalaDia(){ return 0.6; }
function gruposPer(per){
  var G=[];
  ST.tipos.forEach(function(tp){ if(tp.periodo!==per) return; var ts=[]; ST.turmas.forEach(function(T,i){ if(!T.excluida && T.tipo===tp.id) ts.push(i); });
    if(!ts.length) return; ts.sort(function(x,y){ var a9=/^9/.test(ST.turmas[x].nome)?0:1, b9=/^9/.test(ST.turmas[y].nome)?0:1; return a9-b9||x-y; });
    var seq=[]; tp.aulas.forEach(function(h,a){ seq.push({a:a}); var pz=pausaApos(tp,a); if(pz) seq.push({b:pz}); });
    G.push({tp:tp,nome:tp.nome,ts:ts,seq:seq}); });
  return G;
}
// cabeçalho do grupo no quadro geral: "Tipo 1 — Manhã 9º ao 3º" vira "Turmas 9º ao 3º" (o período já está no título)
function nomeGrupoQuadro(n){ var m=String(n).match(/^Tipo \d+ — (?:Manhã|Tarde|Noite|Integral)\s+(.+)$/); return m?"Turmas "+m[1]:n; }
function geralHTML(per,titulo,excel,datas,wk){
  var conf=excel?{}:conflitosSet(), G=gruposPer(per);
  if(!G.length) return '<div class="msg info">Nenhuma turma no período '+esc(per)+".</div>";
  var nl=Math.max.apply(null,G.map(function(g){return g.seq.length;}));
  var SEP=' style="border-left:3px solid #1E3A5F"';
  var h='<table class="g"'+(excel?' border="1"':"")+'><tr><th rowspan="2">Dia</th>'+G.map(function(g,gi){ return '<th colspan="'+(g.ts.length+1)+'"'+(gi?SEP:"")+' class="gtit">'+esc(nomeGrupoQuadro(g.nome))+"</th>"; }).join("")+"</tr><tr>"+
    G.map(function(g,gi){ return '<th class="tm"'+(gi?SEP:"")+'>Horário</th>'+g.ts.map(function(t){ return "<th>"+esc(ST.turmas[t].nome)+"</th>"; }).join(""); }).join("")+"</tr>";
  for(var d=0;d<5;d++) for(var r=0;r<nl;r++){
    h+="<tr"+(r===0&&d>0?' class="dsep"':"")+">"+(r===0?'<th rowspan="'+nl+'" class="dayhead dia"'+(excel?' style="background:#E3E3E3;color:#000;font-weight:bold;font-size:'+Math.round(14*escalaDia())+'pt"':"")+'>'+(excel?DIAS_F[d].split("").join("<br style=\'mso-data-placement:same-cell\'>")+(datas?"<br style=\'mso-data-placement:same-cell\'>"+fmtDM(datas[d]):""):'<span class="vt">'+DIAS_F[d]+"</span>"+(datas?'<span class="vd">'+fmtDM(datas[d])+"</span>":""))+"</th>":"");
    G.forEach(function(g,gi){ var it=g.seq[r], sep=gi?SEP:"";
      if(!it){ h+='<th class="tm"'+sep+"></th>"+g.ts.map(function(){return "<td></td>";}).join(""); return; }
      if(it.b){ h+='<th class="tm"'+sep+'>'+it.b.nome+'<br>'+it.b.ini+"–"+it.b.fim+'</th><td colspan="'+g.ts.length+'"'+(excel?' style="background:#E7ECF1"':"")+'><div class="brkc">'+it.b.nome+" "+it.b.ini+"–"+it.b.fim+"</div></td>"; return; }
      var a=it.a, n=g.tp.aulas.length;
      h+='<th class="tm"'+sep+'>'+(a+1)+"ª<br>"+g.tp.aulas[a][0]+"–"+g.tp.aulas[a][1]+"</th>";
      g.ts.forEach(function(t){ var s=d*n+a, k=(ST.grid[t]||[])[s], vi=wk?wk.cell[datas[d]+"|"+t+"|"+s]:null;
        if(excel){ if(vi){ h+='<td style="background:'+(vi.sub!=null?"#FFF4CC":"#FDE8E6")+'">'+(vi.sub!=null?esc(vi.disc)+"<br>"+esc(pnome(vi.sub))+" (subst.)":"AULA VAGA<br>"+esc(vi.disc))+"</td>"; return; } if(!k){ h+="<td></td>"; return; } var x=parseK(k); h+='<td style="background:'+ST.profs[x.p].cor+'">'+esc(x.disc)+"<br>"+esc(pnome(x.p))+"</td>"; return; }
        if(vi){ h+="<td>"+(vi.sub!=null?cellSub(vi):cellVaga(vi))+"</td>"; return; }
        h+='<td title="'+esc(horA(t,a))+'">'+marcaExt(addCls(cellK(k,null,'data-t="'+t+'" data-s="'+s+'"'),(!wk&&conf[t+"|"+s]?" conf":"")+(ST.locks[t+"|"+s]?" lock":"")),wk?null:extDaAula(t,s))+"</td>"; });
    });
    h+="</tr>";
  }
  return '<h3 style="margin:0 0 8px;font-size:15px">Quadro geral — '+esc(per)+(datas?" · semana de "+fmtDM(datas[0])+" a "+fmtDM(datas[4]):"")+"</h3>"+h+"</table>";
}
// grade do professor: linhas = faixas de horário de cada período
function profTable(p,o){
  o=o||{}; var c=cache(), tm=TM(), pr=ST.profs[p], AP=o.AP||idxAulas(), L=AP[p]||[], ha=(o.ha&&ST.ha&&ST.ha[p])?ST.ha[p].slots:[], datas=o.datas, wk=o.wk;
  var by={}; L.forEach(function(x){ var key=x.d+"|"+tm.clOfK[x.k]; (by[key]=by[key]||[]).push(x); });
  var subs=wk&&wk.subs[p]?wk.subs[p]:[], bySub={}; subs.forEach(function(it){ var key=wdIdx(it.date)+"|"+tm.clOfK[it.k]; (bySub[key]=bySub[key]||[]).push(it); });
  var haBy={}; ha.forEach(function(key){ var x=haParse(key), ci=linhaDaHA(key); if(ci>=0) (haBy[x.d+"|"+ci]=haBy[x.d+"|"+ci]||[]).push(key); });
  var tiposP={}; L.forEach(function(x){ tiposP[ST.turmas[x.t].tipo]=1; }); var temTipo=Object.keys(tiposP).length>0, conf=datas?{}:conflitosSet();
  var filtro=function(ci){ for(var d=0;d<5;d++) if(by[d+"|"+ci]||haBy[d+"|"+ci]||bySub[d+"|"+ci]) return true; return !temTipo || tm.tiposK[ci].some(function(id){ return tiposP[id]; }); };
  var h='<div class="pb"><h3 style="margin:0 0 4px;font-size:15px"><span class="dot" style="display:inline-block;vertical-align:-2px;background:'+pr.cor+'"></span> '+esc(pr.nome)+(pr.completo?'<span class="small pcomp">'+esc(pr.completo)+"</span>":"")+"</h3>";
  var n=0, nh=0;
  tm.SEC.forEach(function(sec){
    var any=sec.cls.some(function(ci){ for(var d=0;d<5;d++) if(by[d+"|"+ci]||haBy[d+"|"+ci]||bySub[d+"|"+ci]) return true; return false; });
    var todos=sec.cls.every(function(ci){ var cl=tm.CL[ci]; for(var d=0;d<5;d++) if(blkVal(p,d,cl.ini,cl.fim)<2) return false; return true; });
    var usado=sec.cls.some(function(ci){ return tm.CL[ci].ks.some(function(k){ return tm.usedK.indexOf(k)>=0; }); });
    if(!any && (todos||!usado) && !o.sempre) return;
    h+='<div class="small" style="margin:8px 0 4px;font-weight:700">'+sec.nome+"</div>";
    h+=tabelaDias(linhasSecao(sec,o.edit?null:filtro),function(d,ln){ var ci=ln.ci, cl=tm.CL[ci], ex='data-d="'+d+'" data-ci="'+ci+'"', its=by[d+"|"+ci];
      if(its){ n+=its.length;
        if(wk){ var vs=its.map(function(x){ return wk.cell[datas[d]+"|"+x.t+"|"+x.s]; }); if(vs.every(Boolean)) return cellVaga(vs[0],ex,true).replace("AULA VAGA","AUSENTE · AULA VAGA"); }
        var lbl=its.map(function(x){ return ST.turmas[x.t].nome; }).join(" + "), x=addCls(cellK(its[0].key,lbl,ex),(its.length>1||its.some(function(y){ return conf[y.t+"|"+y.s]; }))?" conf":"");
        x=x.replace(/<\/div>$/,'<span class="tmx">'+uniq(its.map(function(y){ return hmP(y.ini)+"–"+hmP(y.fim); })).join(" / ")+"</span></div>");
        var ee=null; its.some(function(y){ var r=extInfo(p,y.d,y.ini,y.fim); if(r.length){ ee=r[0]; return true; } return false; }); return marcaExt(x,ee); }
      var sb=bySub[d+"|"+ci]; if(sb) return cellSub(sb[0],ex,true);
      var hk=haBy[d+"|"+ci]; if(hk){ nh++; var lc=haLocal(p,hk[0]); return '<div class="c ha" '+ex+'>HA'+(hk.length===1&&tm.CL[ci].ks.length>1?'<span class="tmx">'+haParse(hk[0]).txt+"</span>":"")+(lc?'<small style="font-weight:500">'+esc(lc)+"</small>":"")+"</div>"; }
      var bb=blkVal(p,d,cl.ini,cl.fim); if(bb===3) return '<div class="c fo" '+ex+'>Formador</div>'; if(bb===2) return '<div class="c x" '+ex+'>[X]</div>';
      var ei=extInfo(p,d,cl.ini,cl.fim); if(ei.length) return '<div class="c ext" '+ex+' title="'+esc(ei.map(function(z){ return z.escola+": "+hmP(z.ini)+"–"+hmP(z.fim)+(z.txt?" ("+z.txt+")":""); }).join(" · "))+'">Outra escola<small>'+esc(ei[0].escola)+"</small></div>";
      if(bb===1) return '<div class="c pf" '+ex+'><small>evitar</small></div>';
      return '<div class="c" '+ex+'></div>';
    },headsDias(datas));
  });
  if(!datas){ var M=c.md.M, txt=DIAS.map(function(dn,d){ var r=Motor.analiseDia(M,c.S,p,d); if(!r) return ""; var bs=r.blocos.filter(function(b){ return b.precisa; }); if(!bs.length) return "";
      return dn+": "+bs.map(function(b){ return b.gap>=(+ST.regras.minBreak||15)?"<b>intervalo "+hmP(b.gi)+"–"+hmP(b.gf)+"</b>":"<i>sem intervalo</i>"; }).join(", "); }).filter(Boolean).join(" · ");
    if(txt) h+='<div class="dbrk">'+txt+"</div>"; }
  h+='<div class="small" style="margin-top:6px">'+n+" aulas"+(ST.ha&&ST.ha[p]?" · "+ST.ha[p].slots.length+" de "+ST.ha[p].need+" HA":"")+(subs.length?" · substitui em "+subs.length+" aula(s) nesta semana":"")+"</div></div>";
  return h;
}
var ARRASTO=null;
function clickSwap(t,s){ DESTAQUE=null; if(!edPrecisa()) return;
  var msg=document.getElementById("gMsg"), n=nA(t);
  if(!SEL||SEL.t!==t){ SEL={t:t,s:s}; renderGrade(); msg.innerHTML='<div class="msg info">Agora clique na aula da mesma turma para trocar de lugar.</div>'; return; }
  if(SEL.s===s){ SEL=null; renderGrade(); msg.innerHTML=""; return; }
  if(ST.locks[t+"|"+SEL.s]||ST.locks[t+"|"+s]){ SEL=null; renderGrade(); msg.innerHTML='<div class="msg warn">Uma das duas aulas está travada (🔒). Para trocar, destrave primeiro no “Modo travar”.</div>'; return; }
  var row=ST.grid[t], x=row[SEL.s], gAnt=deep(ST.grid);
  logar("Troca manual","Troca na "+ST.turmas[t].nome+": "+DIAS[(SEL.s/n)|0]+" "+(SEL.s%n+1)+"ª "+descK(row[SEL.s])+" ⇄ "+DIAS[(s/n)|0]+" "+(s%n+1)+"ª "+descK(row[s]),{t:t});
  var envolvidos=[row[SEL.s],row[s]].filter(Boolean).map(function(k){ return parseK(k).p; });
  row[SEL.s]=row[s]; row[s]=x; SEL=null;
  ST.gridNome="Ajustada à mão"; var tinhaEq=!!ST.eq; ST.eq=null;
  var haTirada=haConferir(envolvidos), nAus=reconciliarAusencias(gAnt);
  if(haTirada) logar("Hora-atividade",haTirada+" HA saíram porque ficaram em cima de aula depois da troca ("+uniq(envolvidos.map(pnome)).join(", ")+").");
  save();
  var before=cache().pr.filter(function(x){return x.tipo==="rígida";}).length; analisar();
  var after=CACHE.pr.filter(function(x){return x.tipo==="rígida";}).length;
  renderGrade(); renderBanner();
  var extra=(haTirada?" "+haTirada+" HA que ficou em cima de aula saiu; coloque de novo na aba Cadastro › Hora-atividade.":"")+(tinhaEq?" Gere os equipamentos de novo.":"")+(nAus?" Confira "+nAus+" aula(s) vaga(s) na aba Grade › Aulas vagas.":"");
  msg.innerHTML=after>before?'<div class="msg bad">A troca criou conflito (veja as aulas com borda vermelha). Clique nas duas de novo para desfazer.'+extra+'</div>':'<div class="msg ok">Troca feita.'+extra+'</div>';
}
// clique numa aula na visão da semana: marcar só esta aula como vaga, escolher substituto ou desfazer
function acaoSemana(t,s,datas){
  var n=nA(t), d=(s/n)|0, date=datas[d], key=date+"|"+t+"|"+s, k=ST.grid[t][s], msg=document.getElementById("gMsg");
  if(!k){ msg.innerHTML='<div class="msg info">Horário sem aula.</div>'; return; }
  ACAO={t:t,s:s}; renderGrade();
  var AP=idxAulas(), wk=vagaMapa([date]), it=wk.cell[key], x=parseK(k), tmk=TM().tsOf[t][s%n], T=TM().TS[tmk];
  var base={p:x.p,t:t,s:s,date:date,ini:T[0],fim:T[1],disc:x.disc,k:tmk};
  var onde=esc(ST.turmas[t].nome)+" · "+DIAS[d]+" "+fmtDM(date)+" · "+hmP(T[0])+"–"+hmP(T[1])+" · "+esc(x.disc)+" ("+esc(pnome(x.p))+")";
  var h='<div class="msg info" style="color:var(--text)"><b>'+onde+"</b><div class=\"row end\" style=\"margin-top:8px\">";
  if(it){ h+='<span>Esta aula está '+(it.sub!=null?"com substituto: <b>"+esc(pnome(it.sub))+"</b>":"<b style='color:var(--bad)'>VAGA</b>")+'.</span><label>Substituto<br><select id="gaSub">'+opcoesSub(it,it.aus.id,it.sub,AP)+'</select></label><button class="btn sm pri" id="gaSalvar">Salvar substituto</button><button class="btn sm" id="gaDesfazer">Voltar ao normal (professor vem)</button>'; }
  else { h+='<label>Substituto (opcional)<br><select id="gaSub">'+opcoesSub(base,null,null,AP)+'</select></label><button class="btn sm red" id="gaMarcar">Marcar só esta aula como vaga</button><span class="small">Para marcar vários dias de uma vez, use a aba Grade › Aulas vagas.</span>'; }
  h+='<button class="btn sm" id="gaFechar">Fechar</button></div></div>';
  msg.innerHTML=h;
  document.getElementById("gaFechar").onclick=function(){ ACAO=null; msg.innerHTML=""; renderGrade(); };
  var sel=document.getElementById("gaSub");
  if(it){
    document.getElementById("gaSalvar").onclick=function(){ var a=it.aus; a.subs=a.subs||{}; if(sel.value==="") delete a.subs[key]; else a.subs[key]=+sel.value; logar("Aula vaga",onde.replace(/<[^>]+>/g,"")+": "+(sel.value===""?"ficou como aula vaga":"substituto "+pnome(+sel.value))); save(); analisar(); ACAO=null; msg.innerHTML='<div class="msg ok">Salvo.</div>'; renderGrade(); };
    document.getElementById("gaDesfazer").onclick=function(){ var a=it.aus; if(a.so){ a.so=a.so.filter(function(z){ return z!==key; }); if(!a.so.length) ST.ausencias=ST.ausencias.filter(function(z){ return z!==a; }); } else { a.fora=a.fora||{}; a.fora[key]=1; } if(a.subs) delete a.subs[key];
      logar("Aula vaga",onde.replace(/<[^>]+>/g,"")+": voltou ao normal (o professor vem)"); save(); analisar(); ACAO=null; msg.innerHTML='<div class="msg ok">A aula voltou ao normal.</div>'; renderGrade(); };
  } else {
    document.getElementById("gaMarcar").onclick=function(){ var ex=ST.ausencias.filter(function(a){ return !a.cancelada && a.p===x.p && a.so && a.de===date && a.ate===date; })[0];
      if(!ex){ ex={id:novoId(),p:x.p,de:date,ate:date,so:[],fora:{},subs:{},motivo:ST.ctx.motivo||"",quem:ST.ctx.quem||"",ts:agora()}; ST.ausencias.unshift(ex); }
      ex.so.push(key); if(sel.value!=="") ex.subs[key]=+sel.value;
      logar("Aula vaga","Aula vaga marcada: "+onde.replace(/<[^>]+>/g,"")+(sel.value!==""?" — substituto "+pnome(+sel.value):"")); save(); analisar(); ACAO=null; msg.innerHTML='<div class="msg ok">Aula marcada como vaga'+(sel.value!==""?" com substituto":"")+".</div>"; renderGrade(); };
  }
}


// =====================================================================
// HORA-ATIVIDADE
// =====================================================================
function haSel(){ var v=document.getElementById("haProf").value; return v===""||v==="all"?null:+v; }
function renderHA(){
  fillSelectsOnce(); renderHAEdit();
  var out=document.getElementById("haOut"), p=haSel(), cnt=contaAulas(), AP=idxAulas();
  var aviso=ST.ha?"":'<div class="msg info" style="margin-top:0">Nenhuma HA gerada ainda para a grade atual. Clique em “Gerar HA”.</div>';
  if(p!=null){ // um professor: resumo dele e a grade
    var edit=document.getElementById("haModo").checked;
    out.innerHTML='<div class="card">'+aviso+haResumo([p])+(edit?'<p class="small" style="margin:8px 0 0">A grade para editar está logo acima, no “Modo edição manual”.</p>':'<div class="scroll" style="margin-top:10px">'+profTable(p,{ha:true,AP:AP})+"</div>")+"</div>";
    return; }
  var ps=profsOrdem().filter(function(i){ return cnt[i]>0 || (ST.ha&&ST.ha[i]&&ST.ha[i].slots.length); });
  out.innerHTML='<div class="card">'+aviso+haResumo()+"</div>"+(ST.ha?'<div class="card">'+ps.map(function(q){ return profTable(q,{ha:true,AP:AP}); }).join('<hr style="border:none;border-top:1px solid var(--border);margin:14px 0">')+"</div>":"");
}
function haLocal(p,key){ var h=ST.ha&&ST.ha[p]; if(!h) return ""; return (h.locais&&h.locais[key])||ST.haLocPad[p]||""; }
function contaAulas(){ var cnt=ST.profs.map(function(){ return 0; }); ST.turmas.forEach(function(T,t){ if(T.excluida) return; (ST.grid[t]||[]).forEach(function(k){ if(k) cnt[parseK(k).p]++; }); }); return cnt; }
function haNeed(p,cnt){ cnt=cnt||contaAulas(); var pr=ST.profs[p]; return {aulas:cnt[p], need:pr.haManual!=null&&pr.haManual!==""?+pr.haManual:Motor.haPorAulas(cnt[p])}; }
function haGarantir(p){ ST.ha=ST.ha||{}; if(!ST.ha[p]){ var x=haNeed(p); ST.ha[p]={slots:[],need:x.need,aulas:x.aulas,locais:{}}; } if(!ST.ha[p].locais) ST.ha[p].locais={}; return ST.ha[p]; }
function haOnde(key){ var x=haParse(key); return DIAS[x.d]+", "+x.txt; }
function renderHAEdit(){
  var p=haSel(), box=document.getElementById("haEdit");
  document.getElementById("haLocPad").innerHTML='<option value="">(escolher)</option>'+ST.haLocais.map(function(l){ return '<option'+(ST.haLocPad[p]===l?" selected":"")+">"+esc(l)+"</option>"; }).join("");
  document.getElementById("haLocais").innerHTML=ST.haLocais.map(function(l,i){ return '<span class="chip" style="display:inline-flex;gap:6px;align-items:center">'+esc(l)+' <button class="btn sm" data-dl="'+i+'">×</button></span>'; }).join("");
  document.querySelectorAll("#haLocais [data-dl]").forEach(function(b){ b.onclick=function(){ ST.haLocais.splice(+b.dataset.dl,1); save(); renderHAEdit(); }; });
  if(!document.getElementById("haModo").checked){ box.innerHTML=""; return; }
  if(p==null){ box.innerHTML='<div class="msg info">Para montar a HA na mão, escolha um professor na caixa acima (não “Todos os professores”).</div>'; return; }
  var h=ST.ha&&ST.ha[p], x=haNeed(p), placed=h?h.slots.length:0;
  var html='<div class="msg '+(placed>=x.need?"ok":"warn")+'">'+esc(ST.profs[p].nome)+": "+x.aulas+" aulas → "+x.need+" HA pela tabela. Colocadas: <b>"+placed+"</b>"+(placed<x.need?" (faltam "+(x.need-placed)+")":placed>x.need?" (passou "+(placed-x.need)+")":"")+".</div>";
  html+='<div class="scroll">'+profTable(p,{ha:true,edit:true})+"</div>";
  if(placed){ html+='<table class="t" style="margin-top:8px"><tr><th>HA</th><th>Onde vai cumprir</th><th></th></tr>'+h.slots.slice().sort(function(a,b){ var A=haParse(a), B=haParse(b); return A.d-B.d||A.ini-B.ini; }).map(function(k){
    return "<tr><td>"+haOnde(k)+"</td><td><select data-loc=\""+k+"\"><option value=\"\">(local padrão"+(ST.haLocPad[p]?": "+esc(ST.haLocPad[p]):"")+")</option>"+ST.haLocais.map(function(l){ return "<option"+(h.locais[k]===l?" selected":"")+">"+esc(l)+"</option>"; }).join("")+'</select></td><td class="right"><button class="btn sm" data-rm="'+k+'">Tirar</button></td></tr>'; }).join("")+"</table>"; }
  box.innerHTML=html;
  box.querySelectorAll(".c[data-ci]").forEach(function(el){ el.style.cursor="pointer"; el.onclick=function(){ haToggleCl(p,+el.dataset.d,+el.dataset.ci); }; });
  box.querySelectorAll("[data-loc]").forEach(function(sel){ sel.onchange=function(){ var k=sel.dataset.loc; var hh=haGarantir(p); if(sel.value) hh.locais[k]=sel.value; else delete hh.locais[k];
    logar("Hora-atividade",ST.profs[p].nome+": HA de "+haOnde(k)+" → local: "+(sel.value||"padrão")); save(); renderHA(); }; });
  box.querySelectorAll("[data-rm]").forEach(function(b){ b.onclick=function(){ haTirar(p,b.dataset.rm); }; });
}
function haTirar(p,key){ var h=haGarantir(p), i=h.slots.indexOf(key); if(i<0) return; h.slots.splice(i,1); delete h.locais[key]; logar("Hora-atividade",ST.profs[p].nome+": tirou HA de "+haOnde(key)+" (manual)"); var x=haNeed(p); h.need=x.need; h.aulas=x.aulas; save(); renderHA(); }
function haToggleCl(p,d,ci){
  var tm=TM(), cl=tm.CL[ci], msg=document.getElementById("haMsg"), h=haGarantir(p);
  var ex=h.slots.filter(function(key){ var x=haParse(key); return x.d===d && x.ini<cl.fim && cl.ini<x.fim; });
  if(ex.length){ haTirar(p,ex[0]); msg.innerHTML=""; return; }
  var L=idxAulas()[p]||[];
  if(L.some(function(x){ return x.d===d && x.ini<cl.fim && cl.ini<x.fim; })){ msg.innerHTML='<div class="msg warn">Nesse horário o professor tem aula.</div>'; return; }
  var pref={}; L.forEach(function(x){ pref[ST.turmas[x.t].tipo]=1; });
  var ks=cl.ks.slice().sort(function(a,b){ var pa=tm.tiposK[a].some(function(id){ return pref[id]; })?0:1, pb=tm.tiposK[b].some(function(id){ return pref[id]; })?0:1; return pa-pb||a-b; });
  var k=ks[0], T=tm.TS[k], b=blkVal(p,d,T[0],T[1]);
  if(b===3){ msg.innerHTML='<div class="msg warn">Horário de formador: não pode ter HA (é feita fora da escola).</div>'; return; }
  if(extVal(p,d,T[0],T[1],true)===4){ msg.innerHTML='<div class="msg warn">Nesse horário o professor está em outra escola (veja a aba Relatórios › Importar/Exportar).</div>'; return; }
  msg.innerHTML=b===2?'<div class="msg warn">Atenção: o professor marcou “não pode” nesse horário. A HA foi colocada mesmo assim.</div>':"";
  var key=d+"|"+hmP(T[0])+"-"+hmP(T[1]); h.slots.push(key); logar("Hora-atividade",ST.profs[p].nome+": colocou HA em "+haOnde(key)+" (manual)");
  var x=haNeed(p); h.need=x.need; h.aulas=x.aulas; save(); renderHA();
}
document.getElementById("haModo").onchange=renderHA;
document.getElementById("haProf").addEventListener("change",function(){ document.getElementById("haMsg").innerHTML=""; renderHA(); });
document.getElementById("haLocPad").onchange=function(e){ var p=haSel(); if(p==null){ document.getElementById("haMsg").innerHTML='<div class="msg info">Escolha um professor na caixa acima.</div>'; return; } if(e.target.value) ST.haLocPad[p]=e.target.value; else delete ST.haLocPad[p]; logar("Hora-atividade",ST.profs[p].nome+": local padrão da HA → "+(e.target.value||"(nenhum)")); save(); renderHA(); };
document.getElementById("haLocTodos").onclick=function(){ var p=haSel(); if(p==null){ document.getElementById("haMsg").innerHTML='<div class="msg info">Escolha um professor na caixa acima.</div>'; return; } if(!ST.haLocPad[p]||!ST.ha||!ST.ha[p]) return; ST.ha[p].locais={}; logar("Hora-atividade",ST.profs[p].nome+": todas as HAs no local "+ST.haLocPad[p]); save(); renderHA(); };
document.getElementById("haLimpar").onclick=function(){ var p=haSel(); if(p==null){ document.getElementById("haMsg").innerHTML='<div class="msg info">Escolha um professor na caixa acima.</div>'; return; } if(!ST.ha||!ST.ha[p]) return; ST.ha[p].slots=[]; ST.ha[p].locais={}; logar("Hora-atividade",ST.profs[p].nome+": tirou todas as HAs"); save(); renderHA(); };
document.getElementById("haAddLocal").onclick=function(){ var v=document.getElementById("haNovoLocal").value.trim(); if(!v||ST.haLocais.indexOf(v)>=0) return; ST.haLocais.push(v); document.getElementById("haNovoLocal").value=""; save(); renderHAEdit(); };
function haResumo(so){
  var cnt=contaAulas(), mais30=false;
  var rows=(so||profsOrdem().filter(function(i){return cnt[i]>0;})).map(function(i){
    var need=haNeed(i,cnt).need, got=ST.ha&&ST.ha[i]?ST.ha[i].slots.length:null; if(cnt[i]>30) mais30=true;
    var stt=got==null?'<span class="small">não gerada</span>':(got>=need?'<span style="color:var(--ok);font-weight:700">ok</span>':'<span style="color:var(--bad);font-weight:700">faltou '+(need-got)+"</span>");
    return "<tr><td>"+esc(ST.profs[i].nome)+'</td><td class="c num">'+cnt[i]+'</td><td class="c num">'+need+(cnt[i]>30?"*":"")+'</td><td class="c num">'+(got==null?"—":got)+'</td><td class="c">'+stt+"</td></tr>";
  }).join("");
  return '<h3 style="margin:0 0 6px;font-size:14px">Resumo'+(so?" — "+esc(ST.profs[so[0]].nome):" — todos os professores")+'</h3><div class="scroll"><table class="t resumo"><colgroup><col style="width:190px"><col style="width:80px"><col style="width:120px"><col style="width:120px"><col style="width:110px"></colgroup><tr><th>Professor</th><th class="c">Aulas</th><th class="c">HA (tabela SEED)</th><th class="c">HA colocadas</th><th class="c">Situação</th></tr>'+rows+"</table></div>"+(mais30?'<p class="small" style="margin:4px 0 0">* Acima de 30 aulas a HA é somada por vínculo (confirmar com a coordenação).</p>':"");
}
function gerarHA(list){
  var md=buildModelData(), tm=TM(); var r=Motor.gerarHA(md.M,md.grid,list,tm.usedK);
  ST.ha=ST.ha||{}; Object.keys(r).forEach(function(p){ var x=r[p]; ST.ha[p]={slots:x.slots.map(function(v){ var d=(v/tm.K)|0, k=v%tm.K; return d+"|"+hmP(tm.TS[k][0])+"-"+hmP(tm.TS[k][1]); }),need:x.need,aulas:x.aulas,locais:{}}; });
  logar("Hora-atividade","HA gerada para "+(list.length>1?list.length+" professores":pnome(list[0])));
  save(); renderHA();
  var falt=Object.keys(r).filter(function(p){ return r[p].slots.length<r[p].need; });
  document.getElementById("haMsg").innerHTML=falt.length?'<div class="msg warn">Não coube toda a HA de: '+falt.map(function(p){return esc(ST.profs[p].nome)+" (faltou "+(r[p].need-r[p].slots.length)+(ST.externo&&ST.externo.usar&&temExt(p)?", tem horário em outra escola":"")+")";}).join(", ")+'. Motivo: poucos horários livres em que o professor pode estar na escola. Libere horários na aba Cadastro › Professores ou ajuste a quantidade (campo “HA manual”).</div>':'<div class="msg ok">HA gerada.</div>';
}
document.getElementById("bHA").onclick=function(){ var p=haSel();
  if(p!=null){ gerarHA([p]); return; }
  ST.ha={}; var cnt=contaAulas(); gerarHA(cnt.map(function(c,i){ return c?i:-1; }).filter(function(i){ return i>=0; })); };

// =====================================================================
// EQUIPAMENTOS
// =====================================================================
function allDiscs(){ var s={}; ST.matriz.forEach(function(r){ s[r.disc]=1; }); return Object.keys(s).sort(); }
function renderEquipCfg(){
  var E=ST.equip;
  document.getElementById("eqCh").value=E.chrome; document.getElementById("eqTb").value=E.tablet; document.getElementById("eqRb").value=E.robo;
  document.getElementById("eqInf").value=E.inf; document.getElementById("eqBib").value=E.bib;
  document.getElementById("eqTbBib").checked=E.tbBib; document.getElementById("eqChBib").checked=E.chBib;
  document.getElementById("eqPri").innerHTML="<tr><th>Matéria</th><th>Uso</th><th></th></tr>"+E.pri.map(function(x,i){ return "<tr><td>"+esc(x.disc)+" <span class='small'>"+esc(ST.siglas[x.disc]||"")+"</span></td><td>"+(x.regra==="todas"?"Todas as aulas":"1 por turma na semana")+'</td><td class="right"><button class="btn sm" data-i="'+i+'">Remover</button></td></tr>'; }).join("");
  document.querySelectorAll("#eqPri button").forEach(function(b){ b.onclick=function(){ E.pri.splice(+b.dataset.i,1); save(); renderEquipCfg(); }; });
  document.getElementById("eqNewDisc").innerHTML=allDiscs().map(function(d){return "<option>"+esc(d)+"</option>";}).join("");
  document.getElementById("eqRobo").innerHTML=allDiscs().map(function(d){ return '<label class="small" style="display:flex;gap:4px;align-items:center"><input type="checkbox" value="'+esc(d)+'"'+(E.robo_d.indexOf(d)>=0?" checked":"")+">"+esc(d)+"</label>"; }).join("");
  document.querySelectorAll("#eqRobo input").forEach(function(c){ c.onchange=function(){ E.robo_d=[].slice.call(document.querySelectorAll("#eqRobo input:checked")).map(function(x){return x.value;}); save(); }; });
  renderEquip();
}
[["eqCh","chrome"],["eqTb","tablet"],["eqRb","robo"],["eqInf","inf"],["eqBib","bib"]].forEach(function(x){ document.getElementById(x[0]).addEventListener("change",function(e){ ST.equip[x[1]]=e.target.value; save(); }); });
[["eqTbBib","tbBib"],["eqChBib","chBib"]].forEach(function(x){ document.getElementById(x[0]).addEventListener("change",function(e){ ST.equip[x[1]]=e.target.checked; save(); }); });
document.getElementById("eqAdd").onclick=function(){ var d=document.getElementById("eqNewDisc").value, r=document.getElementById("eqNewReg").value; ST.equip.pri=ST.equip.pri.filter(function(x){return x.disc!==d;}); ST.equip.pri.push({disc:d,regra:r}); save(); renderEquipCfg(); };
document.getElementById("bEq").onclick=function(){
  var E=ST.equip, md=buildModelData();
  var r=Motor.gerarEquip(md.M,md.grid,{chrome:E.chrome,tablet:E.tablet,robo:E.robo,infNivel:E.inf,biblioNivel:E.bib,tabletSoBiblio:E.tbBib,chromeSoBiblio:E.chBib,prioridades:E.pri,roboDiscs:E.robo_d});
  ST.eq={aloc:r.aloc,falta:r.falta}; logar("Equipamentos","Horário de equipamentos gerado: "+r.aloc.length+" reservas, "+r.falta.length+" não couberam"); save(); renderEquip();
  var aviso=(E.chrome===""||E.tablet==="")?" Atenção: falta a quantidade de Chromebooks e/ou tablets; o resultado considera que sempre há aparelho suficiente.":"";
  document.getElementById("eqMsg").innerHTML='<div class="msg '+(r.falta.length?"warn":"ok")+'">'+r.aloc.length+" reservas feitas"+(r.falta.length?", "+r.falta.length+" não couberam (lista abaixo).":".")+esc(aviso)+"</div>";
};
var RECS=["INF","BIBLIO","CROM","CROM/TAB","ROB"];
function quandoSlot(t,s){ var n=nA(t); return DIAS[(s/n)|0]+", "+(s%n+1)+"ª ("+horA(t,s%n)+")"; }
function renderEquip(){
  var out=document.getElementById("eqOut");
  if(!ST.eq){ out.innerHTML=""; return; }
  var tm=TM(), by={};
  ST.eq.aloc.forEach(function(x){ var n=nA(x.t), d=(x.s/n)|0, ci=tm.clOfK[tm.tsOf[x.t][x.s%n]], rec=x.rec.replace(" (na biblioteca)",""); var k=d+"|"+ci+"|"+rec; (by[k]=by[k]||[]).push(x); });
  var h="";
  tm.SEC.forEach(function(sec){
    var cls=sec.cls.filter(function(ci){ return tm.CL[ci].ks.some(function(k){ return tm.usedK.indexOf(k)>=0; }); }); if(!cls.length) return;
    h+='<div class="card scroll pb"><h3 style="margin:0 0 8px;font-size:15px">Equipamentos — '+sec.nome+'</h3><table class="g"><tr><th></th><th></th>'+DIAS.map(function(d){return "<th>"+d+"</th>";}).join("")+"</tr>";
    cls.forEach(function(ci,j){ RECS.forEach(function(rec,ri){
      h+="<tr>"+(ri===0?'<th rowspan="'+RECS.length+'" class="dayhead">'+tm.CL[ci].label+"</th>":"")+'<th class="tm">'+rec+"</th>";
      for(var d=0;d<5;d++){ var L=by[d+"|"+ci+"|"+rec]||[];
        h+='<td><div class="eqcell">'+L.map(function(x){ var pr=ST.profs[x.p]; return '<div style="background:'+pr.cor+';padding:1px 3px;border-radius:3px;margin:1px 0">'+esc(ST.turmas[x.t].nome)+" · "+esc(pr.nome)+(x.qtd?" ("+x.qtd+")":"")+(x.rec.indexOf("biblioteca")>=0?" 📚":"")+"</div>"; }).join("")+"</div></td>"; }
      h+="</tr>"; }); });
    h+="</table></div>";
  });
  if(ST.eq.falta.length) h+='<div class="card"><h3 style="margin:0 0 6px;font-size:14px">Não couberam</h3><table class="t"><tr><th>Turma</th><th>Matéria</th><th>Professor</th><th>Quando</th><th>Motivo</th></tr>'+ST.eq.falta.map(function(f){ return "<tr><td>"+esc(ST.turmas[f.t].nome)+"</td><td>"+esc(f.disc)+"</td><td>"+esc(pnome(f.p))+"</td><td>"+(f.s>=0?quandoSlot(f.t,f.s):"na semana")+"</td><td>"+esc(f.motivo)+"</td></tr>"; }).join("")+"</table></div>";
  out.innerHTML=h;
}
document.getElementById("eqPrint").onclick=function(){ printSec("s-equip"); };

// =====================================================================
// PROFESSORES
// =====================================================================
var PSEL=0, PEDIT=null; // PEDIT = {p, antes: cópia do professor} enquanto está editando
function profGuardarCampos(){ if(!PEDIT||!document.getElementById("pf_nome")) return; ["nome","completo","email","cel","maxDia","haManual","obs","cor"].forEach(function(f){ PEDIT["f_"+f]=document.getElementById("pf_"+f).value; }); PEDIT.f_conc=document.getElementById("pf_conc").checked; }
// telefone no formato (41) 98401-6030
function fmtFone(v){ var d=String(v||"").replace(/\D/g,""); if(d.length>11 && d.indexOf("55")===0) d=d.slice(2); if(d.length===11) return "("+d.slice(0,2)+") "+d.slice(2,7)+"-"+d.slice(7); if(d.length===10) return "("+d.slice(0,2)+") "+d.slice(2,6)+"-"+d.slice(6); return String(v||"").trim(); }
function mascaraFone(el){ var d=el.value.replace(/\D/g,""); if(d.length>11&&d.indexOf("55")===0) d=d.slice(2); d=d.slice(0,11); var r=d;
  if(d.length>2) r="("+d.slice(0,2)+") "+d.slice(2); else if(d.length) r="("+d;
  if(d.length>6) r="("+d.slice(0,2)+") "+d.slice(2,d.length===11?7:6)+"-"+d.slice(d.length===11?7:6);
  el.value=r; }
function renderProfs(){
  var q=(document.getElementById("pBusca").value||"").toLowerCase(), tm=TM();
  var cnt=ST.profs.map(function(){ return 0; }); ST.matriz.forEach(function(r){ cnt[r.p]+=r.n; });
  document.getElementById("pList").innerHTML=ST.profs.map(function(p,i){return i;}).sort(function(a,b){ return ST.profs[a].nome.localeCompare(ST.profs[b].nome); }).filter(function(i){ var p=ST.profs[i]; if(p.nome==="(excluído)"&&q.indexOf("exclu")<0) return false; return !q||p.nome.toLowerCase().indexOf(q)>=0||(p.completo||"").toLowerCase().indexOf(q)>=0; }).map(function(i){
    return '<button data-i="'+i+'" class="'+(i===PSEL?"on":"")+'"><span class="dot" style="background:'+ST.profs[i].cor+'"></span><span style="flex:1">'+esc(ST.profs[i].nome)+'</span><span class="small num">'+cnt[i]+"</span></button>"; }).join("");
  document.querySelectorAll("#pList button").forEach(function(b){ b.onclick=function(){
    if(PEDIT && +b.dataset.i!==PEDIT.p){ document.getElementById("pfMsg").innerHTML='<div class="msg warn">Você está editando '+esc(ST.profs[PEDIT.p].nome)+'. Clique em <b>Salvar</b> ou <b>Cancelar</b> antes de trocar de professor.</div>'; return; }
    PSEL=+b.dataset.i; renderProfs(); }; });
  var p=ST.profs[PSEL]; if(!p){ document.getElementById("pDet").innerHTML=""; return; }
  var ed=!!(PEDIT&&PEDIT.p===PSEL), dis=ed?"":" disabled";
  var CL=["","pf","x","fo"], TX=["","evitar","não pode","formador"];
  var h='<div id="pfMsg"></div><div class="row" style="justify-content:space-between"><h2 style="margin:0">'+esc(p.nome)+(ed?' <span class="pill" style="background:#FCEBDD;color:#9A4513;vertical-align:3px">editando</span>':"")+'</h2><span class="row"><span class="small">'+cnt[PSEL]+" aulas · HA pela tabela: "+Motor.haPorAulas(cnt[PSEL])+"</span>"+
    (ed?'<button class="btn sm pri" id="pSalvar">Salvar</button><button class="btn sm" id="pCancelar">Cancelar</button>':'<button class="btn sm pri" id="pEditar">Editar</button>')+'<button class="btn sm red" id="pAus">Marcar ausência (Aula Vaga)</button></span></div>';
  if(!ed) h+='<p class="small" style="margin:6px 0 0">Para mudar os dados ou os horários deste professor, clique em <b>Editar</b>. Nada muda até você clicar em <b>Salvar</b>.</p>';
  h+='<div class="grid2" style="margin:10px 0"><label>Nome na grade<br><input type="text" id="pf_nome" value="'+esc(p.nome)+'" style="width:100%"'+dis+'></label><label>Nome completo<br><input type="text" id="pf_completo" value="'+esc(p.completo||"")+'" style="width:100%"'+dis+'></label><label>E-mail<br><input type="text" id="pf_email" value="'+esc(p.email||"")+'" placeholder="nome@escola.pr.gov.br" style="width:100%"'+dis+'></label><label>Celular (WhatsApp)<br><input type="text" id="pf_cel" inputmode="numeric" value="'+esc(fmtFone(p.cel))+'" placeholder="(41) 98401-6030" style="width:100%"'+dis+'></label><label>Cor<br><input type="color" id="pf_cor" value="'+p.cor+'"'+dis+'></label><label>Máximo de aulas por dia<br><input type="number" id="pf_maxDia" min="1" max="12" value="'+(p.maxDia||"")+'" placeholder="sem limite"'+dis+'></label><label>HA manual (vazio = tabela)<br><input type="number" id="pf_haManual" min="0" max="20" value="'+(p.haManual==null?"":p.haManual)+'"'+dis+'></label></div>';
  h+='<label class="chk"><input type="checkbox" id="pf_conc"'+(p.concentrar?" checked":"")+dis+'> Prefere concentrar as aulas em menos dias</label>';
  h+='<label>Observações<br><input type="text" id="pf_obs" value="'+esc(p.obs||"")+'" style="width:100%"'+dis+'></label>';
  var ativas=ST.ausencias.filter(function(a){ return a.p===PSEL && !statusAus(a).enc; });
  if(ativas.length) h+='<div class="msg warn">Ausências marcadas: '+ativas.map(function(a){ return periodoTxt(a)+(a.motivo?" ("+esc(a.motivo)+")":""); }).join("; ")+". Veja na aba Grade › Aulas vagas.</div>";
  h+='<div class="legend"><span><span class="dot"></span>livre</span><span><span class="dot" style="background:var(--prefbg)"></span>evitar</span><span><span class="dot" style="background:var(--xbg)"></span>não pode</span><span><span class="dot" style="background:var(--formbg)"></span>formador</span>'+(temExt(PSEL)?'<span><span class="dot" style="background:var(--extbg)"></span>em outra escola (vem da aba Relatórios › Importar/Exportar)</span>':"")+(ed?"<span><b>Clique nos horários para mudar.</b></span>":"")+"</div>";
  tm.SEC.forEach(function(sec){
    h+='<div class="row" style="justify-content:space-between;margin-top:6px"><b>'+sec.nome+"</b>"+(ed?'<span><button class="btn sm" data-all="'+sec.per+'" data-v="0">Liberar '+sec.nome.toLowerCase()+'</button> <button class="btn sm" data-all="'+sec.per+'" data-v="2">Bloquear '+sec.nome.toLowerCase()+"</button></span>":"")+"</div>";
    h+=tabelaDias(linhasSecao(sec),function(d,ln){ var cl=tm.CL[ln.ci], b=blkVal(PSEL,d,cl.ini,cl.fim), ei=b>=2?[]:extInfo(PSEL,d,cl.ini,cl.fim);
      if(ei.length) return '<div class="c'+(ed?" clk":"")+' ext" data-d="'+d+'" data-ci="'+ln.ci+'" title="'+esc(ei.map(function(z){ return z.escola+": "+hmP(z.ini)+"–"+hmP(z.fim)+(z.txt?" ("+z.txt+")":""); }).join(" · "))+'">Outra escola<small>'+esc(ei[0].escola)+(b===1?" · evitar":"")+"</small></div>";
      return '<div class="c'+(ed?" clk":"")+" "+CL[b]+'" data-d="'+d+'" data-ci="'+ln.ci+'"><small>'+TX[b]+"</small></div>"; },DIAS);
  });
  h+='<div class="row" style="margin-top:10px">'+(ed?'<button class="btn sm pri" id="pSalvar2">Salvar</button><button class="btn sm" id="pCancelar2">Cancelar</button>':'<button class="btn sm" id="pDel">Excluir professor</button>')+"</div>";
  document.getElementById("pDet").innerHTML=h;
  var msg=function(t,c){ document.getElementById("pfMsg").innerHTML='<div class="msg '+(c||"bad")+'">'+t+"</div>"; document.getElementById("pfMsg").scrollIntoView({block:"nearest"}); };
  document.getElementById("pAus").onclick=function(){ if(ed){ msg("Salve ou cancele a edição antes.","warn"); return; } novoForm(PSEL); show("vagas"); };
  var cel=document.getElementById("pf_cel"); cel.oninput=function(){ mascaraFone(cel); }; cel.onblur=function(){ cel.value=fmtFone(cel.value); };
  if(!ed){
    document.getElementById("pEditar").onclick=function(){ PEDIT={p:PSEL,antes:deep(p)}; renderProfs(); };
    document.querySelectorAll("#pDet .c[data-ci]").forEach(function(el){ el.onclick=function(){ msg("Para mudar os horários, clique em <b>Editar</b>.","info"); }; });
    document.getElementById("pDel").onclick=function(){
      if(cnt[PSEL]>0){ document.getElementById("pDel").insertAdjacentHTML("afterend",'<span class="small" style="color:var(--bad);margin-left:8px">Este professor tem aulas. Passe as aulas para outro na aba Cadastro › Turmas e aulas antes de excluir.</span>'); return; }
      var b=this; if(b.dataset.arm!=="1"){ b.dataset.arm="1"; b.textContent="Confirmar exclusão?"; return; }
      logar("Professor","Professor excluído: "+ST.profs[PSEL].nome); ST.profs[PSEL].nome="(excluído)"; ST.profs[PSEL].ind={}; for(var d=0;d<5;d++) setBlkFaixa(PSEL,d,0,24*60,2); save(); _filled=false; renderProfs(); };
    return;
  }
  // ---- modo edição: os horários mudam na hora (sem salvar ainda) ----
  var guardarCampos=profGuardarCampos;
  function voltarCampos(){ if(PEDIT.f_nome==null) return; ["nome","completo","email","cel","maxDia","haManual","obs","cor"].forEach(function(f){ document.getElementById("pf_"+f).value=PEDIT["f_"+f]; }); document.getElementById("pf_conc").checked=PEDIT.f_conc; }
  voltarCampos();
  document.querySelectorAll("#pDet .c[data-ci]").forEach(function(el){ el.onclick=function(){ var d=+el.dataset.d, cl=tm.CL[+el.dataset.ci], nv=(blkVal(PSEL,d,cl.ini,cl.fim)+1)%4; guardarCampos(); setBlkFaixa(PSEL,d,cl.ini,cl.fim,nv); renderProfs(); }; });
  document.querySelectorAll("#pDet button[data-all]").forEach(function(b){ b.onclick=function(){ var per=+b.dataset.all, v=+b.dataset.v, sec=tm.SEC.filter(function(s){ return s.per===per; })[0]; guardarCampos();
    sec.cls.forEach(function(ci){ var c2=tm.CL[ci]; for(var d=0;d<5;d++) setBlkFaixa(PSEL,d,c2.ini,c2.fim,v); }); renderProfs(); }; });
  function cancelar(){ ST.profs[PEDIT.p]=PEDIT.antes; PEDIT=null; renderProfs(); }
  function salvar(){
    var g=function(id){ return document.getElementById(id).value.trim(); }, a=PEDIT.antes;
    var nome=g("pf_nome").toUpperCase(), email=g("pf_email"), celD=g("pf_cel").replace(/\D/g,""), cor=document.getElementById("pf_cor").value;
    if(!nome) return msg("O nome na grade não pode ficar vazio.");
    if(ST.profs.some(function(q,i){ return i!==PSEL && q.nome===nome; })) return msg("Já existe um professor com o nome “"+esc(nome)+"”.");
    if(email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return msg("E-mail inválido. Confira e tente de novo.");
    if(celD.length>11 && celD.indexOf("55")===0) celD=celD.slice(2);
    if(celD && celD.length!==10 && celD.length!==11) return msg("Celular incompleto: coloque o DDD e o número, por exemplo (41) 98401-6030.");
    var perto=ST.profs.map(function(q,i){return i;}).filter(function(i){ return i!==PSEL && ST.profs[i].nome!=="(excluído)" && corDist(ST.profs[i].cor,cor)<40; });
    if(cor!==a.cor && perto.length) return msg("Essa cor é igual ou muito parecida com a de "+perto.map(function(i){return esc(ST.profs[i].nome);}).join(", ")+". Escolha outra.");
    var nv={nome:nome,completo:g("pf_completo"),email:email,cel:fmtFone(celD),cor:cor,maxDia:g("pf_maxDia")?+g("pf_maxDia"):null,haManual:g("pf_haManual")===""?null:+g("pf_haManual"),obs:g("pf_obs"),concentrar:document.getElementById("pf_conc").checked};
    var NOMES={nome:"nome na grade",completo:"nome completo",email:"e-mail",cel:"celular",cor:"cor",maxDia:"máximo de aulas por dia",haManual:"HA manual",obs:"observação",concentrar:"concentrar aulas"}, mud=[];
    Object.keys(nv).forEach(function(k){ var x=a[k]==null?"":a[k], y=nv[k]==null?"":nv[k]; if(k==="cel") x=fmtFone(x); if(String(x)!==String(y)) mud.push(NOMES[k]+": "+(k==="cor"?"alterada":(x===""?"(vazio)":x)+" → "+(y===""?"(vazio)":y))); p[k]=nv[k]; });
    var nInd=0, ka=a.ind||{}, kb=p.ind||{}; Object.keys(ka).concat(Object.keys(kb)).forEach(function(k,i,arr){ if(arr.indexOf(k)===i && (ka[k]||0)!==(kb[k]||0)) nInd++; });
    if(nInd) mud.push("horários de disponibilidade ("+nInd+" "+(nInd===1?"mudança":"mudanças")+")");
    if(mud.length) logar("Professor",a.nome+" — "+mud.join("; "));
    PEDIT=null; save(); CACHE=null; _filled=false; renderProfs();
    document.getElementById("pfMsg").innerHTML='<div class="msg ok">'+(mud.length?"Salvo. "+esc(mud.join("; "))+".":"Nada foi alterado.")+"</div>";
  }
  ["pSalvar","pSalvar2"].forEach(function(id){ document.getElementById(id).onclick=salvar; });
  ["pCancelar","pCancelar2"].forEach(function(id){ document.getElementById(id).onclick=cancelar; });
}
document.getElementById("pBusca").addEventListener("input",function(){ if(PEDIT) profGuardarCampos(); renderProfs(); });
document.getElementById("pAdd").onclick=function(){
  if(PEDIT){ document.getElementById("pfMsg").innerHTML='<div class="msg warn">Salve ou cancele a edição antes de adicionar outro professor.</div>'; return; }
  var n=document.getElementById("pNovo").value.trim().toUpperCase(); if(!n) return;
  if(ST.profs.some(function(q){ return q.nome===n; })) return;
  var cor=null; for(var i=0;i<3000&&!cor;i++){ var c=hsl2hex(Math.random(),0.45+Math.random()*0.4,0.70+Math.random()*0.16); if(ST.profs.every(function(q){ return corDist(q.cor,c)>=45; })) cor=c; } cor=cor||hsl2hex(Math.random(),0.6,0.8);
  logar("Professor","Novo professor cadastrado: "+n);
  ST.profs.push({nome:n,completo:"",cor:cor,corEsc:"#333",ind:{},maxDia:null,concentrar:false,haManual:null,obs:"",email:"",cel:""});
  PSEL=ST.profs.length-1; document.getElementById("pNovo").value=""; save(); _filled=false; CACHE=null; renderProfs();
};
function hex2rgb(h){ h=h.replace("#",""); return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]; }
function corDist(a,b){ var x=hex2rgb(a), y=hex2rgb(b); var rm=(x[0]+y[0])/2, dr=x[0]-y[0], dg=x[1]-y[1], db=x[2]-y[2]; return Math.sqrt((2+rm/256)*dr*dr+4*dg*dg+(2+(255-rm)/256)*db*db); }
function sortearCores(n){
  var cores=[], tent=0, minD=70;
  while(cores.length<n && tent<20000){ tent++;
    var c=hsl2hex(Math.random(), 0.45+Math.random()*0.4, 0.70+Math.random()*0.16);
    if(cores.every(function(x){ return corDist(x,c)>=minD; })) cores.push(c);
    if(tent%2000===0) minD-=6;
  }
  while(cores.length<n) cores.push(hsl2hex(cores.length*0.618%1,0.6,0.8));
  return cores;
}
document.getElementById("pCores").onclick=function(){ var c=sortearCores(ST.profs.length); ST.profs.forEach(function(p,i){ p.cor=c[i]; }); logar("Professor","Cores de todos os professores sorteadas de novo"); save(); renderProfs(); };
function hsl2hex(h,s,l){ function f(n){ var k=(n+h*12)%12, a=s*Math.min(l,1-l); var c=l-a*Math.max(-1,Math.min(k-3,9-k,1)); return Math.round(c*255).toString(16).padStart(2,"0"); } return "#"+f(0)+f(8)+f(4); }

// =====================================================================
// TURMAS
// =====================================================================
function tipoOpts(sel){ return ST.tipos.map(function(tp){ return '<option value="'+tp.id+'"'+(tp.id===sel?" selected":"")+">"+esc(tp.nome)+" ("+tp.aulas[0][0]+"–"+tp.aulas[tp.aulas.length-1][1]+", "+tp.aulas.length+" aulas/dia)</option>"; }).join(""); }
function previaTipo(tp){ return '<b class="small">'+esc(tp.nome)+":</b> "+tp.aulas.map(function(h,a){ var pz=pausaApos(tp,a); return (a+1)+"ª "+h[0]+"–"+h[1]+(pz?" · <i>"+pz.nome.toLowerCase()+" "+pz.ini+"–"+pz.fim+"</i>":""); }).join(" · "); }
function totalTurma(t){ return ST.matriz.reduce(function(s,r){ return s+(r.t===t?r.n:0); },0); }
function mudarTipoTurma(t,novo){
  var T=ST.turmas[t], antes=tipoById(T.tipo), depois=tipoById(novo), oldN=antes.aulas.length, gAnt=deep(ST.grid);
  T.tipo=novo; if(depois.aulas.length!==oldN) resizeTurma(t,oldN,depois.aulas.length);
  ST.eq=null; reconciliarAusencias(gAnt); _TM=null; var nh=haConferirTodos();
  logar("Turmas e aulas",T.nome+": horário "+antes.nome+" → "+depois.nome+(depois.periodo!==antes.periodo?" (período "+antes.periodo+" → "+depois.periodo+")":"")+". As aulas precisam ser reencaixadas: use Ajustar."+(nh?" "+nh+" hora(s)-atividade em cima de aula foram tiradas.":""),{t:t});
  save(); CACHE=null; _filled=false; return nh;
}
function renderTurmas(){
  fillSelectsOnce();
  var nt=document.getElementById("ntTipo"), ntv=nt.value; nt.innerHTML=tipoOpts(ntv||ST.tipos[0].id);
  document.getElementById("ntHorPrev").innerHTML=previaTipo(tipoById(nt.value))+'. <span class="small">Para criar ou mudar horários, use a aba Cadastro › Horários.</span>';
  // todas
  var rowsT=ST.turmas.map(function(T,i){ return i; }).filter(function(i){ return !ST.turmas[i].excluida; });
  document.getElementById("tTodas").innerHTML="<tr><th>Turma</th><th>Horário</th><th>Período</th><th>Nível</th><th class='right'>Alunos</th><th>Aulas cadastradas</th><th></th></tr>"+rowsT.map(function(t){ var T=ST.turmas[t], tp=tipoDe(t), tot=totalTurma(t), N=tp.aulas.length*5;
    return "<tr><td><b>"+esc(T.nome)+'</b></td><td><select data-tt="'+t+'" aria-label="Horário da turma '+esc(T.nome)+'">'+ST.tipos.map(function(x){ return '<option value="'+x.id+'"'+(x.id===T.tipo?" selected":"")+">"+esc(x.nome)+"</option>"; }).join("")+"</select></td><td>"+tp.periodo+"</td><td>"+(T.nivel==="F"?"Fundamental":"Médio")+'</td><td class="right num">'+(T.alunos||0)+'</td><td style="font-weight:700;color:'+(tot===N?"var(--ok)":"var(--bad)")+'">'+tot+" de "+N+'</td><td class="right"><button class="btn sm" data-td="'+t+'">Disciplinas</button></td></tr>'; }).join("");
  document.querySelectorAll("#tTodas [data-tt]").forEach(function(sel){ sel.onchange=function(){ var t=+sel.dataset.tt, nh=mudarTipoTurma(t,sel.value); renderTurmas(); document.getElementById("tTodasMsg").innerHTML='<div class="msg warn">O horário da '+esc(ST.turmas[t].nome)+' mudou. As aulas dela precisam ser reencaixadas: vá na aba Gerar e clique em “Ajustar a grade atual”.'+(nh?" "+esc(avisoHAtirada(nh)):"")+'</div>'; }; });
  document.querySelectorAll("#tTodas [data-td]").forEach(function(b){ b.onclick=function(){ document.getElementById("tSel").value=b.dataset.td; renderTurmas(); document.getElementById("tCardDisc").scrollIntoView({behavior:"smooth"}); }; });
  // detalhe
  var sel=document.getElementById("tSel"), sv=sel.value;
  sel.innerHTML=rowsT.map(function(i){ return '<option value="'+i+'">'+esc(ST.turmas[i].nome)+" ("+perDe(i)+")</option>"; }).join(""); if(sv!==""&&rowsT.indexOf(+sv)>=0) sel.value=sv;
  var t=+sel.value||rowsT[0]||0, tm=ST.turmas[t], N=nA(t)*5;
  var rows=ST.matriz.map(function(r,i){return i;}).filter(function(i){ return ST.matriz[i].t===t; }).sort(function(a,b){ return ST.matriz[a].disc.localeCompare(ST.matriz[b].disc); });
  var tot=rows.reduce(function(s,i){ return s+ST.matriz[i].n; },0);
  document.getElementById("tInfo").innerHTML='<span style="font-weight:700;color:'+(tot===N?"var(--ok)":"var(--bad)")+'">'+tot+" de "+N+" aulas</span> · Alunos: <input type=number id=tAlunos min=0 aria-label=Alunos value="+(tm.alunos||0)+">";
  document.getElementById("tAlunos").onchange=function(e){ logar("Turmas e aulas",tm.nome+": alunos "+(tm.alunos||0)+" → "+e.target.value); tm.alunos=+e.target.value; save(); renderTurmas(); };
  document.getElementById("tDados").innerHTML='<label>Nome<br><input type="text" id="tdNome" value="'+esc(tm.nome)+'" style="width:110px"></label>'+
    '<label>Horário<br><select id="tdTipo">'+tipoOpts(tm.tipo)+"</select></label>"+
    '<label>Nível<br><select id="tdNivel"><option value="F"'+(tm.nivel==="F"?" selected":"")+'>Fundamental</option><option value="M"'+(tm.nivel==="M"?" selected":"")+'>Médio</option></select></label>'+
    '<button class="btn sm" id="tdDel">Excluir turma</button><div class="small" style="flex-basis:100%">'+previaTipo(tipoDe(t))+"</div>";
  document.getElementById("tdNome").onchange=function(e){ var v=e.target.value.trim().toUpperCase(); if(!v||ST.turmas.some(function(x,i){return i!==t&&x.nome===v;})){ e.target.value=tm.nome; return; } logar("Turmas e aulas","Turma renomeada: "+tm.nome+" → "+v,{t:t}); tm.nome=v; save(); _filled=false; renderTurmas(); };
  document.getElementById("tdTipo").onchange=function(e){ mudarTipoTurma(t,e.target.value); renderTurmas(); };
  document.getElementById("tdNivel").onchange=function(e){ logar("Turmas e aulas",tm.nome+": nível → "+(e.target.value==="F"?"Fundamental":"Médio"),{t:t}); tm.nivel=e.target.value; save(); renderTurmas(); };
  document.getElementById("tdDel").onclick=function(){ var b=this;
    if(rows.length){ b.insertAdjacentHTML("afterend",'<span class="small" style="color:var(--bad);margin-left:6px">Tire as disciplinas da turma antes de excluir.</span>'); return; }
    if(b.dataset.arm!=="1"){ b.dataset.arm="1"; b.textContent="Confirmar exclusão?"; return; }
    logar("Turmas e aulas","Turma excluída: "+tm.nome); tm.excluida=true; tm.nome=tm.nome+" (excluída)"; ST.grid[t]=new Array(N).fill(null); save(); CACHE=null; _filled=false; sel.value=""; renderTurmas(); };
  var popts=profsOrdem();
  document.getElementById("tTab").innerHTML="<tr><th>Disciplina</th><th>Professor</th><th>Aulas/semana</th><th>2ª docência</th><th></th></tr>"+rows.map(function(i){ var r=ST.matriz[i];
    return "<tr><td><b>"+esc(r.disc)+"</b> <span class='small'>"+esc(ST.siglas[r.disc]||"")+'</span></td><td><select data-i="'+i+'" data-f="p" aria-label="Professor de '+esc(r.disc)+'">'+popts.map(function(j){ return '<option value="'+j+'"'+(j===r.p?" selected":"")+">"+esc(ST.profs[j].nome)+"</option>"; }).join("")+'</select></td><td><input type="number" min="1" max="12" data-i="'+i+'" data-f="n" value="'+r.n+'" aria-label="Aulas por semana de '+esc(r.disc)+'"></td><td>'+(r.doc2?"sim":"")+'</td><td class="right"><button class="btn sm" data-del="'+i+'">Remover</button></td></tr>'; }).join("");
  document.querySelectorAll("#tTab [data-f]").forEach(function(el){ el.onchange=function(){ var r=ST.matriz[+el.dataset.i], old=kOf(r.disc,r.p,r.doc2);
    if(el.dataset.f==="p") logar("Turmas e aulas",ST.turmas[t].nome+" — "+r.disc+": professor "+pnome(r.p)+" → "+pnome(+el.value),{t:t});
    else logar("Turmas e aulas",ST.turmas[t].nome+" — "+r.disc+": aulas por semana "+r.n+" → "+el.value,{t:t});
    r[el.dataset.f]=+el.value; var nk=kOf(r.disc,r.p,r.doc2); if(old!==nk){ ST.grid[t]=ST.grid[t].map(function(k){ return k===old?nk:k; }); } save(); CACHE=null; renderTurmas(); }; });
  document.querySelectorAll("#tTab [data-del]").forEach(function(b){ b.onclick=function(){ var r=ST.matriz[+b.dataset.del]; logar("Turmas e aulas",ST.turmas[t].nome+": removida "+r.disc+" ("+pnome(r.p)+", "+r.n+" aulas)",{t:t}); var k=kOf(r.disc,r.p,r.doc2); ST.matriz.splice(+b.dataset.del,1); ST.grid[t]=ST.grid[t].map(function(x){ return x===k?null:x; }); save(); CACHE=null; renderTurmas(); }; });
  document.getElementById("discList").innerHTML=Object.keys(ST.siglas).map(function(d){return '<option value="'+esc(d)+'">';}).join("");
}
document.getElementById("tSel").addEventListener("change",renderTurmas);
document.getElementById("ntTipo").addEventListener("change",renderTurmas);
document.getElementById("ntAdd").onclick=function(){
  var nome=document.getElementById("ntNome").value.trim().toUpperCase(), msg=document.getElementById("ntMsg");
  if(!nome){ msg.innerHTML='<div class="msg bad">Escreva o nome da turma.</div>'; return; }
  if(ST.turmas.some(function(x){ return x.nome===nome; })){ msg.innerHTML='<div class="msg bad">Já existe uma turma com esse nome.</div>'; return; }
  var tp=tipoById(document.getElementById("ntTipo").value);
  ST.turmas.push({nome:nome,tipo:tp.id,nivel:document.getElementById("ntNivel").value,alunos:+document.getElementById("ntAlunos").value||0});
  ST.grid.push(new Array(tp.aulas.length*5).fill(null));
  logar("Turmas e aulas","Nova turma "+nome+" ("+tp.nome+")");
  save(); CACHE=null; _filled=false; document.getElementById("tSel").innerHTML=""; renderTurmas(); document.getElementById("tSel").value=String(ST.turmas.length-1); renderTurmas();
  document.getElementById("ntNome").value="";
  msg.innerHTML='<div class="msg ok">Turma '+esc(nome)+" criada. Agora adicione as disciplinas (até somar "+tp.aulas.length*5+" aulas) e use “Ajustar a grade atual” na aba Gerar para encaixar as aulas.</div>";
};
document.getElementById("tAdd").onclick=function(){
  var t=+document.getElementById("tSel").value, d=document.getElementById("tNovaDisc").value.trim().toUpperCase(), p=+document.getElementById("tNovoProf").value, n=+document.getElementById("tNovoN").value||1;
  if(!d) return; ST.matriz.push({t:t,disc:d,p:p,doc2:false,n:n}); logar("Turmas e aulas",ST.turmas[t].nome+": adicionada "+d+" ("+pnome(p)+", "+n+" aulas)",{t:t}); document.getElementById("tNovaDisc").value=""; save(); CACHE=null; renderTurmas();
};

// =====================================================================
// HORÁRIOS (tipos)
// =====================================================================
var HSEL=0;
function cfgDe(tp){ var ini=tp.aulas[0][0], dur=toMin(tp.aulas[0][1])-toMin(tp.aulas[0][0]); return {ini:ini,dur:dur,n:tp.aulas.length,ints:pausas(tp).map(function(pz){ return {apos:pz.apos+1,dur:pz.min}; })}; }
function gerarAulas(cfg){ var t=toMin(cfg.ini), H=[]; for(var a=0;a<cfg.n;a++){ H.push([hmP(t),hmP(t+cfg.dur)]); t+=cfg.dur; cfg.ints.forEach(function(x){ if(x.apos===a+1) t+=x.dur; }); } return H; }
var HMSG="";
function haConferirTodos(){ return ST.ha?haConferir(Object.keys(ST.ha).map(Number)):0; }
function avisoHAtirada(nh){ return nh?"Com a mudança, "+nh+" hora(s)-atividade ficaram em cima de uma aula e foram tiradas. Na aba Cadastro › Hora-atividade, escolha “Todos os professores” e clique em “Gerar HA” para completar.":""; }
function aplicarAulas(tp,novas,desc){
  var oldN=tp.aulas.length, gAnt=deep(ST.grid); tp.aulas=novas;
  if(novas.length!==oldN){ ST.turmas.forEach(function(T,t){ if(T.tipo===tp.id) resizeTurma(t,oldN,novas.length); }); ST.eq=null; reconciliarAusencias(gAnt); }
  _TM=null; var nh=haConferirTodos();
  logar("Horários",tp.nome+": "+desc+" → "+resumoTipo(tp)+(nh?". "+nh+" hora(s)-atividade em cima de aula foram tiradas":""));
  HMSG=avisoHAtirada(nh);
  save(); CACHE=null;
}
function usoTipo(id){ return ST.turmas.map(function(T,i){ return i; }).filter(function(i){ return !ST.turmas[i].excluida && ST.turmas[i].tipo===id; }); }
function renderHorarios(){
  if(HSEL>=ST.tipos.length) HSEL=0;
  document.getElementById("hLista").innerHTML=ST.tipos.map(function(tp,i){ var u=usoTipo(tp.id).length;
    return '<button data-i="'+i+'" class="'+(i===HSEL?"on":"")+'"><span style="flex:1">'+esc(tp.nome)+'<br><span class="small" style="font-weight:400">'+esc(resumoTipo(tp))+'</span></span><span class="small num">'+u+" turma"+(u===1?"":"s")+"</span></button>"; }).join("");
  document.querySelectorAll("#hLista button").forEach(function(b){ b.onclick=function(){ HSEL=+b.dataset.i; renderHorarios(); }; });
  var tp=ST.tipos[HSEL], cfg=cfgDe(tp), uso=usoTipo(tp.id);
  var h='<div id="hMsg"></div><div id="hMsg2"></div><div class="row end">'+
    '<label>Nome do horário<br><input type="text" id="hfNome" value="'+esc(tp.nome)+'" style="width:240px"></label>'+
    '<label>Período<br><select id="hfPer">'+PERIODOS.map(function(p){ return "<option"+(p===tp.periodo?" selected":"")+">"+p+"</option>"; }).join("")+"</select></label>"+
    '<label>Aulas por dia<br><input type="number" id="hfN" min="1" max="14" value="'+cfg.n+'" style="width:64px"></label>'+
    '<label>Início<br><input type="text" id="hfIni" value="'+cfg.ini+'" style="width:64px"></label>'+
    '<label>Duração da aula (min)<br><input type="number" id="hfDur" min="20" max="120" value="'+cfg.dur+'" style="width:64px"></label></div>';
  h+='<div class="row end" style="margin-top:10px"><span><span class="small">Intervalos:</span><br>'+(cfg.ints.length?cfg.ints.map(function(x,i){ return '<span class="chip">depois da '+x.apos+"ª aula · "+x.dur+' min <button class="btn sm" style="padding:0 6px" data-ri="'+i+'">×</button></span>'; }).join(""):'<span class="small">nenhum</span>')+"</span>"+
    '<label>Novo intervalo depois da<br><select id="hfApos">'+(function(){ var o=""; for(var a=1;a<cfg.n;a++) o+='<option value="'+a+'">'+a+"ª aula</option>"; return o; })()+"</select></label>"+
    '<label>Duração (min)<br><input type="number" id="hfIdur" min="5" max="240" value="15" style="width:64px"></label><button class="btn sm" id="hfAddInt">+ Intervalo</button></div>';
  h+='<p class="small" style="margin:10px 0 4px">Mudar aulas por dia, início, duração ou intervalos recalcula todas as aulas. Para acertar só uma aula, mude o início ou o fim direto na tabela. Intervalo de 45 minutos ou mais aparece como “Almoço”.</p>';
  h+='<table class="t" style="max-width:420px"><tr><th style="width:60px">Aula</th><th>Início</th><th>Fim</th></tr>';
  tp.aulas.forEach(function(x,a){ h+="<tr><td>"+(a+1)+'ª</td><td><input type="text" data-a="'+a+'" data-i="0" value="'+x[0]+'" style="width:64px" aria-label="Início da '+(a+1)+'ª aula"></td><td><input type="text" data-a="'+a+'" data-i="1" value="'+x[1]+'" style="width:64px" aria-label="Fim da '+(a+1)+'ª aula"></td></tr>';
    var pz=pausaApos(tp,a); if(pz) h+='<tr><td colspan="3"><div class="brkc">'+pz.nome+" "+pz.ini+"–"+pz.fim+" ("+pz.min+" min)</div></td></tr>"; });
  h+="</table>";
  h+='<p class="small" style="margin:12px 0 4px">Turmas que usam este horário:</p><div>'+(uso.length?uso.map(function(t){ return '<span class="chip">'+esc(ST.turmas[t].nome)+"</span>"; }).join(""):'<span class="small">nenhuma (escolha na aba Cadastro › Turmas e aulas)</span>')+"</div>";
  h+='<div class="row" style="margin-top:12px"><button class="btn sm" id="hfDel"'+(uso.length||ST.tipos.length<2?" disabled":"")+'>Excluir horário</button><span class="small">(só exclui quando nenhuma turma usa)</span>'+(tp.id.match(/^T[1-4]$/)&&BASE.horarios?'<button class="btn sm" id="hfOficial">Voltar ao horário oficial da escola</button>':"")+"</div>";
  document.getElementById("hEd").innerHTML=h;
  var msg=function(t,c){ document.getElementById("hMsg").innerHTML='<div class="msg '+(c||"warn")+'">'+t+"</div>"; };
  if(HMSG){ document.getElementById("hMsg2").innerHTML='<div class="msg warn">'+esc(HMSG)+"</div>"; HMSG=""; }
  document.getElementById("hfNome").onchange=function(e){ var v=e.target.value.trim(); if(!v){ e.target.value=tp.nome; return; } logar("Horários","Horário renomeado: "+tp.nome+" → "+v); tp.nome=v; save(); CACHE=null; renderHorarios(); };
  document.getElementById("hfPer").onchange=function(e){ logar("Horários",tp.nome+": período "+tp.periodo+" → "+e.target.value+(uso.length?" ("+uso.length+" turmas mudam junto)":"")); tp.periodo=e.target.value; save(); CACHE=null; _filled=false; renderHorarios(); };
  function recalc(desc){ var ini=document.getElementById("hfIni").value.trim(); if(!okHora(ini)){ msg("Início inválido: use o formato 07:00."); return; }
    var n=Math.max(1,Math.min(14,+document.getElementById("hfN").value||cfg.n)), dur=Math.max(20,Math.min(120,+document.getElementById("hfDur").value||cfg.dur));
    var c2={ini:normHora(ini),dur:dur,n:n,ints:cfg.ints.filter(function(x){ return x.apos<n; })};
    var novas=gerarAulas(c2); if(toMin(novas[novas.length-1][1])>=24*60){ msg("Com esses valores a última aula passa da meia-noite."); return; }
    var mudouN=n!==tp.aulas.length; aplicarAulas(tp,novas,desc); renderHorarios();
    if(mudouN&&uso.length) msg("As turmas que usam este horário agora têm "+n+" aulas por dia ("+n*5+" na semana). Confira as disciplinas na aba Cadastro › Turmas e aulas e use “Ajustar a grade atual” na aba Gerar."); }
  document.getElementById("hfN").onchange=function(){ recalc("aulas por dia"); };
  document.getElementById("hfIni").onchange=function(){ recalc("início"); };
  document.getElementById("hfDur").onchange=function(){ recalc("duração da aula"); };
  document.querySelectorAll("#hEd [data-ri]").forEach(function(b){ b.onclick=function(){ cfg.ints.splice(+b.dataset.ri,1); recalc("intervalo removido"); }; });
  document.getElementById("hfAddInt").onclick=function(){ var a=+document.getElementById("hfApos").value, d=+document.getElementById("hfIdur").value||15; if(!a) return; cfg.ints=cfg.ints.filter(function(x){ return x.apos!==a; }); cfg.ints.push({apos:a,dur:d}); recalc("novo intervalo depois da "+a+"ª aula"); };
  document.querySelectorAll("#hEd input[data-a]").forEach(function(el){ el.onchange=function(){ var v=el.value.trim(), a=+el.dataset.a, i=+el.dataset.i;
    if(!okHora(v)){ el.style.borderColor="var(--bad)"; msg("Horário inválido: use o formato 07:00."); return; }
    var novas=deep(tp.aulas); novas[a][i]=normHora(v);
    if(toMin(novas[a][1])<=toMin(novas[a][0])){ el.style.borderColor="var(--bad)"; msg("A "+(a+1)+"ª aula termina antes de começar."); return; }
    if(a>0&&toMin(novas[a][0])<toMin(novas[a-1][1])){ el.style.borderColor="var(--bad)"; msg("A "+(a+1)+"ª aula começa antes de a "+a+"ª terminar."); return; }
    if(a<novas.length-1&&toMin(novas[a][1])>toMin(novas[a+1][0])){ el.style.borderColor="var(--bad)"; msg("A "+(a+1)+"ª aula termina depois de a "+(a+2)+"ª começar."); return; }
    aplicarAulas(tp,novas,(a+1)+"ª aula: "+(i?"fim":"início")+" "+tp.aulas[a][i]+" → "+normHora(v)); renderHorarios(); }; });
  document.getElementById("hfDel").onclick=function(){ var b=this; if(b.dataset.arm!=="1"){ b.dataset.arm="1"; b.textContent="Confirmar exclusão?"; return; } logar("Horários","Horário excluído: "+tp.nome); ST.tipos.splice(HSEL,1); HSEL=0; save(); CACHE=null; renderHorarios(); };
  var of=document.getElementById("hfOficial"); if(of) of.onclick=function(){ var key={T1:"MED",T2:"FUND",T3:"MEDT",T4:"FUNDT"}[tp.id]; aplicarAulas(tp,BASE.horarios[key].map(function(x){ return [normHora(x[0]),normHora(x[1])]; }),"voltou ao horário oficial"); renderHorarios(); };
}
function novoTipoId(){ var m=0; ST.tipos.forEach(function(tp){ var n=+String(tp.id).replace(/\D/g,""); if(n>m) m=n; }); return "T"+(m+1); }
document.getElementById("hNovo").onclick=function(){ var id=novoTipoId(), tp={id:id,nome:"Tipo "+id.slice(1)+" — Novo",periodo:"Manhã",aulas:gerarAulas({ini:"07:00",dur:50,n:6,ints:[{apos:3,dur:15}]})}; ST.tipos.push(tp); HSEL=ST.tipos.length-1; logar("Horários","Novo horário criado: "+tp.nome); save(); renderHorarios(); };
document.getElementById("hDup").onclick=function(){ var o=ST.tipos[HSEL], id=novoTipoId(), tp={id:id,nome:o.nome.replace(/^Tipo \d+/,"Tipo "+id.slice(1))+" (cópia)",periodo:o.periodo,aulas:deep(o.aulas)}; ST.tipos.push(tp); HSEL=ST.tipos.length-1; logar("Horários","Horário duplicado: "+o.nome+" → "+tp.nome); save(); renderHorarios(); };

// =====================================================================
// REGRAS
// =====================================================================
function profOpts(todos){ return (todos?'<option value="-1">Todos os professores</option>':"")+profsOrdem().map(function(i){ return '<option value="'+i+'">'+esc(ST.profs[i].nome)+"</option>"; }).join(""); }
function discOpts(todas){ return (todas?'<option value="*">Todas as disciplinas</option>':"")+allDiscs().map(function(d){ return '<option value="'+esc(d)+'">'+esc(d)+"</option>"; }).join(""); }
function camposExtra(){
  var t=document.getElementById("xTipo").value, h="", maxN=Math.max.apply(null,ST.tipos.map(function(tp){ return tp.aulas.length; }));
  if(t==="seguidas"||t==="maxdia") h='<label>Professor<br><select id="xP">'+profOpts(true)+'</select></label><label>Máximo<br><input type="number" id="xN" min="1" max="12" value="'+(t==="seguidas"?4:8)+'"></label>';
  else if(t==="dialivre") h='<label>Professor<br><select id="xP">'+profOpts(true)+"</select></label>";
  else if(t==="posicao"){ var a=[]; for(var i=1;i<=maxN;i++) a.push(i); h='<label>Disciplina<br><select id="xD">'+discOpts(false)+'</select></label><label>Período<br><select id="xTu"><option value="-1">Todos</option>'+PERIODOS.map(function(p,i){ return '<option value="'+i+'">'+p+"</option>"; }).join("")+'</select></label><span class="small">Não pode na:<br>'+a.map(function(a){ return '<label class="small" style="margin-right:6px"><input type="checkbox" class="xA" value="'+a+'"'+(a===1?" checked":"")+"> "+a+"ª</label>"; }).join("")+"</span>"; }
  else if(t==="espalhar") h='<label>Disciplina<br><select id="xD">'+discOpts(true)+'</select></label><label>Mínimo de dias<br><input type="number" id="xDias" min="2" max="5" value="3"></label><label>Quando tiver a partir de<br><input type="number" id="xMinA" min="2" max="12" value="4"> aulas</label>';
  else if(t==="simult") h='<label>Disciplina<br><select id="xD">'+discOpts(false)+'</select></label><label>Máximo de turmas<br><input type="number" id="xN" min="1" max="10" value="2"></label>';
  document.getElementById("xCampos").innerHTML=h;
  if(t==="simult"){ var sel=document.getElementById("xD"); if([].some.call(sel.options,function(o){return o.value==="ED.FIS";})) sel.value="ED.FIS"; }
}
function descExtra(r){
  var quem=r.p==null||r.p<0?"todos os professores":pnome(r.p), dis=r.disc==="*"?"todas as disciplinas":r.disc;
  return {seguidas:"No máximo "+r.n+" aulas seguidas — "+quem, maxdia:"No máximo "+r.n+" aulas por dia — "+quem, dialivre:"Pelo menos 1 dia sem aula — "+quem,
    posicao:dis+" não pode na "+(r.aulas||[]).map(function(a){return a+"ª";}).join(", ")+" aula"+(r.turno>=0?" ("+PERIODOS[r.turno].toLowerCase()+")":""),
    espalhar:dis+": espalhar em pelo menos "+r.dias+" dias (quando tiver "+r.minAulas+" aulas ou mais)", simult:"No máximo "+r.n+" turmas com "+dis+" ao mesmo tempo"}[r.tipo]||r.tipo;
}
document.getElementById("xTipo").onchange=camposExtra;
document.getElementById("xAdd").onclick=function(){
  var t=document.getElementById("xTipo").value, r={tipo:t,forca:document.getElementById("xForca").value};
  var g=function(id){ var e=document.getElementById(id); return e?e.value:null; };
  if(g("xP")!=null) r.p=+g("xP"); if(g("xN")!=null) r.n=+g("xN"); if(g("xD")!=null) r.disc=g("xD");
  if(t==="posicao"){ r.turno=+g("xTu"); r.aulas=[].slice.call(document.querySelectorAll(".xA:checked")).map(function(x){return +x.value;}); if(!r.aulas.length) return; }
  if(t==="espalhar"){ r.dias=+g("xDias"); r.minAulas=+g("xMinA"); }
  ST.extras.push(r); logar("Regras","Nova regra ("+(r.forca==="rigida"?"rígida":"preferência")+"): "+descExtra(r)); save(); CACHE=null; renderRegras();
};
function renderRegras(){
  fillSelectsOnce();
  var R=ST.regras; document.getElementById("rMax").value=R.max; document.getElementById("rMin").value=R.minBreak;
  [["rTwo","two"],["rPar","par"],["rLate","late"],["rCross","cross"],["rGap","gap"],["rSep","sep"],["rInt","intervalo"]].forEach(function(x){ document.getElementById(x[0]).checked=!!R[x[1]]; });
  camposExtra();
  document.getElementById("xLista").innerHTML=ST.extras.length?"<tr><th>Regra</th><th>Força</th><th></th></tr>"+ST.extras.map(function(r,i){ return "<tr><td>"+esc(descExtra(r))+'</td><td><span class="tag '+(r.forca==="rigida"?"rigida":"preferencia")+'">'+(r.forca==="rigida"?"rígida":"preferência")+'</span></td><td class="right"><button class="btn sm" data-x="'+i+'">Remover</button></td></tr>'; }).join(""):"<tr><td class='small'>Nenhuma regra adicional ainda.</td></tr>";
  document.querySelectorAll("#xLista button").forEach(function(b){ b.onclick=function(){ logar("Regras","Regra removida: "+descExtra(ST.extras[+b.dataset.x])); ST.extras.splice(+b.dataset.x,1); save(); CACHE=null; renderRegras(); }; });
  renderPares();
}
document.getElementById("rMax").onchange=function(e){ ST.regras.max=+e.target.value||2; save(); CACHE=null; };
document.getElementById("rMin").onchange=function(e){ ST.regras.minBreak=+e.target.value||15; save(); CACHE=null; };
[["rTwo","two"],["rPar","par"],["rLate","late"],["rCross","cross"],["rGap","gap"],["rSep","sep"],["rInt","intervalo"]].forEach(function(x){ document.getElementById(x[0]).onchange=function(e){ logar("Regras",(e.target.checked?"Ligou":"Desligou")+" a regra: "+e.target.closest("label").textContent.trim().slice(0,90)); ST.regras[x[1]]=e.target.checked; save(); CACHE=null; }; });
