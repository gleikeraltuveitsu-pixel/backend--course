// Error de aplicación tipado, compartido por todos los módulos desde la
// clase 5: tanto el módulo auth como el de requests lo lanzan, y la capa
// HTTP traduce la categoría a un código de estado. Categorías:
//   'contract'  -> 400  el cliente rompió el contrato de la petición
//   'auth'      -> 401  no hay identidad confiable (token ausente/inválido, mal login)
//   'forbidden' -> 403  actor identificado, operación no permitida
//   'resource'  -> 404  el recurso no existe (o no debe revelarse)
//   'domain'    -> 409  conflicto con el estado actual del recurso
export class AppError extends Error {
  constructor(category, code, message) {
    super(message);
    this.category = category;
    this.code = code;
  }
}