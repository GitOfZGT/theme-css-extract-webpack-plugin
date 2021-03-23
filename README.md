# @zougt/theme-css-extract-webpack-plugin

这个 webpack 插件主要用于使用了[@zougt/less-loader](https://github.com/GitOfZGT/less-loader)和[@zougt/sass-loader](https://github.com/GitOfZGT/sass-loader)的 webpack 工程将对应的`multipleScopeVars`主题 css 提取出独立的 css 文件

> 提取主题 css 文件的操作只在 webpackConfig.mode:"production"才生效，但`@zougt/theme-css-extract-webpack-plugin`另外一个功能是[`defaultScopeName`](#defaultScopeName)与`html-webpack-plugin`结合在 html 文件的 html 标签添加默认的 className，在开发模式需要

## 安装

```bash
# use npm
npm install -D @zougt/theme-css-extract-webpack-plugin
# use yarn
yarn add @zougt/theme-css-extract-webpack-plugin -D
```

**webpack.config.js**

```js
const ThemeCssExtractWebpackPlugin = require('@zougt/theme-css-extract-webpack-plugin');
const multipleScopeVars = [
  {
    scopeName: 'theme-default',
    path: path.resolve('src/theme/default-vars.less'),
  },
  {
    scopeName: 'theme-mauve',
    path: path.resolve('src/theme/mauve-vars.less'),
  },
];
module.exports = {
  plugins: [
    new ThemeCssExtractWebpackPlugin({
      multipleScopeVars,
      extract: process.env.NODE_ENV === 'production',
    }),
  ],
  module: {
    rules: [
      {
        test: /\.less$/i,
        // loader: "less-loader",
        loader: '@zougt/less-loader',
        options: {
          multipleScopeVars,
        },
      },
    ],
  },
};
```

## 示例

```less
//src/theme/default-vars.less
@primary-color: #0081ff;
```

```less
//src/theme/mauve-vars.less
@primary-color: #9c26b0;
```

```less
//src/components/Button/style.less
@import '../../theme/default-vars';
.un-btn {
  position: relative;
  display: inline-block;
  font-weight: 400;
  white-space: nowrap;
  text-align: center;
  border: 1px solid transparent;
  background-color: @primary-color;
  .anticon {
    line-height: 1;
  }
}
```

`@zougt/less-loader`编译之后

src/components/Button/style.css

```css
.un-btn {
  position: relative;
  display: inline-block;
  font-weight: 400;
  white-space: nowrap;
  text-align: center;
  border: 1px solid transparent;
}
.theme-default .un-btn {
  background-color: #0081ff;
}
.theme-mauve .un-btn {
  background-color: #9c26b0;
}
.un-btn .anticon {
  line-height: 1;
}
```

`@zougt/theme-css-extract-webpack-plugin`提取之后

src/components/Button/style.css

```css
.un-btn {
  position: relative;
  display: inline-block;
  font-weight: 400;
  white-space: nowrap;
  text-align: center;
  border: 1px solid transparent;
}
.un-btn .anticon {
  line-height: 1;
}
```

theme-default.css

```css
.theme-default .un-btn {
  background-color: #0081ff;
}
```

theme-mauve.css

```css
.theme-mauve .un-btn {
  background-color: #9c26b0;
}
```

## 在线切换主题 css 文件

```js
const toggleTheme = (scopeName = 'theme-default') => {
  let styleLink = document.getElementById('theme-link-tag');
  if (styleLink) {
    // 假如存在id为theme-link-tag 的link标签，直接修改其href
    styleLink.href = `/${scopeName}.css`;
    document.documentElement.className = scopeName;
  } else {
    // 不存在的话，则新建一个
    styleLink = document.createElement('link');
    styleLink.type = 'text/css';
    styleLink.rel = 'stylesheet';
    styleLink.id = 'theme-link-tag';
    styleLink.href = `/${scopeName}.css`;
    document.documentElement.className = scopeName;
    document.head.append(styleLink);
  }
};
```

## Options

|                          Name                           |     Type     |            Default             | Description                                                                                                                                                 |
| :-----------------------------------------------------: | :----------: | :----------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------- |
|      **[`multipleScopeVars`](#multipleScopeVars)**      | `{Object[]}` |              `[]`              | 与[@zougt/less-loader](https://github.com/GitOfZGT/less-loader)和[@zougt/sass-loader](https://github.com/GitOfZGT/sass-loader)的`multipleScopeVars`对应即可 |
|                **[`extract`](#extract)**                | `{Boolean}`  |             `true`             | 是否提取                                                                                                                                                    |
|              **[`outputDir`](#outputDir)**              |  `{String}`  |              `/`               | 提取的 css 文件存放目录                                                                                                                                     |
|     **[`removeCssScopeName`](#removeCssScopeName)**     | `{Boolean}`  |            `false`             | 是否将提取的 css 文件内移除对应的权重类名                                                                                                                   |
| **[`customThemeCssFileName`](#customThemeCssFileName)** | `{Function}` |             `null`             | 自定义 css 文件名的函数                                                                                                                                     |
|       **[`defaultScopeName`](#defaultScopeName)**       |  `{String}`  | multipleScopeVars[0].scopeName | 默认使用主题名称                                                                                                                                            |
|         **[`themeLinkTagId`](#themeLinkTagId)**         |  `{String}`  |        `theme-link-tag`        | 在 html 中使用主题 css 文件的 link 标签的 id                                                                                                                |
|     **[`themeLinkTagAppend`](#themeLinkTagAppend)**     | `{Boolean}`  |            `false`             | 是否在其他 css 之后插入主题 css 文件的 link 标签                                                                                                            |

### `multipleScopeVars`

Type: `Object[]`  
Default: `[]`

与[@zougt/less-loader](https://github.com/GitOfZGT/less-loader)和[@zougt/sass-loader](https://github.com/GitOfZGT/sass-loader)的`multipleScopeVars`对应

#### `multipleScopeVars[].scopeName`

Type: `String`

### `extract`

Type: `Boolean`  
Default: `true`

是否提取 ，提取主题 css 文件的操作只在 webpackConfig.mode:"production"才生效，但`@zougt/theme-css-extract-webpack-plugin`另外一个功能是[`defaultScopeName`](#defaultScopeName)与`html-webpack-plugin`结合在 html 文件的 html 标签添加默认的 className，在开发模式需要

通常这样使用:

```js
new ThemeCssExtractWebpackPlugin({
  multipleScopeVars,
  extract: process.env.NODE_ENV === 'production',
});
```

### `outputDir`

Type: `String`  
Default: `/`

提取的 css 文件存放目录

### `removeCssScopeName`

Type: `Boolean`  
Default: `false`

是否将提取的 css 文件内移除对应的权重类名

移除之后的 css 内容：

theme-default.css

```css
.un-btn {
  background-color: #0081ff;
}
```

theme-mauve.css

```css
.un-btn {
  background-color: #9c26b0;
}
```

### `customThemeCssFileName`

Type: `Function`  
Default: `null`

自定义 css 文件名的函数

```js
new ThemeCssExtractWebpackPlugin({
  multipleScopeVars,
  extract: process.env.NODE_ENV === 'production',
  customThemeCssFileName: (scopeName) => {
    return `${scopeName}-antd`;
  },
});
```

提取的 css 文件名：

```bash
├── /dist/
│ ├── theme-default-antd.css
│ └── theme-mauve-antd.css
```

### `defaultScopeName`

Type: `String`  
Default: multipleScopeVars[0].scopeName

默认使用主题名称，并且使用了`html-webpack-plugin`的钩子在 html 文件的 html 标签添加默认的 className（当`removeCssScopeName`为 false 有效），并且当`extract`为 true 时，会在 html 中插入使用默认主题 css 文件的 link 标签

```html
<!DOCTYPE html>
<html class="theme-default">
  <head>
    <meta charset="utf-8" />
    <title></title>
    <link href="/theme-default.css" rel="stylesheet" id="theme-link-tag" />
    <link href="/static/css/style.8445032bddc5.css" rel="stylesheet" />
  </head>
  <body></body>
</html>
```

### `themeLinkTagId`

Type: `String`  
Default: `theme-link-tag`

在 html 中使用主题 css 文件的 link 标签的 id

### `themeLinkTagAppend`

Type: `Boolean`  
Default: `false`

是否在其他 css 之后插入主题 css 文件的 link 标签
