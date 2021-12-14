/* eslint-disable no-param-reassign */

import { minify } from 'terser';

import HtmlWebpackPlugin from 'html-webpack-plugin';

import {
  createSetCustomThemeFile,
  getThemeStyleContent,
} from '@zougt/some-loader-utils';

import pack from '../../package.json';

function getThemeStyleTag({ userOptions, styleContent }) {
  return [
    {
      tagName: 'style',
      closeTag: true,
      innerHTML: styleContent,
      attributes: {
        type: 'text/css',
        id: userOptions.styleTagId,
      },
    },
  ];
}
export function arbitraryModeApply(compiler) {
  if (this.userOptions.InjectDefaultStyleTagToHtml) {
    let injectTo = 'body';
    if (typeof this.userOptions.InjectDefaultStyleTagToHtml === 'string') {
      injectTo = this.userOptions.InjectDefaultStyleTagToHtml;
    }
    compiler.hooks.compilation.tap(
      'ThemeCssExtractWebpackPlugin',
      (compilation) => {
        // 添加html-webpack-plugin v3 的钩子
        if (typeof HtmlWebpackPlugin.getHooks !== 'function') {
          compilation.hooks.htmlWebpackPluginAlterAssetTags.tapAsync(
            'ThemeCssExtractWebpackPlugin',
            (data, cb) => {
              getThemeStyleContent().then(({ styleContent }) => {
                if (injectTo === 'body') {
                  data[injectTo] = getThemeStyleTag({
                    userOptions: this.userOptions,
                    styleContent,
                  }).concat(data[injectTo]);
                } else {
                  data[injectTo] = data[injectTo].concat(
                    getThemeStyleTag({
                      userOptions: this.userOptions,
                      styleContent,
                    })
                  );
                }
                cb(null, data);
              });
            }
          );
          return;
        }
        // html-webpack-plugin v4+ 才有 HtmlWebpackPlugin.getHooks
        const htmlWebpackCompilation = HtmlWebpackPlugin.getHooks(compilation);

        htmlWebpackCompilation.alterAssetTagGroups.tapAsync(
          'ThemeCssExtractWebpackPlugin',
          (data, cb) => {
            getThemeStyleContent().then(({ styleContent }) => {
              if (injectTo === 'body') {
                data[`${injectTo}Tags`] = getThemeStyleTag({
                  userOptions: this.userOptions,
                  styleContent,
                }).concat(data[`${injectTo}Tags`]);
              } else {
                data[`${injectTo}Tags`] = data[`${injectTo}Tags`].concat(
                  getThemeStyleTag({
                    userOptions: this.userOptions,
                    styleContent,
                  })
                );
              }
              cb(null, data);
            });
          }
        );
      }
    );
  }
  compiler.hooks.emit.tapAsync(
    'ThemeCssExtractWebpackPlugin',
    (compilation, callback) => {
      getThemeStyleContent()
        .then(({ styleContent, themeRuleValues }) => {
          const createOpt = {
            defaultPrimaryColor: this.userOptions.defaultPrimaryColor,
            styleTagId: this.userOptions.styleTagId,
            includeStyleWithColors: this.userOptions.includeStyleWithColors,
            hueDiffControls: this.userOptions.hueDiffControls,
            styleContent,
            themeRuleValues,
            importUtils: false,
          };
          if (compiler.hasZougtUpdateLoader) {
            // 在开发模式下，使用了../hot-loader , 会存在compiler.hasZougtUpdateLoader
            if (
              typeof this.cacheThemeStyleContent !== 'string' ||
              this.cacheThemeStyleContent !== styleContent
            ) {
              this.cacheThemeStyleContent = styleContent;
              const packRoot = require
                .resolve(pack.name, {
                  paths: [process.cwd()],
                })
                .replace(/[\\/]cjs\.js$/, '')
                .replace(/\\/g, '/');
              // no return
              createSetCustomThemeFile({
                ...createOpt,
                customThemeOutputPath: `${packRoot}/hot-loader/setCustomThemeContent.js`,
                appendedContent: '\nexport {setCustomTheme};',
              });
            }
          } else {
            // need return
            return createSetCustomThemeFile(createOpt);
          }

          return Promise.resolve();
        })
        .then((result) => {
          if (result) {
            return minify(
              {
                'setCustomTheme.js': `(function(){${result.setCustomThemeConent}\nreturn setCustomTheme;})()`,
              },
              { compress: { defaults: false } }
            ).then((res) => {
              Object.keys(compilation.assets).forEach((filename) => {
                const source = compilation.assets[filename].source().toString();
                const replaceReg = /__ZOUGT_CUSTOM_THEME_METHOD__(?!\s*["'])/g;
                if (source.match(replaceReg)) {
                  const isDevReg = /eval\(.+__ZOUGT_CUSTOM_THEME_METHOD__/;
                  const replaceCode = res.code.replace(/;+$/g, '');
                  const newSource = source.replace(
                    replaceReg,
                    isDevReg.test(source)
                      ? JSON.stringify(replaceCode).replace(
                          /(^["']|["']$)/g,
                          ''
                        )
                      : replaceCode
                  );

                  compilation.assets[filename] = {
                    source() {
                      return newSource;
                    },
                    size() {
                      return Buffer.byteLength(newSource, 'utf8');
                    },
                  };
                }
              });
            });
          }
          return null;
        })
        .then(() => {
          callback(null);
        });
    }
  );
}

export default arbitraryModeApply;
