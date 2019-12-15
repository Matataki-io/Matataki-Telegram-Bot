import { MessageHandler } from "../definitions";

export interface IController { }

export class BaseController<T extends { [P in keyof T]: MessageHandler }> implements IController {
    constructor() {
        console.log(Object.getPrototypeOf(this).constructor.name, new Date);
    }
}
