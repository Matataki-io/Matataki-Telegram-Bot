import networks from "./network";

/**
 * For Non sensitive configuration only
 * Use .env for secret variable that not being track by any VCS
 */

export const network = networks["KOVAN"]
export const tokenContract = "0x26e806aa19d8388d428c01e8d8b9985697650d75"
