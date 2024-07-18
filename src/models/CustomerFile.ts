import knex from "knex"
import knexConfig from "../../knexfile"

export interface ICustomerFile {
  id: number,
  customer_id: number,
  file_name: string,
  file_type: string,
  file_size: string,
  dropbox_file_id: string,
  dropbox_file_url: string,
  created_at: string,
  updated_at: string
}

const CUSTOMER_FILES_TABLE = 'customer_files'
const db = knex(knexConfig)

export class CustomerFile {
  static async create(payload: Partial<ICustomerFile>): Promise<ICustomerFile> {
    const [customerFile] = await db(CUSTOMER_FILES_TABLE)
      .insert({
        file_name: payload.file_name,
        file_type: payload.file_type,
        file_size: payload.file_size,
        dropbox_file_id: payload.dropbox_file_id,
        dropbox_file_url: payload.dropbox_file_url,
      })
      .returning('*')

    return customerFile;
  }

  static async readById(id: number): Promise<ICustomerFile | null> {
    const customerFile = await db(CUSTOMER_FILES_TABLE)
      .where('id', '=', id)
      .first()

    return customerFile;
  }

  static async readByCustomerId(customerId: number): Promise<ICustomerFile | null> {
    const [ customerFile ] = await db(CUSTOMER_FILES_TABLE)
      .where('customer_id', '=', customerId)

    return customerFile;
  }

  static async update({ customerId, payload }: { customerId: number, payload: Partial<ICustomerFile> }): Promise<ICustomerFile | null> {
    await db(CUSTOMER_FILES_TABLE)
      .where('customer_id', '=', customerId)
      .update(payload)

    const updatedCustomerFile = await CustomerFile.readByCustomerId(customerId);
    return updatedCustomerFile;
  }

  static async delete(id: number): Promise<void> {
    await db(CUSTOMER_FILES_TABLE)
      .where('id', '=', id)
      .del()
  }
}