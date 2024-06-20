import { capitalizeFirstLetter } from './strings'

interface CreateErrorOptions {
  res: any
  statusCode: number
  message: string
  error?: Error | unknown
}

const createError = ({ res, statusCode, message, error }: CreateErrorOptions) => {
  if (!res.headersSent) {
    res.status(statusCode).json({ message })
    console.trace(error ? error : message )
    throw new Error(message)
  }
}

export const BadRequestError = (category: string, res: any, error?: Error | unknown) => {
 const message = `Invalid ${capitalizeFirstLetter(category)}`
  createError({ res, statusCode: 400, message, error})
}

export const UnauthorizedRequestError = (category: string, res: any, error?: Error | unknown) => {
  const message = `Unauthorized: Invalid ${capitalizeFirstLetter(category)}`
  createError({ res, statusCode: 401, message, error})
}

export const NotFoundError = (category: string, res: any, error?: Error | unknown) => {
  const message = `${capitalizeFirstLetter(category)} Not Found`
  createError({ res, statusCode: 404, message, error})
}

export const ExternalServerError = (category: string, res: any, error?: Error | unknown) => {
  const message = `Server Error: Something went wrong with ${capitalizeFirstLetter(category)}`
  createError({ res, statusCode: 500, message, error})
}

export const InternalServerError = (
  method: "get" | "create" | "update" | "delete" | "destroy" | "login" | "logout" | "forgot" | "refresh",
  category: string, 
  res: any,
  error?: Error | unknown
) => {
  const message = `Internal Server Error : Unable to ${capitalizeFirstLetter(method)} ${capitalizeFirstLetter(category)}`
  createError({ res, statusCode: 500, message, error})
}