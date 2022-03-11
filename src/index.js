/* eslint-disable no-param-reassign */
import { validate } from 'schema-utils';

import fs from 'fs-extra';

import {
  createPulignParamsFile,
  removeThemeFiles,
} from '@zougt/some-loader-utils';

import schema from './plugin-options.json';

import { arbitraryModeApply } from './apply/arbitraryModeApply';

import { presetModeApply } from './apply/presetModeApply';

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

        // 以下是任意主题模式的参数 arbitraryMode:true 有效
        arbitraryMode: false,
        // 默认主题色，必填
        defaultPrimaryColor: '',
        // style标签的id
        styleTagId: 'custom-theme-tagid',
        // boolean || "head" || "body"
        InjectDefaultStyleTagToHtml: true,
        includeStyleWithColors: [],
        hueDiffControls: { low: 0, high: 0 },
        customThemeOutputPath: '',
        customLinkHref: (href) => href
      },
      options
    );
    if (this.userOptions.customThemeOutputPath&&!fs.existsSync(this.userOptions.customThemeOutputPath)) {
      fs.outputFileSync(
        this.userOptions.customThemeOutputPath,
        `function setCustomTheme() {
        return null;
      }\nexport default setCustomTheme;`
      );
    }
    removeThemeFiles();
    createPulignParamsFile({
      extract: this.userOptions.extract,
      includeStyleWithColors: this.userOptions.includeStyleWithColors,
      arbitraryMode: this.userOptions.arbitraryMode,
      customThemeOutputPath: this.userOptions.customThemeOutputPath,
    });
  }
  apply(compiler) {
    if (this.userOptions.arbitraryMode) {
      arbitraryModeApply.call(this, compiler);
      return;
    }
    presetModeApply.call(this, compiler);
  }
}

export default ThemeCssExtractWebpackPlugin;
