import { spawn, execSync } from "child_process"
import { existsSync, mkdirSync } from "fs"
import path from "path"
import puppeteer from "puppeteer"

import { getAllBlockIds } from "../lib/blocks"

const REGISTRY_PATH = path.join(process.cwd(), "public/r")
const SERVER_PORT = 4000

// ----------------------------------------------------------------------------
// Kill any existing Next.js dev servers
// ----------------------------------------------------------------------------
function killExistingServers() {
  try {
    console.log("🧹 Checking for existing dev servers...")
    // Kill any process using the target port
    try {
      execSync(`lsof -ti:${SERVER_PORT} | xargs kill -9 2>/dev/null || true`, {
        stdio: "ignore",
      })
    } catch {
      // Ignore errors if no process found
    }
    // Kill any Next.js dev servers
    try {
      execSync('pkill -f "next dev" 2>/dev/null || true', { stdio: "ignore" })
    } catch {
      // Ignore errors if no process found
    }
    // Wait a moment for processes to fully terminate
    execSync("sleep 2")
    console.log("✅ Cleared existing servers")
  } catch (error) {
    // Ignore any errors
  }
}

// ----------------------------------------------------------------------------
// Start dev server on port 4000 for screenshot capture
// ----------------------------------------------------------------------------
async function startDevServer() {
  return new Promise<{ stop: () => void }>((resolve, reject) => {
    // Kill any existing servers first
    killExistingServers()

    console.log("🚀 Starting dev server on port", SERVER_PORT)

    const server = spawn("pnpm", ["dev", "--port", String(SERVER_PORT)], {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
    })

    let stderr = ""

    server.stdout?.on("data", (data) => {
      const output = data.toString()
      if (output.includes("Local:") || output.includes("Ready")) {
        console.log("✅ Dev server ready")
        // Give it a bit more time to fully initialize
        setTimeout(() => {
          resolve({
            stop: () => {
              server.kill()
            },
          })
        }, 3000)
      }
    })

    server.stderr?.on("data", (data) => {
      stderr += data.toString()
    })

    server.on("error", (error) => {
      reject(new Error(`Failed to start dev server: ${error.message}`))
    })

    server.on("close", (code) => {
      if (code !== 0 && code !== null) {
        reject(new Error(`Dev server exited with code ${code}\n${stderr}`))
      }
    })

    // Timeout after 60 seconds
    setTimeout(() => {
      reject(new Error("Dev server failed to start within 60 seconds"))
    }, 60000)
  })
}

// ----------------------------------------------------------------------------
// Capture screenshots
// ----------------------------------------------------------------------------
async function captureScreenshots() {
  const blockIds = await getAllBlockIds()
  const blocks = blockIds.filter((block) => {
    // Check if screenshots already exist
    const lightPath = path.join(
      REGISTRY_PATH,
      `styles/default/${block}-light.png`
    )
    const darkPath = path.join(
      REGISTRY_PATH,
      `styles/default/${block}-dark.png`
    )
    return !existsSync(lightPath) || !existsSync(darkPath)
  })

  if (blocks.length === 0) {
    console.log("✨ All screenshots exist, nothing to capture")
    return
  }

  console.log(`📸 Capturing screenshots for ${blocks.length} blocks...`)

  // Ensure output directory exists
  const stylesDir = path.join(REGISTRY_PATH, "styles/default")
  if (!existsSync(stylesDir)) {
    mkdirSync(stylesDir, { recursive: true })
  }

  const browser = await puppeteer.launch({
    defaultViewport: {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2,
    },
  })

  for (const block of blocks) {
    const pageUrl = `http://localhost:${SERVER_PORT}/view/default/${block}`

    const page = await browser.newPage()

    try {
      await page.goto(pageUrl, {
        waitUntil: "networkidle2",
        timeout: 30000,
      })

      console.log(`  - Capturing ${block}...`)

      for (const theme of ["light", "dark"]) {
        const screenshotPath = path.join(
          REGISTRY_PATH,
          `styles/default/${block}${theme === "dark" ? "-dark" : "-light"}.png`
        )

        if (existsSync(screenshotPath)) {
          continue
        }

        // Set theme and reload page
        await page.evaluate((currentTheme) => {
          localStorage.setItem("theme", currentTheme)
        }, theme)

        await page.reload({ waitUntil: "networkidle2", timeout: 30000 })

        // Wait for animations to complete
        if (block.startsWith("chart") || block.startsWith("dashboard")) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }

        // Hide Tailwind indicator
        await page.evaluate(() => {
          const indicator = document.querySelector("[data-tailwind-indicator]")
          if (indicator) {
            indicator.remove()
          }
        })

        await page.screenshot({
          path: screenshotPath,
        })
      }

      await page.close()
    } catch (error) {
      console.error(`  ❌ Failed to capture ${block}:`, error)
      await page.close()
    }
  }

  await browser.close()
}

// ----------------------------------------------------------------------------
// Main execution
// ----------------------------------------------------------------------------
try {
  console.log("🔍 Block Screenshot Capture")
  console.log("━".repeat(50))

  // Start dev server
  const server = await startDevServer()

  try {
    // Capture screenshots
    await captureScreenshots()

    console.log("━".repeat(50))
    console.log("✅ Screenshot capture complete!")
  } finally {
    // Always stop the dev server
    console.log("🛑 Stopping dev server...")
    server.stop()
    // Kill any remaining processes to ensure clean exit
    killExistingServers()
    console.log("✅ Cleanup complete")
  }
} catch (error) {
  console.error("❌ Error:", error)
  // Ensure cleanup on error too
  killExistingServers()
  process.exit(1)
}
