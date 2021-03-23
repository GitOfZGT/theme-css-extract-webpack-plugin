/* eslint-disable no-param-reassign */
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { validate } from 'schema-utils';

import schema from './plugin-options.json';

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
  }
  apply(compiler) {
    if (
      Array.isArray(this.userOptions.multipleScopeVars) &&
      this.userOptions.multipleScopeVars.length
    ) {
      if (!this.userOptions.defaultScopeName) {
        // 未指定defaultScopeName时，取multipleScopeVars[0].scopeName
        this.userOptions.defaultScopeName = this.userOptions.multipleScopeVars[0].scopeName;
      }
      compiler.hooks.compilation.tap(
        'ThemeCssExtractWebpackPlugin',
        (compilation) => {
          // 添加html-webpack-plugin的钩子
          const htmlWebpackCompilation = HtmlWebpackPlugin.getHooks(
            compilation
          );
          if (this.userOptions.extract && this.userOptions.themeLinkTagId) {
            let publicPath = this.userOptions.publicPath || '';
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
                const filename =
                  (typeof this.userOptions.customThemeCssFileName === 'function'
                    ? this.userOptions.customThemeCssFileName(
                        this.userOptions.defaultScopeName
                      )
                    : '') || this.userOptions.defaultScopeName;
                // 添加默认主题link标签
                const themeLinkTag = [
                  {
                    tagName: 'link',
                    voidTag: true,
                    attributes: {
                      href: `/${publicPath || ''}/${
                        this.userOptions.outputDir || ''
                      }/${filename}.css`.replace(/\/+(?=\/)/g, ''),
                      rel: 'stylesheet',
                      id: this.userOptions.themeLinkTagId,
                    },
                  },
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
                const htmlTagAttrStrings = data.html.match(/<\s*html[^<>]*>/gi);
                if (htmlTagAttrStrings) {
                  htmlTagAttrStrings.forEach((attrstr) => {
                    const classnameStrings = attrstr.match(
                      /class\s*=['"].+['"]/g
                    );
                    if (classnameStrings) {
                      classnameStrings.forEach((classstr) => {
                        const classnamestr = classstr.replace(
                          /(^class\s*=['"]|['"]$)/g,
                          ''
                        );
                        const classnames = classnamestr.split(' ');
                        if (
                          !classnames.includes(
                            this.userOptions.defaultScopeName
                          )
                        ) {
                          classnames.push(this.userOptions.defaultScopeName);
                          data.html = data.html.replace(
                            attrstr,
                            attrstr.replace(
                              classstr,
                              classstr.replace(
                                classnamestr,
                                classnames.join(' ')
                              )
                            )
                          );
                        }
                      });
                    } else {
                      data.html = data.html.replace(
                        attrstr,
                        `${attrstr.replace(/>$/, '')} class="${
                          this.userOptions.defaultScopeName
                        }">`
                      );
                    }
                  });
                }
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
            // 在资产生成文件之前，从css内容中抽取multipleScopeVars对应的内容
            const themeFragsMap = {};
            for (const filename in compilation.assets) {
              if (/\.css$/.test(filename)) {
                const { _value: content } = compilation.assets[filename];
                if (content) {
                  let newContent = content;
                  this.userOptions.multipleScopeVars.forEach((item) => {
                    if (!item.scopeName) {
                      return;
                    }
                    const currThemefixReg = new RegExp(
                      `\\w*\\.${item.scopeName}\\s*[^{}/\\\\]*{[^{}]*?}`,
                      'g'
                    );

                    newContent = newContent.replace(currThemefixReg, '');
                    let themeFrags = content.match(currThemefixReg);
                    if (themeFrags) {
                      if (this.userOptions.removeCssScopeName) {
                        const scopeNameReg = new RegExp(
                          `\\.${item.scopeName}`,
                          'g'
                        );
                        themeFrags = themeFrags.map((frag) =>
                          frag.replace(scopeNameReg, '')
                        );
                      }
                      const scopeFrags = themeFragsMap[item.scopeName] || [];
                      themeFragsMap[item.scopeName] = scopeFrags.concat(
                        themeFrags
                      );
                    }
                  });
                  // eslint-disable-next-line no-underscore-dangle
                  compilation.assets[filename]._value = newContent;
                }
              }
            }
            Object.keys(themeFragsMap).forEach((scopeName) => {
              const filename =
                (typeof this.userOptions.customThemeCssFileName === 'function'
                  ? this.userOptions.customThemeCssFileName(scopeName)
                  : '') || scopeName;

              compilation.assets[
                `/${this.userOptions.outputDir || ''}/${filename}.css`.replace(
                  /\/+(?=\/)/g,
                  ''
                )
              ] = {
                source() {
                  return themeFragsMap[scopeName].join('');
                },
                size() {
                  return themeFragsMap[scopeName].length;
                },
              };
            });
            callback();
          }
        );
      }
    }
  }
}

export default ThemeCssExtractWebpackPlugin;
