/* eslint-disable global-require */
/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */
/* eslint-env browser */

export function addClassNameToHtmlTag({ scopeName, multipleScopeVars }) {
  let currentClassName = document.documentElement.className;
  if (new RegExp(`\\s*${scopeName}\\s*`).test(currentClassName)) {
    return;
  }
  multipleScopeVars.forEach((item) => {
    currentClassName = currentClassName.replace(
      new RegExp(`\\s*${item.scopeName}\\s*`, 'g'),
      ` ${scopeName} `
    );
  });
  document.documentElement.className = currentClassName.replace(
    /(^\s+|\s+$)/g,
    ''
  );
}
function createThemeLinkTag({ id, href }) {
  // 不存在的话，则新建一个
  const styleLink = document.createElement('link');
  styleLink.rel = 'stylesheet';
  styleLink.href = href;
  styleLink.id = id;
  return styleLink;
}
/**
 *
 * @param {object} opts
 * @param {string} opts.scopeName
 * @param {array} opts.multipleScopeVars
 * @param {boolean} opts.extract
 * @param {boolean} opts.removeCssScopeName
 * @param {string} [opts.themeLinkTagId]
 * @param {string} [opts.themeLinkTagInjectTo]
 * @param {string} [opts.publicPath]
 * @param {string} [opts.outputDir]
 * @param {object} [opts.loading]
 * @returns
 */
export function toggleTheme(opts) {
  const options = {
    multipleScopeVars: [],
    scopeName: 'theme-default',
    extract: true,
    customLinkHref: (href) => href,
    themeLinkTagId: 'theme-link-tag',
    // "head" || "body"
    themeLinkTagInjectTo: 'head',
    publicPath: '',
    outputDir: '',
    removeCssScopeName: false,
    loading: {
      show: () => {},
      hide: () => {},
    },
    ...opts,
  };

  if (!options.extract) {
    addClassNameToHtmlTag(options);
    return;
  }
  const linkId = options.themeLinkTagId;
  let styleLink = document.getElementById(linkId);
  const href = options.customLinkHref(
    `/${options.publicPath || ''}/${options.outputDir || ''}/${
      options.scopeName
    }.css`.replace(/\/+(?=\/)/g, '')
  );
  if (styleLink) {
    // 假如存在id为theme-link-tag 的link标签，创建一个新的添加上去加载完成后再移除旧的
    styleLink.id = `${linkId}_old`;
    const newLink = createThemeLinkTag({ id: linkId, href });
    if (styleLink.nextSibling) {
      styleLink.parentNode.insertBefore(newLink, styleLink.nextSibling);
    } else {
      styleLink.parentNode.appendChild(newLink);
    }
    options.loading.show();
    newLink.onload = () => {
      styleLink.parentNode.removeChild(styleLink);
      styleLink = null;

      // 注：如果是removeCssScopeName:true移除了主题文件的权重类名，就可以不用修改className 操作
      if (!options.removeCssScopeName) {
        addClassNameToHtmlTag(options);
      }
      options.loading.hide();
    };
    return;
  }

  // 不存在的话，则新建一个
  styleLink = createThemeLinkTag({ id: linkId, href });
  // 注：如果是removeCssScopeName:true移除了主题文件的权重类名，就可以不用修改className 操作
  if (!options.removeCssScopeName) {
    addClassNameToHtmlTag(options);
  }
  document[options.themeLinkTagInjectTo].appendChild(styleLink);
}

export default toggleTheme;
