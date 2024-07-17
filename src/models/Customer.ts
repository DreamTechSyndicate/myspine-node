import knex from "knex"
import knexConfig from "../../knexfile"

export interface ICustomer {
  id: number,
  user_id: number,
  firstname: string,
  lastname: string,
  email: string,
  phone_number: number,
  is_consented: boolean,
  age: string,
  sex: string,
  height: string,
  weight: string,
  occupation: string,
  acute_pain_type: string,
  pain_summary: string,
  pain_degree: string,
  pain_duration: string,
  activity_level: string,
  pain_area: string,
  pain_start_type: string,
  pain_start_cause: string,
  physical_theray_history: string,
  offered_spinal_surgery: string,
  spine_imaging_type: string,
  previous_spinal_surgery: string,
  limb_weakness_numbness: string,
  walking_unsteadiness: string,
  offered_procedure: string,
  offered_by: string,
  results_discussed: string,
  surgery_type: string,
  surgery_date_time: string,
  surgeon: string,
  hand_object_manipulation_problems: string,
  past_pain_medications: string,
  current_pain_medications: string,
  painful_activities: string,
  painful_leg_activities: string,
  helpful_activities: string,
  unoperational_due_to_pain: string,
  physician_visit_for_pain: string,
  injection_procedures_for_pain: string,
  injection_types: string,
  injection_relief: string,
  helpful_injections: string,
  injection_relief_duration: string,
  medical_problems: string,
  current_medications: string
}

const CUSTOMERS_TABLE = 'customers'
const db = knex(knexConfig)

export class Customer {
  static async create(customerData: Partial<ICustomer>): Promise<ICustomer> {
    const [customer]: ICustomer[] = await db(CUSTOMERS_TABLE)
      .insert<ICustomer>(customerData)
      .returning('*')
    return customer
  }

  static async readById(customerId: number) {
    return await db(CUSTOMERS_TABLE)
      .where('id', '=', customerId)
      .first<ICustomer, Pick<ICustomer, "id">>()
  }

  static async readByUserId(userId: number) {
    return await db(CUSTOMERS_TABLE)
      .where('user_id', '=', userId)
      .first<ICustomer, Pick<ICustomer, "user_id">>()
  }

  static async readByEmail(email: string) {
    return await db(CUSTOMERS_TABLE)
      .where('email', '=', email)
      .first<ICustomer, Pick<ICustomer, "email">>()
  }

  static async update({ customerId, payload }: { customerId: number, payload: Partial<ICustomer> }) {
    await db(CUSTOMERS_TABLE)
      .where('id', '=', customerId)
      .update<ICustomer>(payload)

    const updatedCustomerRecord = await Customer.readById(customerId)
    return updatedCustomerRecord
  }

  static async delete(id: number) {
    return await db(CUSTOMERS_TABLE)
      .where('id', '=', id)
      .first<ICustomer, Pick<ICustomer, "id">>()
      .delete()
  }
}