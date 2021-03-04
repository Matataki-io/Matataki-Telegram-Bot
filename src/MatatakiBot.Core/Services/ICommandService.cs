using System;

namespace MatatakiBot.Services
{
    public interface ICommandService
    {
        void RegisterCommand(Type type);
    }
}
