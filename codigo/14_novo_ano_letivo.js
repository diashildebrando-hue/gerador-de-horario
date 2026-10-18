
// =====================================================================
// NOVO ANO LETIVO: limpa o que é do ano que passou e mantém o essencial
// (antes de tudo baixa um backup completo; dá para desfazer)
// =====================================================================
var NA_ARM=false;
function naAnoSugerido(){ var d=new Date(); return d.getMonth()>=6?d.getFullYear()+1:d.getFullYear(); }
// a grade guardada dentro do arquivo é mais nova que o "novo ano"? (só então ela pode substituir a grade em uso)
function naBaseMaisNova(){ if(!ST.novoAno) return true; var m=String(BASE.versao||"").match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/); if(!m) return false;
  return new Date(+m[3],+m[2]-1,+m[1]).getTime()>new Date(ST.novoAno.ts).getTime(); }
function naMostrar(){
  var box=document.getElementById("naBox"), ps=profsOrdem(), cnt=ST.profs.map(function(){ return 0; }); ST.matriz.forEach(function(r){ cnt[r.p]+=r.n; });
  if(ST.edicao){ box.innerHTML='<div class="msg warn">Há uma edição da grade aberta. Termine (Salvar ou Cancelar) na aba Grade antes de começar o novo ano.</div>'; return; }
  var ck=function(id,txt,on,dica){ return '<label class="chk" style="display:block;margin:3px 0"><input type="checkbox" id="'+id+'"'+(on?" checked":"")+"> "+txt+(dica?' <span class="small">— '+dica+"</span>":"")+"</label>"; };
  box.innerHTML='<div class="impgrp" style="margin-top:8px">'+
    '<label>Ano letivo novo<br><input type="number" id="naAno" min="2020" max="2100" value="'+naAnoSugerido()+'" style="width:90px"></label>'+
    '<p style="margin:10px 0 2px"><b>O que continua</b> (o essencial já vem marcado)</p>'+
    '<label class="chk" style="display:block;margin:3px 0"><input type="checkbox" checked disabled> Dados da instituição, horários das aulas, siglas, cores e configurações de impressão</label>'+
    '<label class="chk" style="display:block;margin:3px 0"><input type="checkbox" checked disabled> Turmas <span class="small">— nome, horário e número de alunos; depois, na aba Turmas, você exclui as que acabaram e cadastra as novas</span></label>'+
    ck("naRegras","Regras da escola",true,"as regras gerais e as regras adicionais que valem para todos")+
    ck("naEquip","Equipamentos e locais de hora-atividade",true,"quantidades, prioridades e locais")+
    ck("naMatriz","Quem dá cada disciplina em cada turma",false,"só dos professores que continuam; desmarcado = a coordenação lança de novo")+
    ck("naInd","Horários e pedidos de cada professor",false,"desmarcado = cada um preenche o formulário de novo")+
    ck("naHist","Histórico de mudanças",true,"fica guardado; o backup também tem tudo")+
    '<p style="margin:10px 0 2px"><b>Professores que continuam</b> ('+ps.length+') — desmarque quem saiu. Quem continua mantém nome, nome completo, e-mail, celular e cor.</p>'+
    '<div class="row" style="margin:4px 0"><button class="btn sm" id="naTodos">Marcar todos</button><button class="btn sm" id="naNenhum">Desmarcar todos</button></div>'+
    '<div class="chiplist" style="max-height:180px">'+ps.map(function(i){ return '<label><input type="checkbox" data-nap="'+i+'" checked> '+esc(ST.profs[i].nome)+' <span class="small">('+cnt[i]+" aulas)</span></label>"; }).join("")+"</div>"+
    '<p class="small" style="margin:10px 0 4px"><b>Sempre começam vazios no ano novo:</b> a grade, a hora-atividade, os equipamentos da grade, as aulas vagas e ausências, os avisos, os horários de outras escolas, as grades anteriores, as aulas travadas, os pares de professores e as respostas do formulário. Tudo isso fica no backup que o gerador baixa antes.</p>'+
    '<div class="row" style="margin-top:8px"><button class="btn sm pri" id="naIr">Baixar o backup e começar o novo ano</button><button class="btn sm" id="naCanc">Cancelar</button></div><div id="naMsg" aria-live="polite"></div></div>';
  document.getElementById("naTodos").onclick=function(){ box.querySelectorAll("[data-nap]").forEach(function(c){ c.checked=true; }); };
  document.getElementById("naNenhum").onclick=function(){ box.querySelectorAll("[data-nap]").forEach(function(c){ c.checked=false; }); };
  document.getElementById("naCanc").onclick=function(){ NA_ARM=false; box.innerHTML=""; };
  document.getElementById("naIr").onclick=function(){ var ano=+document.getElementById("naAno").value, msg=document.getElementById("naMsg");
    if(!(ano>=2020&&ano<=2100)){ msg.innerHTML='<div class="msg warn">Escreva o ano letivo (ex.: '+naAnoSugerido()+").</div>"; return; }
    var cfg={ano:ano,turmas:true,regras:document.getElementById("naRegras").checked,equip:document.getElementById("naEquip").checked,
      matriz:document.getElementById("naMatriz").checked,ind:document.getElementById("naInd").checked,hist:document.getElementById("naHist").checked,
      ficam:[].slice.call(box.querySelectorAll("[data-nap]:checked")).map(function(c){ return +c.dataset.nap; })};
    if(!NA_ARM){ NA_ARM=true; this.textContent="Confirmar: começar "+ano;
      msg.innerHTML='<div class="msg warn">Confira antes de confirmar: continuam <b>'+cfg.ficam.length+"</b> de "+ps.length+" professores e as turmas. A grade de agora vai para o backup e fica vazia aqui. Clique de novo para confirmar.</div>"; return; }
    naAplicar(cfg); };
}
function naAplicar(cfg){
  var msg=document.getElementById("naMsg");
  // 1) backup completo antes de mexer em qualquer coisa
  if(!bkBaixar()){ msg.innerHTML='<div class="msg bad">Não consegui baixar o backup, então nada foi mudado. Abra o gerador direto no computador (arquivo .html) e tente de novo.</div>'; NA_ARM=false; return; }
  var antes=JSON.stringify(ST), guardou=true; try{ localStorage.setItem(KEY+"_antesNovoAno",antes); }catch(e){ guardou=false; }
  var O=ST, f=freshState(), mapa={}, novos=[];
  // 2) professores que continuam (renumerados)
  cfg.ficam.slice().sort(function(a,b){ return a-b; }).forEach(function(i){ var p=O.profs[i]; if(!p||p.nome==="(excluído)") return; mapa[i]=novos.length;
    novos.push({nome:p.nome,completo:p.completo||"",cor:p.cor,corEsc:p.corEsc||"#333",email:p.email||"",cel:p.cel||"",
      ind:cfg.ind?deep(p.ind||{}):{},maxDia:cfg.ind?p.maxDia:null,concentrar:cfg.ind?!!p.concentrar:false,haManual:cfg.ind?p.haManual:null,obs:cfg.ind?(p.obs||""):""}); });
  var rp=function(i){ return mapa[i]; };
  var turmas=cfg.turmas?O.turmas.filter(function(t){ return !t.excluida; }).map(function(t){ return deep(t); }):[];
  var tmap={}; if(cfg.turmas){ var j=0; O.turmas.forEach(function(t,i){ if(!t.excluida) tmap[i]=j++; }); }
  var matriz=cfg.matriz&&cfg.turmas?O.matriz.filter(function(r){ return rp(r.p)!=null&&tmap[r.t]!=null; }).map(function(r){ var o={t:tmap[r.t],disc:r.disc,p:rp(r.p),doc2:!!r.doc2,n:r.n}; if(r.p2!=null&&rp(r.p2)!=null) o.p2=rp(r.p2); return o; }):[];
  var extras=cfg.regras?(O.extras||[]).filter(function(r){ return r.fonte!=="formulario"&&(r.p==null||r.p<0||(cfg.ind&&rp(r.p)!=null)); }).map(function(r){ var x=deep(r); if(x.p!=null&&x.p>=0) x.p=rp(x.p); return x; }):[];
  var pares=cfg.ind?(O.pares||[]).filter(function(r){ return rp(r.a)!=null&&rp(r.b)!=null; }).map(function(r){ var x=deep(r); x.a=rp(r.a); x.b=rp(r.b); x.ta=[]; x.tb=[]; x.juntas=null; x.soJuntas=false; return x; }):[];
  var hlp={}; if(cfg.equip&&cfg.ind) Object.keys(O.haLocPad||{}).forEach(function(k){ if(rp(+k)!=null) hlp[rp(+k)]=O.haLocPad[k]; });
  var E=O.externo||{}, A=O.aviso||{};
  var N={v:2, turmas:turmas, profs:novos, matriz:matriz, pares:pares, siglas:deep(O.siglas||{}), regras:cfg.regras?deep(O.regras):f.regras, tipos:deep(O.tipos),
    extras:extras, locks:{}, hist:cfg.hist?O.hist:[], snaps:[], histLimite:O.histLimite, ctx:O.ctx,
    haLocais:cfg.equip?deep(O.haLocais||f.haLocais):f.haLocais, haLocPad:hlp,
    aviso:{base:null,baseTs:null,msg:A.msg||null,edits:{},enviados:{},anexos:deep(A.anexos||f.aviso.anexos),rem:A.rem||f.aviso.rem,data:""},
    equip:cfg.equip?deep(O.equip):f.equip, grid:turmas.map(function(){ return []; }), gridNome:"Ano letivo "+cfg.ano+" (em montagem)", ha:null, eq:null,
    externo:{usar:E.usar!==false,margem:E.margem==null?20:E.margem,escolas:[]}, inst:O.inst, ausencias:[], pvistos:{}, formRespostas:[],
    visual:O.visual, compacto:O.compacto, imp:(function(){ var m=deep(O.imp||{}); m.profs={}; m.turmas={}; return m; })(), baseVersao:O.baseVersao,
    novoAno:{ano:cfg.ano,ts:agora(),antes:O.gridNome||"",profsAntes:O.profs.filter(function(p){ return p.nome!=="(excluído)"; }).length,profsFicam:novos.length}};
  ST=N; ST.turmas.forEach(function(tm,t){ ST.grid[t]=new Array(nA(t)*5).fill(null); });
  ST.aviso.base=deep(ST.grid); ST.aviso.baseTs=agora(); ST.aviso.baseP=basePorProf(ST.grid);
  logar("Novo ano letivo","Começou o ano letivo "+cfg.ano+". Continuaram "+novos.length+" de "+N.novoAno.profsAntes+" professores"+(cfg.turmas?", "+turmas.length+" turmas":", sem turmas")+(cfg.matriz?" e a distribuição das aulas":"")+". A grade anterior (“"+N.novoAno.antes+"”) ficou no backup baixado.",{motivo:"Novo ano letivo"});
  save(); NA_ARM=false; recarregar(); show("backup");
  document.getElementById("bkMsg").innerHTML='<div class="msg ok">Pronto: começou o ano letivo '+cfg.ano+'. O backup do ano anterior foi baixado — guarde esse arquivo. Próximos passos: confira as turmas, cadastre os professores novos, mande o formulário aos professores e lance as aulas de cada turma.'+(guardou?"":" (Não deu para guardar uma cópia para desfazer aqui; se precisar voltar, recupere o backup baixado.)")+"</div>";
}
function naDesfazer(){ var s=null; try{ s=localStorage.getItem(KEY+"_antesNovoAno"); }catch(e){} if(!s) return; var velho=ST, msg=document.getElementById("bkMsg");
  try{ var o=JSON.parse(s); if(!o||o.v!==2||!sanear(o)) throw 0; bkAplicar(o); }catch(e){ ST=velho; recarregar(); msg.innerHTML='<div class="msg bad">Não foi possível desfazer. Recupere o backup baixado antes do novo ano.</div>'; return; }
  try{ localStorage.removeItem(KEY+"_antesNovoAno"); }catch(e){}
  logar("Novo ano letivo","Novo ano desfeito: os dados voltaram a ser os do ano anterior"); save(); show("backup");
  document.getElementById("bkMsg").innerHTML='<div class="msg ok">Pronto: os dados voltaram a ser os de antes do novo ano.</div>'; }
function naRender(){
  var el=document.getElementById("naDesf"); if(!el) return; var tem=null; try{ tem=localStorage.getItem(KEY+"_antesNovoAno"); }catch(e){}
  el.innerHTML=ST.novoAno?'<p class="small" style="margin:6px 0 0">Ano letivo atual: <b>'+esc(ST.novoAno.ano)+"</b> (começado em "+esc(fmtData(ST.novoAno.ts))+")."+(tem?' <button class="btn sm" id="naDesfBtn">Desfazer o novo ano</button>':"")+"</p>":"";
  var b=document.getElementById("naDesfBtn"); if(b) b.onclick=function(){ if(b.dataset.arm!=="1"){ b.dataset.arm="1"; b.textContent="Confirmar: desfazer"; return; } naDesfazer(); };
}
document.getElementById("naComecar").onclick=naMostrar;
