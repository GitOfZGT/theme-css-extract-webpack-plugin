/* eslint-disable no-param-reassign */

import { minify } from 'terser';

import HtmlWebpackPlugin from 'html-webpack-plugin';

import {
  createSetCustomThemeFile,
  getThemeStyleContent,
} from '@zougt/some-loader-utils';

import acorn from 'acorn';
import walk from 'acorn-walk';

import pack from '../../package.json';

function getEvalFromCode(code) {
  // 解析为AST（启用位置信息）
  const ast = acorn.parse(code, {
    ecmaVersion: 2022,
    locations: true,
  });

  // 存储找到的eval调用
  const evalCalls = [];

  // 遍历AST
  walk.simple(ast, {
    CallExpression(node) {
      // 检查是否为直接调用eval
      if (node.callee.type === 'Identifier' && node.callee.name === 'eval') {
        // 提取信息：参数、位置
        const args = node.arguments.map((arg) => {
          // 如果参数是字面量，直接获取值
          if (arg.type === 'Literal') return arg.value;
          // 其他类型返回大致结构
          return { type: arg.type, content: code.slice(arg.start, arg.end) };
        });
        evalCalls.push({
          type: 'Direct eval call',
          arguments: args,
          location: node.loc,
        });
      }

      // 处理间接调用如window.eval
      if (
        node.callee.type === 'MemberExpression' &&
        node.callee.property.name === 'eval'
      ) {
        evalCalls.push({
          type: 'MemberExpression eval call',
          object: code.slice(node.callee.object.start, node.callee.object.end),
          location: node.loc,
        });
      }
    },
  });
  return evalCalls;
}
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
            if (
              typeof this.cacheThemeStyleContent !== 'string' ||
              this.cacheThemeStyleContent !== styleContent
            ) {
              this.cacheThemeStyleContent = styleContent;
              const packRoot = require
                .resolve(pack.name)
                .replace(/[\\/]cjs\.js$/, '')
                .replace(/\\/g, '/');
              // no return
              createSetCustomThemeFile({
                ...createOpt,
                customThemeOutputPath:
                  this.userOptions.customThemeOutputPath ||
                  `${packRoot}/hot-loader/setCustomThemeContent.js`,
                appendedContent: '\nexport default setCustomTheme;',
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
                if (!/\.js$/.test(filename)) {
                  return;
                }
                const source = compilation.assets[filename].source().toString();
                const replaceReg = /__ZOUGT_CUSTOM_THEME_METHOD__(?!\s*["'])/g;
                if (source.match(replaceReg)) {
                  const evalCalls = getEvalFromCode(source);
                  const isInEval = evalCalls.some((item) =>
                    (item.arguments || []).some((arg) => {
                      if (typeof arg === 'string') {
                        if (replaceReg.test(arg)) {
                          return true;
                        }
                      }
                      return false;
                    })
                  );
                  const replaceCode = res.code.replace(/;+$/g, '');
                  const newSource = source.replace(
                    replaceReg,
                    isInEval
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
