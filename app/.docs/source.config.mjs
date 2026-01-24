// source.config.ts
import {
  defineConfig,
  defineDocs,
  frontmatterSchema
} from "@hanzo/docs-mdx/config";
import rehypePrettyCode from "rehype-pretty-code";
import { z } from "zod";
var source_config_default = defineConfig({
  mdxOptions: {
    rehypePlugins: [
      [
        rehypePrettyCode,
        {
          theme: {
            dark: "github-dark",
            light: "github-light-default"
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
