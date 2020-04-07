import { BaseController } from ".";
import { IPoemService } from "#/services";
import { inject } from "inversify";
import { Injections } from "#/constants";
import { Controller, Command, InjectRegexMatchGroup, GlobalAlias } from "#/decorators";
import { MessageHandlerContext } from "#/definitions";

@Controller("poem")
@GlobalAlias("make", "poem")
export class PoemController extends BaseController<PoemController> {
    constructor(@inject(Injections.PoemService) private poemService: IPoemService) {
        super();
    }

    @Command("make", /(\p{sc=Han}+)$/u)
    async makePoem({ reply }: MessageHandlerContext, @InjectRegexMatchGroup(1) keyword: string) {
        await reply(await this.poemService.make(keyword));
    }
}
