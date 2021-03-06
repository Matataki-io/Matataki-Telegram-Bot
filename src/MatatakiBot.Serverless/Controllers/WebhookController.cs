using MatatakiBot.Services;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
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

        private static bool _isInitialized;

        public WebhookController(IUpdateService updateService, ILogger logger)
        {
            _updateService = updateService;
            _logger = logger;
        }

        [HttpPost]
        public async Task<IActionResult> Handle([FromBody] Update update)
        {
            if (!_isInitialized)
            {
                await Bootstraper.Startup();
                _isInitialized = true;
            }

            _logger.Information("New update: {Update}", JsonConvert.SerializeObject(update));

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
