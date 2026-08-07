export const PC=0, S=1, INIPC=2, FINPC=3, INISIM=4, FINSIM=5, COMA=6,
      ID=7, SIMBOL=8, ENTERO=9, ITT=12, FTT=13, FIN=666, ERROR=999;

export const KEYWORDS = { PC:PC, S:S, inipc:INIPC, finpc:FINPC, inisim:INISIM, finsim:FINSIM, ITT:ITT, FTT:FTT };

export const NOMBRE_TOKEN = {
  0:'PC', 1:'S', 2:'inipc', 3:'finpc', 4:'inisim', 5:'finsim',
  6:'coma (,)', 7:'ID (Palabra)', 8:'SIMBOLO', 9:'NUMERO',
  12:'ITT', 13:'FTT', 666:'FIN'
};
export function nombreToken(t){ return NOMBRE_TOKEN[t] || 'DESCONOCIDO'; }

const T = {};
function setT(o,tok,d){ if(!T[o]) T[o]={}; T[o][tok]=d; }
setT(0,PC,1);      setT(1,INIPC,2);   setT(2,ID,3);      setT(3,ENTERO,14);
setT(14,COMA,2);   setT(14,FINPC,4);
setT(4,S,5);       setT(0,S,5);       setT(5,INISIM,6);  setT(6,SIMBOL,7);
setT(7,ENTERO,15); setT(15,COMA,6);   setT(15,FINSIM,8);
setT(8,PC,1);      setT(8,ITT,9);     setT(9,ENTERO,10); setT(10,ID,11);
setT(10,SIMBOL,11);setT(11,ENTERO,12);setT(12,COMA,9);   setT(12,FTT,13);

export function transition(estado, tok){
  return (T[estado] && T[estado][tok] !== undefined) ? T[estado][tok] : ERROR;
}

export const MSG_SINTACTICO = {
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
