/**
 * De Hierro Muebles · Avisos automáticos de pedidos
 * Planilla de Google + este script: cuando cambiás la "Etapa" de un pedido,
 * el cliente recibe un mail con la novedad y la fecha estimada de entrega.
 * Se envía desde la cuenta de Gmail dueña de la planilla (usar dehierromuebles.sf@gmail.com).
 *
 * Instalación (una sola vez):
 *  1. Con la cuenta dehierromuebles.sf@gmail.com, crear una planilla nueva en sheets.google.com.
 *  2. Extensiones > Apps Script. Borrar lo que haya, pegar este archivo y guardar.
 *  3. Elegir la función "instalar" arriba y tocar Ejecutar. Aceptar los permisos
 *     (Google avisa "app no verificada": Configuración avanzada > Ir al proyecto).
 *  4. Volver a la planilla: ya tiene la hoja "Pedidos" con los encabezados y el desplegable.
 */

const MARCA = 'De Hierro Muebles';
const INSTAGRAM = 'dehierromuebles.sf';
const HOJA = 'Pedidos';
const COL = { pedido:1, cliente:2, email:3, mueble:4, etapa:5, entrega:6, nota:7, aviso:8 };
const ENCABEZADOS = ['Pedido', 'Cliente', 'Email', 'Mueble', 'Etapa', 'Entrega estimada', 'Nota para el cliente', 'Último aviso'];

const ETAPAS = [
  ['Pedido confirmado',    'Recibimos la seña y tu mueble ya está en agenda.'],
  ['Materiales',           'Compramos el hierro y la madera para tu pieza.'],
  ['Estructura de hierro', 'Estamos cortando y soldando la estructura.'],
  ['Pintura y madera',     'Pintamos el hierro y lijamos y protegemos la madera.'],
  ['Armado y control',     'Armamos el mueble y revisamos cada detalle.'],
  ['Listo para entregar',  '¡Tu mueble está terminado! Coordinemos el envío.'],
  ['Entregado',            '¡Gracias por confiar en nosotros! Que lo disfrutes.'],
];

function instalar() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(HOJA) || ss.insertSheet(HOJA);
  sh.getRange(1, 1, 1, ENCABEZADOS.length).setValues([ENCABEZADOS]).setFontWeight('bold');
  sh.setFrozenRows(1);
  const regla = SpreadsheetApp.newDataValidation().requireValueInList(ETAPAS.map(e => e[0]), true).build();
  sh.getRange(2, COL.etapa, 500, 1).setDataValidation(regla);
  sh.getRange(2, COL.entrega, 500, 1).setNumberFormat('dd/mm/yyyy');
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('alEditar').forSpreadsheet(ss).onEdit().create();
  SpreadsheetApp.getUi().alert('Listo. Cada vez que cambies la columna "Etapa", se avisa al cliente por mail.');
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu(MARCA)
    .addItem('Reenviar aviso de la fila seleccionada', 'reenviarFila')
    .addToUi();
}

function alEditar(e) {
  const r = e.range;
  if (r.getSheet().getName() !== HOJA || r.getColumn() !== COL.etapa || r.getRow() < 2 || r.getNumRows() > 1) return;
  if (!e.value) return;
  avisar(r.getSheet(), r.getRow());
}

function reenviarFila() {
  const sh = SpreadsheetApp.getActiveSheet();
  avisar(sh, sh.getActiveRange().getRow());
}

function avisar(sh, fila) {
  const v = sh.getRange(fila, 1, 1, ENCABEZADOS.length).getValues()[0];
  const pedido = v[COL.pedido-1], cliente = String(v[COL.cliente-1]).split(' ')[0];
  const email = String(v[COL.email-1]).trim(), mueble = v[COL.mueble-1];
  const etapa = v[COL.etapa-1], entrega = v[COL.entrega-1], nota = v[COL.nota-1];
  const idx = ETAPAS.findIndex(x => x[0] === etapa);
  if (!email || idx < 0) { SpreadsheetApp.getActive().toast('Falta el email o la etapa en la fila ' + fila); return; }

  const fecha = entrega instanceof Date ? Utilities.formatDate(entrega, 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy') : (entrega || 'a confirmar');
  const lista = ETAPAS.slice(0, 6).map((x, i) => {
    const hecho = i < idx || idx >= 5, actual = i === idx;
    const marca = hecho && !actual ? '✔' : actual ? '●' : '○';
    const estilo = actual ? 'font-weight:bold;color:#1A1D20' : hecho ? 'color:#1A1D20' : 'color:#9AA0A6';
    return `<tr><td style="padding:4px 10px 4px 0;${estilo}">${marca}</td><td style="padding:4px 0;${estilo}">${x[0]}</td></tr>`;
  }).join('');

  const asunto = `${MARCA} · Tu ${mueble || 'mueble'}: ${etapa}`;
  const html = `
  <div style="font-family:Arial,sans-serif;max-width:520px;color:#1A1D20">
    <div style="border-top:6px solid #E8A80C;padding-top:12px;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#565C63">${MARCA} · Pedido ${pedido}</div>
    <h2 style="margin:10px 0 6px">Hola ${cliente}, tu ${mueble || 'mueble'} avanzó</h2>
    <p style="font-size:16px;margin:0 0 4px"><b>${etapa}</b></p>
    <p style="margin:0 0 16px;color:#565C63">${ETAPAS[idx][1]}</p>
    ${nota ? `<p style="background:#F3F3F1;border-left:4px solid #E8A80C;padding:10px 12px">${nota}</p>` : ''}
    <table style="border-collapse:collapse;margin:8px 0 16px;font-size:15px">${lista}</table>
    ${idx < 6 ? `<p style="margin:0 0 16px">Entrega estimada: <b>${fecha}</b></p>` : ''}
    <p style="font-size:14px;color:#565C63">Cualquier duda, respondé este mail o escribinos por Instagram a <a href="https://instagram.com/${INSTAGRAM}">@${INSTAGRAM}</a>.</p>
  </div>`;
  const texto = `Hola ${cliente}, tu ${mueble || 'mueble'} pasó a la etapa "${etapa}". ${ETAPAS[idx][1]} ${nota || ''} Entrega estimada: ${fecha}.`;

  MailApp.sendEmail({ to: email, subject: asunto, htmlBody: html, body: texto, name: MARCA });
  sh.getRange(fila, COL.aviso).setValue(new Date());
  SpreadsheetApp.getActive().toast('Aviso enviado a ' + email);
}
