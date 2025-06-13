import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import mpa from 'vite-plugin-multi-pages';
import path from 'path';
import moveAssets from './plugins/move-assets';
import UnoCSS from 'unocss/vite'

function getRootPath() {
  return path.resolve(process.cwd());
}

function getSrcPath(srcName = 'src') {
  const rootPath = getRootPath();

  return `${rootPath}/${srcName}`;
}

// https://vite.dev/config/
export default defineConfig({
  base: '',
  resolve: {
    alias: {
      '@': getSrcPath()
    }
  },
  plugins: [
    UnoCSS(),
    vue(),
    mpa({
      scanDir: 'src/pages',
      defaultOpenPage: 'index'
    }),
    moveAssets()
  ],
  build: {
    sourcemap: true,
    rollupOptions: {
      external: ['@nut-tree/nut-js', 'rubick-active-win', 'request', 'request-promise', 'uuid', 'execa', 'child_process', 'os', 'electron']
    }
  }
});
