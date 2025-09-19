"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AUTHENTICATED_LIBRARIES = exports.LIBRARY_CATEGORIES = exports.UI_LIBRARY_CONFIGS = exports.daisyUIConfig = exports.nextUIConfig = exports.mantineConfig = exports.chakraUIConfig = exports.antDesignConfig = exports.materialUIConfig = exports.headlessUIConfig = exports.radixUIConfig = exports.tailwindUIConfig = exports.shadcnUIConfig = void 0;
exports.getConfig = getConfig;
exports.getAllConfigs = getAllConfigs;
exports.getLibraryNames = getLibraryNames;
exports.getConfigsByFramework = getConfigsByFramework;
exports.getTypeScriptConfigs = getTypeScriptConfigs;
exports.getDarkModeConfigs = getDarkModeConfigs;
exports.validateAuthentication = validateAuthentication;
exports.calculateDelay = calculateDelay;
// Import all UI library configurations
const shadcn_ui_config_1 = require("./shadcn-ui.config");
Object.defineProperty(exports, "shadcnUIConfig", { enumerable: true, get: function () { return shadcn_ui_config_1.shadcnUIConfig; } });
const tailwind_ui_config_1 = require("./tailwind-ui.config");
Object.defineProperty(exports, "tailwindUIConfig", { enumerable: true, get: function () { return tailwind_ui_config_1.tailwindUIConfig; } });
const radix_ui_config_1 = require("./radix-ui.config");
Object.defineProperty(exports, "radixUIConfig", { enumerable: true, get: function () { return radix_ui_config_1.radixUIConfig; } });
const headless_ui_config_1 = require("./headless-ui.config");
Object.defineProperty(exports, "headlessUIConfig", { enumerable: true, get: function () { return headless_ui_config_1.headlessUIConfig; } });
const material_ui_config_1 = require("./material-ui.config");
Object.defineProperty(exports, "materialUIConfig", { enumerable: true, get: function () { return material_ui_config_1.materialUIConfig; } });
const ant_design_config_1 = require("./ant-design.config");
Object.defineProperty(exports, "antDesignConfig", { enumerable: true, get: function () { return ant_design_config_1.antDesignConfig; } });
const chakra_ui_config_1 = require("./chakra-ui.config");
Object.defineProperty(exports, "chakraUIConfig", { enumerable: true, get: function () { return chakra_ui_config_1.chakraUIConfig; } });
const mantine_config_1 = require("./mantine.config");
Object.defineProperty(exports, "mantineConfig", { enumerable: true, get: function () { return mantine_config_1.mantineConfig; } });
const nextui_config_1 = require("./nextui.config");
Object.defineProperty(exports, "nextUIConfig", { enumerable: true, get: function () { return nextui_config_1.nextUIConfig; } });
const daisyui_config_1 = require("./daisyui.config");
Object.defineProperty(exports, "daisyUIConfig", { enumerable: true, get: function () { return daisyui_config_1.daisyUIConfig; } });
// Master configuration map
exports.UI_LIBRARY_CONFIGS = {
    'shadcn-ui': shadcn_ui_config_1.shadcnUIConfig,
    'tailwind-ui': tailwind_ui_config_1.tailwindUIConfig,
    'radix-ui': radix_ui_config_1.radixUIConfig,
    'headless-ui': headless_ui_config_1.headlessUIConfig,
    'material-ui': material_ui_config_1.materialUIConfig,
    'ant-design': ant_design_config_1.antDesignConfig,
    'chakra-ui': chakra_ui_config_1.chakraUIConfig,
    'mantine': mantine_config_1.mantineConfig,
    'nextui': nextui_config_1.nextUIConfig,
    'daisyui': daisyui_config_1.daisyUIConfig
};
// Helper functions
function getConfig(libraryName) {
    return exports.UI_LIBRARY_CONFIGS[libraryName];
}
function getAllConfigs() {
    return Object.values(exports.UI_LIBRARY_CONFIGS);
}
function getLibraryNames() {
    return Object.keys(exports.UI_LIBRARY_CONFIGS);
}
// Configuration categories for grouping
exports.LIBRARY_CATEGORIES = {
    'Headless/Unstyled': ['radix-ui', 'headless-ui'],
    'Tailwind-based': ['shadcn-ui', 'tailwind-ui', 'daisyui', 'nextui'],
    'Material Design': ['material-ui'],
    'Enterprise': ['ant-design'],
    'Modern/Flexible': ['chakra-ui', 'mantine']
};
// Libraries that require authentication
exports.AUTHENTICATED_LIBRARIES = getAllConfigs()
    .filter(config => config.authentication.required)
    .map(config => config.name);
// Get configs by framework
function getConfigsByFramework(framework) {
    return getAllConfigs().filter(config => config.metadata.framework.toLowerCase().includes(framework.toLowerCase()));
}
// Get configs that support TypeScript
function getTypeScriptConfigs() {
    return getAllConfigs().filter(config => config.metadata.typescript);
}
// Get configs with dark mode support
function getDarkModeConfigs() {
    return getAllConfigs().filter(config => config.metadata.darkMode);
}
// Validation function to ensure all required environment variables are set
function validateAuthentication(config) {
    if (!config.authentication.required)
        return true;
    if (config.authentication.envVars) {
        return config.authentication.envVars.every(envVar => process.env[envVar] !== undefined);
    }
    return true;
}
// Rate limit calculator
function calculateDelay(config) {
    return Math.max(config.rateLimit.delayMs, 1000 / config.rateLimit.maxRequestsPerSecond);
}
