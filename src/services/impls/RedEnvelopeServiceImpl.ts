import { Injections } from "#/constants";
import { Service } from "#/decorators";
import {
  IRedEnvelopeService, IMatatakiService, Arguments,
  MessageContext, MatatakiUser
} from "#/services";
import { inject } from "inversify";
import _ from 'lodash';
import { MessageHandlerContext } from "../../definitions";
import { Markup } from "telegraf";
import { checkNotNull } from "../../utils";

type Envelope = {
  msgCtx: MessageContext,
  sender: MatatakiUser,
  amountArr: number[],
  args: Arguments,
  takenUsers: Transfer[],
  _id: number,
};

type Transfer = {
  grabber: MatatakiUser,
  envelope: Envelope,
  amount: number,
  txHash: string,
  status: boolean,
};

const Msgs = {
  grabMessage: ({ grabber, amount, txHash, envelope, status }: Transfer) =>
    status ?
      `[${grabber.name}抢到了${envelope.sender.name}的一个${envelope.args.description}红包`
      + `, 价值 ${amount / 10000} ${envelope.args.unit}]`
      + `(https://rinkeby.etherscan.io/tx/${txHash})`
      : `${grabber.name}正在尝试抢红包`
  ,
  successMessage:
    (userName: string) => userName +
      "发了红包，快来抢吧!",
};

function isEmptyEnvelope({ args: { quantity }, takenUsers }: Envelope) {
  return takenUsers.length == quantity &&
    _.every(takenUsers, ({ status }) => status);
}

@Service(Injections.RedEnvelopeService)
export class RedEnvelopeServiceImpl implements IRedEnvelopeService {
  constructor(@inject(Injections.MatatakiService) private matatakiService: IMatatakiService) {
  }
  private counter: number=0;
  private envelopes: Envelope[] = new Array();
  private removeEmptyEnvelopes() {
    this.envelopes = this.envelopes.filter(
      e => !isEmptyEnvelope(e));
  }
  registerEnvelope(msgCtx: MessageContext, user: MatatakiUser,
    amountArr: number[], args: Arguments): number {
    const _id = this.counter++;
    this.envelopes.push({
      msgCtx,
      sender: user,
      amountArr,
      takenUsers: [],
      args,
      _id
    });
    return _id;
  }
  async grab({ id, name }: MatatakiUser, ctx: MessageHandlerContext,eid :number): Promise<void> {
    let validEnvelopes = this.envelopes.filter(({ takenUsers, args: { quantity },_id }) => {
      return _id == eid
      && !(_.find(takenUsers, ({ grabber }) => grabber.id === id))
        && takenUsers.length < quantity;
    });
    let transfers: Transfer[] = validEnvelopes.map((e) => {
      const transfer = {
        grabber: { name, id },
        envelope: e,
        amount: e.amountArr[e.takenUsers.length],
        txHash: '',
        status: false,
      };
      e.takenUsers.push(transfer);
      return transfer;
    });
    for (const { envelope } of transfers) {
      await this.renderEnvelope(ctx, envelope);
    }
    await this.processTransfers(ctx, transfers);
    this.removeEmptyEnvelopes();
  }
  private async processTransfers(ctx: MessageHandlerContext,
    transfers: Transfer[]): Promise<void> {
    for (const transfer of transfers) {
      try {
        let { grabber, envelope, amount } = transfer;
        let txHash = await this.matatakiService.transfer(grabber.id,
          envelope.sender.id, envelope.args.unit, amount);
        transfer.status = true;
        transfer.txHash = txHash;
        await this.renderEnvelope(ctx, envelope);
      } catch (e) {
        _.remove(transfer.envelope.takenUsers, (({ grabber }) =>
          grabber == transfer.grabber));
        await this.renderEnvelope(ctx, transfer.envelope);
      }
    }
  }
  async resendEnvelope(ctx: MessageHandlerContext, eid: number) {
    let envelope = _.find(this.envelopes, (({ _id }) => _id == eid));
    if (envelope) {
      await this.renderEnvelope(ctx, envelope, false);
    }
  }
  private async renderEnvelope(ctx: MessageHandlerContext, e: Envelope
    , modified = true) {
    const grabMessages = e.takenUsers.map((transfer) => Msgs.grabMessage(transfer));
    let messages = [Msgs.successMessage(e.sender.name),
      ...grabMessages].join('\n').replace('_', '\\_');
    const empty = isEmptyEnvelope(e);
    if (empty) {
      messages += `\n${e.sender.name}的红包已经被抢完`;
    }
    const replyMarkup = Markup.inlineKeyboard([
      [Markup.callbackButton("抢", `hongbao ${e._id}`),
      Markup.callbackButton("继续发送",`hongbao_resend ${e._id}`)]
    ]);
    if (modified) {
      const { msgCtx } = e;
      await ctx.telegram.editMessageText(msgCtx.chatId, msgCtx.messageId,
        undefined, messages, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        reply_markup: empty ? undefined : replyMarkup
      });
    } else {
      const { message_id } = await ctx.replyWithMarkdown(messages, {
        disable_web_page_preview: true,
        reply_markup: empty ? undefined : replyMarkup
      });
      e.msgCtx.messageId = message_id;
    }

  }

}
