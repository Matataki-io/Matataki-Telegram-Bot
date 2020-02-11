import { ContextMessageUpdate } from "telegraf";
import { Container } from "inversify";

export type ControllerMethodContext = {
    ctx: ContextMessageUpdate,
    container: Container,
}
