// import fs from 'fs';

import { getPluginParams } from '@zougt/some-loader-utils';

import pack from '../../package.json';

function HotUpdateLoader(content) {
  const callback = this.async();
  const packRoot = require
    .resolve(pack.name, {
      paths: [this.context || process.cwd()],
    })
    .replace(/[\\/]cjs\.js$/, '')
    .replace(/\\/g, '/');
  const param = getPluginParams();
  const dep =
    param.customThemeOutputPath ||
    `${packRoot}/hot-loader/setCustomThemeContent.js`;
  if (this.mode === 'development' && this.resourcePath === `${packRoot}/setCustomTheme.js`) {
    // 在开发模式下
    this._compiler.hasZougtUpdateLoader = true;
    this.addDependency(dep);
    this.addDependency(`${packRoot}/setCustomTheme.js`);
    callback(
      null,
      `import setCustomTheme from '${dep}';
      export default setCustomTheme;
      import Color from 'color';
      if (module.hot) {
        module.hot.accept('${dep}', function() {
          const moduleId = require.resolve('@setCustomTheme');
          if (require.cache[moduleId]) {
            require.cache[moduleId].hot.invalidate();
          }
          setCustomTheme({Color});
        });
      }
      `
    );
    return;
  }
  callback(null, content);
}

export default HotUpdateLoader;
