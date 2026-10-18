
// =====================================================================
// PROFESSORES QUE NÃO PODEM COINCIDIR (recomposição e outros casos), com turmas, aulas, dias e força
// =====================================================================
var DISC_RECOMP=["RAM","RAP","L.RAP","R.LEIT"], PFORM=null;
function parNovo(a,b){ return {a:a,b:b,ta:[],tb:[],modo:"recomp",discs:[],dias:[0,1,2,3,4],forca:"preferencia",obs:"",juntas:turmasEmComum(a,b),soJuntas:false}; }
// turmas em que os dois professores dão aula (sugestão de "trabalham juntos")
function turmasEmComum(a,b){ if(!ST||!ST.grid) return []; var A=turmasDoProf(a), B=turmasDoProf(b); return Object.keys(A).filter(function(t){ return B[t]; }).map(Number).sort(function(x,y){ return ST.turmas[x].nome.localeCompare(ST.turmas[y].nome,"pt",{numeric:true}); }); }
function ordTurmas(L){ return L.slice().sort(function(x,y){ return (ST.turmas[x]?ST.turmas[x].nome:"").localeCompare(ST.turmas[y]?ST.turmas[y].nome:"","pt",{numeric:true}); }); }
// aceita o formato antigo ([a,b]) e confere tudo o que vem de arquivo
function normPar(x,P,Tn){ var o=Array.isArray(x)?{a:x[0],b:x[1]}:(x&&typeof x==="object"?x:null); if(!o) return null; var a=+o.a, b=+o.b;
  if(!(a>=0&&a<P&&b>=0&&b<P)||a===b||a%1||b%1) return null;
  var ts=function(v){ return (Array.isArray(v)?v:[]).map(Number).filter(function(t){ return t>=0&&t<Tn&&t%1===0; }).filter(function(t,i,arr){ return arr.indexOf(t)===i; }); };
  var dias=(Array.isArray(o.dias)?o.dias:[0,1,2,3,4]).map(Number).filter(function(d){ return d>=0&&d<=4&&d%1===0; });
  return {a:a,b:b,ta:ts(o.ta),tb:ts(o.tb),modo:["recomp","todas","disc"].indexOf(o.modo)>=0?o.modo:"recomp",discs:(Array.isArray(o.discs)?o.discs:[]).map(function(v){ return String(v).slice(0,40); }).slice(0,80),
    dias:dias.length?dias.filter(function(d,i,arr){ return arr.indexOf(d)===i; }).sort():[0,1,2,3,4],forca:o.forca==="rigida"?"rigida":"preferencia",obs:String(o.obs||"").slice(0,200),
    juntas:o.juntas==null?null:ts(o.juntas),soJuntas:!!o.soJuntas&&Array.isArray(o.juntas)&&ts(o.juntas).length>0}; }
function turmasDoProf(p){ var s={}; ST.turmas.forEach(function(T,t){ if(!T.excluida&&(ST.grid[t]||[]).some(function(k){ return k&&parseK(k).p===p; })) s[t]=1; }); return s; }
function discsDoProf(p){ var s={}; ST.matriz.forEach(function(r){ if(r.p===p) s[r.disc]=1; }); return s; }
function nomesTurmas(L){ return L.map(function(t){ return ST.turmas[t]?ST.turmas[t].nome:"?"; }).join(", "); }
function descPar(r){ var dias=r.dias.length===5?"todos os dias":r.dias.map(function(d){ return DIAS_C[d]; }).join(", ");
  return {quem:pnome(r.a)+" × "+pnome(r.b), juntas:r.juntas&&r.juntas.length?nomesTurmas(ordTurmas(r.juntas)):"—",
    turmas:r.soJuntas?"só nas turmas em que trabalham juntos":(r.ta.length?pnome(r.a)+": "+nomesTurmas(r.ta):pnome(r.a)+": todas")+" · "+(r.tb.length?pnome(r.b)+": "+nomesTurmas(r.tb):pnome(r.b)+": todas"),
    aulas:r.modo==="recomp"?"só aulas de recomposição":r.modo==="todas"?"qualquer aula":"só "+(r.discs.join(", ")||"(nenhuma disciplina marcada)"), dias:dias}; }
function renderPares(){
  var tb=document.getElementById("rPares"); tb.className="t cards";
  var mudou=false; ST.pares.forEach(function(r){ if(r.juntas==null){ r.juntas=turmasEmComum(r.a,r.b); mudou=true; } }); if(mudou) save();
  tb.innerHTML=ST.pares.length?"<tr><th>Professores</th><th>Trabalham juntos em</th><th>Turmas que contam na regra</th><th>Aulas que contam</th><th>Dias</th><th>Força</th><th>Ações</th></tr>"+ST.pares.map(function(r,i){ var d=descPar(r);
    return '<tr><td data-l="Professores"><b>'+esc(d.quem)+"</b>"+(r.obs?'<br><span class="small">'+esc(r.obs)+"</span>":"")+'</td><td data-l="Trabalham juntos em">'+esc(d.juntas)+'</td><td data-l="Turmas que contam">'+esc(d.turmas)+'</td><td data-l="Aulas">'+esc(d.aulas)+'</td><td data-l="Dias">'+esc(d.dias)+'</td><td data-l="Força"><span class="tag '+(r.forca==="rigida"?"rigida":"preferencia")+'">'+(r.forca==="rigida"?"rígida":"preferência")+'</span></td><td class="right" style="white-space:nowrap"><button class="btn sm" data-pe="'+i+'">Editar</button> <button class="btn sm" data-pd="'+i+'">Duplicar</button> <button class="btn sm" data-pr="'+i+'">Remover</button></td></tr>'; }).join(""):'<tr><td class="small">Nenhum par ainda.</td></tr>';
  tb.querySelectorAll("[data-pe]").forEach(function(b){ b.onclick=function(){ var i=+b.dataset.pe; PFORM=deep(ST.pares[i]); PFORM._i=i; renderParForm(); document.getElementById("rForm").scrollIntoView({behavior:"smooth",block:"start"}); }; });
  tb.querySelectorAll("[data-pd]").forEach(function(b){ b.onclick=function(){ PFORM=deep(ST.pares[+b.dataset.pd]); delete PFORM._i; renderParForm(); document.getElementById("rForm").scrollIntoView({behavior:"smooth",block:"start"}); }; });
  tb.querySelectorAll("[data-pr]").forEach(function(b){ b.onclick=function(){ if(b.dataset.arm!=="1"){ b.dataset.arm="1"; b.textContent="Confirmar?"; return; } var r=ST.pares[+b.dataset.pr];
    logar("Regras","Par removido (não podem coincidir): "+descPar(r).quem); ST.pares.splice(+b.dataset.pr,1); if(PFORM&&PFORM._i!=null) PFORM=null; save(); CACHE=null; renderPares(); renderParForm(); }; });
  renderParForm(); }
function renderParForm(){
  var el=document.getElementById("rForm"); if(!el) return; var ps=profsOrdem();
  if(!PFORM) PFORM=parNovo(ps[0],ps[1]); var F=PFORM;
  var selP=function(id,v){ return '<select id="'+id+'" aria-label="'+(id==="pfA"?"Primeiro professor":"Segundo professor")+'">'+ps.map(function(p){ return '<option value="'+p+'"'+(p===v?" selected":"")+">"+esc(ST.profs[p].nome)+"</option>"; }).join("")+"</select>"; };
  var turmasBox=function(lado){ var p=lado==="a"?F.a:F.b, sel=lado==="a"?F.ta:F.tb, dele=turmasDoProf(p), todas=F["_todas"+lado], lista=ST.turmas.map(function(T,t){ return t; }).filter(function(t){ return !ST.turmas[t].excluida&&(todas||dele[t]||sel.indexOf(t)>=0); }).sort(function(x,y){ return ST.turmas[x].nome.localeCompare(ST.turmas[y].nome,"pt",{numeric:true}); });
    return '<div class="row" style="margin:4px 0"><label><input type="radio" name="pfT'+lado+'" value="todas"'+(sel.length?"":" checked")+"> Todas as turmas</label><label><input type=\"radio\" name=\"pfT"+lado+'" value="esc"'+(sel.length?" checked":"")+'> Só as turmas marcadas</label><label class="small"><input type="checkbox" data-pftodas="'+lado+'"'+(todas?" checked":"")+"> mostrar também turmas em que ele não dá aula</label>"+(lado==="b"?'<button class="btn sm" id="pfMesmas">Usar as mesmas turmas do 1º professor</button>':"")+"</div>"+
      '<div class="chiplist" style="max-height:140px">'+(lista.length?lista.map(function(t){ return '<label><input type="checkbox" data-pft="'+lado+'" value="'+t+'"'+(sel.indexOf(t)>=0?" checked":"")+"> "+esc(ST.turmas[t].nome)+(dele[t]?"":' <span class="small">(sem aula dele)</span>')+"</label>"; }).join(""):'<span class="small">Este professor ainda não tem aulas na grade.</span>')+"</div>"; };
  if(F.juntas==null) F.juntas=turmasEmComum(F.a,F.b);
  var juntasBox=function(){ var A=turmasDoProf(F.a), B=turmasDoProf(F.b), com=turmasEmComum(F.a,F.b), todas=F._todasj;
    var lista=ordTurmas(ST.turmas.map(function(T,t){ return t; }).filter(function(t){ return !ST.turmas[t].excluida&&(todas||A[t]||B[t]||F.juntas.indexOf(t)>=0); }));
    return '<div class="impgrp" style="margin:10px 0;padding:8px 10px;background:var(--bg2,#f4f7fb)"><p style="margin:0 0 2px"><b>Em quais turmas eles trabalham juntos (na mesma sala)?</b></p>'+
      '<p class="small" style="margin:0 0 4px">Fica guardado como referência para o gerador. As marcadas com ★ são turmas em que os dois têm aula na grade.</p>'+
      '<div class="row" style="margin:4px 0"><button class="btn sm" id="pfJCom">Marcar as turmas em comum ('+com.length+')</button><button class="btn sm" id="pfJNada">Desmarcar todas</button><label class="small"><input type="checkbox" id="pfJTodas"'+(todas?" checked":"")+'> mostrar todas as turmas</label></div>'+
      '<div class="chiplist" style="max-height:140px">'+(lista.length?lista.map(function(t){ return '<label><input type="checkbox" data-pfj value="'+t+'"'+(F.juntas.indexOf(t)>=0?" checked":"")+'> '+esc(ST.turmas[t].nome)+(A[t]&&B[t]?' ★':"")+"</label>"; }).join(""):'<span class="small">Nenhum dos dois tem aulas na grade ainda.</span>')+"</div>"+
      '<label class="chk" style="margin-top:6px"><input type="checkbox" id="pfSoJ"'+(F.soJuntas?" checked":"")+'> A regra vale só nessas turmas (para os dois professores)</label></div>'; };
  var discs={}; [F.a,F.b].forEach(function(p){ Object.keys(discsDoProf(p)).forEach(function(d){ discs[d]=1; }); }); DISC_RECOMP.concat(F.discs).forEach(function(d){ discs[d]=1; });
  var h='<h4>'+(F._i!=null?"Editando o par "+(F._i+1):"Novo par")+'</h4>'+
    '<div class="row end"><label>1º professor<br>'+selP("pfA",F.a)+'</label><span style="padding-bottom:8px">×</span><label>2º professor<br>'+selP("pfB",F.b)+'</label><button class="btn sm" id="pfInv" title="Trocar a ordem dos dois">⇄ inverter</button></div>'+
    juntasBox()+
    (F.soJuntas?'<p class="small" style="margin:8px 0 2px">A regra vale <b>só nas turmas em que trabalham juntos</b>. Para escolher turmas diferentes para cada professor, desmarque a opção acima.</p>':
    '<p style="margin:10px 0 2px"><b>Em quais turmas do 1º professor ('+esc(pnome(F.a))+")?</b></p>"+turmasBox("a")+
    '<p style="margin:10px 0 2px"><b>Em quais turmas do 2º professor ('+esc(pnome(F.b))+")?</b></p>"+turmasBox("b"))+
    '<p style="margin:10px 0 2px"><b>Quais aulas contam?</b></p><div class="row"><label><input type="radio" name="pfM" value="recomp"'+(F.modo==="recomp"?" checked":"")+'> Só quando um deles está numa aula de recomposição (RAM, RAP, L.RAP, R.LEIT ou 2ª docência)</label><label><input type="radio" name="pfM" value="todas"'+(F.modo==="todas"?" checked":"")+'> Qualquer aula</label><label><input type="radio" name="pfM" value="disc"'+(F.modo==="disc"?" checked":"")+"> Só quando um deles está numa destas disciplinas:</label></div>"+
    '<div class="chiplist" style="max-height:120px'+(F.modo==="disc"?"":";opacity:.5")+'">'+Object.keys(discs).sort().map(function(d){ return '<label><input type="checkbox" data-pfd value="'+esc(d)+'"'+(F.discs.indexOf(d)>=0?" checked":"")+(F.modo==="disc"?"":" disabled")+"> "+esc(d)+(ST.siglas&&ST.siglas[d]?' <span class="small">'+esc(ST.siglas[d])+"</span>":"")+"</label>"; }).join("")+"</div>"+
    '<p style="margin:10px 0 2px"><b>Em quais dias?</b></p><div class="row">'+DIAS.map(function(dn,d){ return '<label><input type="checkbox" data-pfdia="'+d+'"'+(F.dias.indexOf(d)>=0?" checked":"")+"> "+dn+"</label>"; }).join("")+"</div>"+
    '<div class="row end" style="margin-top:10px"><label>Força<br><select id="pfF"><option value="preferencia"'+(F.forca!=="rigida"?" selected":"")+'>Preferência (o gerador tenta evitar)</option><option value="rigida"'+(F.forca==="rigida"?" selected":"")+'>Rígida (só quebra se não houver outro jeito)</option></select></label>'+
    '<label style="flex:1;min-width:200px">Observação (opcional)<br><input type="text" id="pfObs" value="'+esc(F.obs)+'" placeholder="ex.: L.RAP dos 6ºs anos" style="width:100%"></label></div>'+
    '<div id="pfMsg"></div><div class="row" style="margin-top:8px"><button class="btn sm pri" id="pfSalvar">'+(F._i!=null?"Salvar alterações":"Adicionar par")+'</button>'+(F._i!=null?'<button class="btn sm" id="pfCancelar">Cancelar</button>':'<button class="btn sm" id="pfLimpar">Limpar</button>')+"</div>";
  el.innerHTML=h;
  var ler=function(){ F.a=+document.getElementById("pfA").value; F.b=+document.getElementById("pfB").value;
    F.juntas=[].slice.call(el.querySelectorAll("[data-pfj]:checked")).map(function(c){ return +c.value; }); F.soJuntas=document.getElementById("pfSoJ").checked;
    ["a","b"].forEach(function(l){ var rr=document.querySelector('input[name="pfT'+l+'"]:checked'); if(!rr) return; var esc0=rr.value==="esc"; F["t"+l]=esc0?[].slice.call(el.querySelectorAll('[data-pft="'+l+'"]:checked')).map(function(c){ return +c.value; }):[]; F["_esc"+l]=esc0; });
    F.modo=document.querySelector('input[name="pfM"]:checked').value; F.discs=[].slice.call(el.querySelectorAll("[data-pfd]:checked")).map(function(c){ return c.value; });
    F.dias=[].slice.call(el.querySelectorAll("[data-pfdia]:checked")).map(function(c){ return +c.dataset.pfdia; }); F.forca=document.getElementById("pfF").value; F.obs=document.getElementById("pfObs").value.trim(); };
  var re=function(){ ler(); renderParForm(); };
  ["pfA","pfB"].forEach(function(id){ document.getElementById(id).onchange=function(){ ler(); if(id==="pfA") F.ta=[]; else F.tb=[]; F.juntas=turmasEmComum(F.a,F.b); renderParForm(); }; });
  document.getElementById("pfJCom").onclick=function(){ ler(); F.juntas=turmasEmComum(F.a,F.b); renderParForm(); };
  document.getElementById("pfJNada").onclick=function(){ ler(); F.juntas=[]; renderParForm(); };
  document.getElementById("pfJTodas").onchange=function(){ ler(); F._todasj=this.checked; renderParForm(); };
  document.getElementById("pfSoJ").onchange=function(){ ler(); renderParForm(); };
  el.querySelectorAll('input[name="pfM"]').forEach(function(r){ r.onchange=re; });
  el.querySelectorAll("[data-pftodas]").forEach(function(c){ c.onchange=function(){ ler(); F["_todas"+c.dataset.pftodas]=c.checked; renderParForm(); }; });
  el.querySelectorAll("[data-pft]").forEach(function(c){ c.onchange=function(){ document.querySelector('input[name="pfT'+c.dataset.pft+'"][value="esc"]').checked=true; }; });
  document.getElementById("pfInv").onclick=function(){ ler(); var x=F.a; F.a=F.b; F.b=x; x=F.ta; F.ta=F.tb; F.tb=x; renderParForm(); };
  var bm=document.getElementById("pfMesmas"); if(bm) bm.onclick=function(){ ler(); F.tb=F.ta.slice(); F._todasb=true; renderParForm(); };
  var lc=document.getElementById("pfCancelar")||document.getElementById("pfLimpar"); lc.onclick=function(){ PFORM=null; renderParForm(); };
  document.getElementById("pfSalvar").onclick=function(){ ler(); var m=document.getElementById("pfMsg"), er=[];
    if(F.a===F.b) er.push("escolha dois professores diferentes");
    if(F.soJuntas&&!F.juntas.length) er.push("marque pelo menos uma turma em que eles trabalham juntos (ou desmarque “A regra vale só nessas turmas”)");
    if(F.soJuntas){ F.ta=F.juntas.slice(); F.tb=F.juntas.slice(); F._esca=F._escb=false; }
    if(F._esca&&!F.ta.length) er.push("marque pelo menos uma turma do 1º professor (ou escolha “Todas as turmas”)");
    if(F._escb&&!F.tb.length) er.push("marque pelo menos uma turma do 2º professor (ou escolha “Todas as turmas”)");
    if(F.modo==="disc"&&!F.discs.length) er.push("marque pelo menos uma disciplina");
    if(!F.dias.length) er.push("marque pelo menos um dia");
    if(er.length){ m.innerHTML='<div class="msg warn">Para salvar: '+esc(er.join("; "))+".</div>"; return; }
    var r=normPar(F,ST.profs.length,ST.turmas.length), d=descPar(r);
    if(F._i!=null){ ST.pares[F._i]=r; logar("Regras","Par alterado (não podem coincidir): "+d.quem+" — juntos em: "+d.juntas+"; "+d.turmas+"; "+d.aulas+"; "+d.dias+"; "+(r.forca==="rigida"?"rígida":"preferência")); }
    else { ST.pares.push(r); logar("Regras","Novo par (não podem coincidir): "+d.quem+" — juntos em: "+d.juntas+"; "+d.turmas+"; "+d.aulas+"; "+d.dias+"; "+(r.forca==="rigida"?"rígida":"preferência")); }
    PFORM=null; save(); CACHE=null; renderPares();
    document.getElementById("pfMsg").innerHTML='<div class="msg ok">Par salvo. Para a grade obedecer, use “Ajustar a grade atual” na aba Gerar.</div>'; };
}
