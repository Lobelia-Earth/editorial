/* eslint-env jest */

import { splitMarkdownForTranslations as splitMd } from '../editorial';
import { init } from '../server/httpServer';

const request = require('supertest');

const SINGLE_LINE_TEXT = 'So this is your birthday!';
const TWO_LINE_TEXT = "So this is your birthday!\nIt's my birthday too, yeah!";
const INDENTED_TEXT = `This is a list:

- Item 1
  - Item 1.1
  - Item 1.2
- Item 2`;
const COMPLEX_TEXT_WITH_BLOCKS = `
We have developed a crop suitability tool for Oxfam. At this stage, the tool produces maps showing the number of feasible crop cycles for maize, sorghum and pearl millet in the Sahel, Sub-Saharan Africa and Dry Corridor for the selected clime periods and emission scenarios.

\`\`\`ExampleHome
- a: 3
- b: 5
\`\`\`

Climate change is expected to disproportionately affect smallholder farmers, who already face numerous risks to agricultural production. Crops will respond to specific changes in temperature and precipitation at the locations where they are currently grown.`;
const MULTIPLE_BLOCKS = `
\`\`\`Contents
sidebar: true
\`\`\`

\`\`\`TeamMembers
title: Our team
advisoryGroup: false
\`\`\`

\`\`\`TeamMembers
title: Advisors
advisoryGroup: true
\`\`\`

\`\`\`Contact
question: Would you like to work with us?
button: get in touch
\`\`\`
`;

let app;

beforeAll(async () => {
  app = await init({ uploads: 'uploads' });
});

afterAll(async () => {
  await app.close();
});

const mergeChops = (chops) =>
  chops
    .map((o) => {
      const idx = o.indexOf('_');
      return idx >= 0 ? o.slice(idx + 1) : o;
    })
    .join('');

describe('splitMarkdownForTranslations', () => {
  describe('on a single-line text', () => {
    it('should chop it correctly', () => {
      const result = splitMd(SINGLE_LINE_TEXT, 'context-base');
      expect(result).toMatchSnapshot();
    });

    it('should chop it correctly (and report whitespace)', () => {
      const result = splitMd(SINGLE_LINE_TEXT, 'context-base', {
        whitespace: true,
      });
      expect(result).toMatchSnapshot();
    });

    it('should recover the original text from the chops', () => {
      const chops = splitMd(SINGLE_LINE_TEXT, 'context-base', {
        whitespace: true,
      });
      expect(mergeChops(chops)).toEqual(SINGLE_LINE_TEXT);
    });
  });

  describe('on a two-line text', () => {
    it('should chop it correctly', () => {
      const result = splitMd(TWO_LINE_TEXT, 'context-base');
      expect(result).toMatchSnapshot();
    });

    it('should chop it correctly (and report whitespace)', () => {
      const result = splitMd(TWO_LINE_TEXT, 'context-base', {
        whitespace: true,
      });
      expect(result).toMatchSnapshot();
    });

    it('should recover the original text from the chops', () => {
      const chops = splitMd(TWO_LINE_TEXT, 'context-base', {
        whitespace: true,
      });

      expect(mergeChops(chops)).toEqual(TWO_LINE_TEXT);
    });
  });

  describe('on a text with indented lines', () => {
    it('should chop it correctly', () => {
      const result = splitMd(INDENTED_TEXT, 'context-base');
      expect(result).toMatchSnapshot();
    });

    it('should chop it correctly (and report whitespace)', () => {
      const result = splitMd(INDENTED_TEXT, 'context-base', {
        whitespace: true,
      });
      expect(result).toMatchSnapshot();
    });

    it('should recover the original text from the chops', () => {
      const chops = splitMd(INDENTED_TEXT, 'context-base', {
        whitespace: true,
      });

      expect(mergeChops(chops)).toEqual(INDENTED_TEXT);
    });
  });

  describe('on a text with custom blocks', () => {
    it('should chop it correctly', () => {
      const result = splitMd(COMPLEX_TEXT_WITH_BLOCKS, 'context-base');
      expect(result).toMatchSnapshot();
    });

    it('should chop it correctly (and report whitespace)', () => {
      const result = splitMd(COMPLEX_TEXT_WITH_BLOCKS, 'context-base', {
        whitespace: true,
      });
      expect(result).toMatchSnapshot();
    });

    it('should recover the original text from the chops', () => {
      const chops = splitMd(COMPLEX_TEXT_WITH_BLOCKS, 'context-base', {
        whitespace: true,
      });
      expect(mergeChops(chops)).toEqual(COMPLEX_TEXT_WITH_BLOCKS);
    });
  });

  describe('on a text with multiple blocks', () => {
    it('should chop it correctly', () => {
      const result = splitMd(MULTIPLE_BLOCKS, 'context-base');
      expect(result).toMatchSnapshot();
    });

    it('should chop it correctly (and report whitespace)', () => {
      const result = splitMd(MULTIPLE_BLOCKS, 'context-base', {
        whitespace: true,
      });
      expect(result).toMatchSnapshot();
    });

    it('should recover the original text from the chops', () => {
      const chops = splitMd(MULTIPLE_BLOCKS, 'context-base', {
        whitespace: true,
      });
      expect(mergeChops(chops)).toEqual(MULTIPLE_BLOCKS);
    });
  });
});

describe('API', () => {
  describe('posting new content', () => {
    it('should create content', async () => {
      // deleting old value by id
      await request(app).post('/editorial/_updateItem').send({
        itemType: 'test',
        id: 'test item',
      });
      const initialDatas = await request(app).get('/editorial/_data/test');
      expect(!initialDatas['test item']);

      const data = {
        contents: 'Hello, world!',
        title: 'This is a title',
        id: 'test item',
        number: 12,
        boolean: false,
        color: 'rgb(42, 23, 133)',
        select: 'two',
      };

      await testApiCall(data, 200, 'ok');

      const result = await request(app).get('/editorial/_allData');
      expect(result.body.data.test['test item']).toStrictEqual(data);
    });

    it('should check number fields type', async () => {
      await testApiCall(
        {
          contents: 'Hello, world!',
          title: 'This is a title',
          id: 'test item',
          number: '12',
          boolean: false,
          color: 'rgb(42, 23, 133)',
          select: 'two',
        },
        400,
        `Expected "number" for field "Number" but got "string"`
      );
    });

    it('should check select values', async () => {
      await testApiCall(
        {
          contents: 'Hello, world!',
          title: 'This is a title',
          id: 'test item',
          number: 12,
          boolean: false,
          color: 'rgb(42, 23, 133)',
          select: 'four',
        },
        400,
        `Value "four" invalid for field "Select"`
      );
    });

    it('should check color values', async () => {
      await testApiCall(
        {
          contents: 'Hello, world!',
          title: 'This is a title',
          id: 'test item',
          number: 12,
          boolean: false,
          color: '#12',
          select: 'one',
        },
        400,
        `Value "#12" is not a valid color string`
      );
    });

    it('should check boolean values', async () => {
      await testApiCall(
        {
          contents: 'Hello, world!',
          title: 'This is a title',
          id: 'test item',
          number: 12,
          boolean: 'true',
          color: '#123',
          select: 'one',
        },
        400,
        `Expected "boolean" for field "Boolean" but got "string"`
      );
    });

    it('should check markdown fields type', async () => {
      await testApiCall(
        {
          contents: {},
          title: 'This is a title',
          id: 'test item',
          number: 12,
          boolean: false,
          color: 'rgb(42, 23, 133)',
          select: 'two',
        },
        400,
        `Expected "string" for field "Contents" but got "object"`
      );
    });

    it('should check that mandatory fields are present', async () => {
      await testApiCall(
        {
          contents: 'Hello, world!',
          id: 'test item',
          number: 12,
          boolean: false,
          color: 'rgb(42, 23, 133)',
          select: 'two',
        },
        400,
        `Field "title" missing while it's mandatory`
      );
    });

    it('should not reject extra fields', async () => {
      await testApiCall(
        {
          _draft: true,
          _noTranslation: true,
          _rank: 10,
          title: 'This is a title',
        },
        200,
        'ok'
      );
    });

    it('should not type-check falsy values', async () => {
      await testApiCall(
        {
          title: 'This is a title',
          contents: null,
        },
        200,
        'ok'
      );
    });
  });
});

const testApiCall = async (content, expectedStatus, expectedMessage) => {
  const response = await request(app).post('/editorial/_updateItem').send({
    itemType: 'test',
    attrs: content,
  });
  expect(response.body).toStrictEqual({
    result: expectedMessage,
  });
  expect(response.statusCode).toBe(expectedStatus);
};
