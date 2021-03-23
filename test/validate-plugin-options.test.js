import ThemeCssExtractWebpackPlugin from '../src';

describe('validate options', () => {
  const tests = {
    multipleScopeVars: {
      success: [[], [{ scopeName: 'default' }]],
      failure: [true],
    },
    outputDir: {
      success: ['/dist/css'],
      failure: [true],
    },
    defaultScopeName: {
      success: ['default'],
      failure: [1],
    },
    extract: {
      success: [true, false],
      failure: [1, {}],
    },
    removeCssScopeName: {
      success: [true, false],
      failure: [1, 'a'],
    },
    customThemeCssFileName: {
      success: [(scopeName) => `${scopeName}-build`],
      failure: [1, {}, [], 'invalid/type'],
    },
    themeLinkTagId: {
      success: ['theme-link'],
      failure: [1, true, false],
    },
    themeLinkTagAppend: {
      success: [true, false],
      failure: [1, 'b'],
    },
  };

  function stringifyValue(value) {
    if (
      Array.isArray(value) ||
      (value && typeof value === 'object' && value.constructor === Object)
    ) {
      return JSON.stringify(value);
    }

    return value;
  }

  async function createTestCase(key, value, type) {
    it(`should ${
      type === 'success' ? 'successfully validate' : 'throw an error on'
    } the "${key}" option with "${stringifyValue(value)}" value`, async () => {
      let error;

      try {
        // eslint-disable-next-line no-new
        new ThemeCssExtractWebpackPlugin({ [key]: value });
      } catch (errorFromPlugin) {
        if (errorFromPlugin.name !== 'ValidationError') {
          throw errorFromPlugin;
        }

        error = errorFromPlugin;
      } finally {
        if (type === 'success') {
          expect(error).toBeUndefined();
        } else if (type === 'failure') {
          expect(() => {
            throw error;
          }).toThrowErrorMatchingSnapshot();
        }
      }
    });
  }

  for (const [key, values] of Object.entries(tests)) {
    for (const type of Object.keys(values)) {
      for (const value of values[type]) {
        createTestCase(key, value, type);
      }
    }
  }
});
