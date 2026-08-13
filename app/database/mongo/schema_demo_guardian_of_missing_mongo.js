// =====================================================================
// GuardianOfTheMising - Setup MongoDB (arquitectura hibrida)
// Colecciones que viven aqui: geocercas, ubicaciones
// (el resto de las entidades siguen en MySQL, ver schema_mysql.sql)
//
// Como correrlo:
//   mongosh "mongodb://localhost:27017" setup_mongo.js
//   o pegar el contenido dentro de MongoDB Compass / Atlas Shell
// =====================================================================

use("guardian_of_the_missing");

// ---------------------------------------------------------------------
// Coleccion: geocercas
// IMPORTANTE: GeoJSON usa el orden [longitud, latitud] (al reves que en
// el MySQL viejo). Es el error mas comun al migrar, cuidado con esto.
// ---------------------------------------------------------------------
db.createCollection("geocercas", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id_usuario", "nombre", "tipo_zona", "ubicacion", "radio_metros", "activa"],
      properties: {
        id_usuario: {
          bsonType: "int",
          description: "Referencia logica a Usuarios.id_usuario (MySQL). Sin FK real: validar en backend."
        },
        nombre: { bsonType: "string" },
        tipo_zona: {
          enum: ["segura", "riesgo"],
          description: "Debe ser 'segura' o 'riesgo'"
        },
        ubicacion: {
          bsonType: "object",
          required: ["type", "coordinates"],
          properties: {
            type: { enum: ["Point"] },
            coordinates: {
              bsonType: "array",
              minItems: 2,
              maxItems: 2,
              description: "[longitud, latitud]"
            }
          }
        },
        radio_metros: { bsonType: ["double", "int"] },
        activa: { bsonType: "bool" },
        fecha_creacion: { bsonType: "date" }
      }
    }
  }
});

// Indice geoespacial: permite consultas tipo "que geocercas hay cerca de X punto"
db.geocercas.createIndex({ ubicacion: "2dsphere" });
// Indice de apoyo: listar geocercas por usuario rapido (para la pantalla web)
db.geocercas.createIndex({ id_usuario: 1 });

// ---------------------------------------------------------------------
// Coleccion: ubicaciones (historial de GPS, alto volumen de escritura)
// ---------------------------------------------------------------------
db.createCollection("ubicaciones", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id_usuario", "ubicacion", "fecha_hora"],
      properties: {
        id_usuario: { bsonType: "int" },
        ubicacion: {
          bsonType: "object",
          required: ["type", "coordinates"],
          properties: {
            type: { enum: ["Point"] },
            coordinates: { bsonType: "array", minItems: 2, maxItems: 2 }
          }
        },
        precision_metros: { bsonType: ["double", "int", "null"] },
        fecha_hora: { bsonType: "date" }
      }
    }
  }
});

db.ubicaciones.createIndex({ ubicacion: "2dsphere" });
// Igual al idx_alertas_usuario_fecha que tenias en MySQL: consultas de
// "ultima ubicacion conocida" y mapa de incidentes por usuario/fecha.
db.ubicaciones.createIndex({ id_usuario: 1, fecha_hora: -1 });

print("Colecciones 'geocercas' y 'ubicaciones' creadas con validacion e indices 2dsphere.");

// ---------------------------------------------------------------------
// EJEMPLOS DE USO (dejar comentado, es referencia para el backend)
// ---------------------------------------------------------------------

// Insertar una geocerca:
// db.geocercas.insertOne({
//   id_usuario: 1,
//   nombre: "Casa",
//   tipo_zona: "segura",
//   ubicacion: { type: "Point", coordinates: [-98.7654321, 20.1234567] },
//   radio_metros: 150.0,
//   activa: true,
//   fecha_creacion: new Date()
// });

// Insertar un ping de ubicacion:
// db.ubicaciones.insertOne({
//   id_usuario: 1,
//   ubicacion: { type: "Point", coordinates: [-98.7654000, 20.1234000] },
//   precision_metros: 5.5,
//   fecha_hora: new Date()
// });

// Consulta clave del proyecto: "el usuario esta dentro de esta geocerca?"
// (equivalente a la deteccion de entrada/salida de zona)
// db.geocercas.find({
//   ubicacion: {
//     $geoWithin: {
//       $centerSphere: [
//         [-98.7654000, 20.1234000], // [lng, lat] del usuario ahora
//         150 / 6378100              // radio_metros convertido a radianes
//       ]
//     }
//   },
//   id_usuario: 1
// });

// "Ultima ubicacion conocida" de un usuario (para la tabla de Usuarios en web):
// db.ubicaciones.find({ id_usuario: 1 }).sort({ fecha_hora: -1 }).limit(1);
