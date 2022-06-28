import type { Request } from 'express'

export type MaybeSecureRequest = Request & {
	user?: any | null
}
export type SecuredRequest = Request & {
	user: any
}
