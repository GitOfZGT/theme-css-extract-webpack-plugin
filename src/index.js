/* eslint-disable no-param-reassign */
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { validate } from 'schema-utils';

import {
  extractThemeCss,
  addScopnameToHtmlClassname,
  createPulignParamsFile,
} from '@zougt/some-loader-utils';

import schema from './plugin-options.json';

function getThemeExtractTag({ publicPath, userOptions }) {
  const filename =
    (typeof userOptions.customThemeCssFileName === 'function'
      ? userOptions.customThemeCssFileName(userOptions.defaultScopeName)
      : '') || userOptions.defaultScopeName;
  return {
    tagName: 'link',
    voidTag: true,
    attributes: {
      href: `/${publicPath || ''}/${
        userOptions.outputDir || ''
      }/${filename}.css`.replace(/\/+(?=\/)/g, ''),
      rel: 'stylesheet',
      id: userOptions.themeLinkTagId,
    },
  };
}
class ThemeCssExtractWebpackPlugin {
  constructor(options = {}) {
    validate(schema, options, {
      name: 'Extract Theme CSS Plugin',
      baseDataPath: 'options',
    });
    this.userOptions = Object.assign(
      {
        multipleScopeVars: [],
        outputDir: '/',
        defaultScopeName: '',
        extract: true,
        removeCssScopeName: false,
        // type: function
        customThemeCssFileName: null,
        themeLinkTagId: 'theme-link-tag',
        themeLinkTagAppend: false,
      },
      options
    );
    createPulignParamsFile({ extract: this.userOptions.extract });
  }
  apply(compiler) {
    if (
      Array.isArray(this.userOptions.multipleScopeVars) &&
      this.userOptions.multipleScopeVars.length
    ) {
      if (!this.userOptions.defaultScopeName) {
        // 未指定defaultScopeName时，取multipleScopeVars[0].scopeName
        this.userOptions.defaultScopeName =
          this.userOptions.multipleScopeVars[0].scopeName;
      }
      let publicPath = this.userOptions.publicPath || '';
      compiler.hooks.compilation.tap(
        'ThemeCssExtractWebpackPlugin',
        (compilation) => {
          // 添加html-webpack-plugin v3 的钩子
          if (typeof HtmlWebpackPlugin.getHooks !== 'function') {
            if (this.userOptions.extract && this.userOptions.themeLinkTagId) {
              if (!publicPath) {
                compilation.plugin(
                  'html-webpack-plugin-before-html-generation',
                  (data) => {
                    // console.log('html-webpack-plugin-before-html-generation');
                    const { publicPath: path } = data.assets || {};
                    publicPath = path;
                  }
                );
              }
              compilation.plugin(
                'html-webpack-plugin-alter-asset-tags',
                (data) => {
                  // 添加默认主题link标签
                  const themeLinkTag = [
                    getThemeExtractTag({
                      publicPath,
                      userOptions: this.userOptions,
                    }),
                  ];
                  data.head = this.userOptions.themeLinkTagAppend
                    ? data.head.concat(themeLinkTag)
                    : themeLinkTag.concat(data.head);
                }
              );
            }
            if (!this.userOptions.removeCssScopeName) {
              compilation.plugin(
                'html-webpack-plugin-before-html-processing',
                (data) => {
                  // console.log('html-webpack-plugin-before-html-processing');
                  data.html = addScopnameToHtmlClassname(
                    data.html,
                    this.userOptions.defaultScopeName
                  );
                }
              );
            }
            return;
          }

          // html-webpack-plugin v4+ 才有 HtmlWebpackPlugin.getHooks
          const htmlWebpackCompilation =
            HtmlWebpackPlugin.getHooks(compilation);
          if (this.userOptions.extract && this.userOptions.themeLinkTagId) {
            if (!publicPath) {
              // 未指定publicPath时，取html-webpack-plugin解析后的publicPath
              htmlWebpackCompilation.beforeAssetTagGeneration.tapAsync(
                'ThemeCssExtractWebpackPlugin',
                (data, cb) => {
                  const { publicPath: path } = data.assets || {};
                  publicPath = path;
                  cb(null, data);
                }
              );
            }
            htmlWebpackCompilation.alterAssetTags.tapAsync(
              'ThemeCssExtractWebpackPlugin',
              (data, cb) => {
                // 添加默认主题link标签
                const themeLinkTag = [
                  getThemeExtractTag({
                    publicPath,
                    userOptions: this.userOptions,
                  }),
                ];
                data.assetTags.styles = this.userOptions.themeLinkTagAppend
                  ? data.assetTags.styles.concat(themeLinkTag)
                  : themeLinkTag.concat(data.assetTags.styles);
                cb(null, data);
              }
            );
          }
          if (!this.userOptions.removeCssScopeName) {
            htmlWebpackCompilation.beforeEmit.tapAsync(
              'ThemeCssExtractWebpackPlugin',
              (data, cb) => {
                // console.log(data.html)
                data.html = addScopnameToHtmlClassname(
                  data.html,
                  this.userOptions.defaultScopeName
                );
                cb(null, data);
              }
            );
          }
        }
      );

      if (this.userOptions.extract) {
        compiler.hooks.emit.tapAsync(
          'ThemeCssExtractWebpackPlugin',
          (compilation, callback) => {
            extractThemeCss({
              removeCssScopeName: this.userOptions.removeCssScopeName,
            }).then(({ themeCss }) => {
              Object.keys(themeCss).forEach((scopeName) => {
                const filename =
                  (typeof this.userOptions.customThemeCssFileName === 'function'
                    ? this.userOptions.customThemeCssFileName(scopeName)
                    : '') || scopeName;

                compilation.assets[
                  `/${
                    this.userOptions.outputDir || ''
                  }/${filename}.css`.replace(/\/+(?=\/)/g, '')
                ] = {
                  source() {
                    return themeCss[scopeName];
                  },
                  size() {
                    return themeCss[scopeName].length;
                  },
                };
              });
              callback(null);
            });
          }
        );
      }
    }
  }
}

export default ThemeCssExtractWebpackPlugin;
