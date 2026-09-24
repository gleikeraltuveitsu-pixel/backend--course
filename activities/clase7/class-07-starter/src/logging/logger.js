// Logger estructurado mínimo: una línea JSON por evento, escrita a stdout
// (info) o stderr (error). Sin archivos, sin servicios externos — el punto
// de esta clase es decidir QUÉ loguear, no aprender una librería de logs.
//
// Toda línea lleva timestamp, level y nombre de evento; el llamador agrega
// solo los campos que eligió deliberadamente. Aquí nada lee la petición,
// así que nada puede filtrar un header o un body por accidente.

function line(level, event, fields = {}) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...fields
  });
}

export const logger = {
  info(event, fields) {
    console.log(line('info', event, fields));
  },
  error(event, fields) {
    console.error(line('error', event, fields));
  }
};