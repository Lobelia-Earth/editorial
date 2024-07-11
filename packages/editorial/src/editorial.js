/* eslint-disable no-console */
/* eslint-disable no-eval */

import path from 'path';
import fs from 'fs-extra';
import { merge, clone } from 'timm';
import yaml from 'js-yaml';
import LRU from 'lru-cache';

const RE_MARKDOWN_CODE_BLOCKS = /(\s*```[\s\S]*?```\s*)/gm;
const RE_LINE_ENDINGS = /([\r\n]+)/gm;
const RE_MULTIPLE_LIST = /\s*,\s*/;

// ===========================================
// Read config files
// ===========================================
const getConfig = () => {
  const raw = fs.readFileSync('./data/config.yaml', 'utf8');
  const out = yaml.safeLoad(raw);
  return out;
};

const getSchema = () => {
  const raw = fs.readFileSync('./data/schema.yaml', 'utf8');
  const out = yaml.safeLoad(raw);
  return out;
};

const getData = () => {
  const raw = fs.readFileSync('./data/data.json', 'utf8');
  const out = JSON.parse(raw);
  return out;
};

const getLocaleConfig = () => {
  const raw = fs.readFileSync('./locales/config.json', 'utf8');
  const out = JSON.parse(raw);
  return out;
};

// ===========================================
// Translation-related
// ===========================================
// To be used in <root>/locales/getExtraMessages.js
const getExtraMessages = () => {
  const config = getConfig();
  const schema = getSchema();
  const dataJson = getData();

  const out = [];
  if (config.noTranslation) return out;
  Object.keys(dataJson).forEach((pageType) => {
    const pages = dataJson[pageType];
    const subschema = schema[pageType];
    if (!subschema) return;
    const allFieldSpecs = subschema.fields;
    Object.keys(pages).forEach((id) => {
      const pageData = pages[id];
      if (pageData._noTranslation) return;
      const scope = `${pageType}-${id}`;
      Object.keys(pageData).forEach((fieldName) => {
        const value = pageData[fieldName];
        if (!value) return;
        const fieldSpec = allFieldSpecs[fieldName];
        if (!isFieldTranslatable(fieldSpec)) return;
        const isMarkdown = fieldSpec.type === 'markdown';
        const context = `${pageType}-${fieldName}`;
        let chops;
        let includeSeq = false;
        if (isMarkdown) {
          chops = splitMarkdownForTranslations(value, context).filter(
            // Remove those chops that correspond to section names
            (o) => !/===+(.*?)===+/g.test(o.trim())
          );
          includeSeq = true;
        } else if (fieldSpec.isMultiple) {
          chops = splitMultipleFieldForTranslations(value, context);
        } else {
          chops = [`${context}_${value}`];
        }
        let seq = 0;
        chops.forEach((text) => {
          const msgDetails = { isMarkdown, scope, text, filePath: scope };
          if (includeSeq) {
            msgDetails.seq = seq;
            seq += 1;
          }
          out.push(msgDetails);
        });
      });
    });
  });
  return out;
};

// Load locales, both scoped and not, and also locale code (unscoped):
// - Locales: in order to translate data for data packages
// - Locale code: in order to embed in the page, with the translations
//   of the application itself (not of its data).
const loadAllLocales = (_t, { data, appendScopedLocaleCode } = {}) => {
  const dataJson = data || getData();
  const { langs } = getLocaleConfig();
  let numLoaded = 0;
  let scopeErrors = false;
  langs.forEach((lang) => {
    let additionalLocaleCode = '';
    // Load all locales (main and scoped) into Mady
    let locales;
    try {
      const myPath = path.join(process.cwd(), `locales/${lang}.js`);
      locales = requireFreshModule(myPath);
    } catch (err) {
      console.warn(
        `Translations file ${lang}.js is missing. Run \`mady --recompile\``
      );
      locales = {};
    }
    Object.keys(dataJson).forEach((pageType) => {
      const ids = Object.keys(dataJson[pageType]);
      ids.forEach((id) => {
        let scopedLocales;
        const scopedPath = path.join(
          process.cwd(),
          `locales/scoped/${pageType}-${id}-${lang}.js`
        );
        try {
          scopedLocales = requireFreshModule(scopedPath);
          numLoaded += 1;
          if (appendScopedLocaleCode) {
            Object.keys(scopedLocales).forEach((key) => {
              const msg = scopedLocales[key]();
              const msgJson = JSON.stringify(msg);
              additionalLocaleCode += `\nmodule.exports['${key}'] = () => ${msgJson}`;
            });
          }
        } catch (err) {
          scopeErrors = true;
          return;
        }
        locales = merge(locales, scopedLocales);
      });
    });
    _t.addLocales(lang, locales);

    // Load also (unscoped) localeCode into Mady
    let localeCode;
    try {
      localeCode = fs.readFileSync(`./locales/${lang}.js`, 'utf8');
    } catch (err) {
      console.warn(
        `Translations file ${lang}.js is missing. Run \`mady --recompile\``
      );
      localeCode = '';
    }
    if (additionalLocaleCode.length) localeCode += additionalLocaleCode;
    localeCode = localeCode.trim();
    _t.addLocaleCode(lang, localeCode);
  });
  if (scopeErrors)
    console.warn(
      'No translations found for some scopes. Remember to translate!'
    );
  console.log(`Loaded ${numLoaded} scoped locale files`);
};

const getAllTranslations = (_t, data) => {
  // We use appendScopedLocaleCode since we want to get a snapshot
  // of absolutely all translations in the DB, so that they can be
  // applied for translations later on
  loadAllLocales(_t, { data, appendScopedLocaleCode: true });
  const { langs } = getLocaleConfig();
  const allLocaleCode = {};
  for (let i = 0; i < langs.length; i++) {
    const lang = langs[i];
    allLocaleCode[lang] = _t.getLocaleCode(lang).result;
  }
  return allLocaleCode;
};

const getTranslations = (_t, lang, allLocaleCode) => allLocaleCode[lang];

const isFieldTranslatable = (fieldSpec) => {
  if (!fieldSpec) return false;
  if (fieldSpec.dontTranslate) return false;
  if (['boolean', 'date', 'number', 'color'].indexOf(fieldSpec.type) >= 0) {
    return false;
  }
  return true;
};

const splitMarkdownForTranslations = (
  text,
  contextBase,
  { whitespace } = {}
) => {
  const segments = text.split(RE_MARKDOWN_CODE_BLOCKS);
  const out = [];
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    // Code block
    if (i % 2) {
      const parts = segment.split('```');
      if (whitespace) out.push(parts[0]);
      out.push(`${contextBase}_\`\`\`${parts[1]}\`\`\``);
      if (whitespace) out.push(parts[2]);

      // Normal text
    } else {
      const parts = segment.split(RE_LINE_ENDINGS);
      for (let k = 0; k < parts.length; k++) {
        if (k % 2) {
          if (whitespace) out.push(parts[k]);
        } else {
          const part = parts[k];
          if (!part.length) continue;
          const firstNonSpacePos = part.search(/\S/);
          if (whitespace && firstNonSpacePos > 0)
            out.push(part.substring(0, firstNonSpacePos));
          if (firstNonSpacePos < part.length - 1)
            out.push(`${contextBase}_${part.substring(firstNonSpacePos)}`);
        }
      }
    }
  }
  return out;
};

const splitMultipleFieldForTranslations = (text, contextBase) =>
  (text || '')
    .split(RE_MULTIPLE_LIST)
    .filter((o) => !!o)
    .map((o) => `${contextBase}_${o}`);

const _cachedLocales = new LRU({ max: 10 });

const translate = (_t, item0, itemType, schema, lang, allLocaleCode) => {
  // Deserialize locale code and load it into Mady
  // NOTE: We use a cache, because eval() on large content not only is slow,
  // but also causes memory instability/leaks.
  const localeCode = allLocaleCode[lang];
  let locales = _cachedLocales.get(localeCode);
  if (!locales) {
    locales = eval(`
      (function() {
        var module = { exports: {} };
        ${localeCode};
        return module.exports;
      })();
    `);
    _cachedLocales.set(localeCode, locales);
  }
  _t.setLocales(locales);

  // Translate the item
  let item = item0;
  if (item == null) return item;
  item = translateItem(item, itemType, schema, _t);
  return item;
};

const translateItem = (item, itemType, schema, _t) => {
  const subschema = schema[itemType];
  if (!subschema) return clone(item);
  const allFieldSpecs = subschema.fields;
  const translatedFields = [];
  const out = {};
  Object.keys(item).forEach((attr) => {
    const value = item[attr];
    const fieldSpec = allFieldSpecs[attr];
    out[attr] = value;
    if (value == null) return;
    if (!isFieldTranslatable(fieldSpec)) return;
    const context = `${itemType}-${attr}`;
    let translation;
    if (fieldSpec.type === 'markdown') {
      translation = splitMarkdownForTranslations(value, context, {
        whitespace: true,
      })
        .map((chop) => (chop.includes('_') ? _t(chop) : chop))
        .join('');
    } else if (fieldSpec.isMultiple) {
      translation = splitMultipleFieldForTranslations(value, context)
        .map(_t)
        .join(', ');
    } else {
      translation = _t(`${context}_${value}`);
    }
    out[attr] = translation;
    translatedFields.push(attr);
  });
  // console.log(
  //   `  Translated for ${itemType}-${item.id}: ${translatedFields.join(', ')}`
  // );
  return out;
};

// ===========================================
// Helpers
// ===========================================
const requireFreshModule = (module) => {
  delete require.cache[require.resolve(module)];
  return require(module); // eslint-disable-line
};

// ===========================================
// Public
// ===========================================
export {
  getConfig,
  getSchema,
  getData,
  getLocaleConfig,
  // --
  getExtraMessages,
  loadAllLocales,
  getAllTranslations,
  getTranslations,
  isFieldTranslatable,
  splitMarkdownForTranslations,
  splitMultipleFieldForTranslations,
  translate,
  translateItem,
};
