using System.Collections.Generic;

namespace MatatakiBot
{
    public class InlineButtonsResponseMarkup : IMessageResponseMarkup
    {
        public IEnumerable<IEnumerable<InlineButton>> InlineButtons { get; }

        public InlineButtonsResponseMarkup(InlineButton inlineButton) : this(new IEnumerable<InlineButton>[] { new[] { inlineButton } }) { }
        public InlineButtonsResponseMarkup(IEnumerable<InlineButton> inlineButtons) : this(new IEnumerable<InlineButton>[] { inlineButtons }) { }
        public InlineButtonsResponseMarkup(IEnumerable<IEnumerable<InlineButton>> inlineButtons)
        {
            InlineButtons = inlineButtons;
        }
    }
}
