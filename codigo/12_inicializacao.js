
// ---------- início ----------
document.getElementById("ctxQuem").value=ST.ctx.quem||""; document.getElementById("ctxMotivo").value=ST.ctx.motivo||"";
document.getElementById("ctxQuem").onchange=function(e){ ST.ctx.quem=e.target.value.trim(); save(); };
document.getElementById("ctxMotivo").onchange=function(e){ ST.ctx.motivo=e.target.value.trim(); save(); };
if(ST._reconciliar){ try{ reconciliarAusencias(ST._reconciliar); }catch(e){} delete ST._reconciliar; }
edCarregar(); inst(); aplicarInst();
save();
avisoSalvar();
fillSelectsOnce();
analisar();
show("grade");
if(ST.visual) delete ST.visual;
edBarraGlobal(); edBotoes();
