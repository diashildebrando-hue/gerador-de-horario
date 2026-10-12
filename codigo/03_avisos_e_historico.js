
// =====================================================================
// AVISOS
// =====================================================================
var MSG_PADRAO="Olá, {nome}! Tudo bem?\n\nO seu horário no {escola} foi atualizado e vale a partir de {data}.\n\n{mudancas}\n\nMotivo: {motivo}\n\nO seu horário atualizado segue em PDF. Qualquer dúvida, estamos à disposição.\n\nObrigado pela parceria!\n{assinatura}";
function mudancasProf(p){
  var base=(ST.aviso.baseP||{})[p]||[], agora_=basePorProf(ST.grid)[p]||[], sai=[], entra=[], cb={}, ca={};
  base.forEach(function(x){ cb[x]=(cb[x]||0)+1; }); agora_.forEach(function(x){ ca[x]=(ca[x]||0)+1; });
  Object.keys(cb).forEach(function(x){ for(var i=0;i<cb[x]-(ca[x]||0);i++) sai.push(x); });
  Object.keys(ca).forEach(function(x){ for(var i=0;i<ca[x]-(cb[x]||0);i++) entra.push(x); });
  function fmt(x){ var q=x.split("|"), t=+q[0]; return (ST.turmas[t]?ST.turmas[t].nome:"turma removida")+" — "+DIAS[+q[1]]+", "+q[2].replace("-","–")+" — "+q[3]; }
  function ord(x,y){ var a=x.split("|"), b=y.split("|"); return (+a[1])-(+b[1]) || (a[2]<b[2]?-1:a[2]>b[2]?1:0); }
  sai.sort(ord); entra.sort(ord);
  return {n:sai.length+entra.length, sai:sai.map(fmt), entra:entra.map(fmt)};
}
function afetados(){ var out=[]; ST.profs.forEach(function(p,i){ if(p.nome==="(excluído)") return; if(mudancasProf(i).n) out.push(i); }); return out; }
function renderBanner(){
  var n=afetados().length, el=document.getElementById("avisoBanner");
  el.innerHTML=n?'<div class="avb">📣 A grade mudou desde o último aviso: <b>'+n+' professor(es) afetado(s)</b>. <button class="btn sm pri" id="bnAvisar">Avisar agora</button></div>':"";
  if(n) document.getElementById("bnAvisar").onclick=function(){ document.querySelector('input[name="avQuem"][value="af"]').checked=true; show("avisos"); };
}
function profsAtivos(){ var c=contaAulas(); return profsOrdem().filter(function(i){ return c[i]||ST.profs[i].email||ST.profs[i].cel; }); }
var AV_ESC={};
function destinatarios(){
  var modo=document.querySelector('input[name="avQuem"]:checked').value, af=afetados();
  if(modo==="af") return af; if(modo==="todos") return profsAtivos();
  return profsAtivos().filter(function(i){ return AV_ESC[i]; });
}
function textoAviso(p){
  var A=ST.aviso, m=mudancasProf(p), mud;
  if(!m.n) mud="Não houve mudança nas suas aulas; segue o horário para conferência.";
  else { mud="O que mudou nas suas aulas:"; if(m.sai.length) mud+="\n\nSaiu:\n"+m.sai.map(function(x){return "• "+x;}).join("\n"); if(m.entra.length) mud+="\n\nEntrou:\n"+m.entra.map(function(x){return "• "+x;}).join("\n"); }
  var data=A.data?A.data.split("-").reverse().join("/"):new Date().toLocaleDateString("pt-BR");
  var pr=ST.profs[p], nome=(pr.completo&&pr.completo.indexOf("?")<0?pr.completo.split(" ")[0]:pr.nome); nome=nome.charAt(0)+nome.slice(1).toLowerCase();
  return (A.msg||MSG_PADRAO).replace(/\{nome\}/g,nome).replace(/\{mudancas\}/g,mud).replace(/\{motivo\}/g,ST.ctx.motivo||"organização do horário").replace(/\{data\}/g,data).replace(/\{assinatura\}/g,A.rem||"").replace(/\{escola\}/g,instCurto());
}
function renderAvisos(){
  var A=ST.aviso, af=afetados(), afs={}; af.forEach(function(i){ afs[i]=1; });
  document.getElementById("avNaf").textContent="("+af.length+")";
  document.getElementById("avBaseTxt").textContent=A.baseTs?"desde "+fmtData(A.baseTs):"";
  var modo=document.querySelector('input[name="avQuem"]:checked').value;
  document.getElementById("avLista").innerHTML=profsAtivos().map(function(i){ var p=ST.profs[i];
    return '<label class="'+(afs[i]?"af":"")+'"><input type="checkbox" data-p="'+i+'"'+(modo==="esc"?(AV_ESC[i]?" checked":""):(modo==="todos"||afs[i]?" checked disabled":" disabled"))+'><span class="dot" style="background:'+p.cor+'"></span>'+esc(p.nome)+(p.email?" ✉":"")+(p.cel?" 📱":"")+"</label>"; }).join("");
  document.querySelectorAll("#avLista input").forEach(function(c){ c.onchange=function(){ AV_ESC[+c.dataset.p]=c.checked; renderEnvio(); }; });
  [["anIndiv","indiv"],["anHA","ha"],["anTurmas","turmas"],["anEq","eq"]].forEach(function(x){ var e=document.getElementById(x[0]); e.checked=!!A.anexos[x[1]]; e.onchange=function(){ A.anexos[x[1]]=e.checked; save(); }; });
  document.getElementById("anGerais").innerHTML=periodosEmUso().map(function(per){ return '<label><input type="checkbox" data-ger="'+per+'"'+(A.anexos.gerais[per]?" checked":"")+"> Horário geral — "+per.toLowerCase()+"</label>"; }).join("");
  document.querySelectorAll("#anGerais [data-ger]").forEach(function(e){ e.onchange=function(){ A.anexos.gerais[e.dataset.ger]=e.checked; save(); }; });
  document.getElementById("avData").value=A.data||""; document.getElementById("avRem").value=A.rem||""; document.getElementById("avAssunto").value=A.assunto||ASSUNTO_PADRAO;
  document.getElementById("avMsg").value=A.msg||MSG_PADRAO;
  renderEnvio();
}
function geraisMarcados(){ var g=ST.aviso.anexos.gerais||{}; return periodosEmUso().filter(function(p){ return g[p]; }); }
document.querySelectorAll('input[name="avQuem"]').forEach(function(r){ r.onchange=renderAvisos; });
document.getElementById("avData").onchange=function(e){ ST.aviso.data=e.target.value; ST.aviso.edits={}; save(); renderEnvio(); };
document.getElementById("avAssunto").onchange=function(e){ ST.aviso.assunto=e.target.value.trim()||null; save(); };
document.getElementById("avRem").onchange=function(e){ ST.aviso.rem=e.target.value; ST.aviso.edits={}; save(); renderEnvio(); };
document.getElementById("avMsg").onchange=function(e){ ST.aviso.msg=e.target.value; save(); };
document.getElementById("avAplicar").onclick=function(){ ST.aviso.msg=document.getElementById("avMsg").value; ST.aviso.edits={}; save(); renderEnvio(); };
document.getElementById("avPadrao").onclick=function(){ ST.aviso.msg=null; ST.aviso.edits={}; save(); renderAvisos(); };
var ASSUNTO_PADRAO="Horário atualizado — {nome} — {escola} (vale a partir de {data})";
function assuntoDe(p){ var A=ST.aviso, data=A.data?A.data.split("-").reverse().join("/"):new Date().toLocaleDateString("pt-BR"); return (A.assunto||ASSUNTO_PADRAO).replace(/\{nome\}/g,ST.profs[p].nome).replace(/\{data\}/g,data).replace(/\{escola\}/g,instCurto()); }
function msgDe(p){ return ST.aviso.edits[p]!=null?ST.aviso.edits[p]:textoAviso(p); }
function foneWa(c){ var d=String(c||"").replace(/\D/g,""); if(!d) return ""; if(d.length<=11) d="55"+d; return d; }
function renderEnvio(){
  var L=destinatarios(), box=document.getElementById("avEnvio");
  if(!L.length){ box.innerHTML='<div class="msg info">Ninguém selecionado. '+(document.querySelector('input[name="avQuem"]:checked').value==="af"?"Não há professores afetados desde o último aviso.":"")+"</div>"; return; }
  box.innerHTML=L.map(function(p){ var pr=ST.profs[p], env=ST.aviso.enviados[p];
    return '<div class="avrow"><div class="hd"><span class="dot" style="background:'+pr.cor+'"></span><b>'+esc(pr.nome)+'</b><span class="small">'+esc(pr.email||"sem e-mail")+" · "+esc(pr.cel||"sem celular")+"</span>"+(env?'<span class="small" style="color:var(--ok)">✓ '+esc(env)+"</span>":"")+
      '<span style="flex:1"></span><button class="btn sm" data-wa="'+p+'"'+(pr.cel?"":" disabled")+'>WhatsApp</button><button class="btn sm" data-em="'+p+'"'+(pr.email?"":" disabled")+'>E-mail</button><button class="btn sm" data-pdf="'+p+'">Baixar PDF</button></div>'+
      '<textarea rows="7" data-tx="'+p+'">'+esc(msgDe(p))+"</textarea></div>"; }).join("");
  box.querySelectorAll("textarea[data-tx]").forEach(function(t){ t.onchange=function(){ ST.aviso.edits[+t.dataset.tx]=t.value; save(); }; });
  box.querySelectorAll("[data-wa]").forEach(function(b){ b.onclick=function(){ var p=+b.dataset.wa, t=msgDe(p);
    enviarComPdf({canal:"whatsapp",doc:docProf(p),arquivo:"horario-"+ST.profs[p].nome+".pdf",texto:t,assunto:"Horário atualizado — "+instCurto(),url:urlWa(ST.profs[p].cel,t),box:"avMsgBox",ok:function(c){ marcarEnvio(p,"WhatsApp ("+c+")"); }}); }; });
  box.querySelectorAll("[data-em]").forEach(function(b){ b.onclick=function(){ var p=+b.dataset.em, t=msgDe(p), as=assuntoDe(p);
    enviarComPdf({canal:"email",doc:docProf(p),arquivo:"horario-"+ST.profs[p].nome+".pdf",texto:t,assunto:as,url:urlGmail(ST.profs[p].email,as,t),box:"avMsgBox",ok:function(c){ marcarEnvio(p,"e-mail ("+c+")"); }}); }; });
  box.querySelectorAll("[data-pdf]").forEach(function(b){ b.onclick=function(){ var p=+b.dataset.pdf; var doc=novoPdf(); pdfProfessor(doc,p,true); marcarPdf(doc,[p]); salvarPdf(doc,"horario-"+ST.profs[p].nome.replace(/[^A-Za-z0-9]+/g,"_")+".pdf"); marcarEnvio(p,"PDF baixado"); }; });
}

// =====================================================================
// ENVIAR COM PDF: no celular (e em computadores que permitem), abre o "compartilhar" com o PDF já anexado;
// nos outros, baixa o PDF e abre o WhatsApp/Gmail para você anexar o arquivo baixado
// =====================================================================
function enviarComPdf(o){
  var nomeArq=o.arquivo.replace(/[^A-Za-z0-9ãáâéêíóôõúçÃÁÂÉÊÍÓÔÕÚÇ._-]+/g,"_"), file=null;
  try{ file=new File([o.doc.output("blob")],nomeArq,{type:"application/pdf"}); }catch(e){}
  try{ if(file && navigator.canShare && navigator.canShare({files:[file]})){
      navigator.share({files:[file],title:o.assunto,text:o.texto}).then(function(){ if(o.ok) o.ok("compartilhado com PDF"); avisoEnvio(o.box,'<div class="msg ok">Enviado: escolha no compartilhamento o '+(o.canal==="whatsapp"?"WhatsApp":"e-mail")+'. O PDF “'+esc(nomeArq)+'” já vai junto.</div>'); }).catch(function(){});
      return; } }catch(e){}
  try{ o.doc.save(nomeArq); }catch(e){}
  window.open(o.url,"_blank","noopener");
  if(o.ok) o.ok("PDF baixado para anexar");
  avisoEnvio(o.box,'<div class="msg info" style="color:var(--text)">📎 O PDF <b>'+esc(nomeArq)+'</b> foi baixado (pasta Downloads). '+(o.canal==="whatsapp"?"Na conversa do WhatsApp que abriu, clique no clipe (📎) → Documento e escolha esse arquivo.":"No e-mail que abriu no Gmail, clique no clipe (📎) “Anexar arquivos” e escolha esse arquivo.")+' <span class="small">(Este navegador não deixa anexar sozinho. No celular, ou na versão no Google da escola, o PDF vai junto automaticamente.)</span></div>');
}
function avisoEnvio(id,html){ var el=document.getElementById(id); if(el) el.innerHTML=html; }
function urlWa(cel,txt){ return "https://wa.me/"+foneWa(cel)+"?text="+encodeURIComponent(txt); }
function urlGmail(para,assunto,txt){ return "https://mail.google.com/mail/?view=cm&fs=1"+(para?"&to="+encodeURIComponent(para):"")+"&su="+encodeURIComponent(assunto)+"&body="+encodeURIComponent(txt); }
function docProf(p){ var doc=novoPdf(); pdfProfessor(doc,p,true); marcarPdf(doc,[p]); return doc; }
function docVagas(datas){ var doc=novoPdf(); pdfVagas(doc,datas); return doc; }
function marcarEnvio(p,canal){
  ST.aviso.enviados[p]=canal+" em "+fmtData(agora());
  var an=ST.aviso.anexos, lst=[]; if(an.indiv) lst.push("horário individual"+(an.ha?" com HA":"")); if(an.turmas) lst.push("turmas"); geraisMarcados().forEach(function(g){ lst.push("geral "+g.toLowerCase()); }); if(an.eq) lst.push("equipamentos");
  logar("Aviso",canal+" — "+ST.profs[p].nome+(canal.indexOf("PDF")>=0?" (anexos: "+(lst.join(", ")||"nenhum")+")":""));
  save(); renderEnvio();
}
document.getElementById("avMarcar").onclick=function(){
  // só quem está na lista de envio passa a ser comparado com a grade de agora; os outros continuam aparecendo como afetados
  var L=destinatarios(), atual=basePorProf(ST.grid); ST.aviso.baseP=ST.aviso.baseP||{};
  L.forEach(function(p){ ST.aviso.baseP[p]=atual[p]||[]; delete ST.aviso.edits[p]; }); ST.aviso.base=deep(ST.grid); ST.aviso.baseTs=agora();
  logar("Aviso","Marcados como avisados: "+(L.map(function(p){return ST.profs[p].nome;}).join(", ")||"nenhum")); save(); renderBanner(); renderAvisos();
  document.getElementById("avMsgBox").innerHTML='<div class="msg ok">Pronto. Para '+L.length+' professor(es), as próximas mudanças serão comparadas com a grade de agora.</div>';
};
document.getElementById("avPdfTodos").onclick=function(){
  var L=destinatarios(); if(!L.length) return; var i=0;
  (function prox(){ if(i>=L.length){ document.getElementById("avMsgBox").innerHTML='<div class="msg ok">'+L.length+' PDFs baixados. Se o navegador perguntar, permita baixar vários arquivos.</div>'; return; }
    var p=L[i++], doc=novoPdf(); pdfProfessor(doc,p,true); marcarPdf(doc,[p]); salvarPdf(doc,"horario-"+ST.profs[p].nome.replace(/[^A-Za-z0-9]+/g,"_")+".pdf"); ST.aviso.enviados[p]="PDF baixado em "+fmtData(agora()); setTimeout(prox,400); })();
  logar("Aviso","PDFs baixados para "+L.length+" professor(es)"); save();
};
document.getElementById("avPdfUnico").onclick=function(){
  var L=destinatarios(); if(!L.length) return; var doc=novoPdf();
  L.forEach(function(p,i){ if(i) doc.addPage(); pdfProfessor(doc,p,false); });
  geraisMarcados().forEach(function(per){ doc.addPage(); pdfGeral(doc,per); });
  marcarPdf(doc,L); salvarPdf(doc,"horarios-professores-"+hoje()+".pdf"); logar("Aviso","PDF único com "+L.length+" professor(es)");
};

// =====================================================================
// PDF
// =====================================================================
function rgb(hex){ return hex2rgb(hex||"#ffffff"); }
function novoPdf(){ var J=window.jspdf.jsPDF; return new J({orientation:"landscape",unit:"mm",format:"a4"}); }
function salvarPdf(doc,nome){ try{ doc.save(nome); }catch(e){ var m=document.getElementById(cur==="vagas"?"vfMsg":"avMsgBox"); if(m) m.innerHTML='<div class="msg bad">Não foi possível baixar aqui. Abra o gerador direto no computador.</div>'; } }
function cabecalho(doc,titulo,sub){
  var x0=14+pdfLogo(doc,14,6,16);
  doc.setFont("helvetica","bold"); doc.setFontSize(13); doc.setTextColor(30,58,95); doc.text(instNome(),x0,13);
  doc.setFontSize(11); doc.setTextColor(23,33,43); doc.text(titulo,x0,20);
  doc.setFont("helvetica","normal"); doc.setFontSize(8.5); doc.setTextColor(90,104,120); doc.text(sub||("Emitido em "+new Date().toLocaleDateString("pt-BR")+(ST.aviso.data?" · vale a partir de "+ST.aviso.data.split("-").reverse().join("/"):"")),x0,25);
}
function tabelaSemana(doc,startY,linhas){
  doc.autoTable({startY:startY, head:[["Aula"].concat(DIAS)], body:linhas.map(function(r){ return r.cells; }), theme:"grid",
    styles:{fontSize:7.5,cellPadding:1.2,halign:"center",valign:"middle",lineColor:[200,208,216],lineWidth:0.2,textColor:[23,33,43]},
    headStyles:{fillColor:[30,58,95],textColor:255,fontStyle:"bold"}, columnStyles:{0:{cellWidth:30,fontStyle:"bold",fillColor:[238,242,246]}},
    didParseCell:function(d){ if(d.section!=="body") return; var r=linhas[d.row.index], f=r.fills&&r.fills[d.column.index]; if(f) d.cell.styles.fillColor=f; if(r.brk){ d.cell.styles.fillColor=[231,236,241]; d.cell.styles.textColor=[90,104,120]; d.cell.styles.fontStyle="italic"; } }, margin:{left:14,right:14} });
  return doc.lastAutoTable.finalY;
}
function linhasPdfProf(p,sec,comHA,AP,semExt){
  var tm=TM(), L=(AP||idxAulas())[p]||[], ha=comHA&&ST.ha&&ST.ha[p]?ST.ha[p].slots:[], out=[];
  var tiposP={}; L.forEach(function(x){ tiposP[ST.turmas[x.t].tipo]=1; }); var temTipo=Object.keys(tiposP).length>0;
  var filtro=function(ci){ var cl=tm.CL[ci]; if(L.some(function(x){ return x.k===ci; })) return true; if(ha.some(function(key){ var y=haParse(key); return y.ini<cl.fim && cl.ini<y.fim; })) return true; return !temTipo || tm.tiposK[ci].some(function(id){ return tiposP[id]; }); };
  linhasSecao(sec,filtro).forEach(function(ln){
    if(ln.brk!=null){ out.push({brk:true,cells:[ln.brkLabel,{content:ln.brkPlain,colSpan:5}]}); return; }
    var cl=tm.CL[ln.ci], cells=[ln.txt], fills=[null];
    for(var d=0;d<5;d++){ var txt="", fill=null;
      L.forEach(function(x){ if(x.d===d && tm.clOfK[x.k]===ln.ci){ txt+=(txt?"\n":"")+ST.turmas[x.t].nome+" · "+x.disc+"\n"+hmP(x.ini)+"–"+hmP(x.fim); fill=rgb(ST.profs[p].cor); } });
      if(!txt){ var hk=ha.filter(function(key){ return haParse(key).d===d && linhaDaHA(key)===ln.ci; }); if(hk.length){ txt="HA"+(haLocal(p,hk[0])?"\n"+haLocal(p,hk[0]):""); fill=[216,240,225]; } }
      if(!txt && blkVal(p,d,cl.ini,cl.fim)===3){ txt="Formador"; fill=[234,223,246]; }
      if(!txt && !semExt){ var ei=extInfo(p,d,cl.ini,cl.fim); if(ei.length){ txt="Outra escola\n"+ei[0].escola; fill=[226,231,243]; } }
      cells.push(txt); fills.push(fill); }
    out.push({cells:cells,fills:fills}); });
  return out;
}
function secoesDoProf(p,comHA,AP){ var tm=TM(), L=(AP||idxAulas())[p]||[], ha=comHA&&ST.ha&&ST.ha[p]?ST.ha[p].slots:[];
  return tm.SEC.filter(function(sec){ return L.some(function(x){ return sec.cls.indexOf(tm.clOfK[x.k])>=0; }) || ha.some(function(key){ var y=haParse(key); return sec.cls.some(function(ci){ var cl=tm.CL[ci]; return y.ini<cl.fim && cl.ini<y.fim; }); }); }); }
function linhasPdfTurma(t){ var tp=tipoDe(t), n=tp.aulas.length, L=[];
  tp.aulas.forEach(function(h,a){ var cells=[(a+1)+"ª  "+h[0]+"–"+h[1]], fills=[null];
    for(var d=0;d<5;d++){ var k=ST.grid[t][d*n+a]; if(k){ var x=parseK(k); cells.push(x.disc+"\n"+pnome(x.p)); fills.push(rgb(ST.profs[x.p].cor)); } else { cells.push(""); fills.push(null); } }
    L.push({cells:cells,fills:fills}); var pz=pausaApos(tp,a); if(pz) L.push({brk:true,cells:[pz.nome,{content:pz.ini+"–"+pz.fim,colSpan:5}]}); });
  return L; }
function pdfProfessor(doc,p,comGerais){
  var an=ST.aviso.anexos, pr=ST.profs[p], first=true, AP=idxAulas();
  function pagina(){ if(!first) doc.addPage(); first=false; }
  if(an.indiv||(!an.turmas&&!an.eq&&!geraisMarcados().length)){
    pagina(); cabecalho(doc,"Horário de "+pr.nome+(pr.completo&&pr.completo.indexOf("?")<0&&pr.completo!==pr.nome?" — "+pr.completo:""));
    var y=30, m=mudancasProf(p);
    if(m.n){ doc.setFontSize(8); doc.setTextColor(180,83,26); var txt="Mudanças: "+m.sai.map(function(x){return "saiu "+x;}).concat(m.entra.map(function(x){return "entrou "+x;})).join("; "); var ln=doc.splitTextToSize(txt,268); doc.text(ln,14,y); y+=ln.length*3.4+2; }
    secoesDoProf(p,an.ha,AP).forEach(function(sec){ doc.setFontSize(9.5); doc.setTextColor(30,58,95); doc.setFont("helvetica","bold"); if(y>170){ doc.addPage(); y=15; } doc.text(sec.nome,14,y+3); doc.setFont("helvetica","normal"); y=tabelaSemana(doc,y+5,linhasPdfProf(p,sec,an.ha,AP))+6; });
  }
  if(an.turmas){
    var ts=[]; ST.turmas.forEach(function(tm,t){ if(!tm.excluida && ST.grid[t].some(function(k){ return k&&parseK(k).p===p; })) ts.push(t); });
    ts.forEach(function(t){ pagina(); var tm=ST.turmas[t]; cabecalho(doc,"Turma "+tm.nome+" — "+perDe(t)+" ("+tipoDe(t).nome+")"); tabelaSemana(doc,30,linhasPdfTurma(t)); });
  }
  if(an.eq && ST.eq){
    var res=ST.eq.aloc.filter(function(x){ return x.p===p; }).sort(function(a,b){ return PERIODOS.indexOf(perDe(a.t))-PERIODOS.indexOf(perDe(b.t))||((a.s/nA(a.t))|0)-((b.s/nA(b.t))|0)||a.s-b.s; });
    pagina(); cabecalho(doc,"Equipamentos reservados — "+pr.nome);
    doc.autoTable({startY:30, head:[["Período","Dia","Aula","Turma","Matéria","Recurso","Aparelhos"]], body:res.length?res.map(function(x){ var n=nA(x.t); return [perDe(x.t),DIAS[(x.s/n)|0],(x.s%n+1)+"ª ("+horA(x.t,x.s%n)+")",ST.turmas[x.t].nome,x.disc,x.rec,x.qtd||""]; }):[["—","—","—","—","—","Nenhuma reserva","—"]], theme:"grid", styles:{fontSize:8}, headStyles:{fillColor:[30,58,95]}, alternateRowStyles:{fillColor:[242,245,249]}, margin:{left:14,right:14}});
  }
  if(comGerais) geraisMarcados().forEach(function(per){ pagina(); pdfGeral(doc,per); });
}
// tenta tamanhos de letra do maior para o menor até a tabela caber numa folha A4 deitada
function caberA4(desenha){
  var tent=[]; [11,10,9,8,7.5,7,6.5,6,5.5,5.2].forEach(function(f){ tent.push({fs:f,duas:true}); }); [6.5,6,5.5,5,4.6,4.2].forEach(function(f){ tent.push({fs:f,duas:false}); });
  for(var i=0;i<tent.length;i++){ var tmp=novoPdf(); desenha(tmp,tent[i]); if(tmp.getNumberOfPages()===1 && tmp.lastAutoTable && tmp.lastAutoTable.finalY<=204) return tent[i]; }
  return tent[tent.length-1];
}
function textoAula(k,duas){ var x=parseK(k); return x.disc+(duas?"\n":" · ")+pnome(x.p); }
function pdfGeral(doc,per,o){ // horário geral do período inteiro numa folha A4 deitada, como na tela
  o=o||{}; var I=IMP(), c0=I.cores; I.cores="cor";
  try{ impGeral(doc,per,o.datas,o.wk,true); } finally{ I.cores=c0; }
}
// tabela de uma turma (ou de um professor) do maior tamanho que cabe na folha
function pdfSemanaA4(doc,titulo,sub,blocos){
  function desenha(D,cfg){ cabecalho(D,titulo,sub); var y=29;
    blocos.forEach(function(b){ if(b.nome){ D.setFontSize(Math.min(10,cfg.fs+2.5)); D.setFont("helvetica","bold"); D.setTextColor(30,58,95); D.text(b.nome,14,y+3); D.setFont("helvetica","normal"); y+=4.5; }
      var L=b.linhas(cfg.duas);
      D.autoTable({startY:y, head:[["Aula"].concat(DIAS)], body:L.map(function(r){ return r.cells; }), theme:"grid",
        styles:{fontSize:cfg.fs+2,cellPadding:{top:cfg.duas?1.1:0.7,bottom:cfg.duas?1.1:0.7,left:1,right:1},halign:"center",valign:"middle",lineColor:[200,208,216],lineWidth:0.2,textColor:[23,33,43]},
        headStyles:{fillColor:[30,58,95],textColor:255,fontStyle:"bold"}, columnStyles:{0:{cellWidth:32,fontStyle:"bold",fillColor:[238,242,246]}},
        didParseCell:function(d){ if(d.section!=="body") return; var r=L[d.row.index], f=r.fills&&r.fills[d.column.index]; if(f) d.cell.styles.fillColor=f; if(r.bold&&r.bold[d.column.index]) d.cell.styles.fontStyle="bold"; if(r.brk){ d.cell.styles.fillColor=[231,236,241]; d.cell.styles.textColor=[90,104,120]; d.cell.styles.fontStyle="italic"; d.cell.styles.cellPadding=0.4; } }, margin:{left:14,right:14,top:8,bottom:6}, rowPageBreak:"avoid"});
      y=D.lastAutoTable.finalY+5; }); }
  desenha(doc,caberA4(desenha));
}
function linhasTurmaPdf(t,duas,datas,wk){ var tp=tipoDe(t), n=tp.aulas.length, L=[];
  tp.aulas.forEach(function(h,a){ var cells=[(a+1)+"ª  "+h[0]+"–"+h[1]], fills=[null], bold=[false];
    for(var d=0;d<5;d++){ var s=d*n+a, k=ST.grid[t][s], vi=wk?wk.cell[datas[d]+"|"+t+"|"+s]:null;
      if(vi){ cells.push(vi.sub!=null?vi.disc+(duas?"\n":" · ")+pnome(vi.sub)+" (subst.)":"AULA VAGA"+(duas?"\n":" · ")+vi.disc+" ("+pnome(vi.p)+")"); fills.push(vi.sub!=null?[255,244,204]:[253,232,230]); bold.push(true); continue; }
      if(k){ var x=parseK(k); cells.push(textoAula(k,duas)); fills.push(rgb(ST.profs[x.p].cor)); } else { cells.push(""); fills.push(null); } bold.push(false); }
    L.push({cells:cells,fills:fills,bold:bold}); var pz=pausaApos(tp,a); if(pz) L.push({brk:true,cells:[pz.nome,{content:pz.ini+"–"+pz.fim,colSpan:5}]}); });
  return L; }
function pdfVagas(doc,datas){
  var titulo=datas.length===1?"Aulas vagas — "+nomeDia(datas[0])+", "+fmtDMA(datas[0]):"Aulas vagas — semana de "+fmtDM(datas[0])+" a "+fmtDMA(datas[datas.length-1]);
  cabecalho(doc,titulo,"Emitido em "+fmtData(agora())+" · as aulas vagas não mudam a grade oficial");
  var body=[], fills=[];
  datas.forEach(function(date){ vagasDoDia(date).forEach(function(x){ body.push([DIAS_C[wdIdx(date)]+" "+fmtDM(date),hmP(x.ini)+"–"+hmP(x.fim),ST.turmas[x.t].nome,x.disc,pnome(x.p),x.sub!=null?"Substituto: "+pnome(x.sub):"AULA VAGA",x.aus.motivo||""]); fills.push(x.sub!=null?[255,244,204]:[253,232,230]); }); });
  if(!body.length) body.push(["—","—","—","—","—","Nenhuma aula vaga","—"]);
  doc.autoTable({startY:30, head:[["Dia","Horário","Turma","Disciplina","Professor ausente","Situação","Motivo"]], body:body, theme:"grid",
    styles:{fontSize:9,cellPadding:1.6,textColor:[23,33,43],lineColor:[200,208,216],lineWidth:0.2}, headStyles:{fillColor:[30,58,95],textColor:255}, alternateRowStyles:{fillColor:[242,245,249]},
    didParseCell:function(d){ if(d.section==="body" && d.column.index===5 && fills[d.row.index]){ d.cell.styles.fillColor=fills[d.row.index]; d.cell.styles.fontStyle="bold"; } }, margin:{left:14,right:14}});
}

// =====================================================================
// HISTÓRICO (tela)
// =====================================================================
function histFiltrado(){
  var q=(document.getElementById("hBusca").value||"").toLowerCase(), tp=document.getElementById("hTipo").value, de=document.getElementById("hDe").value, ate=document.getElementById("hAte").value;
  return ST.hist.filter(function(h){ var d=ymd(new Date(h.ts));
    return (!tp||h.tipo===tp)&&(!de||d>=de)&&(!ate||d<=ate)&&(!q||(h.txt+" "+h.quem+" "+h.motivo+" "+h.tipo).toLowerCase().indexOf(q)>=0); });
}
function renderHist(){
  var tipos={}; ST.hist.forEach(function(h){ tipos[h.tipo]=1; });
  var sel=document.getElementById("hTipo"), cv=sel.value;
  sel.innerHTML='<option value="">Todos os tipos</option>'+Object.keys(tipos).sort().map(function(t){ return "<option"+(t===cv?" selected":"")+">"+esc(t)+"</option>"; }).join("");
  var L=histFiltrado();
  document.getElementById("hTab").innerHTML="<tr><th>Data e hora</th><th>Tipo</th><th>O que mudou</th><th>Solicitado por</th><th>Motivo</th></tr>"+(L.length?L.map(function(h){
    return '<tr><td class="num" style="white-space:nowrap">'+fmtData(h.ts)+'</td><td><span class="tag preferencia" style="background:var(--surface2);color:var(--primary)">'+esc(h.tipo)+"</span></td><td>"+esc(h.txt)+"</td><td>"+esc(h.quem||"—")+"</td><td>"+esc(h.motivo||"—")+"</td></tr>"; }).join(""):'<tr><td colspan="5" class="small">Nenhuma mudança registrada ainda.</td></tr>');
  document.getElementById("sLim").value=ST.histLimite;
  document.getElementById("sTab").innerHTML=ST.snaps.length?"<tr><th>Guardada em</th><th>Nome</th><th>Diferença para a atual</th><th>Solicitado por / motivo</th><th></th></tr>"+ST.snaps.map(function(sn,i){
    var dif=diffGrids(sn.grid,ST.grid).length;
    return '<tr><td class="num" style="white-space:nowrap">'+fmtData(sn.ts)+"</td><td>"+esc(sn.nome)+'</td><td class="num">'+(dif?dif+" aulas diferentes":"igual à atual")+"</td><td>"+esc([sn.quem,sn.motivo].filter(Boolean).join(" — ")||"—")+'</td><td class="right" style="white-space:nowrap"><button class="btn sm" data-ver="'+i+'">Ver</button> <button class="btn sm" data-cmp="'+i+'">Comparar</button> <button class="btn sm" data-res="'+i+'">Restaurar</button></td></tr>'; }).join(""):"<tr><td class='small'>Nenhuma grade guardada ainda.</td></tr>";
  document.querySelectorAll("#sTab [data-ver]").forEach(function(b){ b.onclick=function(){ verSnap(+b.dataset.ver); }; });
  document.querySelectorAll("#sTab [data-cmp]").forEach(function(b){ b.onclick=function(){ cmpSnap(+b.dataset.cmp); }; });
  document.querySelectorAll("#sTab [data-res]").forEach(function(b){ b.onclick=function(){ if(!edPrecisa()) return;
    if(b.dataset.arm!=="1"){ b.dataset.arm="1"; b.textContent="Confirmar?"; setTimeout(function(){ b.dataset.arm=""; b.textContent="Restaurar"; },4000); return; }
    var sn=ST.snaps[+b.dataset.res]; guardarGrade("Antes de restaurar — "+ST.gridNome);
    var avisos=[], gAnt=deep(ST.grid);
    ST.grid=ST.turmas.map(function(T,t){ var row=sn.grid[t], N=nA(t)*5; if(row && row.length===N) return deep(row); if(row){ avisos.push(T.nome); ST.grid[t]=deep(row); resizeTurma(t,row.length/5|0,N/5); return ST.grid[t]; } return ST.grid[t]; });
    ST.gridNome="Restaurada: "+sn.nome; ST.ha=null; ST.eq=null; CACHE=null; reconciliarAusencias(gAnt);
    logar("Grade restaurada","Voltou para a grade guardada em "+fmtData(sn.ts)+" ("+sn.nome+")"); save(); renderHist();
    document.getElementById("sOut").innerHTML='<div class="msg ok">Grade restaurada. A grade que estava em uso foi guardada na lista.'+(avisos.length?" Atenção: "+esc(avisos.join(", "))+" mudaram de horário depois daquela versão; confira e use Ajustar.":"")+"</div>"; }; });
}
function verSnap(i){
  var sn=ST.snaps[i], real=ST.grid, h="";
  try{ ST.grid=sn.grid.map(function(row,t){ return t<ST.turmas.length?row:null; }).filter(function(r){ return r!==null; }); while(ST.grid.length<ST.turmas.length) ST.grid.push([]);
    h='<div class="card scroll"><div class="row" style="justify-content:space-between"><b>'+esc(sn.nome)+" — guardada em "+fmtData(sn.ts)+'</b><button class="btn sm noprint" onclick="document.getElementById(\'sOut\').innerHTML=\'\'">Fechar</button></div>'+periodosEmUso().map(function(per){ return geralHTML(per,sn.nome,true); }).join("<br>")+"</div>"; }
  catch(e){ h='<div class="msg bad">Não foi possível mostrar essa grade guardada.</div>'; }
  finally{ ST.grid=real; }
  document.getElementById("sOut").innerHTML=h; document.getElementById("sOut").scrollIntoView({behavior:"smooth"});
}
function cmpSnap(i){
  var sn=ST.snaps[i], d=diffGrids(sn.grid,ST.grid);
  document.getElementById("sOut").innerHTML='<div class="card"><div class="row" style="justify-content:space-between"><b>Diferenças: '+esc(sn.nome)+" ("+fmtData(sn.ts)+') → grade atual</b><button class="btn sm" onclick="document.getElementById(\'sOut\').innerHTML=\'\'">Fechar</button></div><div class="scroll"><table class="t"><tr><th>Turma e horário</th><th>Antes</th><th>Agora</th></tr>'+
    (d.length?d.map(function(x){ return "<tr><td>"+esc(lugarTS(x.t,x.s))+"</td><td>"+esc(descK(x.antes))+"</td><td><b>"+esc(descK(x.depois))+"</b></td></tr>"; }).join(""):"<tr><td colspan=3 class=small>As duas grades são iguais.</td></tr>")+"</table></div></div>";
  document.getElementById("sOut").scrollIntoView({behavior:"smooth"});
}
["hBusca","hTipo","hDe","hAte"].forEach(function(id){ document.getElementById(id).addEventListener("input",renderHist); document.getElementById(id).addEventListener("change",renderHist); });
document.getElementById("hAddNota").onclick=function(){ var v=document.getElementById("hNota").value.trim(); if(!v) return; logar("Anotação",v); document.getElementById("hNota").value=""; renderHist(); };
document.getElementById("sSalvar").onclick=function(){ var n=document.getElementById("sNome").value.trim(); guardarGrade(n||ST.gridNome); logar("Grade guardada","Versão guardada: "+(n||ST.gridNome)); document.getElementById("sNome").value=""; renderHist(); };
document.getElementById("sLim").onchange=function(e){ ST.histLimite=Math.max(3,Math.min(50,+e.target.value||15)); if(ST.snaps.length>ST.histLimite) ST.snaps.length=ST.histLimite; save(); renderHist(); };
document.getElementById("hPrint").onclick=function(){ printSec("s-hist"); };
document.getElementById("hExcel").onclick=function(){
  var L=histFiltrado();
  var html='<html><head><meta charset="utf-8"><style>td,th{border:1px solid #999;font-family:Arial;font-size:10pt;vertical-align:top} th{background:#DDE4EC}</style></head><body><h2>'+esc(instCurto())+' — Histórico de mudanças do horário</h2><p>Emitido em '+fmtData(agora())+'</p><table><tr><th>Data e hora</th><th>Tipo</th><th>O que mudou</th><th>Solicitado por</th><th>Motivo</th></tr>'+
    L.map(function(h){ return "<tr><td>"+fmtData(h.ts)+"</td><td>"+esc(h.tipo)+"</td><td>"+esc(h.txt)+"</td><td>"+esc(h.quem)+"</td><td>"+esc(h.motivo)+"</td></tr>"; }).join("")+"</table></body></html>";
  baixar("historico-horario-"+instSlug()+"-"+hoje()+".xls","﻿"+html,"application/vnd.ms-excel");
};

// =====================================================================
// DADOS / EXPORTAR
// =====================================================================
function renderDados(){
  var h="<tr><th>Aulas (regência)</th>"; for(var i=1;i<=30;i++) h+='<td class="num">'+i+"</td>"; h+="</tr><tr><th>Hora-atividade</th>"; for(var j=1;j<=30;j++) h+='<td class="num">'+Motor.haPorAulas(j)+"</td>"; h+="</tr>";
  document.getElementById("haTab").innerHTML=h;
  renderImp();
}
function baixar(nome,conteudo,tipo){
  var box=document.getElementById(cur==="hist"?"sOut":"xMsg");
  try{ var blob=new Blob([conteudo],{type:tipo}); var a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=nome; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); },1000);
    box.innerHTML='<div class="msg ok">Arquivo “'+esc(nome)+'” baixado.</div>'; }
  catch(e){ box.innerHTML='<div class="msg bad">Não foi possível baixar aqui. Abra o gerador direto no computador (arquivo .html) e tente de novo.</div>'; }
}
function recarregar(){ if(typeof edCarregar==="function") edCarregar(); IEDIT=null; aplicarInst(); _filled=false; _TM=null; _EXT=null; CACHE=null; FORM=null; SEMANA=null; document.getElementById("tSel").innerHTML=""; analisar(); }
document.getElementById("xIrBackup").onclick=function(){ show("backup"); };
var resetArm=false;
document.getElementById("xReset").onclick=function(){ if(!edPrecisa()) return;
  if(!resetArm){ resetArm=true; this.textContent="Clique de novo para confirmar"; var b=this; setTimeout(function(){ resetArm=false; b.textContent="Voltar à grade oficial"; },4000); return; }
  guardarGrade("Antes de voltar à grade oficial");
  var f=freshState(), gAnt=deep(ST.grid);
  // professores da planilha ligados aos cadastrados pelo nome (e-mail, celular e horários continuam)
  var mapa=f.profs.map(function(bp){ var i=-1; ST.profs.forEach(function(q,j){ if(i<0&&q.nome===bp.nome) i=j; }); if(i<0){ ST.profs.push(bp); i=ST.profs.length-1; } return i; });
  f.matriz.forEach(function(r){ r.p=mapa[r.p]; }); f.grid=f.grid.map(function(row){ return row.map(function(k){ if(!k) return k; var x=parseK(k); return kOf(x.disc,mapa[x.p],x.doc2); }); });
  ST.matriz=f.matriz; ST.grid=f.grid; ST.turmas=f.turmas; ST.tipos=f.tipos; ST.locks={}; ST.gridNome=f.gridNome; ST.ha=null; ST.eq=null; ST.baseVersao=BASE.versao||"28/09";
  reconciliarAusencias(gAnt);
  logar("Dados","Voltou à grade oficial"); save(); recarregar(); resetArm=false; this.textContent="Voltar à grade oficial"; document.getElementById("xMsg").innerHTML='<div class="msg ok">Grade oficial restaurada. Os professores (com e-mail, celular e horários), as regras, o Histórico, as grades guardadas e as aulas vagas foram mantidos.</div>';
};
document.getElementById("xExcel").onclick=function(){
  var css="td,th{border:1px solid #999;font-family:Arial;font-size:9pt;text-align:center;vertical-align:middle} th{background:#DDE4EC} tr.dsep td,tr.dsep th{border-top:3px solid #000}";
  var parts=[], tm=TM(), AP=idxAulas();
  periodosEmUso().forEach(function(per){ parts.push(geralHTML(per,null,true)+"<br>"); });
  parts.push("<h3>Grade por professor</h3>");
  profsOrdem().forEach(function(p){
    var L=AP[p]||[], ha=ST.ha&&ST.ha[p]?ST.ha[p].slots:[]; if(!L.length && !ha.length) return;
    var h="<table><tr><th colspan='6' style='background:"+ST.profs[p].cor+"'>"+esc(ST.profs[p].nome)+"</th></tr><tr><th>Horário</th>"+DIAS.map(function(d){ return "<th>"+d+"</th>"; }).join("")+"</tr>";
    secoesDoProf(p,true,AP).forEach(function(sec){ h+="<tr><th colspan='6'>"+sec.nome+"</th></tr>";
      linhasPdfProf(p,sec,true,AP).forEach(function(r){ if(r.brk){ h+="<tr><td style='background:#E7ECF1'>"+esc(r.cells[0])+"</td><td colspan='5' style='background:#E7ECF1'>"+esc(r.cells[1].content)+"</td></tr>"; return; }
        h+="<tr>"+r.cells.map(function(c,i){ var f=r.fills[i]; return '<td style="'+(f?"background:rgb("+f.join(",")+")":"")+'">'+esc(c).replace(/\n/g,"<br>")+"</td>"; }).join("")+"</tr>"; }); });
    parts.push(h+"</table><br>");
  });
  if(ST.eq){ parts.push("<h3>Equipamentos</h3><table><tr><th>Período</th><th>Dia</th><th>Aula</th><th>Recurso</th><th>Turma</th><th>Professor</th><th>Matéria</th><th>Aparelhos</th></tr>"+ST.eq.aloc.slice().sort(function(a,b){ return PERIODOS.indexOf(perDe(a.t))-PERIODOS.indexOf(perDe(b.t))||((a.s/nA(a.t))|0)-((b.s/nA(b.t))|0)||a.s%nA(a.t)-b.s%nA(b.t); }).map(function(x){ var n=nA(x.t); return "<tr><td>"+perDe(x.t)+"</td><td>"+DIAS[(x.s/n)|0]+"</td><td>"+(x.s%n+1)+"ª ("+horA(x.t,x.s%n)+")</td><td>"+esc(x.rec)+"</td><td>"+esc(ST.turmas[x.t].nome)+'</td><td style="background:'+ST.profs[x.p].cor+'">'+esc(pnome(x.p))+"</td><td>"+esc(x.disc)+"</td><td>"+(x.qtd||"")+"</td></tr>"; }).join("")+"</table>"); }
  var ativas=ST.ausencias.filter(function(a){ return !statusAus(a).enc; });
  if(ativas.length){ var AP2=idxAulas(); parts.push("<h3>Aulas vagas marcadas (em andamento e agendadas)</h3><table><tr><th>Dia</th><th>Horário</th><th>Turma</th><th>Disciplina</th><th>Professor ausente</th><th>Situação</th><th>Motivo</th></tr>"+ativas.map(function(a){ return itensAus(a,AP2).map(function(x){ return "<tr><td>"+DIAS_C[wdIdx(x.date)]+" "+fmtDM(x.date)+"</td><td>"+hmP(x.ini)+"–"+hmP(x.fim)+"</td><td>"+esc(ST.turmas[x.t].nome)+"</td><td>"+esc(x.disc)+"</td><td>"+esc(pnome(x.p))+'</td><td style="background:'+(x.sub!=null?"#FFF4CC":"#FDE8E6")+'">'+(x.sub!=null?"Substituto: "+esc(pnome(x.sub)):"AULA VAGA")+"</td><td>"+esc(a.motivo||"")+"</td></tr>"; }).join(""); }).join("")+"</table>"); }
  var marca=""; try{ marca="<!--GH29-HORARIO-INICIO "+pacoteHorario(profsOrdem(),true)+" GH29-HORARIO-FIM-->"; }catch(e){}
  var html='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"><style>'+css+"</style></head><body><h2>"+esc(instCurto())+" — "+esc(ST.gridNome)+"</h2>"+parts.join("")+marca+"</body></html>";
  baixar("horario-"+instSlug()+"-"+hoje()+".xls","﻿"+html,"application/vnd.ms-excel");
};

