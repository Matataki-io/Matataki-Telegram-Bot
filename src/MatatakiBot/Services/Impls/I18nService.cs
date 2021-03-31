using Jeffijoe.MessageFormat;
using Serilog;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;
using YamlDotNet.RepresentationModel;
using File = System.IO.File;

namespace MatatakiBot.Services.Impls
{
    class I18nService : II18nService
    {
        private ILogger _logger;

        private readonly SortedList<string, IMessageFormatter> _formatters;
        private readonly SortedList<string, SortedList<string, string>> _patterns;

        private readonly SortedList<int, string> _userLocales;

        public I18nService(ILogger logger)
        {
            _logger = logger;

            _formatters = new SortedList<string, IMessageFormatter>(StringComparer.OrdinalIgnoreCase);
            _patterns = new SortedList<string, SortedList<string, string>>(StringComparer.OrdinalIgnoreCase);

            _userLocales = new SortedList<int, string>();
        }

        public void Initialize()
        {
            var cultureInfos = new HashSet<string>(CultureInfo.GetCultures(CultureTypes.AllCultures).Select(r => r.IetfLanguageTag),
                StringComparer.OrdinalIgnoreCase);
            var localeDirectory = Path.Join(Path.GetDirectoryName(GetType().Assembly.Location), "locales");

            if (!Directory.Exists(localeDirectory))
            {
                _logger.Warning("Locales directory not found");
                return;
            }

            foreach (var localeFilename in Directory.EnumerateFiles(localeDirectory, "*.yml"))
            {
                var locale = Path.GetFileNameWithoutExtension(localeFilename);
                if (!cultureInfos.Contains(locale))
                    continue;

                using var reader = File.OpenText(localeFilename);

                var yaml = new YamlStream();
                yaml.Load(reader);

                var patterns = new SortedList<string, string>(StringComparer.Ordinal);

                TraverseLocaleNode(patterns, string.Empty, (YamlMappingNode)yaml.Documents[0].RootNode);

                _formatters[locale] = new MessageFormatter(locale: locale);
                _patterns[locale] = patterns;
            }
        }
        internal void TraverseLocaleNode(IDictionary<string, string> patterns, string prefix, YamlMappingNode mapping)
        {
            foreach (var (key, value) in mapping.Children)
            {
                var keyScalarNode = (YamlScalarNode)key;
                var patternKey = prefix == string.Empty ? keyScalarNode.Value! : $"{prefix}.{keyScalarNode.Value}";

                if (value.NodeType == YamlNodeType.Scalar)
                {
                    var valueScalarNode = (YamlScalarNode)value;

                    patterns[patternKey] = valueScalarNode.Value ?? patternKey;
                    continue;
                }

                if (value.NodeType != YamlNodeType.Mapping)
                    throw new InvalidOperationException("The locale file should have only scalar or mapping nodes");

                TraverseLocaleNode(patterns, patternKey, (YamlMappingNode)value);
            }
        }

        public ValueTask<string> GetLocaleForChatAsync(Chat chat, User user)
        {
            if (chat.Type == ChatType.Private)
            {
                if (_userLocales.TryGetValue(user.Id, out var result))
                    return new ValueTask<string>(result);
            }

            return new ValueTask<string>("en");
        }

        public string Format(I18n entry, string locale)
        {
            if (!_formatters.TryGetValue(locale, out var formatter))
                throw new InvalidOperationException($"Locale {locale} is unavailable");

            var patterns = _patterns[locale];

            if (!patterns.TryGetValue(entry.Key, out var pattern))
                return entry.Key;

            return formatter.FormatMessage(pattern, entry.Arguments);
        }

        public void CacheUserLocale(int userId, string locale) => _userLocales[userId] = locale;
    }
}
