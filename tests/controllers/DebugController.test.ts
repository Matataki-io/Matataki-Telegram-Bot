import { DebugController } from "#/controllers/DebugController";

import { createMockedContext } from "../Utils";
import { I18nContext } from "#/definitions";
import { I18nServiceImpl } from "#/services/impls/I18nServiceImpl";

const controller = new DebugController();

describe("DebugController", () => {
    it("/ping", async () => {
        const ctx = createMockedContext();

        await controller.ping(ctx);

        expect(ctx.reply).toBeCalledTimes(1);
        expect(ctx.reply).toBeCalledWith("pong");
    });

    describe("/debuggrouponly", () => {
        it("Group Chat (Group)", async () => {
            const ctx = createMockedContext();
            Object.assign(ctx, {
                message: {
                    ...ctx.message,
                    chat: {
                        type: "group",
                    },
                },
            });

            await controller.groupOnly(ctx);

            expect(ctx.reply).toBeCalledTimes(1);
            expect(ctx.reply).toBeCalledWith("Ok");
        });
        it("Group Chat (Supergroup)", async () => {
            const ctx = createMockedContext();
            Object.assign(ctx, {
                message: {
                    ...ctx.message,
                    chat: {
                        type: "supergroup",
                    },
                },
            });

            await controller.groupOnly(ctx);

            expect(ctx.reply).toBeCalledTimes(1);
            expect(ctx.reply).toBeCalledWith("Ok");
        });
        it("Private Chat", async () => {
            const ctx = createMockedContext();
            Object.assign(ctx, {
                message: {
                    ...ctx.message,
                    chat: {
                        type: "private",
                    },
                },
            });

            await controller.groupOnly(ctx);

            expect(ctx.reply).toBeCalledTimes(1);
            expect(ctx.reply).toBeCalledWith("该命令仅限群聊里使用");
        });
    });

    describe("/debugprivatechatonly", () => {
        it("Group Chat (Group)", async () => {
            const ctx = createMockedContext();
            Object.assign(ctx, {
                message: {
                    ...ctx.message,
                    chat: {
                        type: "group",
                    },
                },
            });

            await controller.privateChatOnly(ctx);

            expect(ctx.reply).toBeCalledTimes(1);
            expect(ctx.reply).toBeCalledWith("该命令仅限和机器人私聊里使用");
        });
        it("Group Chat (Supergroup)", async () => {
            const ctx = createMockedContext();
            Object.assign(ctx, {
                message: {
                    ...ctx.message,
                    chat: {
                        type: "supergroup",
                    },
                },
            });

            await controller.privateChatOnly(ctx);

            expect(ctx.reply).toBeCalledTimes(1);
            expect(ctx.reply).toBeCalledWith("该命令仅限和机器人私聊里使用");
        });
        it("Private Chat", async () => {
            const ctx = createMockedContext();
            Object.assign(ctx, {
                message: {
                    ...ctx.message,
                    chat: {
                        type: "private",
                    },
                },
            });

            await controller.privateChatOnly(ctx);

            expect(ctx.reply).toBeCalledTimes(1);
            expect(ctx.reply).toBeCalledWith("Ok");
        });
    });

    describe("/debugrequirematataki", () => {
        describe("Type A", () => {
            it("Without matataki account", async () => {
                const ctx = createMockedContext();
                Object.assign(ctx, {
                    message: {
                        ...ctx.message,
                        from: {
                            id: 1,
                        },
                    },
                });

                await controller.requireMatatakiAccount(ctx, null!);

                expect(ctx.reply).toBeCalledTimes(1);
                expect(ctx.reply).toBeCalledWith("抱歉，您没有在 瞬Matataki 绑定该 Telegram 帐号");
            });
            it("With matataki account (No minted minetoken)", async () => {
                const ctx = createMockedContext();
                Object.assign(ctx, {
                    message: {
                        ...ctx.message,
                        from: {
                            id: 8102,
                        },
                    },
                });

                await controller.requireMatatakiAccount(ctx, null!);

                expect(ctx.reply).toBeCalledTimes(1);
                expect(ctx.reply).toBeCalledWith("810:野獣先輩");
            });
            it("With matataki account (With minted minetoken)", async () => {
                const ctx = createMockedContext();
                Object.assign(ctx, {
                    message: {
                        ...ctx.message,
                        from: {
                            id: 8101,
                        },
                    },
                });

                await controller.requireMatatakiAccount(ctx, null!);

                expect(ctx.reply).toBeCalledTimes(1);
                expect(ctx.reply).toBeCalledWith("114514:李田所");
            });
        });
        describe("Type B", () => {
            it("Without matataki account", async () => {
                const ctx = createMockedContext();
                Object.assign(ctx, {
                    message: {
                        ...ctx.message,
                        from: {
                            id: 1,
                        },
                    },
                });

                await controller.requireMatatakiAccount2(ctx);

                expect(ctx.reply).toBeCalledTimes(1);
                expect(ctx.reply).toBeCalledWith("抱歉，您没有在 瞬Matataki 绑定该 Telegram 帐号");
            });
            it("With matataki account (No minted minetoken)", async () => {
                const ctx = createMockedContext();
                Object.assign(ctx, {
                    message: {
                        ...ctx.message,
                        from: {
                            id: 8102,
                        },
                    },
                });

                await controller.requireMatatakiAccount2(ctx);

                expect(ctx.reply).toBeCalledTimes(1);
                expect(ctx.reply).toBeCalledWith("Ok");
            });
            it("With matataki account (With minted minetoken)", async () => {
                const ctx = createMockedContext();
                Object.assign(ctx, {
                    message: {
                        ...ctx.message,
                        from: {
                            id: 8101,
                        },
                    },
                });

                await controller.requireMatatakiAccount2(ctx);

                expect(ctx.reply).toBeCalledTimes(1);
                expect(ctx.reply).toBeCalledWith("Ok");
            });
        });
    });

    describe("/debugmintedminetoken", () => {
        describe("Type A", () => {
            it("Without matataki account", async () => {
                const ctx = createMockedContext();
                Object.assign(ctx, {
                    message: {
                        ...ctx.message,
                        from: {
                            id: 1,
                        },
                    },
                });

                await controller.requireMintedMinetoken(ctx, null!);

                expect(ctx.reply).toBeCalledTimes(1);
                expect(ctx.reply).toBeCalledWith("抱歉，您没有在 瞬Matataki 绑定该 Telegram 帐号或者尚未发行 Fan 票");
            });
            it("With matataki account (No minted minetoken)", async () => {
                const ctx = createMockedContext();
                Object.assign(ctx, {
                    message: {
                        ...ctx.message,
                        from: {
                            id: 8102,
                        },
                    },
                });

                await controller.requireMintedMinetoken(ctx, null!);

                expect(ctx.reply).toBeCalledTimes(1);
                expect(ctx.reply).toBeCalledWith("抱歉，您没有在 瞬Matataki 绑定该 Telegram 帐号或者尚未发行 Fan 票");
            });
            it("With matataki account (With minted minetoken)", async () => {
                const ctx = createMockedContext();
                Object.assign(ctx, {
                    message: {
                        ...ctx.message,
                        from: {
                            id: 8101,
                        },
                    },
                });

                await controller.requireMintedMinetoken(ctx, null!);

                expect(ctx.reply).toBeCalledTimes(1);
                expect(ctx.reply).toBeCalledWith("114514:李田所 w/ 1919:银票(INM)");
            });
        });
        describe("Type B", () => {
            it("Without matataki account", async () => {
                const ctx = createMockedContext();
                Object.assign(ctx, {
                    message: {
                        ...ctx.message,
                        from: {
                            id: 1,
                        },
                    },
                });

                await controller.requireMintedMinetoken2(ctx);

                expect(ctx.reply).toBeCalledTimes(1);
                expect(ctx.reply).toBeCalledWith("抱歉，您没有在 瞬Matataki 绑定该 Telegram 帐号或者尚未发行 Fan 票");
            });
            it("With matataki account (No minted minetoken)", async () => {
                const ctx = createMockedContext();
                Object.assign(ctx, {
                    message: {
                        ...ctx.message,
                        from: {
                            id: 8102,
                        },
                    },
                });

                await controller.requireMintedMinetoken2(ctx);

                expect(ctx.reply).toBeCalledTimes(1);
                expect(ctx.reply).toBeCalledWith("抱歉，您没有在 瞬Matataki 绑定该 Telegram 帐号或者尚未发行 Fan 票");
            });
            it("With matataki account (With minted minetoken)", async () => {
                const ctx = createMockedContext();
                Object.assign(ctx, {
                    message: {
                        ...ctx.message,
                        from: {
                            id: 8101,
                        },
                    },
                });

                await controller.requireMintedMinetoken2(ctx);

                expect(ctx.reply).toBeCalledTimes(1);
                expect(ctx.reply).toBeCalledWith("Ok");
            });
        });
    });

    describe("/debugi18n", () => {
        const i18nService = new I18nServiceImpl();

        it.each`
        language
        ${"en"}
        ${"zh-hans"}
        ${"zh-hant"}
        ${"ja"}
        `("$language", async ({ language }) => {
            const ctx = createMockedContext();
            Object.assign(ctx, {
                message: {
                    ...ctx.message,
                    from: {
                        id: 1,
                        language_code: language,
                    },
                },
                i18n: new I18nContext(i18nService.templateMap, i18nService.pluralRules, language),
            });

            await controller.i18n(ctx);

            expect(ctx.reply).toBeCalledTimes(1);
            expect(ctx.reply).toBeCalledWith(i18nService.t(language, "lang"));
        });
    })
});
