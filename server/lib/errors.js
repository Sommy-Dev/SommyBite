export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

export function httpError(status, message) {
  return new HttpError(status, message)
}

/** Escape user input before using it in a PostgREST ilike pattern. */
export function escapeLike(value) {
  return String(value).replace(/[\\%_]/g, (c) => `\\${c}`)
}
