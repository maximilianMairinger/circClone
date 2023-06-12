import { merge } from "webpack-merge"
import commonMod from "./rollup.node.common.config.mjs"


export default merge(commonMod, {
  input: 'app/src/circClone.ts',
  output: {
    file: 'app/dist/cjs/josmFsAdapter.js',
    format: 'cjs'
  },
})