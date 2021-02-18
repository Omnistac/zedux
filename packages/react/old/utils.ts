import { Atom, Scope } from './types'

let idCounter = 0

const generateId = () => {
  idCounter += 1
  return idCounter
}

const stringifyParam = (param: any): string => {
  if (Array.isArray(param)) {
    return `[${param.map(child => stringifyParam(child)).join(',')}]`
  }

  if (param && typeof param === 'object') {
    return `{${Object.entries(param)
      .map(([key, val]) => `${key}: ${stringifyParam(val)}`)
      .sort((a, b) => a.localeCompare(b))
      .join(',')}}`
  }

  return JSON.stringify(param)
}

export const generateAppId = () => `app-${generateId()}`
export const generateImplementationId = () => `im-${generateId()}`
export const generateInstanceId = () => `in-${generateId()}`
export const generateLocalId = () => `lo-${generateId()}`

export const getFullKey = (atom: Atom, params?: any[]) => {
  if (atom.scope === Scope.local) return generateLocalId()

  if (!params?.length) return atom.key

  return `${atom.key}---${stringifyParam(params)}`
}
