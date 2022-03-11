# @zougt/theme-css-extract-webpack-plugin

这个 webpack 插件与[@zougt/some-loader-utils](https://github.com/GitOfZGT/some-loader-utils)结合轻松实现在线动态主题，使用文档直接查看[@zougt/some-loader-utils](https://github.com/GitOfZGT/some-loader-utils)

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
|         **[`customLinkHref`](#customLinkHref)**         | `{Function}` |             `null`             | 预设主题模式，抽取 css 后，自定义默认添加到 html 的 link 的 href                                                                                            |

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

[多主题编译示例](#多主题编译示例)中移除之后的 css 内容：

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
Default: `""`

`defaultScopeName`为空时会默认取自`multipleScopeVars[0].scopeName`

默认使用主题的 scopeName，使用了`html-webpack-plugin`的钩子在 html 文件的 html 标签添加默认的 className（当`removeCssScopeName`为 false 有效），并且当`extract`为 true 和存在`themeLinkTagId`时，会在 html 中插入使用默认主题 css 文件的 link 标签

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

当`themeLinkTagId`为 false 时即不会生成对应的 link 标签

### `themeLinkTagAppend`

Type: `Boolean`  
Default: `false`

是否在其他 css 之后插入主题 css 文件的 link 标签
