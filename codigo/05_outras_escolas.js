
// =====================================================================
// OUTRAS ESCOLAS: cruzar o horário de quem trabalha em mais de uma escola
// =====================================================================

var EX_LIDO=null, EX_SEL={}, EX_VER=null, EX_ARM={}, EX_OUTROS_ABERTO=false, EX_CONFIRMA=false, EX_ABRIR={};
function exDef(){ var E=ST.externo; if(!E||typeof E!=="object"){ E=ST.externo={}; } if(!Array.isArray(E.escolas)) E.escolas=[]; if(E.usar==null) E.usar=true; if(E.margem==null) E.margem=20; return E; }

// ---- texto e bytes ----
function bytesParaTexto(u){ var out="", CH=0x8000; for(var i=0;i<u.length;i+=CH) out+=String.fromCharCode.apply(null,u.subarray(i,i+CH)); return out; }
function b64DeBytes(u){ return btoa(bytesParaTexto(u)); }
function bytesDeB64(b){ var bin=atob(b), u=new Uint8Array(bin.length); for(var i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i); return u; }
function normNome(s){ return String(s==null?"":s).normalize("NFD").replace(/[̀-ͯ]/g,"").toUpperCase().replace(/[^A-Z0-9]+/g," ").trim(); }

// ---- o nosso horário, no formato para outra escola (só nome, dia, horário, turma e disciplina) ----
function payloadDeEstado(S,filtro,comHA,escola){
  var tipos={}; (S.tipos||[]).forEach(function(tp){ tipos[tp.id]=tp; });
  var por={}; function add(p,it){ (por[p]=por[p]||[]).push(it); }
  (S.turmas||[]).forEach(function(T,t){ if(T.excluida) return; var tp=tipos[T.tipo]||S.tipos[0], n=tp.aulas.length, row=(S.grid||[])[t]||[];
    for(var s=0;s<row.length&&s<n*5;s++){ var k=row[s]; if(!k) continue; var x=parseK(k); if(filtro&&!filtro[x.p]) continue; var h=tp.aulas[s%n], d=(s/n)|0;
      add(x.p,{d:d,dia:DIAS[d],ini:h[0],fim:h[1],turma:T.nome,disc:x.disc,tipo:"aula"}); } });
  if(comHA&&S.ha) Object.keys(S.ha).forEach(function(p){ var pp=+p; if(filtro&&!filtro[pp]) return; ((S.ha[p]||{}).slots||[]).forEach(function(key){ var y=haParse(key); if(!(y.d>=0&&y.d<5)) return; add(pp,{d:y.d,dia:DIAS[y.d],ini:hmP(y.ini),fim:hmP(y.fim),turma:"",disc:"Hora-atividade",tipo:"HA"}); }); });
  var ord=function(a,b){ return a.d-b.d||toMin(a.ini)-toMin(b.ini); };
  var profs=Object.keys(por).map(Number).filter(function(p){ return S.profs[p]&&S.profs[p].nome!=="(excluído)"; })
    .sort(function(a,b){ return String(S.profs[a].nome).localeCompare(String(S.profs[b].nome)); })
    .map(function(p){ var pr=S.profs[p], c=String(pr.completo||""); return {nome:String(pr.nome), completo:c&&c.indexOf("?")<0&&c!==pr.nome?c:"", horarios:por[p].sort(ord)}; });
  return {formato:"horario-professores", versao:1, escola:escola==null?instNome():escola, cidade:escola==null?instCidade():"", grade:S.gridNome||"", emitido:agora(), professores:profs};
}
function payloadHorario(ps,comHA){ var f=null; if(ps){ f={}; ps.forEach(function(p){ f[p]=1; }); } return payloadDeEstado(ST,f,comHA); }
function profsDasTurmas(ts){ var s={}; ts.forEach(function(t){ (ST.grid[t]||[]).forEach(function(k){ if(k) s[parseK(k).p]=1; }); }); return Object.keys(s).map(Number); }
function pacoteHorario(ps,comHA){ return b64DeBytes(fflate.deflateSync(new TextEncoder().encode(JSON.stringify(payloadHorario(ps,comHA))),{level:9})); }
// guarda os horários dentro do PDF (invisível na folha), para outra escola que use este gerador importar sem erro
function marcarPdf(doc,ps){ if(!doc||!ps||!ps.length) return; try{
  var txt=pacoteHorario(ps,true);
  doc.internal.events.subscribe("postPutResources",function(){ doc.internal.write("%GH29-HORARIO-INICIO"); for(var i=0;i<txt.length;i+=180) doc.internal.write("%"+txt.slice(i,i+180)); doc.internal.write("%GH29-HORARIO-FIM"); });
}catch(e){} }
function lerMarcador(u){ var s=bytesParaTexto(u), A="GH29-HORARIO-INICIO", i=s.indexOf(A); if(i<0) return null; var j=s.indexOf("GH29-HORARIO-FIM",i); if(j<0) return null;
  try{ return JSON.parse(new TextDecoder("utf-8").decode(fflate.inflateSync(bytesDeB64(s.slice(i+A.length,j).replace(/[^A-Za-z0-9+\/=]/g,""))))); }catch(e){ return null; } }

// ---- leitor de PDF (pdf.js), carregado só quando precisa ----
function carregarPdfjs(){
  if(window.pdfjsLib&&window.pdfjsWorker) return true;
  try{ var un=function(id){ var el=document.getElementById(id); if(!el) throw new Error("falta "+id); return new TextDecoder("utf-8").decode(fflate.inflateSync(bytesDeB64(el.textContent.replace(/\s+/g,"")))); };
    var add=function(code){ var sc=document.createElement("script"); sc.textContent=code; document.head.appendChild(sc); };
    if(!window.pdfjsWorker) add(un("libPdfW")); if(!window.pdfjsLib) add(un("libPdf"));
    if(window.pdfjsLib&&pdfjsLib.GlobalWorkerOptions) pdfjsLib.GlobalWorkerOptions.workerSrc="data:text/javascript,";
    return !!(window.pdfjsLib&&window.pdfjsWorker); }catch(e){ return false; }
}
function pdfPaginas(u){
  return pdfjsLib.getDocument({data:u,isEvalSupported:false,disableFontFace:true,useSystemFonts:false,verbosity:0}).promise.then(function(doc){
    var pages=[], n=Math.min(doc.numPages,300), seq=Promise.resolve(); pages.total=doc.numPages;
    for(var i=1;i<=n;i++) (function(i){ seq=seq.then(function(){ return doc.getPage(i).then(function(pg){ var vp=pg.getViewport({scale:1}); return pg.getTextContent().then(function(tc){
      pages.push({n:i,w:vp.width,h:vp.height,itens:tc.items.filter(function(it){ return it.str&&it.str.trim(); }).map(function(it){ var t=vp.convertToViewportPoint(it.transform[4],it.transform[5]); return {x:t[0],y:t[1],w:it.width||0,s:it.str.replace(/\s+/g," ").trim()}; })}); }); }); }); })(i);
    return seq.then(function(){ try{ doc.destroy(); }catch(e){} pages.total=doc.numPages; return pages; }); });
}
// ---- entender a grade do PDF pela posição dos textos ----
var RX_FAIXA=/(\d{1,2})\s*[:hH]\s*(\d{2})\s*(?:-|–|—|às|as|a|até|ate)?\s*(\d{1,2})\s*[:hH]\s*(\d{2})/;
function diaDe(s){ var x=normNome(s);
  if(/^(SEG|SEGUNDA)( FEIRA)?$|^2A FEIRA$/.test(x)) return 0; if(/^(TER|TERCA)( FEIRA)?$|^3A FEIRA$/.test(x)) return 1; if(/^(QUA|QUARTA)( FEIRA)?$|^4A FEIRA$/.test(x)) return 2;
  if(/^(QUI|QUINTA)( FEIRA)?$|^5A FEIRA$/.test(x)) return 3; if(/^(SEX|SEXTA)( FEIRA)?$|^6A FEIRA$/.test(x)) return 4; return -1; }
function mediana(a){ var b=a.slice().sort(function(x,y){ return x-y; }); return b.length?b[(b.length-1)>>1]:0; }
function linhasDaPagina(pg){ var its=pg.itens.slice().sort(function(a,b){ return a.y-b.y||a.x-b.x; }), L=[];
  its.forEach(function(it){ var ln=L.length?L[L.length-1]:null; if(ln&&Math.abs(ln.y-it.y)<=2.2) ln.itens.push(it); else L.push({y:it.y,itens:[it]}); });
  L.forEach(function(ln){ ln.itens.sort(function(a,b){ return a.x-b.x; }); ln.txt=ln.itens.map(function(i){ return i.s; }).join(" ").replace(/\s+/g," ").trim(); }); return L; }
var RX_RUIDO=/RELATORIO|CENARIO|QUADRO|PAGINA|EMITID|IMPRESS|GERAD|LEGENDA|^AULA$|^HORARIO$|VALE A PARTIR|^(MANHA|TARDE|NOITE|INTEGRAL)\b/;
// título de professor escrito por extenso ("Horário de FULANO", "Professor: FULANO")
function tituloProf(t){ var m=/^Hor[aá]rio(?: e hora-atividade)? de (.+?)(?:\s+[—–-]\s+.*)?$/i.exec(t); if(m) return m[1].trim(); m=/^Professor(?:\(a\)|a)?\s*:\s*(.+)$/i.exec(t); return m?m[1].trim():""; }
// nome logo acima da grade (como no SIGAH): só texto dentro da faixa da grade e depois do fim da grade anterior
function tituloAcima(L,li,b,limY){ var hy=L[li].y;
  for(var j=li-1;j>=0;j--){ var ln=L[j]; if(hy-ln.y>48||ln.y<=limY) break;
    var its=ln.itens.filter(function(it){ var xc=it.x+it.w/2; return xc>=b.xEsq&&xc<=b.xMax+b.colW; }); if(!its.length) continue;
    var t=its.map(function(i){ return i.s; }).join(" ").replace(/\s+/g," ").trim(), n=normNome(t); if(!n||RX_FAIXA.test(t)||RX_RUIDO.test(n)) continue;
    if(its.some(function(i){ return diaDe(i.s)>=0; })) continue;
    return tituloProf(t)||t; }
  return ""; }
var RX_ESCOLA=/\b(COLEGIO|ESCOLA|INSTITUTO|CENTRO ESTADUAL|CEEBJA|CEEP|CMEF|EEEFM|C E|E E|E M)\b/;
function interpretarPdf(pages){
  var blocos=[], escola="", cenario="", tipoRel="", fixo="", atuais=[];
  pages.forEach(function(pg,pi){
    var L=linhasDaPagina(pg), primeiroHdr=null;
    L.forEach(function(ln,li){
      var tp=tituloProf(ln.txt); if(tp) fixo=tp;
      // dias da semana nesta linha; duas grades lado a lado viram dois grupos (a sequência dos dias recomeça)
      var ds=[]; ln.itens.forEach(function(it){ var d=diaDe(it.s); if(d>=0) ds.push({d:d,xc:it.x+it.w/2}); }); ds.sort(function(a,c){ return a.xc-c.xc; });
      var grupos=[], g=null; ds.forEach(function(z){ if(!g||z.d<=g[g.length-1].d){ g=[z]; grupos.push(g); } else g.push(z); });
      grupos=grupos.filter(function(x){ return x.length>=3; });
      if(grupos.length){ var esqAnt=-1e9; atuais=[];
        grupos.forEach(function(gr){ var gaps=[]; for(var i=1;i<gr.length;i++) gaps.push(gr[i].xc-gr[i-1].xc); var colW=Math.max(8,Math.min.apply(null,gaps));
          var b={dias:gr,colW:colW,xMin:gr[0].xc-colW*0.6,xMax:gr[gr.length-1].xc+colW*0.6,xEsq:esqAnt,linhas:[],cels:[],pg:pi,y:ln.y};
          var limY=-1, faixa=function(z){ return [z.xEsq<-1e8?z.xMin-z.colW*2:z.xEsq, z.xMax]; }, fb=faixa(b);
          blocos.forEach(function(bb){ var f2=faixa(bb); if(f2[1]<=fb[0]||f2[0]>=fb[1]) return; bb.linhas.forEach(function(l){ if(l.pg===pi) limY=Math.max(limY,l.y+8); }); if(bb.pg===pi) limY=Math.max(limY,bb.y); });
          b.nome=tituloAcima(L,li,b,limY)||fixo; blocos.push(b); atuais.push(b); esqAnt=b.xMax; });
        if(primeiroHdr==null) primeiroHdr=ln.y; return; }
      atuais.forEach(function(b){
        var esq=ln.itens.filter(function(it){ var xc=it.x+it.w/2; return xc<b.xMin&&xc>=b.xEsq; }).map(function(it){ return it.s; }).join(" "), m=RX_FAIXA.exec(esq);
        if(m){ var ini=pad2(+m[1])+":"+m[2], fim=pad2(+m[3])+":"+m[4]; if(okHora(ini)&&okHora(fim)&&toMin(fim)>toMin(ini)) b.linhas.push({y:ln.y,pg:pi,ini:ini,fim:fim}); }
        ln.itens.forEach(function(it){ var xc=it.x+it.w/2; if(xc>=b.xMin&&xc<=b.xMax) b.cels.push({x:it.x,y:it.y,w:it.w,s:it.s,pg:pi}); }); });
    });
    if(pi===0){ var nomesB={}; blocos.forEach(function(b){ nomesB[normNome(b.nome)]=1; });
      L.forEach(function(ln){ if(primeiroHdr!=null&&ln.y>=primeiroHdr) return; var n=normNome(ln.txt);
        var mc=/CENARIO\s+(.+)$/.exec(n); if(mc&&!cenario) cenario=mc[1];
        if(/RELATORIO POR (PROFESSOR|TURMA|DOCENTE)/.test(n)&&!tipoRel) tipoRel=ln.txt;
        if(!escola&&n&&!nomesB[n]&&!RX_RUIDO.test(n)&&!RX_FAIXA.test(ln.txt)&&(RX_ESCOLA.test(n)||/ - [A-ZÀ-Ú]/.test(ln.txt))) escola=ln.txt; }); }
  });
  blocos.forEach(function(b){ b.itens=[]; if(!b.linhas.length) return;
    var esp=[]; for(var i=1;i<b.linhas.length;i++) if(b.linhas[i].pg===b.linhas[i-1].pg) esp.push(b.linhas[i].y-b.linhas[i-1].y); var passo=esp.length?mediana(esp):20, cel={};
    b.cels.forEach(function(it){ var s=it.s.trim(); if(!s||/^\[?\s*X\s*\]?$|^[-–—.]+$/.test(s)||/^(intervalo|almo[cç]o|recreio)\b/i.test(s)) return;
      var xc=it.x+it.w/2, best=-1, bd=1e9; b.dias.forEach(function(z,zi){ var dd=Math.abs(z.xc-xc); if(dd<bd){ bd=dd; best=zi; } }); if(best<0||bd>b.colW*0.6) return;
      var r=-1, rd=1e9; b.linhas.forEach(function(l,li){ if(l.pg!==it.pg) return; var dd=Math.abs(l.y-it.y); if(dd<rd){ rd=dd; r=li; } }); if(r<0||rd>Math.max(6,passo*0.7)) return;
      var key=r+"|"+b.dias[best].d; (cel[key]=cel[key]||[]).push(it); });
    Object.keys(cel).forEach(function(key){ var q=key.split("|"), l=b.linhas[+q[0]], its=cel[key].sort(function(a,c){ return a.y-c.y||a.x-c.x; });
      var txt=its.map(function(i){ return i.s; }).join(" ").replace(/(\d{1,2})\s*[:hH]\s*(\d{2})\s*(?:-|–|—|às|as|a|até|ate)\s*(\d{1,2})\s*[:hH]\s*(\d{2})/g,"").replace(/\s+/g," ").trim();
      if(!txt||/^(INTERVALO|RECREIO|ALMOCO|ALMOÇO|FORMADOR|EVITAR|N[ÃA]O PODE)$/i.test(txt)||/^outra escola\b/i.test(txt)) return; // "Outra escola" e "Formador" não são aula lá
      b.itens.push({d:+q[1],ini:l.ini,fim:l.fim,txt:txt.slice(0,120)}); });
    b.itens.sort(function(a,c){ return a.d-c.d||toMin(a.ini)-toMin(c.ini); });
  });
  return {escola:escola.slice(0,120), cenario:cenario.slice(0,60), tipoRel:tipoRel, blocos:blocos.filter(function(b){ return b.linhas.length; })};
}
// ---- planilhas (.xlsx e .csv) ----
function colNum(ref){ var m=/^([A-Z]+)(\d+)$/.exec(ref||""); if(!m) return null; var c=0; for(var i=0;i<m[1].length;i++) c=c*26+(m[1].charCodeAt(i)-64); return {c:c-1,r:+m[2]-1}; }
function lerXlsx(u){
  var z=fflate.unzipSync(u), td=new TextDecoder("utf-8"), xml=function(n){ var k=Object.keys(z).filter(function(x){ return x.replace(/^\//,"").toLowerCase()===n.toLowerCase(); })[0]; return k?new DOMParser().parseFromString(td.decode(z[k]),"application/xml"):null; };
  var txt=function(el){ var ts=el.getElementsByTagName("t"), o=""; for(var i=0;i<ts.length;i++) o+=ts[i].textContent; return o; };
  var ss=[], sx=xml("xl/sharedStrings.xml"); if(sx){ var si=sx.getElementsByTagName("si"); for(var i=0;i<si.length;i++) ss.push(txt(si[i])); }
  var wb=xml("xl/workbook.xml"), rel=xml("xl/_rels/workbook.xml.rels"), alvo={}; if(!wb) throw new Error("planilha sem workbook");
  if(rel){ var rs=rel.getElementsByTagName("Relationship"); for(var j=0;j<rs.length;j++) alvo[rs[j].getAttribute("Id")]=rs[j].getAttribute("Target"); }
  var out=[], sh=wb.getElementsByTagName("sheet");
  for(var k=0;k<sh.length&&k<30;k++){ var rid=sh[k].getAttribute("r:id")||sh[k].getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships","id"), tg=alvo[rid]||("worksheets/sheet"+(k+1)+".xml");
    tg=tg.replace(/^\//,""); if(tg.indexOf("xl/")!==0) tg="xl/"+tg; var d=xml(tg); if(!d) continue;
    var G=[], cs=d.getElementsByTagName("c");
    for(var q=0;q<cs.length&&q<200000;q++){ var c=cs[q], pos=colNum(c.getAttribute("r")); if(!pos||pos.r>3000||pos.c>200) continue; var t=c.getAttribute("t"), v=c.getElementsByTagName("v")[0], val="";
      if(t==="s") val=v?(ss[+v.textContent]||""):""; else if(t==="inlineStr") val=txt(c); else if(v){ val=v.textContent; var nv=+val; if(t!=="str"&&isFinite(nv)&&nv>0&&nv<1) val=hmP(Math.round(nv*1440)); }
      if(val===""||val==null) continue; (G[pos.r]=G[pos.r]||[])[pos.c]=String(val); }
    out.push({nome:sh[k].getAttribute("name")||("Planilha "+(k+1)),G:G}); }
  return out; }
function textoDe(u){ try{ return new TextDecoder("utf-8",{fatal:true}).decode(u); }catch(e){ try{ return new TextDecoder("windows-1252").decode(u); }catch(e2){ return new TextDecoder("utf-8").decode(u); } } }
function lerCsv(t){ var G=[], row=[], cel="", q=false, sep=(t.split("\n")[0].split(";").length>t.split("\n")[0].split(",").length)?";":",";
  for(var i=0;i<t.length;i++){ var ch=t[i]; if(q){ if(ch==='"'){ if(t[i+1]==='"'){ cel+='"'; i++; } else q=false; } else cel+=ch; continue; }
    if(ch==='"') q=true; else if(ch===sep){ row.push(cel); cel=""; } else if(ch==="\n"){ row.push(cel.replace(/\r$/,"")); G.push(row); row=[]; cel=""; } else cel+=ch; }
  if(cel||row.length){ row.push(cel); G.push(row); } return G; }
// modelo "quadro": nome do dia, turmas à direita e as aulas embaixo; em cada célula, a disciplina e (na última linha) o professor
var RX_HORA1=/(\d{1,2})\s*[:hH]\s*(\d{2})(?:\s*(?:-|–|—|às|as|a|até|ate)\s*(\d{1,2})\s*[:hH]\s*(\d{2}))?/;
function interpretarQuadro(G){ var por={}, ordem=[];
  var cel=function(r,c){ return String(((G[r]||[])[c])||"").trim(); };
  for(var r=0;r<G.length;r++){ var row=G[r]||[]; for(var c=0;c<row.length;c++){ var d=diaDe(cel(r,c)); if(d<0) continue;
    var cols=[]; for(var c2=c+1;c2<c+80;c2++){ var tt=cel(r,c2); if(!tt||diaDe(tt)>=0) break; cols.push({c:c2,turma:tt.replace(/\s+/g," ")}); }
    if(!cols.length) continue;
    var linhas=[]; for(var r2=r+1;r2<r+40&&r2<G.length;r2++){ var t0=cel(r2,c); if(!t0) break; if(diaDe(t0)>=0) break; var m=RX_HORA1.exec(t0); if(!m) continue;
      var ini=pad2(+m[1])+":"+m[2]; if(!okHora(ini)) continue; var fim=m[3]?pad2(+m[3])+":"+m[4]:null; if(fim&&(!okHora(fim)||toMin(fim)<=toMin(ini))) fim=null; linhas.push({r:r2,ini:ini,fim:fim}); }
    if(!linhas.length) continue;
    var dif=[]; for(var i=1;i<linhas.length;i++){ var x=toMin(linhas[i].ini)-toMin(linhas[i-1].ini); if(x>0) dif.push(x); } var dur=dif.length?Math.min.apply(null,dif):50;
    linhas.forEach(function(l,i){ if(!l.fim){ var f=toMin(l.ini)+dur; if(i+1<linhas.length) f=Math.min(f,toMin(linhas[i+1].ini)); l.fim=hmP(Math.min(f,24*60-1)); } });
    linhas.forEach(function(l){ cols.forEach(function(co){ var t=cel(l.r,co.c); if(!t) return; var ls=t.split(/\n+/).map(function(x){ return x.trim(); }).filter(Boolean); if(ls.length<2) return;
      var prof=ls[ls.length-1].replace(/\s+/g," "), disc=ls.slice(0,-1).join(" "), k=normNome(prof); if(!k||/^\d/.test(k)) return;
      if(!por[k]){ por[k]={nome:prof,itens:[]}; ordem.push(k); } por[k].itens.push({d:d,ini:l.ini,fim:l.fim,txt:(co.turma+" "+disc).slice(0,120)}); }); });
  } }
  return ordem.map(function(k){ var b=por[k], vis={}; b.itens=b.itens.filter(function(x){ var key=x.d+"|"+x.ini+"|"+x.txt; if(vis[key]) return false; vis[key]=1; return true; }).sort(function(a,c){ return a.d-c.d||toMin(a.ini)-toMin(c.ini); }); return b; }); }
// planilha com os dias nas colunas (como o relatório por professor): reaproveita o leitor de PDF
function gridParaPagina(G){ var its=[]; G.forEach(function(row,r){ (row||[]).forEach(function(v,c){ var ls=String(v||"").split(/\n+/).map(function(x){ return x.trim(); }).filter(Boolean); ls.forEach(function(s,i){ its.push({x:c*100+50,y:r*30+(i-(ls.length-1)/2)*8,w:0,s:s}); }); }); }); return {n:1,w:20000,h:G.length*30,itens:its}; }
function blocosDePlanilha(sheets){ var bl=[], escola="";
  sheets.forEach(function(sh){ var q=interpretarQuadro(sh.G); if(q.length){ bl=bl.concat(q); return; }
    var r=interpretarPdf([gridParaPagina(sh.G)]); if(r.escola&&!escola) escola=r.escola; r.blocos.forEach(function(b){ if(b.nome&&b.itens.length) bl.push({nome:b.nome,itens:b.itens}); }); });
  var juntos={}, out=[]; bl.forEach(function(b){ var k=normNome(b.nome); if(juntos[k]!=null){ out[juntos[k]].itens=out[juntos[k]].itens.concat(b.itens); return; } juntos[k]=out.length; out.push({nome:b.nome,itens:b.itens.slice()}); });
  return {blocos:out,escola:escola}; }

// nomes que parecem de turma (relatório por turma) em vez de professor
function pareceTurma(s){ var n=normNome(s); return (/^(TURMA )?\d/.test(n)&&n.split(" ").length<=4)||/^TURMA /.test(n); }

// ---- comparar nomes (outra escola x daqui) ----
function bigramas(s){ var o={}, n=0; for(var i=0;i<s.length-1;i++){ var g=s.substr(i,2); o[g]=(o[g]||0)+1; n++; } return {o:o,n:n}; }
function dice(a,b){ if(!a||!b) return 0; if(a===b) return 1; var A=bigramas(a), B=bigramas(b), c=0; for(var g in A.o) if(B.o[g]) c+=Math.min(A.o[g],B.o[g]); return A.n+B.n?2*c/(A.n+B.n):0; }
function palavraBate(x,y){ return x===y||(x.length===1&&y.charAt(0)===x)||(y.length===1&&x.charAt(0)===y)||(x.length>=3&&y.indexOf(x)===0)||(y.length>=3&&x.indexOf(y)===0); }
// o primeiro nome tem de ser igual; os outros podem vir abreviados (inicial ou começo do sobrenome), na mesma ordem
function tokensCompat(a,b){ if(a[0]!==b[0]) return false; var j=1; for(var i=1;i<a.length;i++){ var ok=false; while(j<b.length){ if(palavraBate(a[i],b[j++])){ ok=true; break; } } if(!ok) return false; } return true; }
// "DARIENE1" no SIGAH = segundo cadastro (padrão) da mesma pessoa
function normPessoa(s){ return normNome(s).replace(/([A-Z])\d+\b/g,"$1").replace(/\s+/g," ").trim(); }
function scoreNome(x,p){ var pr=ST.profs[p], A=normPessoa(x); if(!A||!pr) return 0;
  var comp=pr.completo&&String(pr.completo).indexOf("?")<0?normPessoa(pr.completo):"";
  var sc=function(B){ if(!B) return 0; if(A===B) return 1; var ta=A.split(" "), tb=B.split(" "), cur=ta.length<=tb.length?[ta,tb]:[tb,ta];
    if(ta[0].length>1&&tokensCompat(cur[0],cur[1])) return cur[0].length>=2?0.9:0.7; return 0.6*dice(A,B); };
  var sN=sc(normPessoa(pr.nome)), sC=sc(comp), best=Math.max(sN,sC);
  // o nome completo daqui desmente o de lá (ex.: "ALINE PEREIRA" x ALINE P. = Aline Godoy Paterno): não liga sozinho
  if(comp&&sC<0.85&&best<1){ var tc=comp.split(" "); if(A.split(" ").slice(1).some(function(t){ return t.length>=3&&!tc.some(function(u){ return palavraBate(t,u); }); })) best=Math.min(best,0.5); }
  return best; }
function casarNomes(blocos){ var ps=profsOrdem(), sel={}, usados={};
  var cands=blocos.map(function(b,bi){ var best=-1, bs=0, emp=0; ps.forEach(function(p){ var sc=scoreNome(b.nome,p); if(sc>bs+1e-9){ bs=sc; best=p; emp=0; } else if(sc>0&&Math.abs(sc-bs)<1e-9) emp++; });
    if(emp>0&&bs<1) bs=Math.min(bs,0.45); return {bi:bi,p:best,sc:bs}; });
  // nomes certos (iguais, ou o mesmo nome com número no fim) podem ir para o mesmo professor; os parecidos, só um por professor
  cands.sort(function(a,b){ return b.sc-a.sc; }).forEach(function(c){ if(c.p<0||c.sc<0.6) return; if(c.sc>=0.85||!usados[c.p]){ sel[c.bi]=c.p; usados[c.p]=1; } });
  var conf={}; cands.forEach(function(c){ conf[c.bi]=c; }); return {sel:sel,conf:conf}; }
// relatório por turma: procurar o nome dos nossos professores dentro das aulas
function buscarProfsNasCelulas(blocos){ var por={}, ex={}, sc={}, nomes=[];
  profsOrdem().forEach(function(p){ var pr=ST.profs[p], add=function(x){ var n=normPessoa(x); if(n.length>=3) nomes.push({p:p,n:n,tok:n.split(" ").length}); }; add(pr.nome); if(pr.completo&&String(pr.completo).indexOf("?")<0) add(pr.completo); });
  nomes.sort(function(a,b){ return b.n.length-a.n.length; });
  blocos.forEach(function(b){ var rot=String(b.nome||"").split(/\s+[—–]\s+/)[0]; b.itens.forEach(function(it){ var t=" "+normPessoa(it.txt)+" ", usados=[], vistos={};
    nomes.forEach(function(nm){ var k=t.indexOf(" "+nm.n+" "); if(k<0||vistos[nm.p]) return; var a=k, z=k+nm.n.length+1; if(usados.some(function(u){ return a<u[1]&&u[0]<z; })) return;
      usados.push([a,z]); vistos[nm.p]=1; var txt=((rot?rot+" · ":"")+it.txt).slice(0,120);
      (por[nm.p]=por[nm.p]||[]).push({d:it.d,ini:it.ini,fim:it.fim,txt:txt}); (ex[nm.p]=ex[nm.p]||[]).push(txt); sc[nm.p]=Math.max(sc[nm.p]||0,nm.tok>=2?0.9:0.7); }); }); });
  return Object.keys(por).map(Number).map(function(p){ return {nome:ST.profs[p].nome,itens:por[p],achado:p,sc:sc[p],ex:uniq(ex[p]).slice(0,2)}; }); }

// ---- arquivo -> horários da outra escola ----
function blocosDePayload(o){
  if(!o||!Array.isArray(o.professores)) return null;
  return o.professores.map(function(pr){ var nm=String(pr&&pr.nome||"").slice(0,120);
    var its=(Array.isArray(pr&&pr.horarios)?pr.horarios:[]).map(function(h){ if(!h||typeof h!=="object") return null; var d=+h.d; if(!(d>=0&&d<=4&&d%1===0)) d=diaDe(h.dia||""); if(!(d>=0&&d<=4&&d%1===0)||!okHora(String(h.ini||""))||!okHora(String(h.fim||""))) return null;
      var ini=normHora(h.ini), fim=normHora(h.fim); if(toMin(fim)<=toMin(ini)) return null; return {d:d,ini:ini,fim:fim,txt:[h.turma,h.disc].filter(function(v){ return v!=null&&v!==""; }).map(String).join(" ").slice(0,120)}; }).filter(Boolean);
    return {nome:nm,completo:String(pr&&pr.completo||"").slice(0,160),itens:its}; }).filter(function(b){ return b.nome&&b.itens.length; });
}
function exDeDados(o){ // arquivo de dados completo de outra escola que também usa este gerador
  if(o&&o.tipo===BK_TIPO&&o.dados) o=o.dados;
  var c=deep(o); if(c.v===1) conv1(c); if(c.v!==2||!sanear(c)) return null;
  return payloadDeEstado(c,null,true,""); }
function exLer(f){
  var box=document.getElementById("exMsg"), ee0=document.getElementById("exEscola"); if(EX_LIDO){ ee0.value=""; ee0.dataset.auto=""; } EX_LIDO=null; EX_SEL={}; renderExLido();
  if(!f) return; if(f.size>40*1024*1024){ box.innerHTML='<div class="msg bad">Arquivo muito grande (mais de 40 MB).</div>'; return; }
  box.innerHTML='<div class="msg info">Lendo “'+esc(f.name)+'”…</div>';
  var r=new FileReader();
  r.onerror=function(){ box.innerHTML='<div class="msg bad">Não foi possível ler esse arquivo.</div>'; };
  r.onload=function(){ var u=new Uint8Array(r.result), nome=f.name, ini=bytesParaTexto(u.subarray(0,8));
    if(!u.length){ box.innerHTML='<div class="msg bad">O arquivo está vazio.</div>'; return; }
    var pronto=function(res){ if(!res){ return; } var nIt=res.blocos.reduce(function(a,b){ return a+b.itens.length; },0);
      if(res.blocos.length>2000||nIt>40000){ falha("Esse arquivo é grande demais para conferir aqui ("+res.blocos.length+" nomes, "+nIt+" horários). Peça à outra escola um arquivo só com os professores que também trabalham no "+instCurto()+"."); return; }
      res.arquivo=nome; EX_LIDO=res; var cm=casarOuBuscar(res); EX_SEL=cm.sel; res.conf=cm.conf; EX_OUTROS_ABERTO=false; EX_CONFIRMA=false; EX_ABRIR={};
      res.grupo={}; res.blocos.forEach(function(b,bi){ res.grupo[bi]=EX_SEL[bi]!=null&&EX_SEL[bi]>=0?"ach":"out"; });
      var ee=document.getElementById("exEscola"); if(!ee.value.trim()||ee.dataset.auto==="1"){ ee.value=res.escola||""; ee.dataset.auto=res.escola?"1":""; }
      box.innerHTML=""; renderExLido(); };
    var falha=function(t){ box.innerHTML='<div class="msg bad">'+t+"</div>"; };
    try{
      var pac=lerMarcador(u);
      if(pac){ var bl=blocosDePayload(pac); if(!bl||!bl.length){ falha("O arquivo veio deste gerador, mas não tem horários de professores."); return; }
        pronto({origem:"PDF ou planilha feitos por este gerador",escola:String(pac.escola||"").slice(0,120),cenario:"",blocos:bl,modo:"prof",exato:true}); return; }
      if(/^\s*[\[{]/.test(ini)||/^\xEF\xBB\xBF\s*[\[{]/.test(ini)||/\.json$/i.test(nome)){
        var o; try{ o=JSON.parse(textoDe(u).replace(/^\uFEFF/,"")); }catch(ej){ falha("Esse arquivo .json está com problema (não é um arquivo .json válido). Peça para a outra escola baixar de novo."); return; }
        var pl=null; try{ pl=o&&o.formato==="horario-professores"?o:(o&&((o.v===1||o.v===2)&&o.grid&&o.turmas||o.tipo===BK_TIPO&&o.dados)?exDeDados(o):null); }catch(ed){ pl=null; }
        if(!pl){ falha("Esse arquivo .json não é um horário exportado por este gerador."); return; }
        var b2=blocosDePayload(pl); if(!b2||!b2.length){ falha("Não há horários de professores nesse arquivo."); return; }
        pronto({origem:o.formato==="horario-professores"?"Arquivo exportado por este gerador":"Arquivo de dados de outro gerador",escola:String(pl.escola||"").slice(0,120),cenario:"",blocos:b2,modo:"prof",exato:true}); return; }
      if(ini.slice(0,2)==="PK"||/\.xlsx$/i.test(nome)||/\.csv$/i.test(nome)){
        var sheets; try{ sheets=ini.slice(0,2)==="PK"?lerXlsx(u):[{nome:nome,G:lerCsv(textoDe(u))}]; }catch(ex){ falha("Não foi possível abrir essa planilha. Abra no Excel ou LibreOffice, salve de novo como .xlsx (ou como PDF) e tente outra vez."); return; }
        var pl2=blocosDePlanilha(sheets);
        if(!pl2.blocos.length){ falha("Não encontrei aulas nessa planilha. O gerador entende o modelo de quadro (nome do dia, turmas ao lado e as aulas embaixo, com a disciplina e o professor em cada célula) e a grade por professor (dias nas colunas e horários nas linhas)."); return; }
        if(pl2.blocos.every(function(b){ return pareceTurma(b.nome); })){ pl2.blocos=buscarProfsNasCelulas(pl2.blocos); if(!pl2.blocos.length){ falha("A planilha está organizada por turma, mas não encontrei nela o nome de nenhum professor daqui."); return; } pronto({origem:"Planilha (por turma)",escola:pl2.escola,cenario:"",blocos:pl2.blocos,modo:"turma",exato:false}); return; }
        pronto({origem:"Planilha ("+(ini.slice(0,2)==="PK"?"Excel":"CSV")+")",escola:pl2.escola,cenario:"",blocos:pl2.blocos,modo:"prof",exato:false}); return; }
      if(ini.charCodeAt(0)===0xD0&&ini.charCodeAt(1)===0xCF){ falha("Essa planilha está no formato antigo do Excel (.xls). Abra no Excel ou LibreOffice, use “Salvar como” .xlsx (ou PDF) e traga de novo."); return; }
      if(/\.(ods|odt|doc|docx)$/i.test(nome)){ falha("O gerador lê PDF, planilha do Excel (.xlsx), .csv e o arquivo .json do gerador. Salve esse arquivo como PDF ou .xlsx e traga de novo."); return; }
      if(/^\s*</.test(ini)){ falha("Esse arquivo (planilha ou página .xls/.html) não tem os horários deste gerador. Abra no Excel ou LibreOffice, salve como .xlsx e traga de novo."); return; }
      if(ini.indexOf("%PDF")<0){ falha("Esse arquivo não é PDF, planilha (.xlsx ou .csv) nem .json. Use o PDF do horário (por exemplo, o “Relatório por Professor” do SIGAH) ou o arquivo exportado por este gerador."); return; }
      box.innerHTML='<div class="msg info">Lendo o PDF “'+esc(nome)+'” (pode levar alguns segundos)…</div>';
      setTimeout(function(){
        if(!carregarPdfjs()){ falha("Este navegador não conseguiu abrir o leitor de PDF. Tente no Google Chrome ou Firefox atualizado, ou peça à outra escola o arquivo .json exportado por este gerador."); return; }
        pdfPaginas(u).then(function(pages){
          var nTxt=pages.reduce(function(a,p){ return a+p.itens.length; },0);
          if(!nTxt){ falha("Esse PDF não tem texto para ler (parece uma foto ou um documento escaneado). Peça o PDF original, gerado pelo sistema da escola."); return; }
          var res=interpretarPdf(pages); if(!res.blocos.length){ falha("Não encontrei uma grade com os dias da semana (Segunda a Sexta) e os horários das aulas (ex.: 07:00 - 07:50) nesse PDF. O melhor é o “Relatório por Professor” do SIGAH ou o arquivo exportado por este gerador."); return; }
          var tur=res.blocos.filter(function(b){ return pareceTurma(b.nome); }).length, modo=tur>res.blocos.length*0.6?"turma":"prof";
          var juntos={}, bl=[]; res.blocos.forEach(function(b){ var k=normNome(b.nome)||("#"+bl.length); if(juntos[k]!=null){ bl[juntos[k]].itens=bl[juntos[k]].itens.concat(b.itens); return; } juntos[k]=bl.length; bl.push({nome:b.nome,itens:b.itens.slice()}); });
          if(modo==="turma"){ bl=buscarProfsNasCelulas(bl); if(!bl.length){ falha("O PDF está organizado por turma, mas não encontrei nele o nome de nenhum professor daqui."); return; } }
          else bl=bl.filter(function(b){ return b.nome&&b.itens.length; });
          if(!bl.length){ falha("Encontrei a grade, mas nenhuma aula dentro dela."); return; }
          pronto({origem:(res.tipoRel?res.tipoRel:"PDF")+(modo==="turma"?" (por turma)":""),escola:res.escola,cenario:res.cenario,blocos:bl,modo:modo,exato:false,cortado:pages.total>pages.length?pages.length+" de "+pages.total:""});
        }).catch(function(e){ var nm=String(e&&e.name||e); falha(/password/i.test(nm)?"Esse PDF está protegido por senha. Peça uma cópia sem senha.":/invalidpdf|format|corrupt/i.test(nm+" "+String(e&&e.message||""))?"Esse PDF está com problema (corrompido ou incompleto). Peça para a outra escola mandar de novo.":"Não foi possível ler esse PDF. Tente abrir e salvar de novo como PDF, ou peça o arquivo .json exportado por este gerador."); });
      },30);
    }catch(e){ falha("Não foi possível ler esse arquivo. Confira se é o PDF, a planilha (.xlsx) ou o .json do horário."); }
  };
  r.readAsArrayBuffer(f);
}
function casarOuBuscar(res){ if(res.modo==="turma"){ var sel={}, conf={}; res.blocos.forEach(function(b,bi){ sel[bi]=b.achado; conf[bi]={bi:bi,p:b.achado,sc:b.sc||0.7}; }); return {sel:sel,conf:conf}; } return casarNomes(res.blocos); }

// ---- conflitos (professor em dois lugares ou sem tempo de chegar) ----
function exConflitos(itens,margem){
  var AP=idxAulas(), out=[];
  itens.forEach(function(e){ var p=e.p, ei=toMin(e.ini), ef=toMin(e.fim), la=e.ini+"–"+e.fim+(e.txt?" · "+e.txt:"");
    (AP[p]||[]).forEach(function(a){ if(a.d!==e.d) return; var aqui=hmP(a.ini)+"–"+hmP(a.fim)+" · "+ST.turmas[a.t].nome+" ("+a.disc+")";
      if(a.ini<ef&&ei<a.fim) out.push({p:p,d:e.d,o:Math.min(a.ini,ei),tipo:"aula",aqui:aqui,la:la,escola:e.escola});
      else { var gap=Math.max(a.ini-ef,ei-a.fim); if(gap<margem) out.push({p:p,d:e.d,o:Math.min(a.ini,ei),tipo:"tempo",gap:gap,aqui:aqui,la:la,escola:e.escola}); } });
    if(ST.ha&&ST.ha[p]) (ST.ha[p].slots||[]).forEach(function(key){ var y=haParse(key); if(y.d===e.d&&y.ini<ef&&ei<y.fim) out.push({p:p,d:e.d,o:Math.min(y.ini,ei),tipo:"HA",aqui:"Hora-atividade "+y.txt,la:la,escola:e.escola}); });
  });
  out.sort(function(a,b){ return ST.profs[a.p].nome.localeCompare(ST.profs[b.p].nome)||a.d-b.d||a.o-b.o; });
  return out; }
function exItensGuardados(){ var out=[]; exDef().escolas.forEach(function(e){ e.itens.forEach(function(x){ out.push({p:x.p,d:x.d,ini:x.ini,fim:x.fim,txt:x.txt,escola:e.nome}); }); }); return out; }
function exItensLidos(){ var L=EX_LIDO, out=[], nm=(document.getElementById("exEscola").value||"").trim()||"outra escola"; if(!L) return out;
  L.blocos.forEach(function(b,bi){ var p=EX_SEL[bi]; if(p==null||p<0) return; b.itens.forEach(function(x){ out.push({p:p,d:x.d,ini:x.ini,fim:x.fim,txt:x.txt,escola:nm}); }); }); return out; }
function tabelaConflitos(L,comEscola){
  if(!L.length) return '<div class="msg ok">Nenhum conflito: nenhum professor fica em dois lugares ao mesmo tempo.</div>';
  var sit={aula:'<span class="pill" style="background:#FDE8E6;color:#8F1C13">Em dois lugares</span>',HA:'<span class="pill" style="background:#FCEBDD;color:#8A3D10">HA daqui em cima da aula de lá</span>'};
  return '<div class="scroll" tabindex="0"><table class="t cards"><tr><th>Professor</th><th>Dia</th><th>Aqui ('+esc(instCurto())+')</th><th>Na outra escola</th><th>Situação</th></tr>'+L.map(function(c){
    return '<tr><td data-l="Professor"><b>'+esc(ST.profs[c.p].nome)+'</b></td><td data-l="Dia">'+DIAS[c.d]+'</td><td data-l="Aqui">'+esc(c.aqui)+'</td><td data-l="Lá">'+(comEscola?"<b>"+esc(c.escola)+"</b><br>":"")+esc(c.la)+'</td><td data-l="Situação">'+(c.tipo==="tempo"?'<span class="pill" style="background:#FFF2CC;color:#6B4E00">Só '+c.gap+" min para trocar de escola</span>":sit[c.tipo])+"</td></tr>"; }).join("")+"</table></div>"; }
function resumoConflitos(L){ var a=L.filter(function(c){ return c.tipo==="aula"; }).length, h=L.filter(function(c){ return c.tipo==="HA"; }).length, t=L.filter(function(c){ return c.tipo==="tempo"; }).length;
  return {a:a,h:h,t:t,txt:[a?a+" aula(s) no mesmo horário":"",h?h+" HA em cima de aula de lá":"",t?t+" com pouco tempo para trocar de escola":""].filter(Boolean).join(" · ")}; }

// quantas aulas lidas são iguais às daqui (mesmo professor, dia, horário e turma): muitas iguais = arquivo do próprio colégio
function semelhancaPropria(){ var L=EX_LIDO, AP=idxAulas(), n=0, ig=0; if(!L) return {n:0,ig:0};
  L.blocos.forEach(function(b,bi){ var p=EX_SEL[bi]; if(p==null||p<0) return; b.itens.forEach(function(x){ n++; var t=" "+normNome(x.txt)+" ";
    if((AP[p]||[]).some(function(a){ return a.d===x.d&&hmP(a.ini)===x.ini&&hmP(a.fim)===x.fim&&t.indexOf(" "+normNome(ST.turmas[a.t].nome)+" ")>=0; })) ig++; }); });
  return {n:n,ig:ig}; }
function exProprio(){ var L=EX_LIDO; if(!L) return null; var sm=semelhancaPropria(), r=sm.n?sm.ig/sm.n:0, ch=instChave(), nm=!!ch&&((" "+normNome(L.escola)+" ").indexOf(" "+ch+" ")>=0||(" "+normNome(document.getElementById("exEscola").value)+" ").indexOf(" "+ch+" ")>=0);
  return (sm.n>=10&&r>=0.4)||(nm&&(sm.n<10||r>=0.15))?sm:null; }

// ---- tela ----
function opcoesProfs(sel){ return '<option value="-1">— não trabalha aqui —</option>'+profsOrdem().map(function(p){ var pr=ST.profs[p], c=pr.completo&&String(pr.completo).indexOf("?")<0&&pr.completo!==pr.nome?" ("+pr.completo+")":""; return '<option value="'+p+'"'+(p===sel?" selected":"")+">"+esc(pr.nome+c)+"</option>"; }).join(""); }
function renderExLido(){
  var box=document.getElementById("exLido"); if(!box) return; var L=EX_LIDO; if(!L){ box.innerHTML=""; return; }
  box.innerHTML='<div id="exResumo"></div><div id="exNomes"></div><div id="exRes"></div>'+
    '<div class="row" style="margin-top:10px"><button class="btn pri" id="exGuardar">Guardar o horário desta escola</button><button class="btn" id="exDescartar">Descartar</button><button class="btn sm" id="exVerLidos">Ver os horários lidos</button></div><div id="exLidosLista"></div>';
  document.getElementById("exGuardar").onclick=exGuardar;
  document.getElementById("exDescartar").onclick=function(){ EX_LIDO=null; EX_SEL={}; EX_CONFIRMA=false; var ee=document.getElementById("exEscola"); ee.value=""; ee.dataset.auto=""; document.getElementById("exMsg").innerHTML=""; renderExLido(); };
  document.getElementById("exVerLidos").onclick=function(){ var el=document.getElementById("exLidosLista"); if(el.innerHTML){ el.innerHTML=""; return; }
    el.innerHTML='<div class="scroll" tabindex="0" style="max-height:420px;overflow:auto;margin-top:8px"><table class="t cards"><tr><th>Nome no arquivo</th><th>Dia</th><th>Horário</th><th>Turma / disciplina lá</th></tr>'+L.blocos.map(function(b){ return b.itens.map(function(x,i){ return '<tr><td data-l="Nome">'+(i?"":"<b>"+esc(b.nome)+"</b>")+'</td><td data-l="Dia">'+DIAS[x.d]+'</td><td class="num" data-l="Horário">'+x.ini+"–"+x.fim+'</td><td data-l="Lá">'+esc(x.txt)+"</td></tr>"; }).join(""); }).join("")+"</table></div>"; };
  renderExNomes(); renderExRes();
}
function renderExNomes(){
  var L=EX_LIDO, el=document.getElementById("exNomes"); if(!L||!el) return;
  var ord=L.blocos.map(function(b,bi){ return bi; }), achados=ord.filter(function(bi){ return L.grupo[bi]==="ach"; }), outros=ord.filter(function(bi){ return L.grupo[bi]!=="ach"; });
  var linha=function(bi){ var b=L.blocos[bi], c=L.conf&&L.conf[bi], p=EX_SEL[bi]; if(p==null) p=-1;
    var marca=p<0?"":(c&&c.p===p&&c.sc>=0.6?(c.sc>=0.999?'<span class="pill" style="background:var(--okbg);color:var(--ok)">✓ mesmo nome</span>':c.sc>=0.85?'<span class="pill" style="background:var(--okbg);color:var(--ok)">✓ reconhecido</span>':'<span class="pill" style="background:#FFF2CC;color:#6B4E00">? confira</span>'):'<span class="pill" style="background:#E8F3FF;color:#1E3A5F">escolhido por você</span>');
    var sug=p<0&&c&&c.p>=0&&c.sc>=0.3?'<br><span class="small">parecido: '+esc(ST.profs[c.p].nome)+"</span>":"";
    var ctl=(L.grupo[bi]==="ach"||p>=0||EX_ABRIR[bi])?'<select data-exs="'+bi+'" aria-label="Quem é '+esc(b.nome)+' aqui">'+opcoesProfs(p)+"</select>":'<button class="btn sm" data-exa="'+bi+'">Escolher…</button>';
    return '<tr><td data-l="No arquivo"><b>'+esc(b.nome)+"</b>"+(b.completo?'<br><span class="small">'+esc(b.completo)+"</span>":"")+(b.ex&&b.ex.length?'<br><span class="small">ex.: '+esc(b.ex.join(" / "))+"</span>":"")+'</td><td class="num" data-l="Horários lá">'+b.itens.length+'</td><td data-l="É quem aqui">'+ctl+sug+'</td><td data-l="">'+marca+"</td></tr>"; };
  var cab="<tr><th>Nome no arquivo</th><th>Horários lá</th><th>É quem aqui?</th><th></th></tr>";
  var h='<h3 style="font-size:14px;margin:12px 0 4px">2. Confira quem é quem</h3><p class="small" style="margin:0 0 6px">'+(L.modo==="turma"?"O arquivo está organizado por turma; o gerador procurou o nome dos professores daqui dentro das aulas (veja os exemplos). Escolha “não trabalha aqui” se algum estiver errado.":"Os nomes iguais ou muito parecidos já vêm escolhidos. Confira os marcados com “? confira”. Se algum professor daqui aparece com outro nome no arquivo, escolha o nome dele na lista.")+"</p>";
  h+=achados.length?'<div class="scroll" tabindex="0"><table class="t cards">'+cab+achados.map(linha).join("")+"</table></div>":'<div class="msg warn">Nenhum nome do arquivo foi reconhecido como professor daqui. Se algum for, escolha na lista abaixo.</div>';
  if(outros.length) h+='<details id="exOutros" style="margin-top:8px"'+(EX_OUTROS_ABERTO||!achados.length?" open":"")+'><summary class="small" style="cursor:pointer">Outros '+outros.length+" nome(s) do arquivo que não foram reconhecidos aqui (normal: professores só da outra escola)</summary>"+'<div class="scroll" tabindex="0"><table class="t cards">'+cab+outros.map(linha).join("")+"</table></div></details>";
  el.innerHTML=h;
  var dt=document.getElementById("exOutros"); if(dt) dt.addEventListener("toggle",function(){ EX_OUTROS_ABERTO=dt.open; });
  el.querySelectorAll("[data-exs]").forEach(function(sl){ sl.onchange=function(){ EX_SEL[+sl.dataset.exs]=+sl.value; EX_CONFIRMA=false; renderExNomes(); renderExRes(); }; });
  el.querySelectorAll("[data-exa]").forEach(function(bt){ bt.onclick=function(){ var bi=+bt.dataset.exa; EX_ABRIR[bi]=1; var td=bt.parentNode; td.innerHTML='<select data-exs="'+bi+'" aria-label="Quem é '+esc(L.blocos[bi].nome)+' aqui">'+opcoesProfs(-1)+"</select>";
    var sl=td.querySelector("select"); sl.onchange=function(){ EX_SEL[bi]=+sl.value; EX_CONFIRMA=false; renderExNomes(); renderExRes(); }; sl.focus(); }; });
}
function renderExRes(){
  var L=EX_LIDO, el=document.getElementById("exRes"), rz=document.getElementById("exResumo"); if(!L||!el||!rz) return;
  var nI=L.blocos.reduce(function(a,b){ return a+b.itens.length; },0), prop=exProprio();
  rz.innerHTML='<div class="msg info" style="color:var(--text)"><b>Arquivo lido — ainda não foi guardado.</b> '+esc(L.arquivo)+" · "+esc(L.origem)+" · "+L.blocos.length+(L.modo==="turma"?" professor(es) daqui encontrado(s)":" nome(s)")+" · "+nI+" horário(s)"+(L.escola?" · escola no arquivo: <b>"+esc(L.escola)+"</b>":"")+(L.cenario?" · cenário: "+esc(L.cenario):"")+'.<br>Confira os nomes (item 2) e o resultado (item 3) e clique em <b>“Guardar o horário desta escola”</b>, no fim desta caixa.</div>'+
    (L.escola&&document.getElementById("exEscola").value.trim()&&normNome(L.escola)!==normNome(document.getElementById("exEscola").value)?'<div class="msg warn">No arquivo, a escola é “<b>'+esc(L.escola)+'</b>”, mas o nome escrito no item 1 é “<b>'+esc(document.getElementById("exEscola").value.trim())+'</b>”. Confira antes de guardar. <button class="btn sm" id="exUsarNomeArq">Usar o nome do arquivo</button></div>':"")+
    (L.cortado?'<div class="msg warn">O PDF é muito grande: foram lidas só as primeiras páginas ('+esc(L.cortado)+"). Se faltar algum professor, peça um PDF só com os professores que também trabalham aqui.</div>":"")+
    (prop?'<div class="msg warn">⚠️ Este arquivo parece ser do <b>próprio '+esc(instCurto())+'</b>'+(prop.n?": "+prop.ig+" das "+prop.n+" aulas lidas são iguais às daqui":"")+'. Para cruzar, use o horário da <b>outra</b> escola; se guardar este, as aulas daqui vão aparecer como conflito.</div>':"")+
    (!L.exato?'<p class="small" style="margin:4px 0">Este arquivo foi lido pela posição dos textos. Confira alguns horários (botão “Ver os horários lidos”) com o arquivo aberto ao lado.</p>':"");
  var bn=document.getElementById("exUsarNomeArq"); if(bn) bn.onclick=function(){ var ee=document.getElementById("exEscola"); ee.value=L.escola; ee.dataset.auto="1"; EX_CONFIRMA=false; renderExRes(); };
  var cf=exConflitos(exItensLidos(),+exDef().margem||0), rs=resumoConflitos(cf);
  el.innerHTML='<h3 style="font-size:14px;margin:14px 0 4px">3. Resultado</h3>'+(rs.txt?'<div class="msg warn"><b>'+rs.txt+"</b>.</div>":"")+tabelaConflitos(cf,false);
  var bg=document.getElementById("exGuardar"); if(bg) bg.textContent=EX_CONFIRMA?"Guardar mesmo assim?":"Guardar o horário desta escola";
}
function exGuardar(){
  var L=EX_LIDO, msg=document.getElementById("exMsg"), ee=document.getElementById("exEscola"); if(!L) return;
  var nome=(ee.value||"").trim().slice(0,120);
  if(!nome){ msg.innerHTML='<div class="msg warn">Escreva o nome da outra escola (no item 1) antes de guardar.</div>'; ee.focus(); return; }
  var itens=[], ps={}, spIni=1e9, spFim=-1; L.blocos.forEach(function(b,bi){ b.itens.forEach(function(x){ spIni=Math.min(spIni,toMin(x.ini)); spFim=Math.max(spFim,toMin(x.fim)); }); var p=EX_SEL[bi]; if(p==null||p<0) return; ps[p]=1; b.itens.forEach(function(x){ itens.push({p:p,d:x.d,ini:x.ini,fim:x.fim,nomeLa:b.nome,txt:x.txt}); }); });
  if(!itens.length){ msg.innerHTML='<div class="msg warn">Nenhum professor daqui foi escolhido. Escolha na lista quem trabalha nas duas escolas.</div>'; return; }
  if(exProprio()&&!EX_CONFIRMA){ EX_CONFIRMA=true; renderExRes(); msg.innerHTML='<div class="msg warn">Este arquivo parece ser do próprio '+esc(instCurto())+'. Se tem certeza de que é da outra escola, clique de novo em “Guardar mesmo assim?”.</div>'; return; }
  var E=exDef(), mesma=function(e){ return normNome(e.nome)===normNome(nome); }, trocados=0, mantidos=0, cen=normNome(L.cenario||"");
  E.escolas.forEach(function(e){ if(!mesma(e)) return; var mc=cen&&normNome(e.cenario||"")===cen;
    e.itens=e.itens.filter(function(x){ var a=toMin(x.ini), b=toMin(x.fim); if((mc||ps[x.p])&&a<spFim&&spIni<b){ trocados++; return false; } mantidos++; return true; }); });
  E.escolas=E.escolas.filter(function(e){ return e.itens.length>0; });
  E.escolas.push({id:"e"+Date.now().toString(36),nome:nome,cenario:L.cenario||"",arquivo:String(L.arquivo||"").slice(0,160),origem:L.origem,ts:agora(),quem:ST.ctx.quem||"",itens:itens});
  _EXT=null; var nh=E.usar?haConferirTodos():0, cf=exConflitos(itens.map(function(x){ return {p:x.p,d:x.d,ini:x.ini,fim:x.fim,txt:x.txt,escola:nome}; }),+E.margem||0), rs=resumoConflitos(cf), np=Object.keys(ps).length;
  logar("Outras escolas","Horário guardado: "+nome+(L.cenario?" ("+L.cenario+")":"")+" — "+np+" professor(es), "+itens.length+" horário(s)"+(trocados?"; trocou "+trocados+" horário(s) guardados antes":"")+(rs.txt?"; "+rs.txt:"; sem conflitos")+(nh?"; "+nh+" hora(s)-atividade tiradas por cair no horário da outra escola":""));
  EX_LIDO=null; EX_SEL={}; EX_CONFIRMA=false; ee.value=""; ee.dataset.auto=""; CACHE=null; save(); analisar(); renderExterno();
  msg.innerHTML='<div class="msg ok">Horário de <b>'+esc(nome)+"</b> guardado ("+np+" professor(es)). "+
    (trocados||mantidos?"Já havia horário desta escola guardado: "+(trocados?trocados+" horário(s) dos mesmos professores, no mesmo período, foram trocados pelos novos":"nada foi trocado")+(mantidos?"; "+mantidos+" horário(s) de outros períodos ou professores continuam guardados":"")+". ":"")+
    (rs.a+rs.h?"Há conflitos com a grade daqui: veja abaixo. "+(E.usar?"Para resolver, vá na aba Gerar e clique em “Ajustar a grade atual”: o gerador tira as aulas desses horários.":"Ligue “Considerar esses horários ao gerar” para o gerador resolver."):"Nenhum professor fica em dois lugares.")+(rs.t?" Atenção: "+rs.t+" aula(s) com pouco tempo para trocar de escola.":"")+(nh?" "+esc(avisoHAtirada(nh)):"")+"</div>";
}
function renderExterno(){
  var E=exDef();
  document.getElementById("exUsar").checked=!!E.usar; document.getElementById("exMargem").value=E.margem;
  var todos=exConflitos(exItensGuardados(),+E.margem||0), rs=resumoConflitos(todos);
  document.getElementById("exLista").className="t cards"; document.getElementById("exLista").innerHTML=E.escolas.length?"<tr><th>Escola</th><th>De onde veio</th><th>Guardado em</th><th>Professores</th><th>Horários</th><th></th></tr>"+E.escolas.map(function(e,i){ var np={}; e.itens.forEach(function(x){ np[x.p]=1; });
      return '<tr><td data-l="Escola"><b>'+esc(e.nome)+"</b>"+(e.cenario?'<br><span class="small">'+esc(e.cenario)+"</span>":"")+'</td><td data-l="De onde veio">'+esc(e.origem||"")+(e.arquivo?'<br><span class="small">'+esc(e.arquivo)+"</span>":"")+'</td><td class="num" data-l="Guardado em">'+(e.ts?fmtData(e.ts):"")+(e.quem?'<br><span class="small">'+esc(e.quem)+"</span>":"")+'</td><td class="num" data-l="Professores">'+Object.keys(np).length+'</td><td class="num" data-l="Horários">'+e.itens.length+'</td><td class="right" style="white-space:nowrap"><button class="btn sm" data-exver="'+i+'">Ver</button> <button class="btn sm" data-exdel="'+i+'">'+(EX_ARM[i]?"Confirmar?":"Remover")+"</button></td></tr>"; }).join(""):'<tr><td class="small">Nenhum horário de outra escola guardado ainda.</td></tr>';
  document.querySelectorAll("#exLista [data-exver]").forEach(function(b){ b.onclick=function(){ var i=+b.dataset.exver; EX_VER=EX_VER===i?null:i; renderExterno(); }; });
  document.querySelectorAll("#exLista [data-exdel]").forEach(function(b){ b.onclick=function(){ var i=+b.dataset.exdel; if(!EX_ARM[i]){ EX_ARM={}; EX_ARM[i]=1; renderExterno(); setTimeout(function(){ if(EX_ARM[i]){ EX_ARM={}; renderExterno(); } },4000); return; }
    var e=E.escolas[i]; E.escolas.splice(i,1); EX_ARM={}; EX_VER=null; _EXT=null; CACHE=null; logar("Outras escolas","Horário removido: "+e.nome+(e.cenario?" ("+e.cenario+")":"")); save(); analisar(); renderExterno(); }; });
  var ver=document.getElementById("exVer");
  if(EX_VER!=null&&E.escolas[EX_VER]){ var e=E.escolas[EX_VER], its=e.itens.slice().sort(function(a,b){ return ST.profs[a.p].nome.localeCompare(ST.profs[b.p].nome)||a.d-b.d||toMin(a.ini)-toMin(b.ini); });
    ver.innerHTML='<div class="card" style="margin-top:10px"><div class="row" style="justify-content:space-between"><b>'+esc(e.nome)+(e.cenario?" — "+esc(e.cenario):"")+'</b><button class="btn sm" id="exVerFechar">Fechar</button></div><div class="scroll" tabindex="0" style="max-height:420px;overflow:auto"><table class="t cards"><tr><th>Professor daqui</th><th>Nome lá</th><th>Dia</th><th>Horário</th><th>Turma / disciplina lá</th></tr>'+its.map(function(x){ return '<tr><td data-l="Professor"><b>'+esc(ST.profs[x.p].nome)+'</b></td><td data-l="Nome lá">'+esc(x.nomeLa||"")+'</td><td data-l="Dia">'+DIAS[x.d]+'</td><td class="num" data-l="Horário">'+x.ini+"–"+x.fim+'</td><td data-l="Lá">'+esc(x.txt||"")+"</td></tr>"; }).join("")+"</table></div></div>";
    document.getElementById("exVerFechar").onclick=function(){ EX_VER=null; renderExterno(); }; }
  else ver.innerHTML="";
  document.getElementById("exConfl").innerHTML=E.escolas.length?'<h3 style="font-size:14px;margin:12px 0 4px">Conflitos com a grade atual</h3>'+(rs.txt?'<div class="msg warn"><b>'+rs.txt+"</b>."+(rs.a+rs.h?(E.usar?" Na aba Gerar, clique em “Ajustar a grade atual” para o gerador tirar as aulas desses horários.":" Ligue “Considerar esses horários ao gerar” para o gerador resolver."):"")+"</div>":"")+tabelaConflitos(todos,true):"";
  // exportar
  var modo=document.querySelector('input[name="exQuem"]:checked').value, cnt=contaAulas(), lst=document.getElementById("exProfs");
  lst.style.display=modo==="esc"?"":"none";
  if(modo==="esc") lst.innerHTML=profsOrdem().filter(function(p){ return cnt[p]; }).map(function(p){ return '<label><input type="checkbox" data-exp="'+p+'"'+(EX_EXP[p]?" checked":"")+'><span class="dot" style="background:'+ST.profs[p].cor+'"></span>'+esc(ST.profs[p].nome)+(temExt(p)?" 🏫":"")+"</label>"; }).join("");
  lst.querySelectorAll("[data-exp]").forEach(function(c){ c.onchange=function(){ EX_EXP[+c.dataset.exp]=c.checked; }; });
  if(EX_LIDO&&document.getElementById("exRes")) renderExRes(); else renderExLido();
}
var EX_EXP={};
function exProfsExport(){ var modo=document.querySelector('input[name="exQuem"]:checked').value, cnt=contaAulas();
  return profsOrdem().filter(function(p){ return (cnt[p]||(ST.ha&&ST.ha[p]&&ST.ha[p].slots.length))&&(modo!=="esc"||EX_EXP[p]); }); }
function exNomeArq(ext){ return "horario-professores-"+instSlug()+"-"+hoje()+"."+ext; }
document.getElementById("exArq").onchange=function(e){ var f=e.target.files[0]; exLer(f); e.target.value=""; };
document.getElementById("exArqLbl").onkeydown=function(e){ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); document.getElementById("exArq").click(); } };
document.getElementById("exEscola").oninput=function(){ this.dataset.auto=""; };
var EX_ADIA=null; function exDepois(f){ clearTimeout(EX_ADIA); EX_ADIA=setTimeout(f,300); }
document.getElementById("exEscola").onchange=function(){ if(EX_LIDO){ EX_CONFIRMA=false; exDepois(renderExRes); } };
document.getElementById("exUsar").onchange=function(e){ var E=exDef(); E.usar=e.target.checked; _EXT=null; CACHE=null; var nh=E.usar?haConferirTodos():0;
  logar("Outras escolas",(E.usar?"Passou a considerar":"Deixou de considerar")+" os horários das outras escolas ao gerar"+(nh?"; "+nh+" hora(s)-atividade tiradas":"")); save(); analisar(); renderExterno();
  document.getElementById("exMsg").innerHTML=nh?'<div class="msg warn">'+esc(avisoHAtirada(nh))+"</div>":""; };
document.getElementById("exMargem").onchange=function(e){ var E=exDef(), v=Math.max(0,Math.min(180,Math.round(+e.target.value||0))); if(v===E.margem){ e.target.value=v; return; }
  logar("Outras escolas","Tempo para trocar de escola: "+E.margem+" → "+v+" minutos"); E.margem=v; e.target.value=v; _EXT=null; CACHE=null; save(); exDepois(function(){ analisar(); renderExterno(); }); };
document.querySelectorAll('input[name="exQuem"]').forEach(function(r){ r.onchange=renderExterno; });
document.getElementById("exBaixarJson").onclick=function(){ var ps=exProfsExport(), m=document.getElementById("exExpMsg"); if(!ps.length){ m.innerHTML='<div class="msg warn">Escolha pelo menos um professor.</div>'; return; }
  var pl=payloadHorario(ps,document.getElementById("exHA").checked), nome=exNomeArq("json");
  try{ var blob=new Blob([JSON.stringify(pl,null,1)],{type:"application/json"}), a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=nome; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); },1000);
    m.innerHTML='<div class="msg ok">Arquivo “'+esc(nome)+"” baixado, com "+pl.professores.length+" professor(es). Mande para a outra escola (e-mail ou WhatsApp). Se ela usa este gerador, é só abrir na aba Relatórios › Importar/Exportar.</div>"; logar("Outras escolas","Horário exportado (.json) com "+pl.professores.length+" professor(es)"); }
  catch(e){ m.innerHTML='<div class="msg bad">Não foi possível baixar aqui.</div>'; } };
document.getElementById("exBaixarPdf").onclick=function(){ var ps=exProfsExport(), m=document.getElementById("exExpMsg"); if(!ps.length){ m.innerHTML='<div class="msg warn">Escolha pelo menos um professor.</div>'; return; }
  var comHA=document.getElementById("exHA").checked, doc=novoPdf(), AP=idxAulas(), nome=exNomeArq("pdf");
  ps.forEach(function(p,i){ if(i) doc.addPage(); var pr=ST.profs[p]; cabecalho(doc,"Horário de "+pr.nome+(pr.completo&&pr.completo.indexOf("?")<0&&pr.completo!==pr.nome?" — "+pr.completo:""),"Horário no "+instNome()+" ("+instCidade()+")"+(comHA?", com a hora-atividade":"")+" · para conferir com outra escola · emitido em "+fmtData(agora()));
    var y=30; secoesDoProf(p,comHA,AP).forEach(function(sec){ doc.setFontSize(9.5); doc.setTextColor(30,58,95); doc.setFont("helvetica","bold"); if(y>170){ doc.addPage(); y=15; } doc.text(sec.nome,14,y+3); doc.setFont("helvetica","normal"); y=tabelaSemana(doc,y+5,linhasPdfProf(p,sec,comHA,AP,true))+6; }); });
  doc.internal.events.subscribe("postPutResources",function(){ var txt=b64DeBytes(fflate.deflateSync(new TextEncoder().encode(JSON.stringify(payloadHorario(ps,comHA))),{level:9})); doc.internal.write("%GH29-HORARIO-INICIO"); for(var i=0;i<txt.length;i+=180) doc.internal.write("%"+txt.slice(i,i+180)); doc.internal.write("%GH29-HORARIO-FIM"); });
  salvarPdf(doc,nome); m.innerHTML='<div class="msg ok">PDF “'+esc(nome)+"” baixado, com "+ps.length+" professor(es). Ele serve para ler e também para a outra escola importar neste gerador.</div>"; logar("Outras escolas","Horário exportado (PDF) com "+ps.length+" professor(es)"); };
document.getElementById("exTodosConf").onclick=function(){ var cnt=contaAulas(); EX_EXP={}; profsOrdem().forEach(function(p){ if(cnt[p]&&temExt(p)) EX_EXP[p]=true; }); document.querySelector('input[name="exQuem"][value="esc"]').checked=true; renderExterno(); };
