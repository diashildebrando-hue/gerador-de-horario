
// =====================================================================
// BACKUP: um arquivo com TODOS os dados (para guardar, levar a outro computador ou recuperar)
// =====================================================================
var BK_TIPO="gerador-horario-backup", BK_LIDO=null, BK_DIAS=7;
function bkHash(s){ var h=2166136261; for(var i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return ("0000000"+(h>>>0).toString(16)).slice(-8); }
function bkResumo(o){ var aulas=0; (o.grid||[]).forEach(function(row){ (row||[]).forEach(function(k){ if(k) aulas++; }); });
  return {profs:(o.profs||[]).filter(function(p){ return p&&p.nome!=="(excluído)"; }).length, turmas:(o.turmas||[]).filter(function(t){ return t&&!t.excluida; }).length, aulas:aulas,
    horarios:(o.tipos||[]).length, regras:(o.extras||[]).length+(o.pares||[]).length, ausencias:(o.ausencias||[]).length, hist:(o.hist||[]).length, grades:(o.snaps||[]).length,
    escolas:(o.externo&&o.externo.escolas||[]).length, ha:o.ha?Object.keys(o.ha).length:0}; }
var BK_ROT=[["profs","Professores"],["turmas","Turmas"],["aulas","Aulas na grade"],["horarios","Modelos de horário"],["regras","Regras adicionais e pares"],["ha","Professores com HA"],["ausencias","Ausências (aulas vagas)"],["grades","Grades guardadas"],["hist","Registros no Histórico"],["escolas","Outras escolas guardadas"]];
function bkUltimo(){ try{ return localStorage.getItem(KEY+"_ultBackup")||""; }catch(e){ return ""; } }
function bkDiasDesde(iso){ if(!iso) return null; return Math.floor((Date.now()-new Date(iso).getTime())/86400000); }
// texto curto para lembrar de fazer backup (aparece no topo da aba)
function bkLembrete(){ var u=bkUltimo(), d=bkDiasDesde(u);
  if(!u) return '<div class="msg warn">Ainda não foi feito nenhum backup neste computador. Clique em <b>Baixar backup agora</b> e guarde o arquivo num pen drive, no e-mail ou no Google Drive.</div>';
  if(d>=BK_DIAS) return '<div class="msg warn">O último backup foi há <b>'+d+' dias</b> ('+fmtData(u)+'). Que tal fazer um novo agora?</div>';
  return '<div class="msg ok">Último backup: <b>'+fmtData(u)+"</b>"+(d===0?" (hoje)":d===1?" (ontem)":" (há "+d+" dias)")+".</div>"; }
function bkNomeArquivo(){ var d=new Date(); return "backup-horario-"+instSlug()+"-"+hoje()+"-"+pad2(d.getHours())+"h"+pad2(d.getMinutes())+".json"; }
function bkMontar(){ var dados=JSON.stringify(ST);
  return '{"tipo":"'+BK_TIPO+'","formato":1,"programa":"Gerador de Horário","criado":'+JSON.stringify(agora())+',"escola":'+JSON.stringify(instNome())+',"quem":'+JSON.stringify(ST.ctx.quem||"")+
    ',"resumo":'+JSON.stringify(bkResumo(ST))+',"conferencia":"'+bkHash(dados)+'","dados":'+dados+"}"; }
function bkBaixar(){ var nome=bkNomeArquivo(), txt=bkMontar(), ok=false;
  try{ var blob=new Blob([txt],{type:"application/json"}), a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=nome; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); },1000); ok=true; }catch(e){}
  if(ok){ try{ localStorage.setItem(KEY+"_ultBackup",agora()); }catch(e){} logar("Backup","Backup baixado: "+nome+" ("+Math.max(1,Math.round(txt.length/1024))+" KB)"); save(); }
  if(cur==="backup") renderBackup();
  var b=document.getElementById("bkMsg"); if(b) b.innerHTML=ok?'<div class="msg ok">Backup “'+esc(nome)+'” baixado. Guarde este arquivo em lugar seguro: pen drive, e-mail ou Google Drive.</div>':'<div class="msg bad">Não foi possível baixar aqui. Abra o gerador direto no computador (arquivo .html) e tente de novo.</div>'; }
// lê o arquivo escolhido: aceita o backup novo e também o "arquivo de dados" antigo
function bkInterpretar(txt){ var o; try{ o=JSON.parse(txt); }catch(e){ return {erro:"Esse arquivo não é um backup do gerador (o conteúdo não pôde ser lido)."}; }
  if(!o||typeof o!=="object") return {erro:"Esse arquivo não é um backup do gerador."};
  var info={escola:"",criado:"",quem:"",antigo:false,conferido:null};
  if(o.tipo===BK_TIPO){ if(!o.dados||typeof o.dados!=="object") return {erro:"O backup está incompleto (faltam os dados)."};
    info.escola=String(o.escola||""); info.criado=String(o.criado||""); info.quem=String(o.quem||"");
    if(o.conferencia){ var m=txt.match(/"dados":([\s\S]*)\}\s*$/); info.conferido=m?bkHash(m[1])===o.conferencia:bkHash(JSON.stringify(o.dados))===o.conferencia; }
    o=o.dados; }
  else if(o.v===1||o.v===2) info.antigo=true;
  else return {erro:"Esse arquivo não é um backup do gerador. (Para cruzar o horário de outra escola, use Relatórios › Importar/Exportar.)"};
  var c=deep(o); if(c.v===1) conv1(c); if(c.v!==2||!sanear(c)) return {erro:"O backup está com problema e não pode ser usado. Nada foi mudado."};
  if(!info.escola&&c.inst) info.escola=c.inst.nome||c.inst.curto||"";
  return {info:info,dados:c,resumo:bkResumo(c)}; }
// coloca os dados do backup no lugar dos atuais (preenche o que faltar com o padrão)
function bkAplicar(o){
  var f0=freshState(); ["regras","ctx","aviso","haLocais","haLocPad","equip","histLimite","gridNome"].forEach(function(k){ if(o[k]==null) o[k]=f0[k]; });
  ["sep","intervalo","minBreak","max","two","par","late","cross","gap"].forEach(function(k){ if(o.regras[k]==null) o.regras[k]=f0.regras[k]; });
  if(!o.aviso.anexos) o.aviso.anexos=f0.aviso.anexos; if(!o.aviso.anexos.gerais) o.aviso.anexos.gerais={}; if(!o.aviso.edits) o.aviso.edits={}; if(!o.aviso.enviados) o.aviso.enviados={};
  ["tipos","extras","locks","hist","snaps","ausencias","externo"].forEach(function(k){ if(o[k]==null) o[k]=f0[k]; });
  if(o.baseVersao==null) o.baseVersao=BASE.versao||"28/09";
  ST=o; ST.turmas.forEach(function(T,t){ ajustarTamanho(t); }); if(!ST.aviso.baseP) ST.aviso.baseP=basePorProf(ST.aviso.base||ST.grid);
  recarregar(); }
function renderBackup(){
  var R=bkResumo(ST), el=document.getElementById("bkInfo");
  document.getElementById("bkLembrete").innerHTML=bkLembrete();
  el.innerHTML='<table class="t" style="width:auto"><tr><th>O que vai no backup</th><th class="right">Agora</th></tr>'+BK_ROT.map(function(r){ return "<tr><td>"+r[1]+'</td><td class="num right">'+R[r[0]]+"</td></tr>"; }).join("")+
    "<tr><td>Instituição, Avisos (mensagens e envios), Equipamentos, cores e configurações</td><td class=\"right\">✓</td></tr></table>";
  var ant=null; try{ ant=localStorage.getItem(KEY+"_antesRestaurar"); }catch(e){}
  var bd=document.getElementById("bkDesfazerBox"); bd.innerHTML=ant?'<div class="msg info">Há uma cópia de como estava <b>antes da última restauração</b>. <button class="btn sm" id="bkDesfazer">Desfazer a restauração</button></div>':"";
  var bu=document.getElementById("bkDesfazer"); if(bu) bu.onclick=bkDesfazer;
  renderBkLido(); }
function renderBkLido(){ var box=document.getElementById("bkLido"); if(!BK_LIDO){ box.innerHTML=""; return; }
  var L=BK_LIDO, A=bkResumo(ST), I=L.info, h='<div class="impgrp"><h4>Backup escolhido: '+esc(L.arquivo)+"</h4>";
  h+='<p style="margin:4px 0">'+(I.escola?"Escola: <b>"+esc(I.escola)+"</b>. ":"")+(I.criado&&!isNaN(new Date(I.criado))?"Feito em <b>"+esc(fmtData(I.criado))+"</b>"+(bkDiasDesde(I.criado)>0?" (há "+bkDiasDesde(I.criado)+" dias)":" (hoje)")+". ":"")+(I.quem?"Por: "+esc(I.quem)+".":"")+"</p>";
  if(I.antigo) h+='<p class="small">Este é um “arquivo de dados” da versão anterior. Ele também pode ser restaurado.</p>';
  if(I.conferido===false) h+='<div class="msg warn">Atenção: o conteúdo deste backup foi alterado depois de ser feito (fora do gerador). Ele ainda pode ser usado, mas confira os dados depois de restaurar.</div>';
  else if(I.conferido===true) h+='<p class="small">✓ Conferido: o arquivo está inteiro, do jeito que foi salvo.</p>';
  if(I.escola&&normNome(I.escola)!==normNome(instNome())) h+='<div class="msg warn">Este backup é de <b>'+esc(I.escola)+"</b>, e aqui está cadastrada <b>"+esc(instNome())+"</b>. Confira se é o arquivo certo.</div>";
  h+='<div class="scroll"><table class="t" style="width:auto"><tr><th>Item</th><th class="right">Aqui agora</th><th class="right">No backup</th></tr>'+BK_ROT.map(function(r){ var a=A[r[0]], b=L.resumo[r[0]];
    return "<tr><td>"+r[1]+'</td><td class="num right">'+a+'</td><td class="num right"'+(a!==b?' style="font-weight:700"':"")+">"+b+"</td></tr>"; }).join("")+"</table></div>";
  h+='<div class="msg info">Ao restaurar, <b>tudo o que está aqui agora é trocado</b> pelo conteúdo do backup. Antes, o gerador guarda uma cópia de como está, para você poder desfazer.</div>';
  h+='<div class="row" style="margin-top:8px"><button class="btn pri" id="bkRestaurar">Restaurar este backup</button><button class="btn" id="bkAntes">Baixar antes um backup do que está aqui</button><button class="btn" id="bkCancelar">Cancelar</button></div>';
  box.innerHTML=h+"</div>";
  document.getElementById("bkCancelar").onclick=function(){ BK_LIDO=null; renderBkLido(); document.getElementById("bkMsg").innerHTML=""; };
  document.getElementById("bkAntes").onclick=bkBaixar;
  var br=document.getElementById("bkRestaurar"); br.onclick=function(){ if(br.dataset.arm!=="1"){ br.dataset.arm="1"; br.textContent="Clique de novo para confirmar"; setTimeout(function(){ if(br.isConnected){ br.dataset.arm=""; br.textContent="Restaurar este backup"; } },5000); return; } bkRestaurar(); }; }
function bkRestaurar(){ var L=BK_LIDO, antes=JSON.stringify(ST), guardou=true, msg=document.getElementById("bkMsg");
  try{ localStorage.setItem(KEY+"_antesRestaurar",antes); }catch(e){ guardou=false; }
  var velho=ST;
  try{ bkAplicar(deep(L.dados)); }catch(e){ ST=velho; recarregar(); msg.innerHTML='<div class="msg bad">Não foi possível restaurar este backup. Nada foi mudado.</div>'; return; }
  logar("Backup","Backup restaurado: "+L.arquivo+(L.info.criado&&!isNaN(new Date(L.info.criado))?" (feito em "+fmtData(L.info.criado)+")":"")); save();
  BK_LIDO=null; show("backup");
  document.getElementById("bkMsg").innerHTML='<div class="msg ok">Backup restaurado. Os dados agora são os do arquivo “'+esc(L.arquivo)+'”.'+(guardou?" Se precisar, use “Desfazer a restauração”.":" (Não coube guardar a cópia de antes neste navegador.)")+"</div>"; }
function bkDesfazer(){ var s=null; try{ s=localStorage.getItem(KEY+"_antesRestaurar"); }catch(e){} if(!s) return; var velho=ST, msg=document.getElementById("bkMsg");
  try{ var o=JSON.parse(s); if(!o||o.v!==2||!sanear(o)) throw 0; bkAplicar(o); }catch(e){ ST=velho; recarregar(); msg.innerHTML='<div class="msg bad">Não foi possível desfazer.</div>'; return; }
  try{ localStorage.removeItem(KEY+"_antesRestaurar"); }catch(e){}
  logar("Backup","Restauração desfeita: os dados voltaram a ser os de antes"); save(); show("backup");
  document.getElementById("bkMsg").innerHTML='<div class="msg ok">Pronto: os dados voltaram a ser como estavam antes da restauração.</div>'; }
document.getElementById("bkBaixar").onclick=bkBaixar;
document.getElementById("bkArqLbl").onkeydown=function(e){ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); document.getElementById("bkArq").click(); } };
document.getElementById("bkArq").onchange=function(e){ var f=e.target.files[0], el=e.target, msg=document.getElementById("bkMsg"); BK_LIDO=null; renderBkLido(); if(!f) return;
  if(f.size>60*1024*1024){ msg.innerHTML='<div class="msg bad">Arquivo muito grande para ser um backup do gerador.</div>'; el.value=""; return; }
  var r=new FileReader(); r.onload=function(){ var x=bkInterpretar(String(r.result)); el.value="";
    if(x.erro){ msg.innerHTML='<div class="msg bad">'+esc(x.erro)+"</div>"; return; }
    msg.innerHTML=""; BK_LIDO={arquivo:f.name,info:x.info,dados:x.dados,resumo:x.resumo}; renderBkLido(); };
  r.onerror=function(){ msg.innerHTML='<div class="msg bad">Não foi possível ler o arquivo.</div>'; el.value=""; };
  r.readAsText(f); };
