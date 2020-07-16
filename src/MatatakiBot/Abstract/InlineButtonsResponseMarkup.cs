using System.Collections.Generic;

namespace MatatakiBot.Abstract
{
    public class InlineButtonsResponseMarkup : IMessageResponseMarkup
    {
        public IEnumerable<IEnumerable<InlineButton>> InlineButtons { get; }

        public InlineButtonsResponseMarkup(InlineButton inlineButton)
        {
            InlineButtons = new IEnumerable<InlineButton>[] { new[] { inlineButton } };
        }
        public InlineButtonsResponseMarkup(IEnumerable<InlineButton> inlineButtons)
        {
            InlineButtons = new IEnumerable<InlineButton>[] { inlineButtons };
        }
        public InlineButtonsResponseMarkup(IEnumerable<IEnumerable<InlineButton>> inlineButtons)
        {
            InlineButtons = inlineButtons;
        }
    }
}
