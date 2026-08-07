import { makeLexer } from './lexer.js';
import { transition, nombreToken, MSG_SINTACTICO, FIN, ERROR, ID, SIMBOL, ENTERO } from './constants.js';

export function analizarConfig(cad){
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
