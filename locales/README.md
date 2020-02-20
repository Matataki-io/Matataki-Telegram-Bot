# I18n FAQ

## What does the filename here mean?

The filename is based on [IETF language tag](https://en.wikipedia.org/wiki/IETF_language_tag).

## What is the format of a translation file?

A transaltion file is a valid [YAML](https://yaml.org/) document, but only the following elements are accepted:

* A simple **key-string** element

```yaml
key: Text
```

You'll get a `Text` string by `i18n.t("key")`.

* One or many **key-string** elements above grouped by a **key**:

```yaml
group:
  key1: A
  key2: B
  subgroup:
    key3: C
```

You'll get the translation by the following way:

```typescript
i18n.t("group.key1", { content: "World!" }) // "A"
i18n.t("group.key2", { add }) // "B"
i18n.t("group..subgroupkey3", { add, a: 2, b: 3 }) // "C"
```

## How can translation work on computed values?

You can use a placeholder in your translation. Both **variable** and **function** are supported. For example:

```yaml
key1: Hello, ${content}

key2: 1 + 2 = ${add(1, 2)}
key3: ${a} + ${b} = ${add(a, b)}
```

And then:

```typescript
i18n.t("key1", { content: "World!" }) // "Hello, World!"

const add = (a: number, b: number) => a + b;

i18n.t("key2", { add }) // "1 + 2 = 3"
i18n.t("key3", { add, a: 2, b: 3 }) // "2 + 3 = 5"
```

## How to handle plurals?

Different languages have different pluralization rules and grammatical constructions that add complexity to the translation task. You can use `pluralize()` to handle them.

Pluralization categories include (depending on the language):

* zero
* one
* two
* few
* many
* other

_See the categories for each languages in [Language Plural Rules](http://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html)_

To make the translation file clean, you should define pluralization rules in the translation file:

```yaml
# en.yml

PluralRules:
  second:
    one: second
    other: seconds
```

Use `pluralize()` in translation placeholder:

```yaml
key: I'll reply you in ${pluralize(time, "second")}.
```

It works.

```typescript
i18n.t("key", { time: 0 }) // "I'll reply you in 0 seconds."
i18n.t("key", { time: 1 }) // "I'll reply you in 1 second."
i18n.t("key", { time: 2 }) // "I'll reply you in 2 seconds."
```
