using System;

namespace MatatakiBot.Attributes
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false, Inherited = false)]
    public sealed class GroupChatOnlyAttribute : Attribute
    {
    }
}
