import crypto from 'crypto'

export const containsMissingFields = ({ payload, requiredFields }: { 
  payload: { [key: string]: any }, 
  requiredFields: string[],
}): string | undefined => {
  let missingFields: string[] = []
  
  for (const field of requiredFields) {
    if (!payload[field]) {
      missingFields.push(field)
    }
  }

  if (missingFields.length > 0) {
    return missingFields.join(', ')
  }

  return undefined
}

export const verifyCSPRNG = ({ storedToken, providedToken }: { storedToken?: string, providedToken?: string }) => {
  if (!storedToken || !providedToken) {
    return false
  }

  if (storedToken.length !== providedToken.length) {
    return false
  }
  
  return crypto.timingSafeEqual(Buffer.from(storedToken), Buffer.from(providedToken))
}