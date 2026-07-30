import { libTypes } from './lib.type';

/**
 * 使用 fetch 获取类型定义文件 并添加到 monaco 中
 */
export const addExtraLibFromFetch = async (monaco: typeof import('monaco-editor'), libName: string) => {
  const response = await fetch(`https://cdn.jsdelivr.net/npm/@types/${libName}/index.d.ts`);
  const content = await response.text();

  monaco.typescript.javascriptDefaults.addExtraLib(
    content,
    `node_modules/@types/${libName}/index.d.ts`
  );
}

/**
 * 添加第三方库类型定义
 */
export const addExtraLibs = async (monaco: typeof import('monaco-editor')) => {
  for (const [key, value] of Object.entries(libTypes)) {
    monaco.typescript.javascriptDefaults.addExtraLib(
      value,
      `node_modules/@types/${key}/index.d.ts`
    )
  }
}