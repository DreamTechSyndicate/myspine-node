import knex from "knex"
import knexConfig from "../../knexfile"

export interface IPatient {
  id: number,
  user_id: number,
  firstname: string,
  lastname: string,
  pain_description: string,
  pain_degree: number,
  address: string,
  email: string,
  phone_number: number
}

const PATIENTS_TABLE = 'patients'
const db = knex(knexConfig)

export class Patient {
  static async create(patientData: Partial<IPatient>): Promise<IPatient> {
    const [patient]: IPatient[] = await db(PATIENTS_TABLE)
      .insert<IPatient>(patientData)
      .returning('*')
    return patient
  }

  static async readById(patientId: number) {
    return await db(PATIENTS_TABLE)
      .where('id', '=', patientId)
      .first<IPatient, Pick<IPatient, "id">>()
  }

  static async readByUserId(userId: number) {
    return await db(PATIENTS_TABLE)
      .where('user_id', '=', userId)
      .first<IPatient, Pick<IPatient, "user_id">>()
  }

  static async readByEmail(email: string) {
    return await db(PATIENTS_TABLE)
      .where('email', '=', email)
      .first<IPatient, Pick<IPatient, "email">>()
  }

  static async update({ patientId, payload }: { patientId: number, payload: Partial<IPatient> }) {
    await db(PATIENTS_TABLE)
      .where('id', '=', patientId)
      .update<IPatient>(payload)

    const updatedPatientRecord = await Patient.readById(patientId)
    return updatedPatientRecord
  }

  static async delete(id: number) {
    return await db(PATIENTS_TABLE)
      .where('id', '=', id)
      .first<IPatient, Pick<IPatient, "id">>()
      .delete()
  }
}