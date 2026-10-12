
// =====================================================================
// INSTITUIÇÃO: cadastro da escola no padrão da SEED-PR (usado nos cabeçalhos, PDFs, mensagens e arquivos)
// =====================================================================
var INST_CAMPOS=[
  {g:"Identificação",c:[
    ["nome","Nome oficial do estabelecimento","ex.: Colégio Estadual Cívico-Militar 29 de Abril",2],
    ["curto","Nome curto (usado nas mensagens e nos arquivos)","ex.: Colégio 29 de Abril"],
    ["codSeed","Código do estabelecimento (SEED)","só números"],
    ["inep","Código INEP","8 números"],
    ["cnpj","CNPJ (APMF / Associação de Pais)","00.000.000/0000-00"],
    ["dependencia","Dependência administrativa","Estadual"],
    ["localizacao","Localização","Urbana ou Rural"]]},
  {g:"Núcleo e endereço",c:[
    ["nre","Núcleo Regional de Educação (NRE)","ex.: Paranaguá"],
    ["municipio","Município","ex.: Guaratuba"],
    ["uf","UF","PR"],
    ["endereco","Endereço (rua e número)","",2],
    ["bairro","Bairro",""],
    ["cep","CEP","00000-000"],
    ["telefone","Telefone","(41) 0000-0000"],
    ["email","E-mail institucional","nome@escola.pr.gov.br"]]},
  {g:"Oferta de ensino",c:[
    ["oferta","Níveis e modalidades ofertados","ex.: Ensino Fundamental (anos finais) e Ensino Médio",2],
    ["turnos","Turnos de funcionamento","ex.: Manhã e Tarde"]]},
  {g:"Equipe gestora",c:[
    ["diretor","Diretor(a)",""],
    ["diretorAux","Diretor(a) auxiliar",""],
    ["pedagogos","Equipe pedagógica (nomes)","",2],
    ["secretario","Secretário(a) escolar",""]]}
];
function instPadrao(){ return {nome:"Colégio Estadual Cívico-Militar 29 de Abril",curto:"Colégio 29 de Abril",codSeed:"",inep:"",cnpj:"",dependencia:"Estadual",localizacao:"Urbana",
  nre:"Paranaguá",municipio:"Guaratuba",uf:"PR",endereco:"",bairro:"",cep:"",telefone:"",email:"",oferta:"Ensino Fundamental (anos finais) e Ensino Médio",turnos:"Manhã e Tarde",
  diretor:"",diretorAux:"",pedagogos:"",secretario:"",logo:"",logoW:0,logoH:0}; }
var IEDIT=null;
function inst(){ var I=ST.inst; if(!I||typeof I!=="object"||Array.isArray(I)) I=ST.inst=deep(instPadrao()); Object.keys(instPadrao()).forEach(function(k){ if(I[k]==null) I[k]=instPadrao()[k]; }); return I; }
function instNome(){ return inst().nome||inst().curto||"Escola"; }
function instCurto(){ return inst().curto||inst().nome||"Escola"; }
function instCidade(){ var I=inst(); return [I.municipio,I.uf].filter(Boolean).join("-"); }
function instSlug(){ return (normNome(instCurto()).toLowerCase().replace(/^(colegio|escola) (estadual )?/,"").replace(/ /g,"-")||"escola").slice(0,40); }
// palavras que identificam a escola (sem "Colégio", "Estadual"...) — usado para reconhecer arquivos do próprio colégio
function instChave(){ return normNome(instCurto()+" ").replace(/\b(COLEGIO|ESCOLA|ESTADUAL|CIVICO|MILITAR|CE|C E|EEEFM|DE|DA|DO)\b/g," ").replace(/\s+/g," ").trim(); }
function sanearInst(o){ var I=o.inst&&typeof o.inst==="object"&&!Array.isArray(o.inst)?o.inst:{}, n={};
  Object.keys(instPadrao()).forEach(function(k){ var v=I[k]; if(k==="logo") n.logo=typeof v==="string"&&/^data:image\/(png|jpeg);base64,[A-Za-z0-9+\/=]+$/.test(v)&&v.length<400000?v:"";
    else if(k==="logoW"||k==="logoH") n[k]=+v>0&&+v<5000?+v:0; else n[k]=v==null?instPadrao()[k]:String(v).slice(0,300); });
  o.inst=n; }
// cabeçalho dos PDFs: brasão/logo (se houver) e o nome da escola
function pdfLogo(doc,x,y,h){ var I=inst(); if(!I.logo||!I.logoW||!I.logoH) return 0; try{ var w=h*I.logoW/I.logoH; if(w>h*2.2){ w=h*2.2; } doc.addImage(I.logo,I.logo.indexOf("image/png")>0?"PNG":"JPEG",x,y,w,h*1); return w+3; }catch(e){ return 0; } }
function renderInst(){
  var I=inst(), ed=!!IEDIT, V=ed?IEDIT:I, dis=ed?"":" disabled";
  var h='<div id="iMsg"></div><div class="row" style="justify-content:space-between;margin-bottom:6px"><span class="small">'+(ed?"Preencha e clique em <b>Salvar</b>. Nada muda até salvar.":"Para mudar, clique em <b>Editar</b>.")+'</span><span class="row">'+
    (ed?'<button class="btn sm pri" id="iSalvar">Salvar</button><button class="btn sm" id="iCancelar">Cancelar</button>':'<button class="btn sm pri" id="iEditar">Editar</button>')+"</span></div>";
  INST_CAMPOS.forEach(function(gr){ h+='<div class="impgrp"><h4>'+gr.g+'</h4><div class="grid2">'+gr.c.map(function(c){
    return '<label'+(c[3]===2?' style="grid-column:1/-1"':"")+'>'+c[1]+'<br><input type="text" data-if="'+c[0]+'" value="'+esc(V[c[0]])+'" placeholder="'+esc(c[2])+'" style="width:100%"'+dis+"></label>"; }).join("")+"</div></div>"; });
  h+='<div class="impgrp"><h4>Brasão ou logotipo (aparece nos PDFs)</h4><div class="row">'+(V.logo?'<img src="'+V.logo+'" alt="Logotipo da escola" style="max-height:64px;max-width:160px;border:1px solid var(--border);border-radius:6px;background:#fff;padding:4px">':'<span class="small">Nenhuma imagem.</span>')+
    (ed?'<label class="btn sm" tabindex="0" role="button" id="iLogoLbl">Escolher imagem (PNG ou JPG)<input type="file" id="iLogo" accept="image/png,image/jpeg" hidden></label>'+(V.logo?'<button class="btn sm" id="iLogoTirar">Tirar imagem</button>':""):"")+"</div></div>";
  document.getElementById("iForm").innerHTML=h;
  var guardar=function(){ document.querySelectorAll("#iForm [data-if]").forEach(function(el){ IEDIT[el.dataset.if]=el.value.trim(); }); };
  if(!ed){ document.getElementById("iEditar").onclick=function(){ IEDIT=deep(I); renderInst(); }; return; }
  document.querySelectorAll("#iForm [data-if]").forEach(function(el){ var k=el.dataset.if;
    if(k==="telefone") el.oninput=function(){ mascaraFone(el); };
    if(k==="cep") el.oninput=function(){ var d=el.value.replace(/\D/g,"").slice(0,8); el.value=d.length>5?d.slice(0,5)+"-"+d.slice(5):d; };
    if(k==="inep"||k==="codSeed") el.oninput=function(){ el.value=el.value.replace(/\D/g,"").slice(0,k==="inep"?8:12); };
    if(k==="cnpj") el.oninput=function(){ var d=el.value.replace(/\D/g,"").slice(0,14), r=d; if(d.length>12) r=d.slice(0,2)+"."+d.slice(2,5)+"."+d.slice(5,8)+"/"+d.slice(8,12)+"-"+d.slice(12); else if(d.length>8) r=d.slice(0,2)+"."+d.slice(2,5)+"."+d.slice(5,8)+"/"+d.slice(8); else if(d.length>5) r=d.slice(0,2)+"."+d.slice(2,5)+"."+d.slice(5); else if(d.length>2) r=d.slice(0,2)+"."+d.slice(2); el.value=r; }; });
  document.getElementById("iCancelar").onclick=function(){ IEDIT=null; renderInst(); };
  var lt=document.getElementById("iLogoTirar"); if(lt) lt.onclick=function(){ guardar(); IEDIT.logo=""; IEDIT.logoW=0; IEDIT.logoH=0; renderInst(); };
  var ll=document.getElementById("iLogoLbl"); if(ll) ll.onkeydown=function(e){ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); document.getElementById("iLogo").click(); } };
  var fl=document.getElementById("iLogo"); if(fl) fl.onchange=function(e){ var f=e.target.files[0]; if(!f) return; var msg=document.getElementById("iMsg");
    if(!/^image\/(png|jpeg)$/.test(f.type)){ msg.innerHTML='<div class="msg warn">Use uma imagem PNG ou JPG.</div>'; return; }
    var r=new FileReader(); r.onload=function(){ var im=new Image(); im.onload=function(){ var k=Math.min(1,240/Math.max(im.width,im.height)), cv=document.createElement("canvas"); cv.width=Math.max(1,Math.round(im.width*k)); cv.height=Math.max(1,Math.round(im.height*k));
        var cx=cv.getContext("2d"); cx.fillStyle="#fff"; cx.fillRect(0,0,cv.width,cv.height); cx.drawImage(im,0,0,cv.width,cv.height); guardar(); IEDIT.logo=cv.toDataURL("image/png"); IEDIT.logoW=cv.width; IEDIT.logoH=cv.height; renderInst(); };
      im.onerror=function(){ msg.innerHTML='<div class="msg warn">Não foi possível abrir essa imagem.</div>'; }; im.src=r.result; }; r.readAsDataURL(f); };
  var salvar=function(){ guardar(); var msg=document.getElementById("iMsg"), N=IEDIT, er=[];
    if(!N.nome) er.push("o nome oficial"); if(!N.curto) er.push("o nome curto");
    if(N.inep&&N.inep.length!==8) er.push("o código INEP (8 números)");
    if(N.email&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(N.email)) er.push("o e-mail");
    if(N.cep&&!/^\d{5}-\d{3}$/.test(N.cep)) er.push("o CEP (00000-000)");
    if(N.cnpj&&N.cnpj.replace(/\D/g,"").length!==14) er.push("o CNPJ (14 números)");
    if(er.length){ msg.innerHTML='<div class="msg warn">Confira '+er.join(", ")+".</div>"; return; }
    var mud=[]; INST_CAMPOS.forEach(function(g){ g.c.forEach(function(c){ if((I[c[0]]||"")!==(N[c[0]]||"")) mud.push(c[1].replace(/ \(.*\)$/,"")); }); }); if(I.logo!==N.logo) mud.push("brasão/logotipo");
    ST.inst=N; IEDIT=null; if(mud.length) logar("Instituição","Cadastro da escola atualizado: "+mud.join(", ")); save(); aplicarInst(); renderInst();
    document.getElementById("iMsg").innerHTML='<div class="msg ok">'+(mud.length?"Cadastro salvo. Os PDFs, as mensagens e os arquivos passam a usar estes dados.":"Nada mudou.")+"</div>"; };
  document.getElementById("iSalvar").onclick=salvar;
}
// nome da escola no topo da tela e na aba do navegador
function aplicarInst(){ var c=instCurto(); var h=document.querySelector("header h1"); if(h) h.textContent="Gerador de Horário — "+c; document.title="Gerador de Horário — "+c; }
