import { existsSync, promises as fs } from "fs"
import path from "path"
import { RegistryFontItem, registryResolvedItemsTreeSchema } from "@/src/schema"
import { Config } from "@/src/utils/get-config"
import { getProjectInfo, ProjectInfo } from "@/src/utils/get-project-info"
<<<<<<< HEAD
import { highlighter } from "@/src/utils/highlighter"
=======
>>>>>>> shadcn/main
import { spinner } from "@/src/utils/spinner"
import {
  CallExpression,
  Project,
  ScriptKind,
  SyntaxKind,
  VariableDeclarationKind,
} from "ts-morph"
import z from "zod"

<<<<<<< HEAD
=======
const ROOT_FONT_VARIABLES = new Set([
  "--font-sans",
  "--font-serif",
  "--font-mono",
])

>>>>>>> shadcn/main
export async function massageTreeForFonts(
  tree: z.infer<typeof registryResolvedItemsTreeSchema>,
  config: Config
) {
  if (!tree.fonts?.length) {
    return tree
  }

  const projectInfo = await getProjectInfo(config.resolvedPaths.cwd)

  if (!projectInfo) {
    return tree
  }

<<<<<<< HEAD
  const [fontSans] = tree.fonts
  tree.cssVars ??= {}
  tree.cssVars.theme ??= {}

  if (
    projectInfo.framework.name === "next-app" ||
    projectInfo.framework.name === "next-pages"
  ) {
    tree.cssVars.theme[fontSans.font.variable] =
      `var(${fontSans.font.variable})`
    return tree
  }

  // Other frameworks will use fontsource for now.
  const fontName = fontSans.name.replace("font-", "")
  const fontSourceDependency = `@fontsource-variable/${fontName}`
  tree.dependencies ??= []
  tree.dependencies.push(fontSourceDependency)
  tree.css ??= {}
  tree.css[`@import "${fontSourceDependency}"`] = {}
  tree.css["@layer base"] ??= {}
  tree.css["@layer base"].html = {
    "@apply font-sans": {},
  }
  tree.css["@layer base"].body = {
    "@apply font-sans bg-background text-foreground": {},
  }
  tree.cssVars.theme[fontSans.font.variable] = fontSans.font.family

  //   tree.docs += `## Fonts
  // The ${highlighter.info(
  //     fontSans.title ?? ""
  //   )} font has been added to your project.

  // If you have existing font-family declarations, you may need to update them to use the new ${highlighter.info(
  //     fontSans.font.variable
  //   )} variable.

  // @theme inline {
  //   ${fontSans.font.variable}: ${fontSans.font.family};
  // }
  //   `
=======
  tree.cssVars ??= {}
  tree.cssVars.theme ??= {}

  const isNext =
    projectInfo.framework.name === "next-app" ||
    projectInfo.framework.name === "next-pages"

  for (const font of tree.fonts) {
    if (isNext) {
      // Next.js sets the CSS variable via next/font on the <html> element.
      // The font utility class is added to <html> className in updateHtmlClassName.
      // We update the theme CSS variable to reference itself so it resolves
      // to the value injected by next/font on <html>.
      tree.cssVars.theme[font.font.variable] = `var(${font.font.variable})`
    } else {
      // Other frameworks will use fontsource for now.
      const fontName = font.name.replace("font-", "")
      const fontSourceDependency =
        font.font.dependency ?? `@fontsource-variable/${fontName}`
      tree.dependencies ??= []
      tree.dependencies.push(fontSourceDependency)
      tree.css ??= {}
      tree.css[`@import "${fontSourceDependency}"`] = {}
      tree.cssVars.theme[font.font.variable] = font.font.family
    }
  }

  // Apply font utility classes grouped by selector.
  if (tree.fonts.length > 0) {
    const groups = new Map<string, string[]>()

    for (const font of tree.fonts) {
      const selector =
        font.font.selector ?? getDefaultFontSelector(font.font.variable)
      if (!selector) {
        continue
      }

      const cls = font.font.variable.replace("--", "")
      if (!groups.has(selector)) {
        groups.set(selector, [])
      }
      groups.get(selector)!.push(cls)
    }

    tree.css ??= {}
    tree.css["@layer base"] ??= {}

    for (const [selector, classes] of Array.from(groups.entries())) {
      const fontClasses = classes.join(" ")
      tree.css["@layer base"][selector] ??= {}
      // Find existing @apply key and merge, or create new.
      const existingApplyKey = Object.keys(
        tree.css["@layer base"][selector]
      ).find((key) => key.startsWith("@apply "))
      if (existingApplyKey) {
        delete tree.css["@layer base"][selector][existingApplyKey]
        tree.css["@layer base"][selector][
          `${existingApplyKey} ${fontClasses}`
        ] = {}
      } else {
        tree.css["@layer base"][selector][`@apply ${fontClasses}`] = {}
      }
    }
  }
>>>>>>> shadcn/main

  return tree
}

export async function updateFonts(
  fonts: RegistryFontItem[] | undefined,
  config: Config,
  options: {
    silent?: boolean
  }
) {
  if (!fonts?.length) {
    return
  }

  const projectInfo = await getProjectInfo(config.resolvedPaths.cwd)

  if (!projectInfo) {
    return
  }

  if (
    projectInfo.framework.name !== "next-app" &&
    projectInfo.framework.name !== "next-pages"
  ) {
    return
  }

  const fontsSpinner = spinner("Updating fonts.", {
    silent: options.silent,
  })?.start()

  try {
    await updateNextFonts(fonts, config, projectInfo)
    fontsSpinner?.succeed("Updating fonts.")
  } catch (error) {
    fontsSpinner?.fail(`Failed to update fonts.`)
    throw error
  }
}

async function updateNextFonts(
  fonts: RegistryFontItem[],
  config: Config,
  projectInfo: ProjectInfo
) {
  // Find layout file.
  const layoutPath = await findLayoutFile(config, projectInfo)

  if (!layoutPath) {
    return
  }

  const layoutContent = await fs.readFile(layoutPath, "utf-8")
  const updatedContent = await transformLayoutFonts(
    layoutContent,
    fonts,
    config
  )

  if (updatedContent !== layoutContent) {
    await fs.writeFile(layoutPath, updatedContent, "utf-8")
  }
}

<<<<<<< HEAD
async function findLayoutFile(
=======
export async function findLayoutFile(
>>>>>>> shadcn/main
  config: Config,
  projectInfo: ProjectInfo
): Promise<string | null> {
  const cwd = config.resolvedPaths.cwd
  const isSrcDir = projectInfo.isSrcDir
  const isTsx = projectInfo.isTsx
  const ext = isTsx ? "tsx" : "jsx"

  const possiblePaths = isSrcDir
    ? [`src/app/layout.${ext}`, `app/layout.${ext}`]
    : [`app/layout.${ext}`]

  for (const relativePath of possiblePaths) {
    const fullPath = path.join(cwd, relativePath)
    if (existsSync(fullPath)) {
      return fullPath
    }
  }

  return null
}

export async function transformLayoutFonts(
  input: string,
  fonts: RegistryFontItem[],
<<<<<<< HEAD
  _config: Config
=======
  config: Config
>>>>>>> shadcn/main
) {
  const project = new Project({
    compilerOptions: {},
  })

  const sourceFile = project.createSourceFile("layout.tsx", input, {
    scriptKind: ScriptKind.TSX,
  })

  // Only process Google fonts for now.
  const googleFonts = fonts.filter((f) => f.font.provider === "google")

<<<<<<< HEAD
  // Track which font variables we're adding.
  const fontVariableNames: string[] = []
=======
  // Track which font variables and utility classes we're adding.
  const fontVariableNames: string[] = []
  const fontUtilityClasses: string[] = []
>>>>>>> shadcn/main

  // Process Google fonts.
  for (const font of googleFonts) {
    const importName = font.font.import
    if (!importName) {
      continue
    }

    // Check if import already exists.
    const existingImport = sourceFile.getImportDeclaration((decl) => {
      const moduleSpecifier = decl.getModuleSpecifierValue()
      return moduleSpecifier === "next/font/google"
    })
<<<<<<< HEAD

    if (existingImport) {
      // Check if this specific font is already imported.
      const namedImports = existingImport.getNamedImports()
      const hasImport = namedImports.some((imp) => imp.getName() === importName)

      if (hasImport) {
        // Font is already imported - skip this font entirely.
        // Assume the user already has it set up correctly.
        continue
      }

      existingImport.addNamedImport(importName)
=======
    let hasExistingImport = false

    if (existingImport) {
      const namedImports = existingImport.getNamedImports()
      hasExistingImport = namedImports.some(
        (imp) => imp.getName() === importName
      )
      if (!hasExistingImport) {
        existingImport.addNamedImport(importName)
      }
>>>>>>> shadcn/main
    } else {
      // Add new import.
      sourceFile.addImportDeclaration({
        moduleSpecifier: "next/font/google",
        namedImports: [importName],
      })
    }

<<<<<<< HEAD
    // Generate a variable name from the import (e.g., "Inter" -> "inter", "Geist_Mono" -> "geistMono").
    const varName = toCamelCase(importName)
=======
    const varName = getFontVariableName(importName, font.font.variable)
>>>>>>> shadcn/main

    // Build font options.
    const fontOptions = buildFontOptions(font)

    // Check if variable declaration already exists with same variable CSS property.
    const existingVarDecl = findFontVariableDeclaration(
      sourceFile,
      font.font.variable
    )
<<<<<<< HEAD
=======
    let resolvedVarName = varName

    if (
      hasExistingImport &&
      !existingVarDecl &&
      isRootFontVariable(font.font.variable) &&
      !hasHeadingFontDeclaration(sourceFile, importName)
    ) {
      continue
    }
>>>>>>> shadcn/main

    if (existingVarDecl) {
      // Replace the initializer of the existing declaration.
      existingVarDecl.setInitializer(`${importName}(${fontOptions})`)
      // Update the variable name if different.
      if (existingVarDecl.getName() !== varName) {
        existingVarDecl.rename(varName)
      }
<<<<<<< HEAD
=======
      resolvedVarName = varName
>>>>>>> shadcn/main
    } else {
      // Find the last import or existing font declaration to insert after.
      const insertPosition = findInsertPosition(sourceFile)

      // Add variable declaration.
      const statement = sourceFile.insertVariableStatement(insertPosition, {
        declarationKind: VariableDeclarationKind.Const,
        declarations: [
          {
            name: varName,
            initializer: `${importName}(${fontOptions})`,
          },
        ],
      })

      // Add a blank line after the declaration.
      statement.appendWhitespace("\n")
    }

<<<<<<< HEAD
    fontVariableNames.push(varName)
  }

  // Update html className to include font variables.
  if (fontVariableNames.length > 0) {
    updateHtmlClassName(sourceFile, fontVariableNames)
=======
    fontVariableNames.push(resolvedVarName)
    if (shouldApplyFontUtilityToHtml(font)) {
      fontUtilityClasses.push(font.font.variable.replace("--", ""))
    }
  }

  // Only keep one font-family class (font-sans, font-serif, font-mono) on <html>.
  // The last one in the array takes priority as it's the one being added/changed.
  const fontFamilyClasses = new Set(["font-sans", "font-serif", "font-mono"])
  const lastFontFamilyClass = [...fontUtilityClasses]
    .reverse()
    .find((cls) => fontFamilyClasses.has(cls))
  const filteredUtilityClasses = fontUtilityClasses.filter(
    (cls) => !fontFamilyClasses.has(cls)
  )
  if (lastFontFamilyClass) {
    filteredUtilityClasses.unshift(lastFontFamilyClass)
  }

  // Update html className to include font variables and utility classes.
  if (fontVariableNames.length > 0) {
    updateHtmlClassName(
      sourceFile,
      fontVariableNames,
      filteredUtilityClasses,
      config
    )
>>>>>>> shadcn/main
  }

  return sourceFile.getFullText()
}

function buildFontOptions(font: RegistryFontItem) {
  const options: Record<string, unknown> = {}

  if (font.font.subsets?.length) {
    options.subsets = font.font.subsets
  }

  if (font.font.weight?.length) {
    options.weight = font.font.weight
  }

  options.variable = font.font.variable

  return JSON.stringify(options)
    .replace(/"([^"]+)":/g, "$1:") // Remove quotes from keys.
    .replace(/"/g, "'") // Use single quotes for strings.
}

<<<<<<< HEAD
=======
function isRootFontVariable(variable: string) {
  return ROOT_FONT_VARIABLES.has(variable)
}

function getDefaultFontSelector(variable: string) {
  return isRootFontVariable(variable) ? "html" : null
}

function shouldApplyFontUtilityToHtml(font: RegistryFontItem) {
  return !font.font.selector && isRootFontVariable(font.font.variable)
}

function getFontVariableName(importName: string, variable: string) {
  const baseName = toCamelCase(importName)

  if (isRootFontVariable(variable)) {
    return baseName
  }

  return `${baseName}${toPascalCase(variable.replace(/^--font-/, ""))}`
}

>>>>>>> shadcn/main
function toCamelCase(str: string) {
  // Convert "Geist_Mono" -> "geistMono", "Inter" -> "inter".
  return str
    .split("_")
    .map((part, index) =>
      index === 0
        ? part.toLowerCase()
        : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    )
    .join("")
}

<<<<<<< HEAD
=======
function toPascalCase(str: string) {
  return str
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")
}

>>>>>>> shadcn/main
function findFontVariableDeclaration(
  sourceFile: ReturnType<Project["createSourceFile"]>,
  variable: string
) {
  // Find variable declarations that call a font function with matching variable.
  const variableStatements = sourceFile.getVariableStatements()

  for (const statement of variableStatements) {
    for (const declaration of statement.getDeclarations()) {
      const initializer = declaration.getInitializer()
      if (!initializer) continue

      // Check if it's a call expression.
      if (initializer.getKind() !== SyntaxKind.CallExpression) continue

      const callExpr = initializer as CallExpression

      // Get the arguments.
      const args = callExpr.getArguments()
      if (args.length === 0) continue

      // Check if any argument contains our variable.
      const argText = args[0].getText()
      if (argText.includes(`variable:`) && argText.includes(variable)) {
        return declaration
      }
    }
  }

  return null
}

<<<<<<< HEAD
=======
function hasHeadingFontDeclaration(
  sourceFile: ReturnType<Project["createSourceFile"]>,
  importName: string
) {
  const variableStatements = sourceFile.getVariableStatements()

  for (const statement of variableStatements) {
    for (const declaration of statement.getDeclarations()) {
      const initializer = declaration.getInitializer()
      if (!initializer) continue

      if (initializer.getKind() !== SyntaxKind.CallExpression) continue

      const callExpr = initializer as CallExpression
      if (callExpr.getExpression().getText() !== importName) continue

      const args = callExpr.getArguments()
      if (!args.length) continue

      const argText = args[0].getText()
      if (argText.includes(`variable:`) && argText.includes("--font-heading")) {
        return true
      }
    }
  }

  return false
}

>>>>>>> shadcn/main
function findInsertPosition(
  sourceFile: ReturnType<Project["createSourceFile"]>
) {
  const imports = sourceFile.getImportDeclarations()
  if (imports.length > 0) {
    const lastImport = imports[imports.length - 1]
    return lastImport.getChildIndex() + 1
  }
  return 0
}

function updateHtmlClassName(
  sourceFile: ReturnType<Project["createSourceFile"]>,
<<<<<<< HEAD
  fontVariableNames: string[]
=======
  fontVariableNames: string[],
  fontUtilityClasses: string[],
  config: Config
>>>>>>> shadcn/main
) {
  // Find the <html> JSX element.
  const jsxElements = sourceFile.getDescendantsOfKind(
    SyntaxKind.JsxOpeningElement
  )

  for (const element of jsxElements) {
    const tagName = element.getTagNameNode().getText()
    if (tagName !== "html") continue

<<<<<<< HEAD
    const classNameAttr = element.getAttribute("className")
    if (!classNameAttr) {
      // Add className attribute with font variables.
      const variableExpressions = fontVariableNames
        .map((name) => `${name}.variable`)
        .join(", ")

      if (fontVariableNames.length === 1) {
        element.addAttribute({
          name: "className",
          initializer: `{${variableExpressions}}`,
        })
      } else {
        // Need to use cn() for multiple fonts.
        ensureCnImport(sourceFile)
        element.addAttribute({
          name: "className",
          initializer: `{cn(${variableExpressions})}`,
        })
      }
=======
    // Build the new expressions: utility classes as strings, then .variable expressions.
    const newUtilityClasses = fontUtilityClasses.map((cls) => `"${cls}"`)
    const newVarExpressions = fontVariableNames.map(
      (name) => `${name}.variable`
    )
    const allNewArgs = [...newUtilityClasses, ...newVarExpressions]

    const classNameAttr = element.getAttribute("className")
    if (!classNameAttr) {
      // Add className attribute with font utility classes and variables.
      ensureCnImport(sourceFile, config)
      element.addAttribute({
        name: "className",
        initializer: `{cn(${allNewArgs.join(", ")})}`,
      })
>>>>>>> shadcn/main
      return
    }

    // Handle existing className.
    if (classNameAttr.getKind() !== SyntaxKind.JsxAttribute) {
      return
    }

    const jsxAttr = classNameAttr.asKindOrThrow(SyntaxKind.JsxAttribute)
    const initializer = jsxAttr.getInitializer()

    if (!initializer) return

<<<<<<< HEAD
    // Build the new variable expressions.
    const newVarExpressions = fontVariableNames.map(
      (name) => `${name}.variable`
    )

    if (initializer.getKind() === SyntaxKind.StringLiteral) {
      // className="some-class" -> className={cn("some-class", font.variable)}
      const currentValue = initializer.getText().slice(1, -1) // Remove quotes.
      ensureCnImport(sourceFile)
      jsxAttr.setInitializer(
        `{cn("${currentValue}", ${newVarExpressions.join(", ")})}`
=======
    if (initializer.getKind() === SyntaxKind.StringLiteral) {
      // className="some-class" -> className={cn("some-class", "font-serif", font.variable)}
      const currentValue = initializer.getText().slice(1, -1) // Remove quotes.
      ensureCnImport(sourceFile, config)
      jsxAttr.setInitializer(
        `{cn("${currentValue}", ${allNewArgs.join(", ")})}`
>>>>>>> shadcn/main
      )
    } else if (initializer.getKind() === SyntaxKind.JsxExpression) {
      // className={...} - need to analyze the expression.
      const jsxExpr = initializer.asKindOrThrow(SyntaxKind.JsxExpression)
      const expr = jsxExpr.getExpression()
      if (!expr) return

      const exprText = expr.getText()

      // Check if it's already using cn().
      if (exprText.startsWith("cn(")) {
<<<<<<< HEAD
        // Check if cn() already has exactly our font variables.
        const hasAllFontVars = newVarExpressions.every((v) =>
          exprText.includes(v)
        )
        if (hasAllFontVars) {
          // Already has our font variables, skip.
          continue
        }

        // Remove existing font variables and add new ones.
        const cleanedExpr = removeFontVariablesFromCn(exprText)
        const newExpr = insertFontVariablesIntoCn(
          cleanedExpr,
          newVarExpressions
        )
=======
        // Check if cn() already has all our font variables and utility classes.
        const hasAllFontVars = newVarExpressions.every((v) =>
          exprText.includes(v)
        )
        const hasAllUtilityClasses = fontUtilityClasses.every((cls) =>
          exprText.includes(`"${cls}"`)
        )
        // Check there are no stale font-family classes (e.g., "font-sans" when we want "font-serif").
        const staleFontFamilyClasses = ["font-sans", "font-serif", "font-mono"]
          .filter((cls) => !fontUtilityClasses.includes(cls))
          .some((cls) => exprText.includes(`"${cls}"`))
        if (hasAllFontVars && hasAllUtilityClasses && !staleFontFamilyClasses) {
          // Already has everything, skip.
          continue
        }

        // Remove existing font variables and font-family classes, then add new ones.
        let cleanedExpr = removeFontVariablesFromCn(exprText, newVarExpressions)
        cleanedExpr = removeFontFamilyClassesFromCn(cleanedExpr)
        const newExpr = insertFontVariablesIntoCn(cleanedExpr, allNewArgs)
>>>>>>> shadcn/main
        jsxExpr.replaceWithText(`{${newExpr}}`)
      } else if (/^\w+\.variable$/.test(exprText)) {
        // Single font variable like {inter.variable}.
        // Check if it's already one of our font variables.
<<<<<<< HEAD
        if (newVarExpressions.includes(exprText)) {
          // Already using our font variable, skip.
          continue
        }
        // Replace with our font variables.
        if (newVarExpressions.length === 1) {
          jsxExpr.replaceWithText(`{${newVarExpressions[0]}}`)
        } else {
          ensureCnImport(sourceFile)
          jsxExpr.replaceWithText(`{cn(${newVarExpressions.join(", ")})}`)
        }
      } else if (exprText.startsWith("`") && exprText.endsWith("`")) {
        // Template literal - parse and convert to cn() arguments.
        const cnArgs = parseTemplateLiteralToCnArgs(exprText)
        ensureCnImport(sourceFile)
        jsxExpr.replaceWithText(
          `{cn(${[...cnArgs, ...newVarExpressions].join(", ")})}`
        )
      } else {
        // Some other expression (variable, etc.), wrap with cn().
        ensureCnImport(sourceFile)
        jsxExpr.replaceWithText(
          `{cn(${exprText}, ${newVarExpressions.join(", ")})}`
        )
=======
        if (
          newVarExpressions.includes(exprText) &&
          fontUtilityClasses.length === 0
        ) {
          continue
        }
        // Replace with cn() including utility classes and font variables.
        ensureCnImport(sourceFile, config)
        const existingName = exprText.split(".")[0] ?? ""
        const shouldPreserveExisting =
          existingName.toLowerCase().includes("heading") ||
          fontUtilityClasses.length === 0
        jsxExpr.replaceWithText(
          shouldPreserveExisting
            ? `{cn(${exprText}, ${allNewArgs.join(", ")})}`
            : `{cn(${allNewArgs.join(", ")})}`
        )
      } else if (exprText.startsWith("`") && exprText.endsWith("`")) {
        // Template literal - parse and convert to cn() arguments.
        const cnArgs = parseTemplateLiteralToCnArgs(exprText)
        ensureCnImport(sourceFile, config)
        // Deduplicate cnArgs against allNewArgs.
        const allNewArgsSet = new Set(allNewArgs)
        const fontFamilyLiterals = new Set(
          ["font-sans", "font-serif", "font-mono"].map((c) => `"${c}"`)
        )
        const cleanedCnArgs = cnArgs.filter(
          (arg) => !allNewArgsSet.has(arg) && !fontFamilyLiterals.has(arg)
        )
        jsxExpr.replaceWithText(
          `{cn(${[...cleanedCnArgs, ...allNewArgs].join(", ")})}`
        )
      } else {
        // Some other expression (variable, etc.), wrap with cn().
        ensureCnImport(sourceFile, config)
        jsxExpr.replaceWithText(`{cn(${exprText}, ${allNewArgs.join(", ")})}`)
>>>>>>> shadcn/main
      }
    }
  }
}

<<<<<<< HEAD
function ensureCnImport(sourceFile: ReturnType<Project["createSourceFile"]>) {
=======
function ensureCnImport(
  sourceFile: ReturnType<Project["createSourceFile"]>,
  config: Config
) {
>>>>>>> shadcn/main
  const existingImport = sourceFile.getImportDeclaration((decl) => {
    const namedImports = decl.getNamedImports()
    return namedImports.some((imp) => imp.getName() === "cn")
  })

  if (!existingImport) {
    // Try to find the lib/utils import pattern.
    const utilsImport = sourceFile.getImportDeclaration((decl) => {
      const moduleSpecifier = decl.getModuleSpecifierValue()
      return moduleSpecifier.includes("/lib/utils")
    })

    if (utilsImport) {
      const namedImports = utilsImport.getNamedImports()
      if (!namedImports.some((imp) => imp.getName() === "cn")) {
        utilsImport.addNamedImport("cn")
      }
    } else {
      // Add a new import for cn.
      sourceFile.addImportDeclaration({
<<<<<<< HEAD
        moduleSpecifier: "@/lib/utils",
=======
        moduleSpecifier: config.aliases.utils,
>>>>>>> shadcn/main
        namedImports: ["cn"],
      })
    }
  }
}

function parseTemplateLiteralToCnArgs(templateLiteral: string) {
  // Parse template literal like `${geistSans.variable} ${geistMono.variable} antialiased`
  // into cn() arguments with static strings first, then variables:
  // ["antialiased", geistSans.variable, geistMono.variable]
  const staticArgs: string[] = []
  const variableArgs: string[] = []

  // Remove the backticks.
  const content = templateLiteral.slice(1, -1)

  // Split by ${...} expressions and static parts.
  const parts = content.split(/(\$\{[^}]+\})/)

  for (const part of parts) {
    if (!part) continue

    if (part.startsWith("${") && part.endsWith("}")) {
      // Expression like ${geistSans.variable}.
      const expr = part.slice(2, -1).trim()
      if (expr) {
        variableArgs.push(expr)
      }
    } else {
      // Static string - split by whitespace and add non-empty parts as quoted strings.
      const staticParts = part.trim().split(/\s+/).filter(Boolean)
      for (const staticPart of staticParts) {
        staticArgs.push(`"${staticPart}"`)
      }
    }
  }

  // Return static strings first, then variables.
  return [...staticArgs, ...variableArgs]
}

<<<<<<< HEAD
function removeFontVariablesFromCn(cnExpr: string) {
  // Remove patterns like "fontName.variable" from cn() call.
  // This is a simple regex-based approach.
  return cnExpr.replace(/,?\s*\w+\.variable/g, "").replace(/cn\(\s*,/, "cn(")
=======
function removeFontVariablesFromCn(
  cnExpr: string,
  variablesToRemove: string[]
) {
  // Remove specific font variable expressions from cn() call.
  let result = cnExpr
  for (const varExpr of variablesToRemove) {
    result = result
      .replace(new RegExp(`,?\\s*${varExpr.replace(".", "\\.")}`, "g"), "")
      .replace(/cn\(\s*,/, "cn(")
  }
  return result
}

function removeFontFamilyClassesFromCn(cnExpr: string) {
  // Remove font-family class strings (font-sans, font-serif, font-mono) from cn() call.
  // Does not remove other font classes like font-bold, font-semibold, etc.
  let result = cnExpr
  for (const cls of ["font-sans", "font-serif", "font-mono"]) {
    result = result
      .replace(new RegExp(`,?\\s*"${cls}"`, "g"), "")
      .replace(/cn\(\s*,/, "cn(")
  }
  return result
>>>>>>> shadcn/main
}

function insertFontVariablesIntoCn(cnExpr: string, fontVars: string[]) {
  // Insert font variables at the end of cn() arguments.
  const varsStr = fontVars.join(", ")
  return cnExpr.replace(/\)$/, `, ${varsStr})`)
}
