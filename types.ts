import { ObjectId } from "mongodb";

export type Personas = {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  amigos: Personas[];
};

export type PersonaModel = {
  _id?: ObjectId;
  nombre: string;
  email: string;
  telefono: string;
  amigos: ObjectId[];
};
