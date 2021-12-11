/* eslint-disable no-var */
import pack from '../../package.json';

function HotUpdateLoader(content) {
  const callback = this.async();
  const packRoot = require
    .resolve(pack.name, {
      paths: [this.context || process.cwd()],
    })
    .replace(/[\\/]cjs\.js$/, '')
    .replace(/\\/g, '/');
  if (this.mode==='development'&&this.resourcePath === `${packRoot}/setCustomTheme.js`) {
    // 在开发模式下
    this._compiler.hasZougtUpdateLoader = true;
    callback(
      null,
      `export {setCustomTheme as default} from '@zougt/theme-css-extract-webpack-plugin/dist/hot-loader/setCustomThemeContent.js';
      if (module.hot) {
        module.hot.accept('@zougt/theme-css-extract-webpack-plugin/dist/hot-loader/setCustomThemeContent.js', function() {
          setCustomTheme({});
        });
      }
      `
    );
    return;
  }
  callback(null, content);
}

export default HotUpdateLoader;
