export const Injections = {
    Controller: Symbol.for("Controller"),
    Context: Symbol.for("Context"),
    Repository: Symbol.for("Repository"),
    GroupMemberEventHandler: Symbol.for("GroupMemberEventHandler"),
    Scheduler: Symbol.for("Scheduler"),

    BotService: Symbol.for("BotService"),
    TestAccountBalanceService: Symbol.for("TestAccountBalanceService"),
    DatabaseService: Symbol.for("DatabaseService"),
};
