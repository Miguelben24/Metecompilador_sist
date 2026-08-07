export function nombreSimbolo(c){
  const map = {'=':'IGUAL','+':'MAS','-':'MENOS','*':'MULT','/':'DIV',';':'PUNTOCOMA',
    ',':'COMA','(':'PARIZQ',')':'PARDER','{':'LLAIZQ','}':'LLADER','<':'MENORQUE',
    '>':'MAYORQUE',':':'DOSPUNTOS','.':'PUNTO','!':'NOT','&':'AMP','|':'PIPE',
    '%':'PORC','^':'CARET','~':'TILDE','?':'INTERR','[':'CORIZQ',']':'CORDER'};
  return map[c] || ('ASCII' + c.charCodeAt(0));
}

export function generarCompiladorCpp(palabrasClave, simbolosLista, transiciones){
  const TOK_ID = 9001, TOK_NUM = 9002, TOK_FIN = 9998, TOK_ERR = 9999;
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
  L.push(palabrasClave.map(([n,t]) => `    {"${n}", ${t}}`).join(',\n'));
  L.push('};\n');

  L.push('map<char,int> mapaSimbolos = {');
  L.push(simbolosLista.map(([s,t]) => `    {'${s}', ${t}}`).join(',\n'));
  L.push('};\n');

  L.push('int buscarTransicion(int estado, int token) {');
  L.push('    auto it = tabla.find({estado, token});');
  L.push('    if (it == tabla.end()) return TOK_ERR;');
  L.push('    return it->second;');
  L.push('}\n');

  L.push('void inicializarTabla() {');
  for(const t of transiciones){
    let tok = null;
    if(t.condicion === 'ID') tok = 'TOK_ID';
    else if(t.condicion === 'NUM') tok = 'TOK_NUM';
    else {
      const pc = palabrasClave.find(p => p[0] === t.condicion);
      const sm = simbolosLista.find(p => p[0] === t.condicion);
      if(pc) tok = pc[1]; else if(sm) tok = sm[1];
    }
    if(tok !== null) L.push(`    tabla[{${t.origen}, ${tok}}] = ${t.destino};`);
  }
  L.push('}\n');

  L.push("int pos = 0; string cad;\n");

  L.push("int getToken(string& lexema) {");
  L.push("    while (pos < (int)cad.size() && isspace((unsigned char)cad[pos])) pos++;"
  );
  L.push("    if (pos >= (int)cad.size()) return TOK_FIN;");
  L.push("    if (cad[pos] == '\"') {");
  L.push("        pos++;"
  );
  L.push("        string tmp;");
  L.push("        while (pos < (int)cad.size() && cad[pos] != '\"') { tmp += cad[pos]; pos++; }");
  L.push("        if (pos < (int)cad.size()) pos++;"
  );
  L.push("        lexema = tmp;");
  L.push("        return TOK_ID;");
  L.push("    }");
  L.push("    if (isalpha((unsigned char)cad[pos])) {");
  L.push("        string tmp;");
  L.push("        while (pos < (int)cad.size() && (isalnum((unsigned char)cad[pos]) || cad[pos] == '_')) { tmp += cad[pos]; pos++; }");
  L.push("        lexema = tmp;");
  L.push("        if (mapaPalabrasClave.count(tmp)) return mapaPalabrasClave[tmp];");
  L.push("        return TOK_ID;");
  L.push("    }");
  L.push("    if (isdigit((unsigned char)cad[pos])) {");
  L.push("        string tmp;");
  L.push("        while (pos < (int)cad.size() && (isdigit((unsigned char)cad[pos]) || cad[pos] == '.')) { tmp += cad[pos]; pos++; }");
  L.push("        lexema = tmp;");
  L.push("        return TOK_NUM;");
  L.push("    }");
  L.push("    if (mapaSimbolos.count(cad[pos])) {");
  L.push("        lexema = string(1, cad[pos]);");
  L.push("        int tok = mapaSimbolos[cad[pos]];");
  L.push("        pos++;");
  L.push("        return tok;");
  L.push("    }");
  L.push("    pos++;");
  L.push("    return TOK_ERR;");
  L.push("}\n");

  L.push('int main(int argc, char** argv) {');
  L.push('    if (argc < 2) { cout << "Uso: " << argv[0] << " <archivo_fuente>" << endl; return 1; }');
  L.push('    ifstream f(argv[1]);');
  L.push('    if (!f.is_open()) { cout << "No se pudo abrir el archivo" << endl; return 1; }');
  L.push('    string linea, todo;');
  L.push('    while (getline(f, linea)) todo += linea + "\n";');
  L.push('    cad = todo;');
  L.push('    inicializarTabla();\n');
  L.push('    int estado = 0, token; string lexema;');
  L.push('    while (true) {');
  L.push('        token = getToken(lexema);');
  L.push('        if (token == TOK_FIN) { cout << "CADENA ACEPTADA en q" << estado << endl; break; }');
  L.push('        if (token == TOK_ERR) { cout << "[ERROR LEXICO] caracter no reconocido cerca de: " << lexema << endl; return 1; }');
  L.push('        int siguiente = buscarTransicion(estado, token);');
  L.push('        cout << " q" << estado << " --( " << lexema << " )--> q" << siguiente << endl;');
  L.push('        if (siguiente == TOK_ERR) { cout << "[ERROR SINTACTICO] transicion invalida desde q" << estado << " con \"" << lexema << "\"" << endl; return 1; }');
  L.push('        estado = siguiente;');
  L.push('    }');
  L.push('    return 1;');
  L.push('}');

  return L.join('\n');
}
