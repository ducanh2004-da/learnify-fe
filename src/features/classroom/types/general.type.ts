import { GENERAL_MODE } from '../constants'

type GeneralMode = (typeof GENERAL_MODE)[keyof typeof GENERAL_MODE]

export type { GeneralMode }