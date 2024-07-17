export const capitalizeFirstLetter = (str: string): string => {
  return str.replace(/\b\w/g, match => match.toUpperCase());
}

export const sanitizeEmail = (email: string) => {
  // TODO: Need a more strict and robust validation
  return email.trim().toLowerCase()
}

export const parseAndCommaJoin = (stringifiedArray: string) => {
  return JSON.parse(stringifiedArray).join(', ')
}