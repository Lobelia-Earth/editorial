/* eslint-disable no-console */
/* eslint-disable no-param-reassign */
/* eslint-disable import/no-extraneous-dependencies */

const fs = require('fs');
const { clone } = require('timm');
const uuid = require('uuid');
const chalk = require('chalk');
const {
  getLocaleConfig,
  splitMarkdownForTranslations,
} = require('@isardsat/editorial');

const utf8ToBase64 = (str) => Buffer.from(str, 'utf8').toString('base64');

const DEBUG = false;

const logTruncate = (str) => (str.length > 30 ? `${str.slice(0, 30)}…` : str);

const run = () => {
  const { langs } = getLocaleConfig();
  let errored = false;

  // Read all files
  const keys = JSON.parse(fs.readFileSync('./locales/keys.json', 'utf8'));
  console.log(
    `Keys: ${Object.keys(keys).length}, ${
      Object.values(keys).filter((o) => !o.isDeleted).length
    } not deleted`
  );
  const allTranslations = {};
  langs.forEach((lang) => {
    allTranslations[lang] = JSON.parse(
      fs.readFileSync(`./locales/${lang}.json`, 'utf8')
    );
    console.log(
      `- Translations to ${lang}: ${
        Object.keys(allTranslations[lang]).length
      }, ${
        Object.values(allTranslations[lang]).filter((o) => !o.isDeleted).length
      } not deleted`
    );
  });

  // Mark translations as deleted if their key is deleted
  langs.forEach((lang) => {
    const translations = Object.values(allTranslations[lang]);
    translations.forEach((translation) => {
      const key = keys[translation.keyId];
      if ((!key || key.isDeleted) && !translation.isDeleted) {
        translation.isDeleted = true;
        console.log(
          `Marked as deleted: ${logTruncate(translation.translation)}`
        );
      }
    });
  });

  // Start chopping
  let cnt = 0;
  Object.values(keys).forEach((key) => {
    const { id } = key;
    if (!key.isMarkdown) return;
    if (key.seq != null) return;
    if (key.isDeleted || key.unusedSince != null) return;
    cnt += 1;

    if (DEBUG) {
      console.log(
        '\n\n========================================================================'
      );
      console.log(chalk.yellow(key.context));
      console.log(chalk.yellow(key.text));
    }

    // Delete original key
    delete keys[id];

    // Chop key
    const { text, context } = key;
    const keyChops = splitMarkdownForTranslations(text, context);
    const lenContext = context.length;
    const newKeyIds = [];
    keyChops.forEach((chop, seq) => {
      const newKey = clone(key);
      const chopId = utf8ToBase64(chop);
      newKey.id = chopId;
      newKey.text = chop.slice(lenContext + 1);
      newKey.seq = seq;
      newKeyIds.push(chopId);
      keys[chopId] = newKey;

      if (DEBUG) {
        console.log('---------->');
        console.log(newKey.id);
        console.log(newKey.seq);
        console.log(newKey.text);
        console.log('\n');
      }
    });

    // For each lang...
    langs.forEach((lang) => {
      if (DEBUG) {
        console.log(
          '\n------------------------------------------------------------------------'
        );
        console.log(`TRANSLATION IN ${lang}:`);
      }

      const translations = allTranslations[lang];
      const translationId = Object.keys(translations).find(
        (o) => !translations[o].isDeleted && translations[o].keyId === id
      );
      if (!translationId) return;
      const translation = translations[translationId];
      if (DEBUG) console.log(chalk.cyan(translation.translation));

      // Delete original translation
      delete translations[translationId];

      // Chop translations
      if (translation.translation == null) return;
      const translationChops = splitMarkdownForTranslations(
        translation.translation,
        ''
      );

      // Watch out for chop mismatches
      if (translationChops.length !== newKeyIds.length) {
        console.log(chalk.red('======================='));
        console.log(chalk.red(`CHOP MISMATCH in ${lang}`));
        console.log(chalk.red(`Key has ${keyChops.length} chops:`));
        keyChops.forEach((chop) => console.log(`--- ${chalk.yellow(chop)}`));
        // console.log(chalk.yellow(`${context}_${text}`));
        // console.log(key);
        console.log(
          chalk.red(`Translation has ${translationChops.length} chops:`)
        );
        translationChops.forEach((chop) =>
          console.log(`--- ${chalk.cyan(chop.slice(1))}`)
        );
        // console.log(translation);
        console.log(chalk.red('======================='));
        errored = true;
      }

      translationChops.forEach((chop, seq) => {
        const newTranslation = clone(translation);
        const chopId = uuid.v4();
        newTranslation.id = chopId;
        newTranslation.translation = chop.slice(1);
        newTranslation.keyId = newKeyIds[seq];
        translations[chopId] = newTranslation;
        if (DEBUG) {
          console.log('---------->');
          console.log(seq);
          console.log(newTranslation.translation);
          console.log('\n');
          // console.log(newTranslation);
        }
      });
    });
  });

  // Verify that there are not multiple translations for the same key
  langs.forEach((lang) => {
    const translations = allTranslations[lang];
    Object.keys(keys).forEach((id) => {
      const key = keys[id];
      if (key.isDeleted || key.unusedSince != null) return;
      const keyTranslations = Object.values(translations).filter(
        (translation) => !translation.isDeleted && translation.keyId === id
      );
      if (keyTranslations.length > 1) {
        // If translations are different, error and bail out
        const dedup = {};
        keyTranslations.forEach((translation) => {
          dedup[translation.translation] = true;
        });
        if (Object.keys(dedup).length > 1) {
          console.log(chalk.red('======================='));
          console.log(
            chalk.red(
              `KEY WITH MULTIPLE TRANSLATIONS in ${lang}: ${key.context}_${key.text}`
            )
          );
          console.log(chalk.red('Translations:'));
          keyTranslations.forEach((translation) => {
            console.log(chalk.cyan(`--- ${translation.translation}`));
            // console.log(translation);
          });
          errored = true;
        } else {
          keyTranslations.forEach((translation, idx) => {
            if (idx > 0) translation.isDeleted = true;
          });
        }
      }
    });
  });

  // Save all files
  if (errored) {
    console.log(chalk.red('Not saving files -- please check the errors above'));
  } else {
    console.log('Saving files...');
    fs.writeFileSync(
      './locales/keys.json',
      JSON.stringify(keys, null, 2),
      'utf8'
    );
    langs.forEach((lang) => {
      fs.writeFileSync(
        `./locales/${lang}.json`,
        JSON.stringify(allTranslations[lang], null, 2),
        'utf8'
      );
    });
  }

  console.log(`Chopped ${cnt} keys`);
};

run();
