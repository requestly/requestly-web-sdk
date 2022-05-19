import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import fs from 'fs';
import { version } from './package.json';

const OUTPUT_FOLDER = 'dist';
const banner = fs.readFileSync('./NOTICE.txt', { encoding: 'utf8' });

export default [
  {
    input: 'src/index.ts',
    output: {
      file: `${OUTPUT_FOLDER}/requestly-web-sdk.js`,
      format: 'iife',
      name: 'Requestly',
      banner,
    },
    plugins: [
      typescript(),
      replace({
        preventAssignment: true,
        __VERSION__: version,
      }),
    ],
  },
  {
    input: 'src/index.ts',
    output: {
      file: `${OUTPUT_FOLDER}/requestly-web-sdk.min.js`,
      format: 'iife',
      name: 'Requestly',
      banner,
    },
    plugins: [
      typescript(),
      terser({
        format: {
          comments: function (_, { type, value }) {
            if (type == 'comment2') {
              // multiline comment
              return /@preserve|@license|Copyright/i.test(value);
            }
          },
        },
      }),
      replace({
        preventAssignment: true,
        __VERSION__: version,
      }),
    ],
  },
  {
    input: 'src/index.ts',
    output: {
      dir: OUTPUT_FOLDER,
      banner,
    },
    plugins: [
      typescript({
        declaration: true,
        declarationDir: 'dist',
        rootDir: 'src',
      }),
      replace({
        preventAssignment: true,
        __VERSION__: version,
      }),
    ],
  },
];
