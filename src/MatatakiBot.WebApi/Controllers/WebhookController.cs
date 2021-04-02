using MatatakiBot.Services;
using Microsoft.AspNetCore.Mvc;
using Serilog;
using System;
using System.Threading.Tasks;
using Telegram.Bot.Types;

namespace MatatakiBot.Controllers
{
    [Route("webhook")]
    public class WebhookController : ControllerBase
    {
        private readonly IUpdateService _updateService;
        private readonly ILogger _logger;

        public WebhookController(IUpdateService updateService, ILogger logger)
        {
            _updateService = updateService;
            _logger = logger;
        }

        [HttpPost]
        public async Task<IActionResult> Handle([FromBody] Update update)
        {
            try
            {
                await _updateService.HandleUpdateAsync(update);
            }
            catch (Exception e)
            {
                _logger.Error(e, "Unhandled exception");
            }

            return Ok();
        }
    }
}
