import { MongoClient } from "mongodb";
import { PersonaModel } from "./types.ts";
import { fromModelToPersona } from "./utils.ts";

// Connection URL
const url = Deno.env.get("MONGO_URL");

if (!url) {
  console.log("URL no encontrada", { status: 404 });
  Deno.exit(-1);
}

const client = new MongoClient(url);

// Database Name
const dbName = "examenBackEnd";

await client.connect();
console.log("Connected successfully to server");
const db = client.db(dbName);
const personasCollection = db.collection<PersonaModel>("Personas");

const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const method = req.method;
  const path = url.pathname;

  if (method === "GET") {
    if (path === "/personas") {
      const personasDB = await personasCollection.find({}).toArray();
      const personas = await Promise.all(
        personasDB.map((p) => fromModelToPersona(p, personasCollection))
      );
      return new Response(JSON.stringify(personas));
    } else if (path === "/persona") {
      const email = url.searchParams.get("email");

      if (!email) {
        return new Response(JSON.stringify("Falta email"), {
          status: 400,
        });
      }

      const personaDB = await personasCollection.findOne({ email });
      if (!personaDB) {
        return new Response(JSON.stringify("Persona no encontrada"), {
          status: 400,
        });
      }

      const personas = await fromModelToPersona(personaDB, personasCollection);
      return new Response(JSON.stringify(personas));
    }
  } else if (method === "POST") {
    if (path === "/personas") {
      const persona = await req.json();
      if (
        !persona.nombre ||
        !persona.email ||
        !persona.telefono ||
        !persona.amigos
      ) {
        return new Response("Datos insuficientes", { status: 400 });
      }

      const personaDB = await personasCollection.findOne({
        email: persona.email,
      });

      if (personaDB) {
        return new Response("El usuario ya existe", { status: 409 });
      }

      const { insertedId } = await personasCollection.insertOne({
        nombre: persona.nombre,
        email: persona.email,
        telefono: persona.telefono,
        amigos: [],
      });

      return new Response(
        JSON.stringify({
          id: insertedId,
          nombre: persona.nombre,
          email: persona.email,
          telefono: persona.telefono,
          amigos: [],
        })
      );
    }
  } else if (method === "DELETE") {
    if (path === "/persona") {
      const email = url.searchParams.get("email");

      if (!email) {
        return new Response(JSON.stringify("falta email"), { status: 400 });
      }

      const borrarPersona = await personasCollection.deleteOne({ email });

      if (borrarPersona === null) {
        return new Response(JSON.stringify("Usuario no encontrado."), {
          status: 404,
        });
      }

      return new Response("Persona eliminada exitosamente.", { status: 200 });
    }
  } else if (method === "PUT") {
    if (path === "/persona") {
      const persona = await req.json();

      if (!persona.nombre || !persona.email || !persona.telefono) {
        return new Response("Faltan datos", { status: 400 });
      }

      const { modifiedCount } = await personasCollection.updateOne(
        { email: persona.email },
        {
          $Set: {
            nombre: persona.nombre,
            email: persona.email,
            telefono: persona.telefono,
          },
        }
      );

      if (modifiedCount === 0) {
        return new Response(JSON.stringify("Usuario no encontrado"), {
          status: 404,
        });
      }

      return new Response(JSON.stringify("Usuario modificado correctamente"), {
        status: 200,
      });
    }
  }

  return new Response(JSON.stringify({ error: "Endopint no encontrado" }), {
    status: 404,
  });
};

Deno.serve({ port: 3000 }, handler);
