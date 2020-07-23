using System;

namespace MatatakiBot.Abstract
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false, Inherited = false)]
    public sealed class GroupChatOnlyAttribute : Attribute
    {
    }
}
