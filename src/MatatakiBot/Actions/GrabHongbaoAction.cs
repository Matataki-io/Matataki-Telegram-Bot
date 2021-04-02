using MatatakiBot.Attributes;
using MatatakiBot.Services;
using MatatakiBot.Types;
using System;
using System.Threading.Tasks;
using Telegram.Bot.Types;

namespace MatatakiBot.Actions
{
    [Action("grabHongbao")]
    class GrabHongbaoAction : ActionBase
    {
        private readonly IHongbaoService _hongbaoService;
        private readonly IBackendService _backendService;

        public GrabHongbaoAction(IHongbaoService hongbaoService, IBackendService backendService)
        {
            _hongbaoService = hongbaoService;
            _backendService = backendService;
        }

        [ActionHandler("([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})")]
        public async Task<string> Handler(CallbackQuery callbackQuery, Guid hongbaoId)
        {
            try
            {
                var user = await _backendService.GetUserByTelegramIdAsync(callbackQuery.From.Id);
                var amount = await _hongbaoService.GrabAsync(hongbaoId, user.Id);

                var info = await _hongbaoService.GetHongbaoTokenInfoAsync(hongbaoId);

                return $"你得到了 {amount} {info.Symbol}";
            }
            catch (MatatakiUserNotFoundException)
            {
                return "抱歉，您还没有绑定 Matataki。";
            }
            catch (HongbaoGrabbedException)
            {
                return "您已抢过该红包。";
            }
            catch (EmptyHongbaoException)
            {
                return "红包被抢光了！";
            }
        }
    }
}
