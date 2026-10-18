import type { Config } from 'tailwindcss';
import rootConfig from '../../tailwind.config';

const config: Config = {
  ...rootConfig,
  content: [
    './src/**/*.ts',
    './src/**/*.tsx',
    '../../packages/ui/src/**/*.ts',
    '../../packages/ui/src/**/*.tsx',
  ],
};

export default config;
