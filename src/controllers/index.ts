import { IController, BaseController } from "./BaseController";
export { IController, BaseController };

export interface ControllerConstructor {
    new(...args: any[]): IController;
}
