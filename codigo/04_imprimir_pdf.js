
// =====================================================================
// IMPRIMIR (aba Relatórios)
// =====================================================================
var PAPEIS={A4:[297,210],A3:[420,297],oficio:[356,216],carta:[279,216]};
var IMP_ITENS=[
  {g:"Grades de aula",itens:[["geral","Quadro geral de cada período (todo junto, como na tela)"],["turmasTodas","Todas as turmas — uma folha por turma"],["turmasEsc","Turmas escolhidas"],["profsTodos","Todos os professores — uma folha por professor"],["profsEsc","Professores escolhidos"]]},
  {g:"Hora-atividade e equipamentos",itens:[["profsHA","Professores com a hora-atividade e o local"],["haResumo","Resumo da hora-atividade (tabela SEED)"],["equip","Reserva de equipamentos (laboratório, biblioteca, Chromebooks, tablets, robótica)"]]},
  {g:"Aulas vagas",itens:[["vagasDia","Aulas vagas do dia (data de referência)"],["vagasSemana","Aulas vagas da semana (semana da data)"],["geralSemana","Quadro geral da semana com aulas vagas e substitutos"]]},
  {g:"Consulta e registro",itens:[["disciplinas","Disciplinas de cada turma (professor e aulas por semana)"],["pontos","Pontos de atenção da grade (conflitos, regras e preferências)"],["historico","Histórico de mudanças"],["disponib","Disponibilidade dos professores (não pode, evitar, formador)"],["externo","Professores que também trabalham em outras escolas: conflitos com a grade"]]}
];
function IMP(){ var o=ST.imp=ST.imp||{}; ["itens","turmas","profs","pers"].forEach(function(k){ if(!o[k]) o[k]={}; }); if(!o.papel) o.papel="auto"; if(!o.orient) o.orient="paisagem"; if(!o.cores) o.cores="cor"; if(!o.grade) o.grade="oficial"; if(!o.formato) o.formato="unico"; if(o.cab==null) o.cab=true; return o; }
function renderImp(){
  var I=IMP(), box=document.getElementById("impItens"); if(!box) return;
  if(!I.data) I.data=diaUtilOuProx(hoje());
  var pers=periodosEmUso();
  box.innerHTML=IMP_ITENS.map(function(gr){ return '<div class="impgrp"><h4>'+gr.g+"</h4>"+gr.itens.map(function(it){ var id=it[0], h='<label class="chk"><input type="checkbox" data-imp="'+id+'"'+(I.itens[id]?" checked":"")+"> "+it[1]+"</label>";
      if(id==="geral") h+='<div class="row" style="margin:0 0 4px 26px">'+pers.map(function(p){ return '<label class="small"><input type="checkbox" data-per="'+p+'"'+(I.pers[p]!==false?" checked":"")+"> "+p+"</label>"; }).join("")+"</div>";
      if(id==="turmasEsc") h+='<div class="chiplist" style="margin-left:26px;max-height:120px">'+ST.turmas.map(function(T,t){ return T.excluida?"":'<label><input type="checkbox" data-it="'+t+'"'+(I.turmas[t]?" checked":"")+"> "+esc(T.nome)+"</label>"; }).join("")+"</div>";
      if(id==="profsEsc") h+='<div class="chiplist" style="margin-left:26px;max-height:140px">'+profsOrdem().map(function(p){ return '<label><input type="checkbox" data-ip="'+p+'"'+(I.profs[p]?" checked":"")+"> "+esc(ST.profs[p].nome)+"</label>"; }).join("")+"</div>";
      if(id==="historico") h+='<div class="row" style="margin:0 0 4px 26px"><label class="small">De <input type="date" id="impHDe" value="'+(I.hDe||"")+'"></label><label class="small">até <input type="date" id="impHAte" value="'+(I.hAte||"")+'"></label><span class="small">(em branco = tudo)</span></div>';
      return h; }).join("")+"</div>"; }).join("");
  box.querySelectorAll("[data-imp]").forEach(function(c){ c.onchange=function(){ I.itens[c.dataset.imp]=c.checked; save(); }; });
  box.querySelectorAll("[data-per]").forEach(function(c){ c.onchange=function(){ I.pers[c.dataset.per]=c.checked; save(); }; });
  box.querySelectorAll("[data-it]").forEach(function(c){ c.onchange=function(){ I.turmas[c.dataset.it]=c.checked; if(c.checked) I.itens.turmasEsc=true; save(); renderImp(); }; });
  box.querySelectorAll("[data-ip]").forEach(function(c){ c.onchange=function(){ I.profs[c.dataset.ip]=c.checked; if(c.checked) I.itens.profsEsc=true; save(); renderImp(); }; });
  var hd=document.getElementById("impHDe"), ha=document.getElementById("impHAte"); if(hd){ hd.onchange=function(){ I.hDe=hd.value; save(); }; ha.onchange=function(){ I.hAte=ha.value; save(); }; }
  [["impPapel","papel"],["impOrient","orient"],["impCores","cores"],["impGrade","grade"],["impData","data"],["impFormato","formato"]].forEach(function(x){ var e=document.getElementById(x[0]); e.value=I[x[1]]; e.onchange=function(){ I[x[1]]=e.value; save(); }; });
  var cb=document.getElementById("impCab"); cb.checked=!!I.cab; cb.onchange=function(){ I.cab=cb.checked; save(); };
}
document.getElementById("impTodos").onclick=function(){ var I=IMP(); IMP_ITENS.forEach(function(g){ g.itens.forEach(function(it){ I.itens[it[0]]=true; }); }); save(); renderImp(); };
document.getElementById("impNenhum").onclick=function(){ var I=IMP(); I.itens={}; save(); renderImp(); };

// ---- cores e cabeçalho ----
function F(c){ if(!c||IMP().cores!=="cinza") return c; var l=0.299*c[0]+0.587*c[1]+0.114*c[2], v=Math.round(205+(l/255)*50); return [v,v,v]; }
function corProf(p){ return F(rgb(ST.profs[p].cor)); }
var COR_VAGA=[253,232,230], COR_SUB=[255,244,204];
function cabImp(D,titulo,sub,W){
  var I=IMP(), extra=[]; if(I.cab){ if(ST.aviso.data) extra.push("vale a partir de "+ST.aviso.data.split("-").reverse().join("/")); if(ST.aviso.rem) extra.push(ST.aviso.rem); }
  var x0=8+pdfLogo(D,8,4,15);
  D.setFont("helvetica","bold"); D.setFontSize(12.5); D.setTextColor(30,58,95); D.text(instNome(),x0,11);
  D.setFontSize(10.5); D.setTextColor(23,33,43); D.text(titulo,x0,17.5);
  D.setFont("helvetica","normal"); D.setFontSize(8); D.setTextColor(90,104,120); D.text([sub||"Emitido em "+fmtData(agora())].concat(extra).join(" · "),x0,22.5);
  return 26;
}
// ---- páginas ----
function tamPapel(){ var I=IMP(); if(I.papel==="auto") return null; var p=PAPEIS[I.papel]; return I.orient==="retrato"?[p[1],p[0]]:[p[0],p[1]]; }
function papelPadrao(){ return tamPapel()||(IMP().orient==="retrato"?[210,297]:[297,210]); }
function novoDoc(){ var P=papelPadrao(), J=window.jspdf.jsPDF; var d=new J({unit:"mm",format:P,orientation:P[0]>P[1]?"landscape":"portrait"}); d.__vazia=true; return d; }
function addPag(D,W,H){ D.addPage([W,H],W>H?"landscape":"portrait"); if(D.__vazia){ D.deletePage(1); D.__vazia=false; } }
var TENT=(function(){ var t=[]; [12,11,10,9,8,7.5,7,6.5,6,5.5,5.2].forEach(function(f){ t.push({fs:f,duas:true}); }); [6.5,6,5.5,5,4.6,4.2,3.8].forEach(function(f){ t.push({fs:f,duas:false}); }); return t; })();
// uma folha só, com o conteúdo do maior tamanho que couber (papel fixo) ou folha do tamanho do conteúdo (automático)
function folha(D,desenha,wAuto,cfgAuto){
  var P=tamPapel(), J=window.jspdf.jsPDF;
  if(P){ var esc0=TENT[TENT.length-1];
    for(var i=0;i<TENT.length;i++){ var tmp=new J({unit:"mm",format:P,orientation:P[0]>P[1]?"landscape":"portrait"}); var y=desenha(tmp,TENT[i],P[0],P[1]); if(tmp.getNumberOfPages()===1 && y<=P[1]-5){ esc0=TENT[i]; break; } }
    addPag(D,P[0],P[1]); desenha(D,esc0,P[0],P[1]); return; }
  var W=Math.max(wAuto||297,180), cfg=cfgAuto||{fs:7.5,duas:true};
  var tmp2=new J({unit:"mm",format:[W,3000],orientation:"portrait"}); var yy=desenha(tmp2,cfg,W,3000);
  var H=Math.max(Math.round(yy+8),Math.round(W*0.45)); addPag(D,W,H); desenha(D,cfg,W,H);
}
// lista que pode continuar em várias folhas
function fluxo(D,titulo,sub,head,body,opts){
  opts=opts||{}; var P=papelPadrao(); addPag(D,P[0],P[1]); var y=cabImp(D,titulo,sub,P[0]);
  D.autoTable({startY:y+2, head:[head], body:body.length?body:[[{content:opts.vazio||"Nada para mostrar.",colSpan:head.length}]], theme:"grid", margin:{left:8,right:8,top:10,bottom:8},
    styles:{fontSize:opts.fs||8.5,cellPadding:1.2,textColor:[23,33,43],lineColor:[200,208,216],lineWidth:0.2,valign:"middle"}, headStyles:{fillColor:[30,58,95],textColor:255}, alternateRowStyles:{fillColor:[242,245,249]},
    columnStyles:opts.col||{}, didParseCell:function(d){ if(d.section==="body"&&opts.fill){ var f=opts.fill(d.row.index,d.column.index); if(f) d.cell.styles.fillColor=F(f); } }});
}
function diaLetras(D,dc){ var tx=String(dc.cell.raw&&dc.cell.raw.content||""), nn=tx.length, passo=(dc.cell.height-3)/nn, fsMax=Math.min(passo/0.3528*0.95,(dc.cell.width-1.5)/0.3528*1.1,16), fs=Math.max(fsMax*escalaDia(),Math.min(fsMax,7.5)); passo=Math.max(passo,fs*0.3528*1.02);
  D.setFont("helvetica","bold"); D.setFontSize(fs); D.setTextColor(0,0,0); var y0=dc.cell.y+1.5+passo*0.5+fs*0.3528*0.35;
  for(var ci=0;ci<nn;ci++) D.text(tx.charAt(ci),dc.cell.x+dc.cell.width/2,y0+ci*passo,{align:"center"}); D.setFont("helvetica","normal"); }

// ---- quadro geral todo junto (como na tela) ----
function impGeral(D,per,datas,wk,naPagina){
  var G=gruposPer(per); if(!G.length) return;
  var nl=Math.max.apply(null,G.map(function(g){ return g.seq.length; }));
  var titulo="Horário geral — "+per+(datas?" — semana de "+fmtDM(datas[0])+" a "+fmtDMA(datas[4]):"");
  var sub=datas?"Emitido em "+fmtData(agora())+" · com aulas vagas e substitutos da semana (a grade oficial não muda)":null;
  var inicioGrupo={}, col=1; G.forEach(function(g,gi){ if(gi) inicioGrupo[col]=1; col+=1+g.ts.length; });
  var nT=G.reduce(function(s,g){ return s+g.ts.length; },0), wAuto=16+9+G.length*22+nT*22;
  function desenha(D2,cfg,W,H){
    var y=cabImp(D2,titulo,sub,W), head1=[{content:"Dia",rowSpan:2}], head2=[], body=[], ini={};
    G.forEach(function(g){ head1.push({content:g.nome,colSpan:1+g.ts.length}); head2.push("Horário"); g.ts.forEach(function(t){ head2.push(ST.turmas[t].nome); }); });
    for(var d=0;d<5;d++) for(var r=0;r<nl;r++){ if(r===0&&d>0) ini[body.length]=1;
      var row=r===0?[{content:DIAS_F[d],rowSpan:nl,styles:{fillColor:[227,227,227],textColor:[227,227,227],fontStyle:"bold"}}]:[];
      G.forEach(function(g){ var it=g.seq[r], n=g.tp.aulas.length;
        if(!it){ row.push(""); g.ts.forEach(function(){ row.push(""); }); return; }
        if(it.b){ row.push({content:it.b.nome+"\n"+it.b.ini+"–"+it.b.fim,styles:{fillColor:[238,242,246],fontSize:Math.max(3.5,cfg.fs-1)}}); row.push({content:it.b.nome+" "+it.b.ini+"–"+it.b.fim,colSpan:g.ts.length,styles:{fillColor:[231,236,241],textColor:[90,104,120],fontStyle:"italic"}}); return; }
        row.push({content:(it.a+1)+"ª\n"+g.tp.aulas[it.a][0]+"–"+g.tp.aulas[it.a][1],styles:{fillColor:[238,242,246],fontStyle:"bold"}});
        g.ts.forEach(function(t){ var s=d*n+it.a, k=ST.grid[t][s], vi=wk?wk.cell[datas[d]+"|"+t+"|"+s]:null;
          if(vi){ row.push({content:vi.sub!=null?vi.disc+(cfg.duas?"\n":" · ")+pnome(vi.sub)+" (subst.)":"AULA VAGA"+(cfg.duas?"\n":" · ")+vi.disc,styles:{fillColor:F(vi.sub!=null?COR_SUB:COR_VAGA),fontStyle:"bold"}}); return; }
          if(k){ var x=parseK(k); row.push({content:textoAula(k,cfg.duas,t),styles:{fillColor:corProf(x.p)}}); } else row.push(""); }); });
      body.push(row); }
    D2.autoTable({startY:y+1, head:[head1,head2], body:body, theme:"grid", margin:{left:8,right:8,top:8,bottom:5}, rowPageBreak:"avoid",
      styles:{fontSize:cfg.fs,cellPadding:{top:0.45,bottom:0.45,left:0.4,right:0.4},halign:"center",valign:"middle",lineColor:[200,208,216],lineWidth:0.15,textColor:[23,33,43],overflow:"linebreak"},
      headStyles:{fillColor:[30,58,95],textColor:255,fontSize:Math.min(9,cfg.fs+1)}, columnStyles:{0:{cellWidth:9}},
      didDrawCell:function(dc){
        if(dc.section==="body" && dc.column.index===0 && dc.cell.rowSpan>1) diaLetras(D2,dc);
        if(dc.section==="body" && ini[dc.row.index]){ D2.setDrawColor(0,0,0); D2.setLineWidth(0.9); D2.line(dc.cell.x,dc.cell.y,dc.cell.x+dc.cell.width,dc.cell.y); }
        if(inicioGrupo[dc.column.index]){ D2.setDrawColor(30,58,95); D2.setLineWidth(0.9); D2.line(dc.cell.x,dc.cell.y,dc.cell.x,dc.cell.y+dc.cell.height); }
        D2.setLineWidth(0.15); D2.setDrawColor(200,208,216); }});
    return D2.lastAutoTable.finalY; }
  if(naPagina){ // desenha na folha atual (A4 deitado), tudo numa página só
    var J=window.jspdf.jsPDF, esc0=TENT[TENT.length-1];
    for(var i=0;i<TENT.length;i++){ var tmp=new J({unit:"mm",format:[297,210],orientation:"landscape"}); var y=desenha(tmp,TENT[i],297,210); if(tmp.getNumberOfPages()===1 && y<=205){ esc0=TENT[i]; break; } }
    desenha(D,esc0,297,210); return; }
  folha(D,desenha,wAuto,{fs:7.5,duas:true});
}
// ---- tabela da semana (turma, professor, disponibilidade) ----
function impSemana(D,titulo,sub,blocos){
  function desenha(D2,cfg,W,H){ var y=cabImp(D2,titulo,sub,W)+1;
    blocos.forEach(function(b){ if(b.nome){ D2.setFontSize(Math.min(10,cfg.fs+2)); D2.setFont("helvetica","bold"); D2.setTextColor(30,58,95); D2.text(b.nome,8,y+3); D2.setFont("helvetica","normal"); y+=4.5; }
      var L=b.linhas(cfg.duas);
      D2.autoTable({startY:y, head:[["Aula"].concat(DIAS)], body:L.map(function(r){ return r.cells; }), theme:"grid", margin:{left:8,right:8,top:8,bottom:5}, rowPageBreak:"avoid",
        styles:{fontSize:Math.min(13,cfg.fs+1.5),cellPadding:{top:cfg.duas?1:0.6,bottom:cfg.duas?1:0.6,left:1,right:1},halign:"center",valign:"middle",lineColor:[200,208,216],lineWidth:0.2,textColor:[23,33,43]},
        headStyles:{fillColor:[30,58,95],textColor:255,fontStyle:"bold"}, columnStyles:{0:{cellWidth:Math.max(24,cfg.fs*3),fontStyle:"bold",fillColor:[238,242,246]}},
        didParseCell:function(d){ if(d.section!=="body") return; var r=L[d.row.index], f=r.fills&&r.fills[d.column.index]; if(f) d.cell.styles.fillColor=F(f); if(r.bold&&r.bold[d.column.index]) d.cell.styles.fontStyle="bold"; if(r.brk){ d.cell.styles.fillColor=[231,236,241]; d.cell.styles.textColor=[90,104,120]; d.cell.styles.fontStyle="italic"; d.cell.styles.cellPadding=0.4; } }});
      y=D2.lastAutoTable.finalY+5; });
    return y-5; }
  folha(D,desenha,297,{fs:9,duas:true});
}
function impTurma(D,t,datas,wk){ impSemana(D,"Turma "+ST.turmas[t].nome+" — "+perDe(t)+" ("+tipoDe(t).nome+")",datas?"Semana de "+fmtDM(datas[0])+" a "+fmtDMA(datas[4])+" · com aulas vagas e substitutos · emitido em "+fmtData(agora()):null,[{linhas:function(duas){ return linhasTurmaPdf(t,duas,datas,wk); }}]); }
function impProf(D,p,comHA,AP){
  var pr=ST.profs[p], secs=secoesDoProf(p,comHA,AP); if(!secs.length) return false;
  impSemana(D,(comHA?"Horário e hora-atividade de ":"Horário de ")+pr.nome+(pr.completo&&pr.completo.indexOf("?")<0&&pr.completo!==pr.nome?" — "+pr.completo:""),null,
    secs.map(function(sec){ return {nome:sec.nome,linhas:function(){ return linhasPdfProf(p,sec,comHA,AP); }}; }));
  return true;
}
function impDisponib(D,p){
  var tm=TM(), TX=["","evitar","NÃO PODE","FORMADOR"], CF=[null,[255,242,204],[220,224,228],[234,223,246]], pr=ST.profs[p];
  impSemana(D,"Disponibilidade de "+pr.nome,"Marcações da aba Cadastro › Professores (e horários guardados na aba Relatórios › Importar/Exportar) · emitido em "+fmtData(agora()),tm.SEC.map(function(sec){ return {nome:sec.nome,linhas:function(){
    return linhasSecao(sec).map(function(ln){ if(ln.brk!=null) return {brk:true,cells:[ln.brkLabel,{content:ln.brkPlain,colSpan:5}]};
      var cl=tm.CL[ln.ci], cells=[ln.txt], fills=[null]; for(var d=0;d<5;d++){ var v=blkVal(p,d,cl.ini,cl.fim), ei=v<2?extInfo(p,d,cl.ini,cl.fim):[]; if(ei.length){ cells.push("OUTRA ESCOLA\n"+ei[0].escola); fills.push([226,231,243]); continue; } cells.push(TX[v]); fills.push(CF[v]); } return {cells:cells,fills:fills}; }); }}; }));
}
function impEquip(D){
  if(!ST.eq){ fluxo(D,"Reserva de equipamentos",null,["Aviso"],[["O horário dos equipamentos ainda não foi gerado. Use a aba Cadastro › Equipamentos."]]); return; }
  var tm=TM(), by={};
  ST.eq.aloc.forEach(function(x){ var n=nA(x.t), d=(x.s/n)|0, ci=tm.clOfK[tm.tsOf[x.t][x.s%n]], rec=x.rec.replace(" (na biblioteca)",""); (by[d+"|"+ci+"|"+rec]=by[d+"|"+ci+"|"+rec]||[]).push(x); });
  tm.SEC.forEach(function(sec){
    var cls=sec.cls.filter(function(ci){ return tm.CL[ci].ks.some(function(k){ return tm.usedK.indexOf(k)>=0; }); }); if(!cls.length) return;
    impSemana(D,"Reserva de equipamentos — "+sec.nome,null,[{linhas:function(){ var L=[];
      cls.forEach(function(ci){ RECS.forEach(function(rec){ var tem=false, cells=[tm.CL[ci].labelTxt+"\n"+rec], fills=[null];
        for(var d=0;d<5;d++){ var A=by[d+"|"+ci+"|"+rec]||[]; if(A.length) tem=true; cells.push(A.map(function(x){ return ST.turmas[x.t].nome+" · "+pnome(x.p)+(x.qtd?" ("+x.qtd+")":"")+(x.rec.indexOf("biblioteca")>=0?" [bibl.]":""); }).join("\n")); fills.push(A.length===1?rgb(ST.profs[A[0].p].cor):null); }
        if(tem) L.push({cells:cells,fills:fills}); }); });
      return L.length?L:[{cells:["—","","","","",""]}]; }}]);
  });
}
function impVagas(D,datas,titulo){
  var body=[], fills=[];
  datas.forEach(function(date){ vagasDoDia(date).forEach(function(x){ body.push([DIAS_C[wdIdx(date)]+" "+fmtDM(date),hmP(x.ini)+"–"+hmP(x.fim),ST.turmas[x.t].nome,x.disc,pnome(x.p),x.sub!=null?"Substituto: "+pnome(x.sub):"AULA VAGA",x.aus.motivo||""]); fills.push(x.sub!=null?COR_SUB:COR_VAGA); }); });
  fluxo(D,titulo,"Emitido em "+fmtData(agora())+" · as aulas vagas não mudam a grade oficial",["Dia","Horário","Turma","Disciplina","Professor ausente","Situação","Motivo"],body,{fs:10,vazio:"Nenhuma aula vaga nesse período.",fill:function(r,c){ return c===5?fills[r]:null; }});
}
// ---- monta e entrega ----
function gerarImpressao(){
  var I=IMP(), it=I.itens, msg=document.getElementById("impMsg"), partes=[];
  var date=I.data||diaUtilOuProx(hoje()), datasSem=semanaDatas(segundaDe(date)), usaSem=I.grade==="semana", wkSem=vagaMapa(datasSem);
  var dG=usaSem?datasSem:null, wG=usaSem?wkSem:null, AP=idxAulas(), turmasOk=ST.turmas.map(function(T,t){ return t; }).filter(function(t){ return !ST.turmas[t].excluida; });
  var ordT=turmasOk.slice().sort(function(a,b){ return ST.turmas[a].nome.localeCompare(ST.turmas[b].nome,"pt",{numeric:true}); }), cnt=contaAulas();
  var turmasDoPer=function(per){ return turmasOk.filter(function(t){ return perDe(t)===per; }); };
  if(it.geral) periodosEmUso().forEach(function(per){ if(I.pers[per]!==false) partes.push({nome:"horario-geral-"+per,ps:profsDasTurmas(turmasDoPer(per)),f:function(D){ impGeral(D,per,dG,wG); }}); });
  if(it.turmasTodas) partes.push({nome:"turmas",ps:profsDasTurmas(ordT),f:function(D){ ordT.forEach(function(t){ impTurma(D,t,dG,wG); }); }});
  if(it.turmasEsc){ var te=ordT.filter(function(t){ return I.turmas[t]; }); if(te.length) partes.push({nome:"turmas-escolhidas",ps:profsDasTurmas(te),f:function(D){ te.forEach(function(t){ impTurma(D,t,dG,wG); }); }}); }
  if(it.profsTodos) partes.push({nome:"professores",ps:profsOrdem().filter(function(p){ return cnt[p]; }),f:function(D){ profsOrdem().forEach(function(p){ if(cnt[p]) impProf(D,p,false,AP); }); }});
  if(it.profsEsc){ var pe=profsOrdem().filter(function(p){ return I.profs[p]; }); if(pe.length) partes.push({nome:"professores-escolhidos",ps:pe,f:function(D){ pe.forEach(function(p){ impProf(D,p,false,AP); }); }}); }
  if(it.profsHA) partes.push({nome:"professores-com-HA",ps:profsOrdem().filter(function(p){ return cnt[p]||(ST.ha&&ST.ha[p]&&ST.ha[p].slots.length); }),f:function(D){ if(!ST.ha){ fluxo(D,"Hora-atividade",null,["Aviso"],[["A hora-atividade ainda não foi gerada. Use a aba Cadastro › Hora-atividade."]]); return; } profsOrdem().forEach(function(p){ if(cnt[p]||(ST.ha[p]&&ST.ha[p].slots.length)) impProf(D,p,true,AP); }); }});
  if(it.haResumo) partes.push({nome:"resumo-HA",f:function(D){ var body=profsOrdem().filter(function(p){ return cnt[p]>0; }).map(function(p){ var need=haNeed(p,cnt).need, got=ST.ha&&ST.ha[p]?ST.ha[p].slots.length:null; return [ST.profs[p].nome,cnt[p],need,got==null?"—":got,got==null?"não gerada":(got>=need?"ok":"faltou "+(need-got))]; });
    fluxo(D,"Resumo da hora-atividade (tabela SEED, HA 15/5)",null,["Professor","Aulas","HA pela tabela","HA colocadas","Situação"],body,{fs:9.5}); }});
  if(it.equip) partes.push({nome:"equipamentos",f:impEquip});
  if(it.vagasDia) partes.push({nome:"aulas-vagas-"+date,f:function(D){ impVagas(D,[date],"Aulas vagas — "+nomeDia(date)+", "+fmtDMA(date)); }});
  if(it.vagasSemana) partes.push({nome:"aulas-vagas-semana-"+datasSem[0],f:function(D){ impVagas(D,datasSem,"Aulas vagas — semana de "+fmtDM(datasSem[0])+" a "+fmtDMA(datasSem[4])); }});
  if(it.geralSemana) periodosEmUso().forEach(function(per){ partes.push({nome:"geral-semana-"+per,ps:profsDasTurmas(turmasDoPer(per)),f:function(D){ impGeral(D,per,datasSem,wkSem); }}); });
  if(it.disciplinas) partes.push({nome:"disciplinas",f:function(D){ var body=[]; ordT.forEach(function(t){ ST.matriz.filter(function(r){ return r.t===t; }).sort(function(a,b){ return a.disc.localeCompare(b.disc); }).forEach(function(r,i){ body.push([i?"":ST.turmas[t].nome,r.disc+(ST.siglas[r.disc]?" — "+ST.siglas[r.disc]:""),pnome(r.p)+(r.doc2?" (2ª docência)":""),r.n]); }); });
    fluxo(D,"Disciplinas de cada turma",null,["Turma","Disciplina","Professor","Aulas/semana"],body,{fs:9,col:{0:{fontStyle:"bold"},3:{halign:"center"}}}); }});
  if(it.pontos) partes.push({nome:"pontos-de-atencao",f:function(D){ var pr=analisar().pr; fluxo(D,"Pontos de atenção da grade — "+ST.gridNome,null,["Tipo","O que acontece"],pr.map(function(x){ return [x.tipo.toUpperCase(),x.txt]; }),{fs:9,vazio:"Nenhum ponto de atenção.",col:{0:{cellWidth:28,fontStyle:"bold"}},fill:function(r,c){ return c===0?(pr[r].tipo==="rígida"?[253,232,230]:pr[r].tipo==="regra"?[252,235,221]:[255,242,204]):null; }}); }});
  if(it.historico) partes.push({nome:"historico",f:function(D){ var L=ST.hist.filter(function(h){ var d=ymd(new Date(h.ts)); return (!I.hDe||d>=I.hDe)&&(!I.hAte||d<=I.hAte); });
    fluxo(D,"Histórico de mudanças"+(I.hDe||I.hAte?" — "+(I.hDe?fmtDMA(I.hDe):"início")+" a "+(I.hAte?fmtDMA(I.hAte):"hoje"):""),null,["Data e hora","Tipo","O que mudou","Solicitado por","Motivo"],L.map(function(h){ return [fmtData(h.ts),h.tipo,h.txt,h.quem||"—",h.motivo||"—"]; }),{fs:8,col:{0:{cellWidth:26},1:{cellWidth:26}}}); }});
  if(it.disponib) partes.push({nome:"disponibilidade",f:function(D){ var n=0; profsOrdem().forEach(function(p){ var ind=ST.profs[p].ind||{}; if(Object.keys(ind).some(function(k){ return ind[k]; })||temExt(p)){ impDisponib(D,p); n++; } }); if(!n) fluxo(D,"Disponibilidade dos professores",null,["Aviso"],[["Nenhum professor tem horário marcado como evitar, não pode ou formador."]]); }});
  if(it.externo) partes.push({nome:"outras-escolas",f:function(D){ var E=exDef(), L=exConflitos(exItensGuardados(),+E.margem||0), sit={aula:"EM DOIS LUGARES",HA:"HA daqui em cima da aula de lá"};
    fluxo(D,"Professores em outras escolas — conflitos com a grade",E.escolas.length?"Escolas guardadas: "+E.escolas.map(function(e){ return e.nome+(e.cenario?" ("+e.cenario+")":""); }).join("; ")+" · emitido em "+fmtData(agora()):"Nenhum horário de outra escola guardado (aba Relatórios › Importar/Exportar)",["Professor","Dia","Aqui","Na outra escola","Situação"],
      L.map(function(c){ return [ST.profs[c.p].nome,DIAS[c.d],c.aqui,c.escola+" — "+c.la,c.tipo==="tempo"?"Só "+c.gap+" min para trocar de escola":sit[c.tipo]]; }),{fs:9,vazio:E.escolas.length?"Nenhum conflito: nenhum professor fica em dois lugares.":"Nada para mostrar.",fill:function(r,c){ return c===4?(L[r].tipo==="tempo"?[255,242,204]:[253,232,230]):null; }}); }});
  if(!partes.length){ msg.innerHTML='<div class="msg warn">Marque pelo menos um item para imprimir.</div>'; return; }
  msg.innerHTML='<div class="msg info">Gerando o PDF…</div>';
  setTimeout(function(){
    try{
      if(I.formato==="cada"){ var i=0; (function prox(){ if(i>=partes.length){ msg.innerHTML='<div class="msg ok">'+partes.length+' arquivo(s) PDF baixado(s). Se o navegador perguntar, permita baixar vários arquivos.</div>'; return; }
          var pt=partes[i++], D=novoDoc(); pt.f(D); if(D.__vazia){ setTimeout(prox,50); return; } marcarPdf(D,pt.ps); D.save(pt.nome.replace(/[^A-Za-z0-9ãáâéêíóôõúçÃÁÂÉÊÍÓÔÕÚÇ_-]+/g,"_")+".pdf"); setTimeout(prox,400); })(); }
      else { var D=novoDoc(), todosPs=[]; partes.forEach(function(pt){ pt.f(D); todosPs=todosPs.concat(pt.ps||[]); }); marcarPdf(D,uniq(todosPs));
        if(D.__vazia){ msg.innerHTML='<div class="msg warn">Não havia nada para imprimir nos itens marcados.</div>'; return; }
        var n=D.getNumberOfPages(), arq="impressao-horario-"+instSlug()+"-"+hoje()+".pdf";
        D.autoPrint(); var w=null; try{ w=window.open(D.output("bloburl"),"_blank"); }catch(e){ w=null; }
        if(!w){ D.save(arq); msg.innerHTML='<div class="msg ok">PDF com '+n+' folha(s) baixado: “'+esc(arq)+'”. Abra e mande imprimir'+(IMP().papel==="auto"?', escolhendo o papel e marcando “Ajustar à página”':"")+".</div>"; }
        else msg.innerHTML='<div class="msg ok">PDF com '+n+' folha(s) aberto em outra aba, pronto para imprimir'+(IMP().papel==="auto"?'. Escolha o papel na janela de impressão e marque “Ajustar à página”':"")+".</div>"; }
      logar("Impressão","PDF gerado para imprimir: "+partes.map(function(p){ return p.nome; }).join(", "));
    }catch(err){ msg.innerHTML='<div class="msg bad">Não foi possível gerar o PDF: '+esc(err&&err.message||err)+"</div>"; }
  },30);
}
document.getElementById("impGerar").onclick=gerarImpressao;
