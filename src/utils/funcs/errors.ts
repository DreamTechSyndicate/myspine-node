import { capitalizeFirstLetter } from './strings'

interface CreateErrorOptions {
  res: any
  statusCode: number
  message: string
}

const createError = ({ res, statusCode, message }: CreateErrorOptions) => {
  if (!res.headersSent) {
    res.status(statusCode).json({ message })
    throw new Error(message)
  }
}

export const BadRequestError = (category: string, res: any) => {
 const message = `${capitalizeFirstLetter(category)} Required`
  createError({ res, statusCode: 400, message })
}

export const UnauthorizedRequestError = (category: string, res: any) => {
  const message = `Unauthorized: Invalid ${capitalizeFirstLetter(category)}`
  createError({ res, statusCode: 401, message })
}

export const NotFoundError = (category: string, res: any) => {
  const message = `${capitalizeFirstLetter(category)} Not Found`
  createError({ res, statusCode: 404, message })
}

export const ExternalServerError = (category: string, res: any) => {
  const message = `Server Error: Something went wrong with ${capitalizeFirstLetter(category)}`
  createError({ res, statusCode: 500, message })
}

export const InternalServerError = (
  method: "get" | "create" | "update" | "delete" | "destroy" | "sign-in" | "sign-out",
  category: string, 
  res: any,
) => {
  const message = `Internal Server Error : Unable to ${capitalizeFirstLetter(method)} ${capitalizeFirstLetter(category)}`
  createError({ res, statusCode: 500, message })
}