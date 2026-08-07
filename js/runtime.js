export function probarPrograma(cad, palabrasClave, simbolosLista, transiciones){
  const TOK_ID = 9001, TOK_NUM = 9002;
  const mapaPC = {};  for(const [n,t] of palabrasClave) mapaPC[n] = t;
  const mapaSim = {}; for(const [s,t] of simbolosLista) mapaSim[s] = t;

  const tabla = new Map();
  for(const t of transiciones){
    let tok = null;
    if(t.condicion==='ID') tok = TOK_ID;
    else if(t.condicion==='NUM') tok = TOK_NUM;
    else if(mapaPC.hasOwnProperty(t.condicion)) tok = mapaPC[t.condicion];
    else if(mapaSim.hasOwnProperty(t.condicion)) tok = mapaSim[t.condicion];
    if(tok!==null) tabla.set(t.origen + '|' + tok, t.destino);
  }

  let pos = 0;
  function nextTok(){
    while(pos<cad.length && /\s/.test(cad[pos])) pos++;
    if(pos>=cad.length) return {tok:'FIN'};
    if(cad[pos]==='"'){
      pos++; let s='';
      while(pos<cad.length && cad[pos]!=='"'){ s+=cad[pos]; pos++; }
      if(pos<cad.length) pos++;
      return {tok:'TOK', lex:s, num:TOK_ID};
    }
    if(/[a-zA-Z]/.test(cad[pos])){
      let s='';
      while(pos<cad.length && /[a-zA-Z0-9_]/.test(cad[pos])){ s+=cad[pos]; pos++; }
      if(mapaPC.hasOwnProperty(s)) return {tok:'TOK', lex:s, num:mapaPC[s]};
      return {tok:'TOK', lex:s, num:TOK_ID};
    }
    if(/[0-9]/.test(cad[pos])){
      let s='';
      while(pos<cad.length && (/[0-9]/.test(cad[pos])||cad[pos]==='.')){ s+=cad[pos]; pos++; }
      return {tok:'TOK', lex:s, num:TOK_NUM};
    }
    if(mapaSim.hasOwnProperty(cad[pos])){
      const c = cad[pos]; pos++;
      return {tok:'TOK', lex:c, num:mapaSim[c]};
    }
    const c = cad[pos]; pos++;
    return {tok:'ERR', lex:c};
  }

  const trace = [];
  let estado = 0;
  while(true){
    const r = nextTok();
    if(r.tok==='FIN') return { ok:true, trace, estadoFinal: estado };
    if(r.tok==='ERR') return { ok:false, trace, error:`Carácter no reconocido cerca de: '${r.lex}'` };
    const destino = tabla.has(estado+'|'+r.num) ? tabla.get(estado+'|'+r.num) : null;
    trace.push(`q${estado} --( ${r.lex} )--> q${destino!==null ? destino : '?'}`);
    if(destino===null) return { ok:false, trace, error:`Transición inválida desde q${estado} con '${r.lex}'` };
    estado = destino;
  }
}
