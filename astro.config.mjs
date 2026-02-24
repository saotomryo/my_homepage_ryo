import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://ryosailabo.com',
  output: 'static',
  i18n: {
    defaultLocale: 'ja',
    locales: ['ja', 'en'],
    routing: {
      prefixDefaultLocale: true
    }
  }
});
