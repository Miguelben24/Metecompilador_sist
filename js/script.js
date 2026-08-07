(function(){

/* =========================================================
   1. LEXICO / SINTACTICO / SEMANTICO DE config.txt
   (puerto directo de la clase Analisis del C++ original)
   ========================================================= */

const PC=0, S=1, INIPC=2, FINPC=3, INISIM=4, FINSIM=5, COMA=6,
      ID=7, SIMBOL=8, ENTERO=9, ITT=12, FTT=13, FIN=666, ERROR=999;

const KEYWORDS = { PC:PC, S:S, inipc:INIPC, finpc:FINPC, inisim:INISIM, finsim:FINSIM, ITT:ITT, FTT:FTT };

const NOMBRE_TOKEN = {
  0:'PC', 1:'S', 2:'inipc', 3:'finpc', 4:'inisim', 5:'finsim',
  6:'coma (,)', 7:'ID (Palabra)', 8:'SIMBOLO', 9:'NUMERO',
  12:'ITT', 13:'FTT', 666:'FIN'
};
function nombreToken(t){ return NOMBRE_TOKEN[t] || 'DESCONOCIDO'; }

const T = {};
function setT(o,tok,d){ if(!T[o]) T[o]={}; T[o][tok]=d; }
setT(0,PC,1);      setT(1,INIPC,2);   setT(2,ID,3);      setT(3,ENTERO,14);
setT(14,COMA,2);   setT(14,FINPC,4);
setT(4,S,5);       setT(0,S,5);       setT(5,INISIM,6);  setT(6,SIMBOL,7);
setT(7,ENTERO,15); setT(15,COMA,6);   setT(15,FINSIM,8);
setT(8,PC,1);      setT(8,ITT,9);     setT(9,ENTERO,10); setT(10,ID,11);
setT(10,SIMBOL,11);setT(11,ENTERO,12);setT(12,COMA,9);   setT(12,FTT,13);

function transition(estado, tok){
  return (T[estado] && T[estado][tok] !== undefined) ? T[estado][tok] : ERROR;
}

function makeLexer(cad){
  let pos = 0;
  function isElement(ch){
    if(ch===undefined) return false;
    if(/[a-zA-Z0-9]/.test(ch)) return false;
    if(ch===' '||ch==='\n'||ch==='\t'||ch==='\r') return false;
    if(ch.charCodeAt(0)===39) return false; // apostrofe, igual que el C++ original
    return true;
  }
  function next(){
    while(pos<cad.length && (cad[pos]===' '||cad[pos]==='\n'||cad[pos]==='\t'||cad[pos]==='\r')) pos++;
    if(pos>=cad.length) return {tok:FIN};
    if(cad[pos]==='#' && cad[pos+1]==='#'){
      pos+=2;
      while(pos<cad.length){
        if(cad[pos]==='#'&&cad[pos+1]==='#'){ pos+=2; break; }
        pos++;
      }
      return next();
    }
    if(cad[pos]==='"'){
      pos++;
      let s='';
      while(pos<cad.length && cad[pos]!=='"'){ s+=cad[pos]; pos++; }
      if(cad[pos]==='"') pos++;
      return {tok:ID, value:s};
    }
    if(/[a-zA-Z]/.test(cad[pos])){
      let s='';
      while(pos<cad.length && /[a-zA-Z0-9_]/.test(cad[pos])){ s+=cad[pos]; pos++; }
      if(KEYWORDS.hasOwnProperty(s)) return {tok:KEYWORDS[s], value:s};
      return {tok:ID, value:s};
    }
    if(/[0-9]/.test(cad[pos])){
      let s='';
      while(pos<cad.length && (/[0-9]/.test(cad[pos])||cad[pos]==='.')){ s+=cad[pos]; pos++; }
      return {tok:ENTERO, value:s};
    }
    if(isElement(cad[pos])){
      const c = cad[pos]; pos++;
      if(c===',') return {tok:COMA, value:','};
      return {tok:SIMBOL, value:c};
    }
    pos++;
    return {tok:ERROR, value:cad[pos-1]};
  }
  return { next };
}

const MSG_SINTACTICO = {
  0:"Se esperaba iniciar con 'PC' o 'S'.",
  1:"Se esperaba la palabra 'inipc'.",
  2:"Se esperaba un ID (nombre de palabra clave).",
  3:"Se esperaba un número de token entero asociado.",
  4:"Se esperaba la palabra 'S'.",
  5:"Se esperaba la palabra 'inisim'.",
  6:"Se esperaba un símbolo válido.",
  7:"Se esperaba un número de token entero asociado.",
  8:"Se esperaba el inicio de transiciones 'ITT'.",
  9:"Se esperaba el estado de origen (número).",
  10:"Se esperaba la condición de salto (ID o símbolo).",
  11:"Se esperaba el estado de destino (número).",
  12:"Faltó una coma ',' para agregar más reglas o 'FTT' para cerrar.",
  14:"Se esperaba una coma ',' o 'finpc'.",
  15:"Se esperaba una coma ',' o 'finsim'."
};

function analizarConfig(cad){
  const lex = makeLexer(cad);
  let estado = 0, temp_lexema = '';
  let origen_din = null, token_din = '', destino_din = null;
  const palabrasClave = [], simbolosLista = [], transiciones = [], trace = [];

  while(true){
    const {tok, value} = lex.next();

    if(tok===FIN){
      if(estado===13 || estado===8 || estado===4){
        return { ok:true, palabrasClave, simbolosLista, transiciones, trace };
      }
      return { ok:false, error:"El archivo terminó abruptamente sin cerrar correctamente los bloques (PC / S / ITT).",
               trace, palabrasClave, simbolosLista, transiciones };
    }

    const prev = estado;
    estado = transition(prev, tok);

    let texto;
    if(tok===ID){
      texto = value;
      if(prev===2) temp_lexema = value;
    } else if(tok===SIMBOL){
      texto = value;
      if(prev===6) temp_lexema = value;
    } else if(tok===ENTERO){
      texto = value;
      if(prev===3) palabrasClave.push([temp_lexema, parseInt(value,10)]);
      else if(prev===7) simbolosLista.push([temp_lexema, parseInt(value,10)]);
    } else {
      texto = nombreToken(tok);
    }

    trace.push(`q${prev} --( ${texto} )--> q${estado===ERROR ? '?' : estado}`);

    if(estado===ERROR){
      return { ok:false, error: MSG_SINTACTICO[prev] || "Estructura inválida en config.txt.",
               trace, palabrasClave, simbolosLista, transiciones };
    }

    if(prev===9 && estado===10) origen_din = parseInt(value,10);
    if(prev===10 && estado===11) token_din = value;
    if(prev===11 && estado===12){
      destino_din = parseInt(value,10);
      transiciones.push({ origen: origen_din, condicion: token_din, destino: destino_din });
    }
  }
}

function analizarSemantico(palabrasClave, simbolosLista, transiciones){
  const errores = [];
  const setPC = new Set();
  for(const [pc] of palabrasClave){
    if(setPC.has(pc)) errores.push(`Palabra clave duplicada: '${pc}'.`);
    setPC.add(pc);
  }
  const setSim = new Set();
  for(const [s] of simbolosLista){
    if(setSim.has(s)) errores.push(`Símbolo duplicado: '${s}'.`);
    setSim.add(s);
  }
  const registradas = new Set();
  for(const t of transiciones){
    const clave = t.origen + '|' + t.condicion;
    if(registradas.has(clave)){
      errores.push(`No determinismo: el estado q${t.origen} con la condición '${t.condicion}' ya tiene un destino asignado.`);
    }
    registradas.add(clave);
    if(t.condicion!=='ID' && t.condicion!=='NUM' && !setPC.has(t.condicion) && !setSim.has(t.condicion)){
      errores.push(`La condición '${t.condicion}' usada en la transición del estado q${t.origen} no está declarada ni como palabra clave (PC) ni como símbolo (S).`);
    }
  }
  return { ok: errores.length===0, errores };
}

/* =========================================================
   2. GENERADOR DEL COMPILADOR .CPP
   (puerto de generarCompiladorCpp, con soporte de comillas
   ya incorporado en el getToken generado)
   ========================================================= */

function nombreSimbolo(c){
  const map = {'=':'IGUAL','+':'MAS','-':'MENOS','*':'MULT','/':'DIV',';':'PUNTOCOMA',
    ',':'COMA','(':'PARIZQ',')':'PARDER','{':'LLAIZQ','}':'LLADER','<':'MENORQUE',
    '>':'MAYORQUE',':':'DOSPUNTOS','.':'PUNTO','!':'NOT','&':'AMP','|':'PIPE',
    '%':'PORC','^':'CARET','~':'TILDE','?':'INTERR','[':'CORIZQ',']':'CORDER'};
  return map[c] || ('ASCII' + c.charCodeAt(0));
}

function generarCompiladorCpp(palabrasClave, simbolosLista, transiciones){
  const TOK_ID=9001, TOK_NUM=9002, TOK_FIN=9998, TOK_ERR=9999;
  const L = [];
  L.push('// ===================================================');
  L.push('// COMPILADOR GENERADO AUTOMATICAMENTE A PARTIR DE config.txt');
  L.push('// ===================================================');
  L.push('#include <iostream>\n#include <fstream>\n#include <map>\n#include <string>\n#include <cctype>\n#include <utility>\nusing namespace std;\n');

  L.push('// ---- Tokens de PALABRAS CLAVE (leidos de config.txt) ----');
  for(const [nombre,num] of palabrasClave) L.push(`#define TOK_${nombre} ${num}`);

  L.push('\n// ---- Tokens de SIMBOLOS (leidos de config.txt) ----');
  for(const [simb,num] of simbolosLista) L.push(`#define TOK_SIM_${nombreSimbolo(simb[0])} ${num}  // simbolo original: '${simb}'`);

  L.push('\n// ---- Tokens reservados del generador ----');
  L.push(`#define TOK_ID  ${TOK_ID}`);
  L.push(`#define TOK_NUM ${TOK_NUM}`);
  L.push(`#define TOK_FIN ${TOK_FIN}`);
  L.push(`#define TOK_ERR ${TOK_ERR}\n`);

  L.push('map<pair<int,int>,int> tabla;\n');

  L.push('map<string,int> mapaPalabrasClave = {');
  L.push(palabrasClave.map(([n,t])=>`    {"${n}", ${t}}`).join(',\n'));
  L.push('};\n');

  L.push('map<char,int> mapaSimbolos = {');
  L.push(simbolosLista.map(([s,t])=>`    {'${s}', ${t}}`).join(',\n'));
  L.push('};\n');

  L.push('int buscarTransicion(int estado, int token) {');
  L.push('    auto it = tabla.find({estado, token});');
  L.push('    if (it == tabla.end()) return TOK_ERR;');
  L.push('    return it->second;');
  L.push('}\n');

  L.push('void inicializarTabla() {');
  for(const t of transiciones){
    let tok = null;
    if(t.condicion==='ID') tok = 'TOK_ID';
    else if(t.condicion==='NUM') tok = 'TOK_NUM';
    else {
      const pc = palabrasClave.find(p=>p[0]===t.condicion);
      const sm = simbolosLista.find(p=>p[0]===t.condicion);
      if(pc) tok = pc[1]; else if(sm) tok = sm[1];
    }
    if(tok!==null) L.push(`    tabla[{${t.origen}, ${tok}}] = ${t.destino};`);
  }
  L.push('}\n');

  L.push('int pos = 0; string cad;\n');

  L.push('int getToken(string& lexema) {');
  L.push('    while (pos < (int)cad.size() && isspace((unsigned char)cad[pos])) pos++;');
  L.push('    if (pos >= (int)cad.size()) return TOK_FIN;');
  L.push('    if (cad[pos] == \'"\') {');
  L.push('        pos++;');
  L.push('        string tmp;');
  L.push('        while (pos < (int)cad.size() && cad[pos] != \'"\') { tmp += cad[pos]; pos++; }');
  L.push('        if (pos < (int)cad.size()) pos++;');
  L.push('        lexema = tmp;');
  L.push('        return TOK_ID;');
  L.push('    }');
  L.push('    if (isalpha((unsigned char)cad[pos])) {');
  L.push('        string tmp;');
  L.push('        while (pos < (int)cad.size() && (isalnum((unsigned char)cad[pos]) || cad[pos]==\'_\')) { tmp += cad[pos]; pos++; }');
  L.push('        lexema = tmp;');
  L.push('        if (mapaPalabrasClave.count(tmp)) return mapaPalabrasClave[tmp];');
  L.push('        return TOK_ID;');
  L.push('    }');
  L.push('    if (isdigit((unsigned char)cad[pos])) {');
  L.push('        string tmp;');
  L.push('        while (pos < (int)cad.size() && (isdigit((unsigned char)cad[pos]) || cad[pos]==\'.\')) { tmp += cad[pos]; pos++; }');
  L.push('        lexema = tmp;');
  L.push('        return TOK_NUM;');
  L.push('    }');
  L.push('    if (mapaSimbolos.count(cad[pos])) {');
  L.push('        lexema = string(1, cad[pos]);');
  L.push('        int tok = mapaSimbolos[cad[pos]];');
  L.push('        pos++;');
  L.push('        return tok;');
  L.push('    }');
  L.push('    pos++;');
  L.push('    return TOK_ERR;');
  L.push('}\n');

  L.push('int main(int argc, char** argv) {');
  L.push('    if (argc < 2) { cout << "Uso: " << argv[0] << " <archivo_fuente>" << endl; return 1; }');
  L.push('    ifstream f(argv[1]);');
  L.push('    if (!f.is_open()) { cout << "No se pudo abrir el archivo" << endl; return 1; }');
  L.push('    string linea, todo;');
  L.push('    while (getline(f, linea)) todo += linea + "\\n";');
  L.push('    cad = todo;');
  L.push('    inicializarTabla();\n');
  L.push('    int estado = 0, token; string lexema;');
  L.push('    while (true) {');
  L.push('        token = getToken(lexema);');
  L.push('        if (token == TOK_FIN) { cout << "CADENA ACEPTADA en q" << estado << endl; break; }');
  L.push('        if (token == TOK_ERR) { cout << "[ERROR LEXICO] caracter no reconocido cerca de: " << lexema << endl; return 1; }');
  L.push('        int siguiente = buscarTransicion(estado, token);');
  L.push('        cout << " q" << estado << " --( " << lexema << " )--> q" << siguiente << endl;');
  L.push('        if (siguiente == TOK_ERR) { cout << "[ERROR SINTACTICO] transicion invalida desde q" << estado << " con \'" << lexema << "\'" << endl; return 1; }');
  L.push('        estado = siguiente;');
  L.push('    }');
  L.push('    return 0;');
  L.push('}');

  return L.join('\n');
}

/* =========================================================
   3. PROBADOR EN VIVO (misma logica que el .cpp generado,
   corrida directamente en JS sobre palabrasClave/simbolosLista/transiciones)
   ========================================================= */

function probarPrograma(cad, palabrasClave, simbolosLista, transiciones){
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

/* =========================================================
   4. WIRING DE LA INTERFAZ
   ========================================================= */

const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

let ultimoAnalisis = null;

const cfgInput = document.getElementById('cfgInput');
const testInput = document.getElementById('testInput');

cfgInput.value =
`PC inipc
    mostrar 1,
    sumar 2,
    restar 3,
    variable 4,
    leer 5,
    si 6,
    mayor 7,
    menor 8,
    igual 9,
    repetir 10,
    matriz 11
finpc

S inisim
    = 20,
    + 21,
    - 22,
    ; 23
finsim

ITT
    0 mostrar 1,
    1 ID 2,
    2 ; 0,

    0 sumar 3,
    3 ID 4,
    3 NUM 4,
    4 ID 41,
    4 NUM 41,
    41 ; 0,

    0 restar 5,
    5 ID 6,
    5 NUM 6,
    6 ID 61,
    6 NUM 61,
    61 ; 0,

    0 variable 7,
    7 ID 8,
    8 NUM 9,
    9 ; 0,

    0 leer 10,
    10 ID 11,
    11 ; 0,

    0 si 12,
    12 ID 13,
    13 mayor 14,
    13 menor 15,
    13 igual 16,
    14 NUM 17,
    15 NUM 17,
    16 NUM 17,
    17 mostrar 18,
    18 ID 19,
    19 ; 0,

    0 repetir 20,
    20 NUM 21,
    21 mostrar 22,
    22 ID 23,
    23 ; 0,

    0 matriz 24,
    24 ID 25,
    25 NUM 26,
    26 NUM 27,
    27 NUM 27,
    27 ; 0
FTT`;

testInput.value =
`variable x 15 ;
variable y 10 ;
mostrar "Iniciando pruebas del compilador" ;
sumar x y ;
restar x y ;
si x mayor 10 mostrar "X es mayor a 10" ;
repetir 3 mostrar "Hola mundo" ;
matriz m 2 2 1 2 3 4 ;`;

document.getElementById('btnValidar').addEventListener('click', () => {
  const cad = cfgInput.value;
  const res = analizarConfig(cad);

  const out = document.getElementById('cfgOutput');
  const verdict = document.getElementById('cfgVerdict');
  const errBox = document.getElementById('cfgErrors');
  const tablesWrap = document.getElementById('cfgTablesWrap');
  const detTrans = document.getElementById('detTransiciones');
  const traceBox = document.getElementById('cfgTrace');
  const status = document.getElementById('cfgStatus');

  out.classList.add('show');
  traceBox.innerHTML = res.trace.map(l => esc(l)).join('\n') || '(sin traza)';

  if(!res.ok){
    verdict.innerHTML = `<span class="stamp bad">ESPECIFICACIÓN INVÁLIDA</span><span class="verdict-text">falló en la etapa léxico/sintáctica</span>`;
    errBox.style.display = 'block';
    errBox.innerHTML = `<li>${esc(res.error)}</li>`;
    tablesWrap.style.display = 'none';
    detTrans.style.display = 'none';
    status.textContent = 'especificación inválida — corrige y vuelve a validar';
    ultimoAnalisis = null;
    document.getElementById('btnGenerar').disabled = true;
    document.getElementById('btnProbar').disabled = true;
    document.getElementById('genStatus').textContent = 'valida la especificación primero';
    document.getElementById('testStatus').textContent = 'valida la especificación primero';
    return;
  }

  const sem = analizarSemantico(res.palabrasClave, res.simbolosLista, res.transiciones);

  if(!sem.ok){
    verdict.innerHTML = `<span class="stamp bad">ERROR SEMÁNTICO</span><span class="verdict-text">sintaxis correcta, pero hay reglas inconsistentes</span>`;
    errBox.style.display = 'block';
    errBox.innerHTML = sem.errores.map(e => `<li>${esc(e)}</li>`).join('');
  } else {
    verdict.innerHTML = `<span class="stamp ok">ESPECIFICACIÓN VÁLIDA</span><span class="verdict-text">léxico, sintáctico y semántico sin errores</span>`;
    errBox.style.display = 'none';
  }

  tablesWrap.style.display = 'grid';
  document.getElementById('tblPC').innerHTML = res.palabrasClave.map(([n,t]) => `<tr><td>${esc(n)}</td><td>${t}</td></tr>`).join('') || '<tr><td colspan="2">—</td></tr>';
  document.getElementById('tblSim').innerHTML = res.simbolosLista.map(([n,t]) => `<tr><td>${esc(n)}</td><td>${t}</td></tr>`).join('') || '<tr><td colspan="2">—</td></tr>';

  detTrans.style.display = 'block';
  document.querySelector('#tblTrans tbody').innerHTML = res.transiciones.map(t =>
    `<tr><td>q${t.origen}</td><td>${esc(t.condicion)}</td><td>q${t.destino}</td></tr>`
  ).join('') || '<tr><td colspan="3">—</td></tr>';

  if(sem.ok){
    ultimoAnalisis = res;
    status.textContent = 'válida — ya puedes generar el compilador y probarlo';
    document.getElementById('btnGenerar').disabled = false;
    document.getElementById('btnProbar').disabled = false;
    document.getElementById('genStatus').textContent = '';
    document.getElementById('testStatus').textContent = '';
  } else {
    ultimoAnalisis = null;
    status.textContent = 'errores semánticos — corrige y vuelve a validar';
    document.getElementById('btnGenerar').disabled = true;
    document.getElementById('btnProbar').disabled = true;
    document.getElementById('genStatus').textContent = 'valida la especificación primero';
    document.getElementById('testStatus').textContent = 'valida la especificación primero';
  }
});

let ultimoCpp = null;

document.getElementById('btnGenerar').addEventListener('click', () => {
  if(!ultimoAnalisis) return;
  ultimoCpp = generarCompiladorCpp(ultimoAnalisis.palabrasClave, ultimoAnalisis.simbolosLista, ultimoAnalisis.transiciones);
  const out = document.getElementById('genOutput');
  out.classList.add('show');
  document.getElementById('genCode').textContent = ultimoCpp;
  document.getElementById('btnDescargar').disabled = false;
});

document.getElementById('btnDescargar').addEventListener('click', () => {
  if(!ultimoCpp) return;
  const blob = new Blob([ultimoCpp], { type: 'text/x-c++src' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'compilador_generado.cpp';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

document.getElementById('btnProbar').addEventListener('click', () => {
  if(!ultimoAnalisis) return;
  const res = probarPrograma(testInput.value, ultimoAnalisis.palabrasClave, ultimoAnalisis.simbolosLista, ultimoAnalisis.transiciones);

  const out = document.getElementById('testOutput');
  out.classList.add('show');
  document.getElementById('testTrace').innerHTML = res.trace.map(l => esc(l)).join('\n') || '(sin traza)';

  const verdict = document.getElementById('testVerdict');
  if(res.ok){
    verdict.innerHTML = `<span class="stamp ok">CADENA ACEPTADA</span><span class="verdict-text">terminó en el estado q${res.estadoFinal}</span>`;
  } else {
    verdict.innerHTML = `<span class="stamp bad">CADENA RECHAZADA</span><span class="verdict-text">${esc(res.error)}</span>`;
  }
});

})();