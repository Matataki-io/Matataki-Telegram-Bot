using Jeffijoe.MessageFormat;
using MatatakiBot.Core;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using YamlDotNet.RepresentationModel;

namespace MatatakiBot.Services.Impls
{
    class I18nService : II18nService
    {
        private readonly SortedList<string, IMessageFormatter> _formatters;
        private readonly SortedList<string, SortedList<string, string>> _patterns;

        public I18nService()
        {
            _formatters = new SortedList<string, IMessageFormatter>(StringComparer.OrdinalIgnoreCase);
            _patterns = new SortedList<string, SortedList<string, string>>(StringComparer.OrdinalIgnoreCase);
        }

        public void Initialize()
        {
            var cultureInfos = new HashSet<string>(CultureInfo.GetCultures(CultureTypes.AllCultures).Select(r => r.IetfLanguageTag),
                StringComparer.OrdinalIgnoreCase);

            foreach (var localeFilename in Directory.EnumerateFiles("locales", "*.yml"))
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

        public string Format(I18n entry, string locale)
        {
            if (!_formatters.TryGetValue(locale, out var formatter))
                throw new InvalidOperationException($"Locale {locale} is unavailable");

            var patterns = _patterns[locale];

            if (!patterns.TryGetValue(entry.Key, out var pattern))
                return entry.Key;

            return formatter.FormatMessage(pattern, entry.Arguments);
        }
    }
}
