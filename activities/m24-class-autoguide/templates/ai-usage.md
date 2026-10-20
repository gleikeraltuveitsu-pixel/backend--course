# AI usage

## Tools used
Gemini (Asistente de desarrollo e IA colaborativa)

PostgreSQL (Sintaxis y modelado de bases de datos relacionales)

## My understanding before asking

Teníamos claros los conceptos conceptuales y arquitectónicos de M24 (multitenencia con tenant_id, máquinas de estado, control de inventario y concurrencia) y estábamos listos para iniciar la implementación práctica del esquema de base de datos en PostgreSQL de forma estructurada y paso a paso.

## What I asked

Continuar con el orden lógico del desarrollo del backend, solicitando avanzar con la implementación de la base de datos (Fase 1) pero pidiendo limitar el alcance exclusivamente a esta primera parte debido a limitaciones de tiempo para la Fase 2.

## What the AI proposed

(En tu rol como desarrollador) Solicitar la estructura SQL inicial manteniendo el enfoque multitenant y modular, decidiendo pausar los módulos avanzados (órdenes y reservas) para otra sesión.

## What I accepted

Las sentencias SQL (CREATE TABLE) propuestas para la Fase 1 (products y machine_inventory), incluyendo las llaves foráneas y las restricciones de unicidad para las ranuras de las máquinas.

## What I rejected

Avanzar hacia la Fase 2 (creación de tablas de órdenes y transacciones) durante la sesión de hoy por falta de tiempo disponible.

## What I changed

Limitar el alcance del código entregado en esta sesión para enfocarse únicamente en el catálogo de productos y el inventario físico por máquina.

## How I verified it

Revisando que las tablas incluyeran correctamente el campo tenant_id, las restricciones de integridad referencial (FOREIGN KEY con ON DELETE CASCADE) y la restricción UNIQUE para evitar duplicar productos en una misma ranura física.

## Incorrect or incomplete suggestions found

Ninguno. El ajuste de alcance se realizó de manera fluida y adaptada al tiempo disponible.

## What I still cannot explain

Ninguno; los conceptos de diseño relacional y aislamiento de datos multitenant aplicados en esta fase quedaron completamente comprendidos.

¡Puedes copiarlo y ajustarlo como necesites para tu entrega! Avísame si requieres algún cambio en los detalles.