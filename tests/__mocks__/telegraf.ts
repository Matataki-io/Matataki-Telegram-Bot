import Telegraf from "telegraf";

const mockedTelegraf = jest.genMockFromModule<typeof Telegraf>("telegraf");
const { Markup, Composer } = require.requireActual("telegraf");

export default mockedTelegraf;
export {
    Markup,
    Composer,
};
