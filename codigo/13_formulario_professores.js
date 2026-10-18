
// =====================================================================
// FORMULÁRIO DOS PROFESSORES (Google Formulários)
// 1) o gerador escreve um script que cria o formulário na conta Google da escola
//    (o professor recebe um comprovante por e-mail, com número de protocolo);
// 2) as respostas ficam numa planilha; baixada em .csv, o gerador importa sozinho.
// =====================================================================
var FM_DIAS=["Segunda","Terça","Quarta","Quinta","Sexta"];
var FM_OPC=["Posso","Prefiro evitar","Não posso","Estou em outra escola"];
var FM_T={nome:"Nome completo",curto:"Nome como aparece na grade",cel:"Celular (WhatsApp)",outra:"Nome da outra escola",semana:"Como você prefere as aulas na semana?",
  maxdia:"Máximo de aulas por dia nesta escola",livre:"Gostaria de ter pelo menos 1 dia sem aula nesta escola?",gem:"Aulas geminadas (2 aulas seguidas na mesma turma)",
  ha:"Pedidos para a hora-atividade (HA)",obs:"Observações",conf:"Confirmação"};
var FM_PREV=null;

// aulas de cada período (manhã, tarde...) somando os tipos de horário em uso: a aula vai do início mais cedo ao fim mais tarde
function fmPeriodos(){ var P={};
  ST.tipos.forEach(function(tp){ if(!ST.turmas.some(function(t){ return t.tipo===tp.id&&!t.excluida; })) return; var L=P[tp.periodo]=P[tp.periodo]||[];
    tp.aulas.forEach(function(h,a){ var i=toMin(h[0]), f=toMin(h[1]); if(!L[a]) L[a]=[i,f]; else { L[a][0]=Math.min(L[a][0],i); L[a][1]=Math.max(L[a][1],f); } }); });
  return PERIODOS.filter(function(p){ return P[p]; }).map(function(p){ return {nome:p,aulas:P[p]}; }); }
function fmRotulo(a,x){ return (a+1)+"ª aula ("+hmP(x[0])+"–"+hmP(x[1])+")"; }
function fmNomeEscola(){ var I=ST.inst||{}; return String(I.nome||I.nomeCurto||document.title||"Escola").replace(/^Gerador de Horário\s*—\s*/,""); }
function fmSemAcento(s){ return String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toUpperCase().replace(/\s+/g," ").trim(); }
// mesmo número de protocolo que o script põe no e-mail (data e hora do envio + um código do e-mail)
function fmProtocolo(dt,email){ var s=dt.getFullYear()+pad2(dt.getMonth()+1)+pad2(dt.getDate())+"-"+pad2(dt.getHours())+pad2(dt.getMinutes())+pad2(dt.getSeconds()), h=0, e=String(email||"").toLowerCase();
  for(var i=0;i<e.length;i++) h=(h*31+e.charCodeAt(i))%9000; return s+"-"+(1000+h); }

// ---------- 1) script que cria o formulário ----------
function fmScript(){
  var per=fmPeriodos().map(function(p){ return {nome:p.nome,rotulos:p.aulas.map(function(x,a){ return fmRotulo(a,x); })}; });
  var cfg={escola:fmNomeEscola(),ano:new Date().getFullYear(),periodos:per,dias:FM_DIAS,opcoes:FM_OPC,t:FM_T};
  return [
"/**",
" * Cria o formulário \"Pedido de horário\" para os professores — Gerador de Horário (software livre, GPL-3.0).",
" * Como usar: na conta Google da escola, abra script.google.com > Novo projeto, apague tudo, cole este texto,",
" * clique em Salvar e depois em Executar (função criarFormulario). Na 1ª vez o Google pede autorização.",
" * Os links do formulário e da planilha aparecem em \"Registro de execução\".",
" */",
"var CFG = "+JSON.stringify(cfg,null,1)+";",
"",
"function criarFormulario() {",
"  var T = CFG.t;",
"  var form = FormApp.create('Pedido de horário — ' + CFG.escola + ' — ' + CFG.ano);",
"  form.setDescription('Preencha quando você pode dar aula e os seus pedidos para o horário de ' + CFG.ano + '. ' +",
"    'As turmas e disciplinas continuam com a coordenação. Ao enviar, você recebe um comprovante por e-mail com o número do protocolo. ' +",
"    'Se precisar mudar algo, é só responder de novo: vale o último envio, e os anteriores ficam guardados no histórico.');",
"  form.setCollectEmail(true);",
"  try { form.setRequireLogin(true); } catch (e) {}   // só quem entra com a conta da escola",
"  form.setAllowResponseEdits(false);",
"  form.setConfirmationMessage('Pedido recebido. Você vai receber o comprovante por e-mail em alguns minutos.');",
"  form.addTextItem().setTitle(T.nome).setRequired(true);",
"  form.addTextItem().setTitle(T.curto).setHelpText('Ex.: o apelido ou nome curto que aparece no horário. Se não souber, deixe em branco.');",
"  form.addTextItem().setTitle(T.cel).setHelpText('Com DDD. Ex.: (41) 98401-6030');",
"  CFG.periodos.forEach(function (p) {",
"    form.addPageBreakItem().setTitle('Quando você pode dar aula — ' + p.nome)",
"      .setHelpText('Para cada aula de cada dia, marque uma opção. Em branco conta como \"Posso\".');",
"    CFG.dias.forEach(function (d) {",
"      form.addGridItem().setTitle(d + '-feira — ' + p.nome).setRows(p.rotulos).setColumns(CFG.opcoes);",
"    });",
"  });",
"  form.addPageBreakItem().setTitle('Pedidos');",
"  form.addTextItem().setTitle(T.outra).setHelpText('Só se você marcou \"Estou em outra escola\" em algum horário.');",
"  form.addMultipleChoiceItem().setTitle(T.semana).setChoiceValues(['Concentrar em menos dias', 'Espalhar pela semana', 'Tanto faz']);",
"  var num = FormApp.createTextValidation().requireNumberBetween(1, 12).setHelpText('Um número de 1 a 12, ou deixe em branco.').build();",
"  form.addTextItem().setTitle(T.maxdia).setHelpText('Deixe em branco se não tiver limite.').setValidation(num);",
"  form.addMultipleChoiceItem().setTitle(T.livre).setChoiceValues(['Sim', 'Tanto faz']);",
"  form.addMultipleChoiceItem().setTitle(T.gem).setChoiceValues(['Prefiro geminadas', 'Prefiro não ter geminadas', 'Tanto faz']);",
"  form.addParagraphTextItem().setTitle(T.ha);",
"  form.addParagraphTextItem().setTitle(T.obs);",
"  form.addCheckboxItem().setTitle(T.conf).setChoiceValues(['Confirmo que as informações acima estão corretas']).setRequired(true);",
"  var ss = SpreadsheetApp.create('Respostas — ' + form.getTitle());",
"  ss.setSpreadsheetTimeZone('America/Sao_Paulo');",
"  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());",
"  ScriptApp.newTrigger('enviarComprovante').forForm(form).onFormSubmit().create();",
"  Logger.log('Link para enviar aos professores: ' + form.getPublishedUrl());",
"  Logger.log('Editar o formulário: ' + form.getEditUrl());",
"  Logger.log('Planilha de respostas: ' + ss.getUrl());",
"}",
"",
"function protocolo(ts, email) {",
"  var s = Utilities.formatDate(ts, 'America/Sao_Paulo', 'yyyyMMdd-HHmmss'), h = 0;",
"  email = String(email || '').toLowerCase();",
"  for (var i = 0; i < email.length; i++) h = (h * 31 + email.charCodeAt(i)) % 9000;",
"  return s + '-' + (1000 + h);",
"}",
"function esc(s) { return String(s == null ? '' : s).replace(/[&<>\"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' }[c]; }); }",
"",
"// manda o comprovante para o professor assim que ele envia o formulário",
"function enviarComprovante(e) {",
"  var r = e.response, email = r.getRespondentEmail();",
"  if (!email) return;",
"  var ts = r.getTimestamp(), prot = protocolo(ts, email), linhas = [];",
"  r.getItemResponses().forEach(function (ir) {",
"    var it = ir.getItem(), v = ir.getResponse();",
"    if (it.getType() == FormApp.ItemType.GRID) {",
"      var rows = it.asGridItem().getRows();",
"      v = rows.map(function (rw, i) { return esc(rw) + ': <b>' + esc((v && v[i]) || 'Posso') + '</b>'; }).join('<br>');",
"    } else v = esc(Array.isArray(v) ? v.join(', ') : v);",
"    linhas.push('<tr><td style=\"padding:4px 8px;border:1px solid #ccc;vertical-align:top\">' + esc(it.getTitle()) + '</td><td style=\"padding:4px 8px;border:1px solid #ccc\">' + v + '</td></tr>');",
"  });",
"  var quando = Utilities.formatDate(ts, 'America/Sao_Paulo', \"dd/MM/yyyy 'às' HH:mm\");",
"  MailApp.sendEmail({",
"    to: email,",
"    subject: 'Comprovante do pedido de horário — protocolo ' + prot,",
"    htmlBody: '<p>Olá! Recebemos o seu pedido de horário em ' + quando + '.</p>' +",
"      '<p><b>Protocolo: ' + prot + '</b></p>' +",
"      '<p>Guarde este e-mail: ele é o comprovante do que você pediu. Se precisar mudar algo, responda o formulário de novo.</p>' +",
"      '<table style=\"border-collapse:collapse;font-size:13px\">' + linhas.join('') + '</table>' +",
"      '<p style=\"color:#666;font-size:12px\">' + esc(CFG.escola) + ' — Gerador de Horário.</p>'",
"  });",
"}",""].join("\n"); }

function fmMostrarCriar(){
  var box=document.getElementById("fmBox"), sc=fmScript(), per=fmPeriodos();
  box.innerHTML='<div class="impgrp" style="margin-top:8px"><p style="margin:0 0 6px"><b>Como criar o formulário (uma vez só)</b></p><ol class="small" style="margin:0 0 8px;padding-left:18px">'+
    '<li>Entre na <b>conta Google da escola</b> e abra <b>script.google.com</b> › <b>Novo projeto</b>.</li>'+
    '<li>Apague o que estiver escrito, <b>cole o script</b> (botão abaixo) e clique em <b>Salvar</b>.</li>'+
    '<li>Clique em <b>Executar</b>. Na primeira vez o Google pede autorização: clique em <b>Revisar permissões</b> e permita.</li>'+
    '<li>Em <b>Registro de execução</b> aparecem 3 links: o do formulário (para mandar aos professores), o de editar e o da planilha de respostas.</li>'+
    '<li>Mande o link do formulário aos professores. Cada um recebe um <b>comprovante por e-mail</b> com o número do protocolo.</li></ol>'+
    '<p class="small" style="margin:0 0 6px">O formulário usa os horários de hoje ('+per.map(function(p){ return p.nome.toLowerCase()+": "+p.aulas.length+" aulas"; }).join(", ")+'). Se os horários mudarem, crie um formulário novo.</p>'+
    '<div class="row"><button class="btn sm pri" id="fmCopiar">Copiar o script</button><button class="btn sm" id="fmBaixar">Baixar o script (.txt)</button></div>'+
    '<textarea id="fmTxt" readonly aria-label="Script do formulário" style="width:100%;height:140px;margin-top:6px;font-family:monospace;font-size:11px">'+esc(sc)+'</textarea><div id="fmMsg"></div></div>';
  document.getElementById("fmCopiar").onclick=function(){ var t=document.getElementById("fmTxt"), m=document.getElementById("fmMsg");
    var ok=function(){ m.innerHTML='<div class="msg ok">Script copiado. Agora cole no script.google.com.</div>'; };
    try{ navigator.clipboard.writeText(sc).then(ok,function(){ t.select(); document.execCommand("copy"); ok(); }); }catch(e){ t.select(); try{ document.execCommand("copy"); ok(); }catch(e2){ m.innerHTML='<div class="msg warn">Não deu para copiar sozinho. Selecione o texto e use Ctrl+C.</div>'; } } };
  document.getElementById("fmBaixar").onclick=function(){ baixar("script-formulario-professores.txt",sc,"text/plain;charset=utf-8"); };
}

// ---------- 2) importar as respostas (.csv baixado da planilha) ----------
function fmCSV(txt){ var out=[], row=[], f="", q=false; txt=String(txt).replace(/^﻿/,"");
  for(var i=0;i<txt.length;i++){ var c=txt[i];
    if(q){ if(c==='"'){ if(txt[i+1]==='"'){ f+='"'; i++; } else q=false; } else f+=c; continue; }
    if(c==='"') q=true; else if(c===","){ row.push(f); f=""; } else if(c==="\n"){ row.push(f); out.push(row); row=[]; f=""; } else if(c!=="\r") f+=c; }
  if(f!==""||row.length){ row.push(f); out.push(row); }
  return out.filter(function(r){ return r.some(function(x){ return String(x).trim()!==""; }); }); }
function fmData(s){ var m=String(s||"").match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/); if(m) return new Date(+m[3],+m[2]-1,+m[1],+m[4],+m[5],+(m[6]||0));
  m=String(s||"").match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):?(\d{2})?/); if(m) return new Date(+m[1],+m[2]-1,+m[3],+m[4],+m[5],+(m[6]||0)); return null; }
function fmLer(txt){
  var R=fmCSV(txt); if(R.length<2) return {erro:"O arquivo não tem respostas."};
  var H=R[0].map(function(h){ return String(h).trim(); }), col={}, grade=[], per=fmPeriodos();
  var acha=function(ini){ for(var i=0;i<H.length;i++) if(H[i].indexOf(ini)===0) return i; return -1; };
  col.ts=0; col.email=-1; H.forEach(function(h,i){ if(/e-?mail/i.test(h)&&col.email<0) col.email=i; });
  Object.keys(FM_T).forEach(function(k){ col[k]=acha(FM_T[k]); });
  if(col.nome<0) return {erro:"Não achei a coluna “"+FM_T.nome+"”. Confira se o arquivo é a planilha de respostas do formulário criado por este gerador."};
  H.forEach(function(h,i){ var m=h.match(/^(Segunda|Terça|Quarta|Quinta|Sexta)-feira — (.+?) \[(\d+)ª aula/); if(!m) return; var pp=per.filter(function(p){ return p.nome===m[2]; })[0], a=+m[3]-1;
    if(pp&&pp.aulas[a]) grade.push({i:i,d:FM_DIAS.indexOf(m[1]),ini:pp.aulas[a][0],fim:pp.aulas[a][1],per:pp.nome,a:a}); });
  if(!grade.length) return {erro:"Não achei as perguntas de horário (Segunda-feira — Manhã…). Os horários da escola podem ter mudado depois que o formulário foi criado."};
  var resp=R.slice(1).map(function(r){ var g=function(k){ return col[k]>=0?String(r[col[k]]||"").trim():""; }, ts=fmData(r[col.ts]);
    var email=col.email>=0?String(r[col.email]||"").trim():"";
    return {ts:ts, tsTxt:String(r[col.ts]||""), email:email, protocolo:ts?fmProtocolo(ts,email):"", nome:g("nome"), curto:g("curto"), cel:g("cel"), outra:g("outra"), semana:g("semana"), maxdia:g("maxdia"), livre:g("livre"), gem:g("gem"), ha:g("ha"), obs:g("obs"),
      horas:grade.map(function(x){ var v=String(r[x.i]||"").trim(); return {d:x.d,ini:x.ini,fim:x.fim,per:x.per,a:x.a,v:v===FM_OPC[1]?1:v===FM_OPC[2]?2:v===FM_OPC[3]?4:0}; })}; }).filter(function(x){ return x.nome||x.email; });
  // vale o último envio de cada professor; os outros ficam no histórico
  var por={}; resp.forEach(function(x){ var k=(x.email||fmSemAcento(x.nome)).toLowerCase(); (por[k]=por[k]||[]).push(x); });
  var lista=Object.keys(por).map(function(k){ var L=por[k].sort(function(a,b){ return (a.ts||0)-(b.ts||0); }); var u=L[L.length-1]; u.envios=L.length; return u; });
  return {lista:lista,todas:resp}; }
function fmAchar(x){ var c=fmSemAcento(x.curto), n=fmSemAcento(x.nome), e=String(x.email||"").toLowerCase(), r=-1;
  ST.profs.forEach(function(p,i){ if(r>=0||p.nome==="(excluído)") return; if(c&&fmSemAcento(p.nome)===c) r=i; });
  ST.profs.forEach(function(p,i){ if(r>=0||p.nome==="(excluído)") return; if(n&&fmSemAcento(p.completo)===n) r=i; });
  ST.profs.forEach(function(p,i){ if(r>=0||p.nome==="(excluído)") return; if(e&&String(p.email||"").toLowerCase()===e) r=i; });
  return r; }
function fmResumo(x){ var n=[0,0,0,0,0]; x.horas.forEach(function(h){ n[h.v]++; });
  var t=[]; if(n[2]) t.push(n[2]+" não pode"); if(n[1]) t.push(n[1]+" evitar"); if(n[4]) t.push(n[4]+" em outra escola"); if(!t.length) t.push("pode em todos os horários");
  if(x.semana&&x.semana!=="Tanto faz") t.push(x.semana.toLowerCase()); if(x.maxdia) t.push("máx. "+x.maxdia+"/dia"); if(x.livre==="Sim") t.push("1 dia sem aula"); return t.join(" · "); }
function fmMostrarPrevia(){
  var box=document.getElementById("fmBox"), P=FM_PREV; if(!P) return;
  var ps=profsOrdem(), opts=function(sel){ return '<option value="-1"'+(sel<0?" selected":"")+'>— não importar —</option><option value="-2">+ cadastrar como professor novo</option>'+ps.map(function(i){ return '<option value="'+i+'"'+(i===sel?" selected":"")+">"+esc(ST.profs[i].nome)+"</option>"; }).join(""); };
  box.innerHTML='<div class="impgrp" style="margin-top:8px"><p style="margin:0 0 4px"><b>'+P.lista.length+' professor(es) responderam</b> ('+P.todas.length+' envio(s) no total). Vale o último envio de cada um. Confira a quem cada resposta pertence e clique em Importar.</p>'+
    '<div class="scroll"><table class="t"><tr><th>Resposta</th><th>Pedido</th><th>O que pediu</th><th>Ligar ao professor</th></tr>'+P.lista.map(function(x,j){
      return '<tr><td><b>'+esc(x.nome||x.email)+'</b><br><span class="small">'+esc(x.email)+'</span></td><td class="small">'+esc(x.tsTxt)+(x.protocolo?'<br>protocolo '+esc(x.protocolo):"")+(x.envios>1?'<br>'+x.envios+' envios (vale o último)':"")+'</td><td class="small">'+esc(fmResumo(x))+'</td>'+
        '<td><select data-fmj="'+j+'" aria-label="Professor da resposta de '+esc(x.nome||x.email)+'">'+opts(x.alvo)+'</select></td></tr>'; }).join("")+'</table></div>'+
    '<p class="small" style="margin:6px 0">O que muda em cada professor: horários em que pode / prefere evitar / não pode, horários em outra escola (aba Outras instituições), contatos, preferências (concentrar, máximo por dia, dia sem aula) e as observações. Os horários de <b>formador</b> marcados pela coordenação são mantidos. Tudo fica no Histórico.</p>'+
    '<div class="row"><button class="btn sm pri" id="fmImp">Importar</button><button class="btn sm" id="fmCanc">Cancelar</button></div><div id="fmMsg"></div></div>';
  document.getElementById("fmCanc").onclick=function(){ FM_PREV=null; box.innerHTML=""; };
  document.getElementById("fmImp").onclick=function(){ box.querySelectorAll("[data-fmj]").forEach(function(s){ P.lista[+s.dataset.fmj].alvo=+s.value; }); fmImportar(); };
}
function fmTemFormador(p,d,ini,fim){ var ind=ST.profs[p].ind||{}; return Object.keys(ind).some(function(k){ if(ind[k]!==3) return false; var bar=k.indexOf("|"); if(+k.slice(0,bar)!==d) return false; var r=k.slice(bar+1).split("-"); return Math.min(fim,toMin(r[1]))-Math.max(ini,toMin(r[0]))>10; }); }
function fmImportar(){
  var P=FM_PREV, feitos=[], E=ST.externo=ST.externo||{usar:true,margem:20,escolas:[]};
  P.lista.forEach(function(x){ var p=x.alvo; if(p===-1||p==null) return;
    if(p===-2){ var cc=sortearCores(ST.profs.length+1); ST.profs.push({nome:(x.curto||x.nome.split(" ")[0]||"NOVO").toUpperCase(),completo:x.nome,cor:cc[ST.profs.length]||"#dddddd",corEsc:"#333",ind:{},maxDia:null,concentrar:false,haManual:null,obs:"",email:"",cel:""}); p=ST.profs.length-1; }
    var pr=ST.profs[p]; pr.ind=pr.ind||{};
    if(x.nome) pr.completo=x.nome; if(x.email) pr.email=x.email; if(x.cel) pr.cel=String(x.cel).replace(/\D/g,"");
    // horários: posso / evitar / não pode / outra escola
    var fora=[]; x.horas.forEach(function(h){ if(h.v===0&&fmTemFormador(p,h.d,h.ini,h.fim)) return; setBlkFaixa(p,h.d,h.ini,h.fim,h.v===4?0:h.v); if(h.v===4) fora.push(h); });
    // outra escola: vai para a aba Outras instituições (o gerador cruza os horários)
    E.escolas.forEach(function(es){ if(es.origem==="formulario") es.itens=es.itens.filter(function(it){ return it.p!==p; }); });
    if(fora.length){ var nm=x.outra||"Outra escola (pedido do formulário)", es=E.escolas.filter(function(z){ return z.origem==="formulario"&&fmSemAcento(z.nome)===fmSemAcento(nm); })[0];
      if(!es){ es={id:"form"+Date.now()+E.escolas.length,nome:nm,cenario:"",arquivo:"formulário dos professores",origem:"formulario",ts:agora(),quem:ST.ctx.quem||"",itens:[]}; E.escolas.push(es); }
      fora.forEach(function(h){ es.itens.push({p:p,d:h.d,ini:hmP(h.ini),fim:hmP(h.fim),nomeLa:pr.nome,txt:"pedido do formulário ("+h.per.toLowerCase()+", "+(h.a+1)+"ª aula)"}); }); }
    E.escolas=E.escolas.filter(function(es){ return es.origem!=="formulario"||es.itens.length; });
    // preferências
    if(x.semana) pr.concentrar=/Concentrar/.test(x.semana);
    var md=parseInt(x.maxdia,10); pr.maxDia=md>=1&&md<=12?md:null;
    ST.extras=(ST.extras||[]).filter(function(r){ return !(r.fonte==="formulario"&&r.tipo==="dialivre"&&r.p===p); });
    if(x.livre==="Sim") ST.extras.push({tipo:"dialivre",p:p,forca:"preferencia",fonte:"formulario"});
    // observações: troca só o bloco do formulário, o resto que a coordenação escreveu fica
    var limpa=function(v){ return String(v||"").replace(/[\r\n]+/g," ").replace(/[\[\]]/g,"").trim(); }; x.ha=limpa(x.ha); x.obs=limpa(x.obs); x.outra=limpa(x.outra);
    var bloco=["[Formulário "+(x.tsTxt||"")+(x.protocolo?" · protocolo "+x.protocolo:"")+"]"];
    if(x.semana) bloco.push("Semana: "+x.semana+"."); if(x.gem&&x.gem!=="Tanto faz") bloco.push("Geminadas: "+x.gem.toLowerCase()+"."); if(x.ha) bloco.push("HA: "+x.ha); if(x.obs) bloco.push("Obs.: "+x.obs);
    if(fora.length) bloco.push("Em outra escola ("+(x.outra||"não informou o nome")+"): "+fora.length+" horário(s).");
    pr.obs=String(pr.obs||"").replace(/\s*\[Formulário[^\]]*\][^\[]*$/,"").trim(); pr.obs=(pr.obs?pr.obs+"\n":"")+bloco.join(" ");
    pr.formulario={ts:x.tsTxt,protocolo:x.protocolo,envios:x.envios};
    feitos.push(pr.nome+" ("+fmResumo(x)+")");
  });
  // guarda todas as respostas (também as antigas) como histórico dos pedidos
  var H=ST.formRespostas=ST.formRespostas||[], vis={}; H.forEach(function(r){ vis[r.protocolo+"|"+r.email]=1; });
  P.todas.forEach(function(x){ var k=x.protocolo+"|"+x.email; if(vis[k]) return; vis[k]=1; H.push({protocolo:x.protocolo,ts:x.tsTxt,email:x.email,nome:x.nome,curto:x.curto,cel:x.cel,outra:x.outra,semana:x.semana,maxdia:x.maxdia,livre:x.livre,gem:x.gem,ha:x.ha,obs:x.obs,horas:x.horas.filter(function(h){ return h.v; }).map(function(h){ return [h.d,h.ini,h.fim,h.v]; })}); });
  if(H.length>2000) H.splice(0,H.length-2000);
  _EXT=null; _TM=null; CACHE=null;
  if(feitos.length) logar("Professor","Pedidos do formulário importados ("+feitos.length+"): "+feitos.join("; "),{motivo:ST.ctx.motivo||"Formulário dos professores"}); else save();
  FM_PREV=null; renderProfs();
  document.getElementById("fmBox").innerHTML='<div class="msg ok">'+(feitos.length?"Pronto: "+feitos.length+" professor(es) atualizados. Para a grade obedecer, use “Ajustar a grade atual” na aba Gerar.":"Nenhuma resposta foi importada.")+'</div>';
}
function fmIniciar(){
  var b=document.getElementById("fmCriar"); if(!b||b._ok) return; b._ok=1;
  b.onclick=fmMostrarCriar;
  var arq=document.getElementById("fmArq");
  document.getElementById("fmImpBtn").onclick=function(){ arq.value=""; arq.click(); };
  arq.onchange=function(){ var f=arq.files&&arq.files[0]; if(!f) return; var rd=new FileReader();
    rd.onload=function(){ var r=fmLer(rd.result), box=document.getElementById("fmBox");
      if(r.erro){ box.innerHTML='<div class="msg warn">'+esc(r.erro)+"</div>"; return; }
      r.lista.forEach(function(x){ x.alvo=fmAchar(x); }); FM_PREV=r; fmMostrarPrevia(); };
    rd.onerror=function(){ document.getElementById("fmBox").innerHTML='<div class="msg warn">Não foi possível ler o arquivo.</div>'; };
    rd.readAsText(f,"utf-8"); };
}
