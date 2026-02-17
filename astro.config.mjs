import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://saotomryo.github.io/my_homepage_ryo',
  base: '/my_homepage_ryo',
  output: 'static',
  i18n: {
    defaultLocale: 'ja',
    locales: ['ja', 'en'],
    routing: {
      prefixDefaultLocale: true
    }
  }
});
