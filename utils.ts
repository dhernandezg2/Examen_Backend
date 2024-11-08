import type { PersonaModel, Personas } from "./types.ts";
import { ObjectId, Collection } from "mongodb";

export const fromModelToPersona = async (
  personaDB: PersonaModel,
  personasCollection: Collection<PersonaModel>
): Promise<Personas> => {
  const amigos = await personasCollection
    .find({ _id: { $in: personaDB.amigos } })
    .toArray();

  return {
    id: personaDB._id!.toString(),
    nombre: personaDB.nombre,
    email: personaDB.email,
    telefono: personaDB.telefono,
    amigos: amigos.map((a) => ({
      id: a._id!.toString(),
      nombre: a.nombre,
      email: a.email,
      telefono: a.telefono,
      amigos: [],
    })),
  };
};
