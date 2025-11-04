// source.config.ts
import {
  defineConfig,
  defineDocs,
  frontmatterSchema
} from "fumadocs-mdx/config";
import { z } from "zod";
import rehypePrettyCode from "rehype-pretty-code";
var source_config_default = defineConfig({
  mdxOptions: {
    rehypePlugins: [
      [
        rehypePrettyCode,
        {
          theme: {
            dark: "github-dark",
            light: "github-light"
          },
          keepBackground: false
        }
      ]
    ]
  }
});
var docs = defineDocs({
  dir: "content/docs",
  docs: {
    schema: frontmatterSchema.extend({
      links: z.object({
        doc: z.string().optional(),
        api: z.string().optional()
      }).optional(),
      toc: z.boolean().optional()
    })
  }
});
export {
  source_config_default as default,
  docs
};
