import path from "path"
import { getRegistryItems } from "@/src/registry/api"
import { configWithDefaults } from "@/src/registry/config"
import { resolveRegistryTree } from "@/src/registry/resolver"
import {
  configSchema,
  registryItemFileSchema,
  registryItemSchema,
  workspaceConfigSchema,
} from "@/src/schema"
<<<<<<< HEAD
=======
import { getSupportedFontMarkers } from "@/src/utils/font-markers"
>>>>>>> shadcn/main
import {
  findCommonRoot,
  findPackageRoot,
  getWorkspaceConfig,
  type Config,
} from "@/src/utils/get-config"
import { getProjectTailwindVersionFromConfig } from "@/src/utils/get-project-info"
import { handleError } from "@/src/utils/handle-error"
import { isSafeTarget } from "@/src/utils/is-safe-target"
import { logger } from "@/src/utils/logger"
import { spinner } from "@/src/utils/spinner"
import { updateCss } from "@/src/utils/updaters/update-css"
<<<<<<< HEAD
import { updateCssVars } from "@/src/utils/updaters/update-css-vars"
=======
>>>>>>> shadcn/main
import { updateDependencies } from "@/src/utils/updaters/update-dependencies"
import { updateEnvVars } from "@/src/utils/updaters/update-env-vars"
import { updateFiles } from "@/src/utils/updaters/update-files"
import {
  massageTreeForFonts,
  updateFonts,
} from "@/src/utils/updaters/update-fonts"
import { updateTailwindConfig } from "@/src/utils/updaters/update-tailwind-config"
import { z } from "zod"

export async function addComponents(
  components: string[],
  config: Config,
  options: {
    overwrite?: boolean
<<<<<<< HEAD
    silent?: boolean
    isNewProject?: boolean
    baseStyle?: boolean
=======
    overwriteCssVars?: boolean
    silent?: boolean
    isNewProject?: boolean
    skipFonts?: boolean
>>>>>>> shadcn/main
    registryHeaders?: Record<string, Record<string, string>>
    path?: string
  }
) {
  options = {
    overwrite: false,
    silent: false,
    isNewProject: false,
<<<<<<< HEAD
    baseStyle: true,
=======
>>>>>>> shadcn/main
    ...options,
  }

  const workspaceConfig = await getWorkspaceConfig(config)
  if (
    workspaceConfig &&
    workspaceConfig.ui &&
    workspaceConfig.ui.resolvedPaths.cwd !== config.resolvedPaths.cwd
  ) {
    return await addWorkspaceComponents(components, config, workspaceConfig, {
      ...options,
      isRemote:
        components?.length === 1 && !!components[0].match(/\/chat\/b\//),
    })
  }

<<<<<<< HEAD
  return await addProjectComponents(components, config, options)
=======
  return await addProjectComponents(components, config, {
    ...options,
    skipFonts: options.skipFonts,
  })
>>>>>>> shadcn/main
}

async function addProjectComponents(
  components: string[],
  config: z.infer<typeof configSchema>,
  options: {
    overwrite?: boolean
<<<<<<< HEAD
    silent?: boolean
    isNewProject?: boolean
    baseStyle?: boolean
    path?: string
  }
) {
  if (!options.baseStyle && !components.length) {
=======
    overwriteCssVars?: boolean
    silent?: boolean
    isNewProject?: boolean
    skipFonts?: boolean
    path?: string
  }
) {
  if (!components.length) {
>>>>>>> shadcn/main
    return
  }

  const registrySpinner = spinner(`Checking registry.`, {
    silent: options.silent,
  })?.start()
  let tree = await resolveRegistryTree(components, configWithDefaults(config))

  if (!tree) {
    registrySpinner?.fail()
    return handleError(new Error("Failed to fetch components from registry."))
  }

  try {
    validateFilesTarget(tree.files ?? [], config.resolvedPaths.cwd)
  } catch (error) {
    registrySpinner?.fail()
    return handleError(error)
  }

  registrySpinner?.succeed()

  const tailwindVersion = await getProjectTailwindVersionFromConfig(config)

<<<<<<< HEAD
  tree = await massageTreeForFonts(tree, config)
=======
  if (!options.skipFonts) {
    tree = await massageTreeForFonts(tree, config)
  }

  const supportedFontMarkers = getSupportedFontMarkers([tree])

  await updateDependencies(tree.dependencies, tree.devDependencies, config, {
    silent: options.silent,
  })
>>>>>>> shadcn/main

  await updateTailwindConfig(tree.tailwind?.config, config, {
    silent: options.silent,
    tailwindVersion,
  })

<<<<<<< HEAD
  const overwriteCssVars = await shouldOverwriteCssVars(components, config)
  await updateCssVars(tree.cssVars, config, {
    cleanupDefaultNextStyles: options.isNewProject,
    silent: options.silent,
    tailwindVersion,
    tailwindConfig: tree.tailwind?.config,
    overwriteCssVars,
    initIndex: options.baseStyle,
  })

  // Add CSS updater
  await updateCss(tree.css, config, {
    silent: options.silent,
  })

=======
>>>>>>> shadcn/main
  await updateEnvVars(tree.envVars, config, {
    silent: options.silent,
  })

<<<<<<< HEAD
  await updateDependencies(tree.dependencies, tree.devDependencies, config, {
    silent: options.silent,
  })

  await updateFonts(tree.fonts, config, {
    silent: options.silent,
  })
=======
  if (!options.skipFonts) {
    await updateFonts(tree.fonts, config, {
      silent: options.silent,
    })
  }
>>>>>>> shadcn/main

  await updateFiles(tree.files, config, {
    overwrite: options.overwrite,
    silent: options.silent,
    path: options.path,
<<<<<<< HEAD
=======
    supportedFontMarkers,
  })

  // Write CSS last so the file watcher triggers a rebuild
  // after all component files and dependencies are in place.
  const overwriteCssVars = tree.cssVars
    ? (options.overwriteCssVars ??
      (await shouldOverwriteCssVars(components, config)))
    : undefined
  await updateCss(tree.css, config, {
    silent: options.silent,
    cssVars: tree.cssVars,
    cleanupDefaultNextStyles: options.isNewProject,
    overwriteCssVars,
    tailwindVersion,
    tailwindConfig: tree.tailwind?.config,
>>>>>>> shadcn/main
  })

  if (tree.docs) {
    logger.info(tree.docs)
  }
}

async function addWorkspaceComponents(
  components: string[],
  config: z.infer<typeof configSchema>,
  workspaceConfig: z.infer<typeof workspaceConfigSchema>,
  options: {
    overwrite?: boolean
<<<<<<< HEAD
    silent?: boolean
    isNewProject?: boolean
    isRemote?: boolean
    baseStyle?: boolean
    path?: string
  }
) {
  if (!options.baseStyle && !components.length) {
=======
    overwriteCssVars?: boolean
    silent?: boolean
    isNewProject?: boolean
    isRemote?: boolean
    path?: string
  }
) {
  if (!components.length) {
>>>>>>> shadcn/main
    return
  }

  const registrySpinner = spinner(`Checking registry.`, {
    silent: options.silent,
  })?.start()
<<<<<<< HEAD
  const tree = await resolveRegistryTree(components, configWithDefaults(config))
=======
  let tree = await resolveRegistryTree(components, configWithDefaults(config))
>>>>>>> shadcn/main

  if (!tree) {
    registrySpinner?.fail()
    return handleError(new Error("Failed to fetch components from registry."))
  }

  try {
    validateFilesTarget(tree.files ?? [], config.resolvedPaths.cwd)
  } catch (error) {
    registrySpinner?.fail()
    return handleError(error)
  }

  registrySpinner?.succeed()

  const filesCreated: string[] = []
  const filesUpdated: string[] = []
  const filesSkipped: string[] = []

  const rootSpinner = spinner(`Installing components.`)?.start()

<<<<<<< HEAD
  // Process global updates (tailwind, css vars, dependencies) first for the main target.
=======
  // Process global updates for the main target.
>>>>>>> shadcn/main
  // These should typically go to the UI package in a workspace.
  const mainTargetConfig = workspaceConfig.ui
  const tailwindVersion =
    await getProjectTailwindVersionFromConfig(mainTargetConfig)
  const workspaceRoot = findCommonRoot(
    config.resolvedPaths.cwd,
    mainTargetConfig.resolvedPaths.ui
  )

<<<<<<< HEAD
  // 1. Update tailwind config.
=======
  // Massage tree for fonts using the app config for framework detection.
  // This adds fontsource deps + CSS for non-Next, or next/font CSS vars for Next.
  tree = await massageTreeForFonts(tree, config)
  const supportedFontMarkers = getSupportedFontMarkers([tree])

  // 1. Update dependencies.
  await updateDependencies(
    tree.dependencies,
    tree.devDependencies,
    mainTargetConfig,
    {
      silent: true,
    }
  )

  // 2. Update tailwind config.
>>>>>>> shadcn/main
  if (tree.tailwind?.config) {
    await updateTailwindConfig(tree.tailwind?.config, mainTargetConfig, {
      silent: true,
      tailwindVersion,
    })
    filesUpdated.push(
      path.relative(
        workspaceRoot,
        mainTargetConfig.resolvedPaths.tailwindConfig
      )
    )
  }

<<<<<<< HEAD
  // 2. Update css vars.
  if (tree.cssVars) {
    const overwriteCssVars = await shouldOverwriteCssVars(components, config)
    await updateCssVars(tree.cssVars, mainTargetConfig, {
      silent: true,
      tailwindVersion,
      tailwindConfig: tree.tailwind?.config,
      overwriteCssVars,
    })
    filesUpdated.push(
      path.relative(workspaceRoot, mainTargetConfig.resolvedPaths.tailwindCss)
    )
  }

  // 3. Update CSS
  if (tree.css) {
    await updateCss(tree.css, mainTargetConfig, {
      silent: true,
    })
    filesUpdated.push(
      path.relative(workspaceRoot, mainTargetConfig.resolvedPaths.tailwindCss)
    )
  }

  // 4. Update environment variables
=======
  // 3. Update environment variables.
>>>>>>> shadcn/main
  if (tree.envVars) {
    await updateEnvVars(tree.envVars, mainTargetConfig, {
      silent: true,
    })
  }

<<<<<<< HEAD
  // 5. Update dependencies.
  await updateDependencies(
    tree.dependencies,
    tree.devDependencies,
    mainTargetConfig,
    {
      silent: true,
    }
  )

  // 6. Update fonts.
  await updateFonts(tree.fonts, mainTargetConfig, {
    silent: true,
  })

  // 7. Group files by their type to determine target config and update files.
=======
  // 4. Update fonts.
  // Fonts modify the app's layout file (e.g. app/layout.tsx),
  // so we use the app config, not the UI workspace config.
  await updateFonts(tree.fonts, config, {
    silent: true,
  })

  // 5. Group files by their type to determine target config and update files.
>>>>>>> shadcn/main
  const filesByType = new Map<string, typeof tree.files>()

  for (const file of tree.files ?? []) {
    const type = file.type || "registry:ui"
    if (!filesByType.has(type)) {
      filesByType.set(type, [])
    }
    filesByType.get(type)!.push(file)
  }

<<<<<<< HEAD
=======
  const FILE_TYPE_TO_CONFIG_KEY: Record<string, string> = {
    "registry:ui": "ui",
    "registry:hook": "hooks",
    "registry:lib": "lib",
  }

>>>>>>> shadcn/main
  // Process each type of component with its appropriate target config.
  for (const type of Array.from(filesByType.keys())) {
    const typeFiles = filesByType.get(type)!

<<<<<<< HEAD
    let targetConfig = type === "registry:ui" ? workspaceConfig.ui : config
=======
    const configKey = FILE_TYPE_TO_CONFIG_KEY[type]
    const targetConfig =
      configKey && workspaceConfig[configKey]
        ? workspaceConfig[configKey]
        : config
>>>>>>> shadcn/main

    const typeWorkspaceRoot = findCommonRoot(
      config.resolvedPaths.cwd,
      targetConfig.resolvedPaths.ui || targetConfig.resolvedPaths.cwd
    )
    const packageRoot =
      (await findPackageRoot(
        typeWorkspaceRoot,
        targetConfig.resolvedPaths.cwd
      )) ?? targetConfig.resolvedPaths.cwd

    // Update files for this type.
    const files = await updateFiles(typeFiles, targetConfig, {
      overwrite: options.overwrite,
      silent: true,
      rootSpinner,
      isRemote: options.isRemote,
      isWorkspace: true,
      path: options.path,
<<<<<<< HEAD
=======
      supportedFontMarkers,
>>>>>>> shadcn/main
    })

    filesCreated.push(
      ...files.filesCreated.map((file) =>
        path.relative(typeWorkspaceRoot, path.join(packageRoot, file))
      )
    )
    filesUpdated.push(
      ...files.filesUpdated.map((file) =>
        path.relative(typeWorkspaceRoot, path.join(packageRoot, file))
      )
    )
    filesSkipped.push(
      ...files.filesSkipped.map((file) =>
        path.relative(typeWorkspaceRoot, path.join(packageRoot, file))
      )
    )
  }

<<<<<<< HEAD
  rootSpinner?.succeed()

  // Sort files.
  filesCreated.sort()
  filesUpdated.sort()
  filesSkipped.sort()

  const hasUpdatedFiles = filesCreated.length || filesUpdated.length
  if (!hasUpdatedFiles && !filesSkipped.length) {
=======
  // 6. Write CSS last so the file watcher triggers a rebuild
  // after all component files and dependencies are in place.
  const overwriteCssVars = tree.cssVars
    ? (options.overwriteCssVars ??
      (await shouldOverwriteCssVars(components, config)))
    : undefined
  await updateCss(tree.css, mainTargetConfig, {
    silent: true,
    cssVars: tree.cssVars,
    overwriteCssVars,
    tailwindVersion,
    tailwindConfig: tree.tailwind?.config,
  })
  if (tree.cssVars || tree.css) {
    filesUpdated.push(
      path.relative(workspaceRoot, mainTargetConfig.resolvedPaths.tailwindCss)
    )
  }

  rootSpinner?.succeed()

  // Deduplicate and sort files.
  const dedupedCreated = Array.from(new Set(filesCreated)).sort()
  const dedupedUpdated = Array.from(
    new Set(filesUpdated.filter((file) => !filesCreated.includes(file)))
  ).sort()
  const dedupedSkipped = Array.from(new Set(filesSkipped)).sort()

  const hasUpdatedFiles = dedupedCreated.length || dedupedUpdated.length
  if (!hasUpdatedFiles && !dedupedSkipped.length) {
>>>>>>> shadcn/main
    spinner(`No files updated.`, {
      silent: options.silent,
    })?.info()
  }

<<<<<<< HEAD
  if (filesCreated.length) {
    spinner(
      `Created ${filesCreated.length} ${
        filesCreated.length === 1 ? "file" : "files"
=======
  if (dedupedCreated.length) {
    spinner(
      `Created ${dedupedCreated.length} ${
        dedupedCreated.length === 1 ? "file" : "files"
>>>>>>> shadcn/main
      }:`,
      {
        silent: options.silent,
      }
    )?.succeed()
<<<<<<< HEAD
    for (const file of filesCreated) {
=======
    for (const file of dedupedCreated) {
>>>>>>> shadcn/main
      logger.log(`  - ${file}`)
    }
  }

<<<<<<< HEAD
  if (filesUpdated.length) {
    spinner(
      `Updated ${filesUpdated.length} ${
        filesUpdated.length === 1 ? "file" : "files"
=======
  if (dedupedUpdated.length) {
    spinner(
      `Updated ${dedupedUpdated.length} ${
        dedupedUpdated.length === 1 ? "file" : "files"
>>>>>>> shadcn/main
      }:`,
      {
        silent: options.silent,
      }
    )?.info()
<<<<<<< HEAD
    for (const file of filesUpdated) {
=======
    for (const file of dedupedUpdated) {
>>>>>>> shadcn/main
      logger.log(`  - ${file}`)
    }
  }

<<<<<<< HEAD
  if (filesSkipped.length) {
    spinner(
      `Skipped ${filesSkipped.length} ${
        filesUpdated.length === 1 ? "file" : "files"
=======
  if (dedupedSkipped.length) {
    spinner(
      `Skipped ${dedupedSkipped.length} ${
        dedupedSkipped.length === 1 ? "file" : "files"
>>>>>>> shadcn/main
      }: (use --overwrite to overwrite)`,
      {
        silent: options.silent,
      }
    )?.info()
<<<<<<< HEAD
    for (const file of filesSkipped) {
=======
    for (const file of dedupedSkipped) {
>>>>>>> shadcn/main
      logger.log(`  - ${file}`)
    }
  }

  if (tree.docs) {
    logger.info(tree.docs)
  }
}

async function shouldOverwriteCssVars(
  components: z.infer<typeof registryItemSchema>["name"][],
  config: z.infer<typeof configSchema>
) {
  const result = await getRegistryItems(components, { config })
  const payload = z.array(registryItemSchema).parse(result)

  return payload.some(
    (component) =>
      component.type === "registry:theme" ||
      component.type === "registry:style" ||
      component.type === "registry:font" ||
      component.type === "registry:base"
  )
}

function validateFilesTarget(
  files: z.infer<typeof registryItemFileSchema>[],
  cwd: string
) {
  for (const file of files) {
    if (!file?.target) {
      continue
    }

    if (!isSafeTarget(file.target, cwd)) {
      throw new Error(
        `We found an unsafe file path "${file.target} in the registry item. Installation aborted.`
      )
    }
  }
}
