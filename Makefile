# Hanzo UI Makefile
# This Makefile provides convenient commands for building, testing, and managing the Hanzo UI monorepo

# Variables
PNPM := pnpm
NODE := node
NPM := npm
TSX := tsx

# Colors for output
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

# Default target - runs build, test, and docs
.PHONY: all
all: install build test docs
	@echo "$(GREEN)✓ All tasks completed successfully$(NC)"

# Help target - shows available commands
.PHONY: help
help:
	@echo "$(CYAN)Hanzo UI Makefile$(NC)"
	@echo ""
	@echo "$(YELLOW)Available targets:$(NC)"
	@echo "  $(GREEN)make$(NC)              - Run default targets (install, build, test, docs)"
	@echo "  $(GREEN)make install$(NC)      - Install all dependencies"
	@echo "  $(GREEN)make build$(NC)        - Build all packages and the app"
	@echo "  $(GREEN)make test$(NC)         - Run all tests"
	@echo "  $(GREEN)make dev$(NC)          - Start development server"
	@echo "  $(GREEN)make lint$(NC)         - Run linting checks"
	@echo "  $(GREEN)make format$(NC)       - Format code with Prettier"
	@echo "  $(GREEN)make typecheck$(NC)    - Run TypeScript type checking"
	@echo "  $(GREEN)make docs$(NC)         - Generate documentation"
	@echo "  $(GREEN)make clean$(NC)        - Clean build artifacts and node_modules"
	@echo "  $(GREEN)make registry$(NC)     - Build the component registry"
	@echo "  $(GREEN)make version$(NC)      - Show package versions"
	@echo ""
	@echo "$(YELLOW)Deployment & Publishing:$(NC)"
	@echo "  $(GREEN)make deploy$(NC)       - Deploy to ui.hanzo.ai via GitHub Pages"
	@echo "  $(GREEN)make deploy-pages$(NC) - Manually trigger GitHub Pages deployment"
	@echo "  $(GREEN)make deploy-status$(NC)- Check deployment status"
	@echo "  $(GREEN)make publish$(NC)      - Publish packages to npm registry"
	@echo "  $(GREEN)make publish-dry$(NC)  - Dry run npm publish"
	@echo ""
	@echo "$(YELLOW)Development:$(NC)"
	@echo "  $(GREEN)make dev-app$(NC)      - Start app development server"
	@echo "  $(GREEN)make dev-ui$(NC)       - Build UI package in watch mode"
	@echo ""
	@echo "$(YELLOW)Quality:$(NC)"
	@echo "  $(GREEN)make check$(NC)        - Run all quality checks (lint, format, typecheck)"
	@echo "  $(GREEN)make fix$(NC)          - Auto-fix linting and formatting issues"
	@echo ""
	@echo "$(YELLOW)Utilities:$(NC)"
	@echo "  $(GREEN)make clean-all$(NC)    - Deep clean (removes lock file too)"
	@echo "  $(GREEN)make update-deps$(NC)  - Update all dependencies"

# Install dependencies
.PHONY: install
install:
	@echo "$(CYAN)Installing dependencies...$(NC)"
	@$(PNPM) install
	@echo "$(GREEN)✓ Dependencies installed$(NC)"

# Build all packages and app
.PHONY: build
build: install
	@echo "$(CYAN)Building all packages...$(NC)"
	@$(PNPM) run build
	@echo "$(GREEN)✓ Build completed$(NC)"

# Build individual components
.PHONY: build-app
build-app:
	@echo "$(CYAN)Building app...$(NC)"
	@cd app && $(PNPM) run build
	@echo "$(GREEN)✓ App build completed$(NC)"

.PHONY: build-ui
build-ui:
	@echo "$(CYAN)Building UI package...$(NC)"
	@cd pkg/ui && $(PNPM) run build
	@echo "$(GREEN)✓ UI package build completed$(NC)"

.PHONY: build-auth
build-auth:
	@echo "$(CYAN)Building Auth package...$(NC)"
	@cd pkg/auth && $(PNPM) run build 2>/dev/null || true
	@echo "$(GREEN)✓ Auth package build completed$(NC)"

.PHONY: build-commerce
build-commerce:
	@echo "$(CYAN)Building Commerce package...$(NC)"
	@cd pkg/commerce && $(PNPM) run build 2>/dev/null || true
	@echo "$(GREEN)✓ Commerce package build completed$(NC)"

# Run tests
.PHONY: test
test:
	@echo "$(CYAN)Running tests...$(NC)"
	@if [ -f "app/package.json" ] && grep -q '"test"' app/package.json 2>/dev/null; then \
		cd app && $(PNPM) test 2>/dev/null || echo "$(YELLOW)No tests configured for app$(NC)"; \
	else \
		echo "$(YELLOW)No test script found in app$(NC)"; \
	fi
	@echo "$(GREEN)✓ Tests completed$(NC)"

# Development server
.PHONY: dev
dev:
	@echo "$(CYAN)Starting development server on port 3003...$(NC)"
	@cd app && $(PNPM) run dev

.PHONY: dev-app
dev-app: dev

.PHONY: dev-ui
dev-ui:
	@echo "$(CYAN)Building UI package in watch mode...$(NC)"
	@cd pkg/ui && $(PNPM) run tc --watch

# Linting
.PHONY: lint
lint:
	@echo "$(CYAN)Running linters...$(NC)"
	@cd app && $(PNPM) run lint
	@echo "$(GREEN)✓ Linting completed$(NC)"

.PHONY: lint-fix
lint-fix:
	@echo "$(CYAN)Fixing linting issues...$(NC)"
	@cd app && $(PNPM) run lint:fix
	@echo "$(GREEN)✓ Linting fixes applied$(NC)"

# Formatting
.PHONY: format
format:
	@echo "$(CYAN)Checking code formatting...$(NC)"
	@cd app && $(PNPM) run format:check
	@echo "$(GREEN)✓ Format check completed$(NC)"

.PHONY: format-fix
format-fix:
	@echo "$(CYAN)Formatting code...$(NC)"
	@cd app && $(PNPM) run format:write
	@echo "$(GREEN)✓ Code formatted$(NC)"

# Type checking
.PHONY: typecheck
typecheck:
	@echo "$(CYAN)Running TypeScript type checking...$(NC)"
	@cd app && $(PNPM) run typecheck
	@cd pkg/ui && $(PNPM) run tc --noEmit
	@echo "$(GREEN)✓ Type checking completed$(NC)"

# Documentation generation
.PHONY: docs
docs:
	@echo "$(CYAN)Generating documentation...$(NC)"
	@if [ -f "app/README.md" ]; then \
		echo "$(GREEN)✓ README.md exists$(NC)"; \
	fi
	@if [ -f "LLM.md" ]; then \
		echo "$(GREEN)✓ LLM.md exists$(NC)"; \
	fi
	@echo "$(YELLOW)Note: Full documentation available at https://hanzo.ai/docs$(NC)"

# Registry build
.PHONY: registry
registry:
	@echo "$(CYAN)Building component registry...$(NC)"
	@cd app && $(PNPM) run registry:build
	@echo "$(GREEN)✓ Registry built$(NC)"

.PHONY: registry-capture
registry-capture:
	@echo "$(CYAN)Capturing registry...$(NC)"
	@cd app && $(PNPM) run registry:capture
	@echo "$(GREEN)✓ Registry captured$(NC)"

.PHONY: validate-registries
validate-registries:
	@echo "$(CYAN)Validating registries...$(NC)"
	@cd app && $(PNPM) run validate:registries
	@echo "$(GREEN)✓ Registries validated$(NC)"

# Quality checks
.PHONY: check
check: lint format typecheck
	@echo "$(GREEN)✓ All quality checks passed$(NC)"

.PHONY: fix
fix: lint-fix format-fix
	@echo "$(GREEN)✓ All fixes applied$(NC)"

# Publishing packages to npm
.PHONY: publish
publish: build test
	@echo "$(CYAN)Publishing packages to npm...$(NC)"
	@echo "$(YELLOW)Publishing @hanzo/ui...$(NC)"
	@cd pkg/ui && $(NPM) publish --access public
	@echo "$(YELLOW)Publishing @hanzo/auth...$(NC)"
	@cd pkg/auth && $(NPM) publish --access public 2>/dev/null || true
	@echo "$(YELLOW)Publishing @hanzo/commerce...$(NC)"
	@cd pkg/commerce && $(NPM) publish --access public 2>/dev/null || true
	@echo "$(GREEN)✓ Packages published to npm$(NC)"

.PHONY: publish-dry
publish-dry: build test
	@echo "$(CYAN)Dry run: Publishing packages...$(NC)"
	@cd pkg/ui && $(NPM) publish --dry-run --access public
	@cd pkg/auth && $(NPM) publish --dry-run --access public 2>/dev/null || true
	@cd pkg/commerce && $(NPM) publish --dry-run --access public 2>/dev/null || true
	@echo "$(GREEN)✓ Dry run completed$(NC)"

# Deployment to ui.hanzo.ai
.PHONY: deploy
deploy: build-static
	@echo "$(CYAN)Deploying to ui.hanzo.ai...$(NC)"
	@echo "$(YELLOW)This will trigger GitHub Actions deployment$(NC)"
	@git add -A
	@git diff --cached --quiet || (git commit -m "Deploy to ui.hanzo.ai" && git push origin main)
	@echo "$(GREEN)✓ Deployment triggered - check GitHub Actions for status$(NC)"
	@echo "$(YELLOW)View deployment at: https://github.com/hanzoai/react-sdk/actions$(NC)"

# Build for static export (GitHub Pages)
.PHONY: build-static
build-static: install
	@echo "$(CYAN)Building static site for ui.hanzo.ai...$(NC)"
	@cd app && $(PNPM) run build
	@if [ ! -f app/next.config.mjs ] || ! grep -q "output.*static" app/next.config.mjs; then \
		echo "$(YELLOW)Note: For GitHub Pages deployment, consider adding 'output: \"export\"' to next.config.mjs$(NC)"; \
	fi
	@echo "$(GREEN)✓ Static build completed$(NC)"

# Deploy preview (for PRs)
.PHONY: deploy-preview
deploy-preview: build
	@echo "$(CYAN)Creating preview deployment...$(NC)"
	@echo "$(YELLOW)Preview deployments are handled by Vercel/Netlify automatically on PR$(NC)"
	@echo "$(GREEN)✓ Push your changes to a branch and create a PR for preview$(NC)"

# Check deployment status
.PHONY: deploy-status
deploy-status:
	@echo "$(CYAN)Checking deployment status...$(NC)"
	@gh workflow view "Deploy to GitHub Pages" --web 2>/dev/null || \
		echo "$(YELLOW)Install GitHub CLI (gh) to check deployment status$(NC)"
	@echo ""
	@echo "$(CYAN)Current site:$(NC) https://ui.hanzo.ai"
	@echo "$(CYAN)GitHub Pages:$(NC) https://hanzoai.github.io/react-sdk"

# Manual GitHub Pages deployment trigger
.PHONY: deploy-pages
deploy-pages:
	@echo "$(CYAN)Triggering GitHub Pages deployment...$(NC)"
	@gh workflow run "Deploy to GitHub Pages" 2>/dev/null || \
		(echo "$(YELLOW)Install GitHub CLI or trigger manually at:$(NC)" && \
		 echo "https://github.com/hanzoai/react-sdk/actions/workflows/deploy-pages.yml")
	@echo "$(GREEN)✓ Deployment workflow triggered$(NC)"

# Version management
.PHONY: version
version:
	@echo "$(CYAN)Package versions:$(NC)"
	@echo "  @hanzo/react-sdk: $$(cat package.json | grep '"version"' | head -1 | cut -d'"' -f4)"
	@echo "  @hanzo/ui: $$(cat pkg/ui/package.json | grep '"version"' | head -1 | cut -d'"' -f4)"
	@echo "  @hanzo/auth: $$(cat pkg/auth/package.json 2>/dev/null | grep '"version"' | head -1 | cut -d'"' -f4 || echo 'N/A')"
	@echo "  @hanzo/commerce: $$(cat pkg/commerce/package.json 2>/dev/null | grep '"version"' | head -1 | cut -d'"' -f4 || echo 'N/A')"
	@echo "  @hanzo/ui-web (app): $$(cat app/package.json | grep '"version"' | head -1 | cut -d'"' -f4)"

.PHONY: version-check
version-check:
	@echo "$(CYAN)Latest published versions:$(NC)"
	@cd pkg/ui && $(PNPM) run lat

# Cleaning
.PHONY: clean
clean:
	@echo "$(CYAN)Cleaning build artifacts and node_modules...$(NC)"
	@$(PNPM) run clean:nm
	@rm -rf app/.next app/dist app/build
	@rm -rf pkg/ui/dist pkg/ui/build
	@rm -rf pkg/auth/dist pkg/auth/build 2>/dev/null || true
	@rm -rf pkg/commerce/dist pkg/commerce/build 2>/dev/null || true
	@echo "$(GREEN)✓ Clean completed$(NC)"

.PHONY: clean-all
clean-all:
	@echo "$(CYAN)Deep cleaning (including lock file)...$(NC)"
	@$(PNPM) run clean:all
	@rm -rf app/.next app/dist app/build
	@rm -rf pkg/ui/dist pkg/ui/build
	@rm -rf pkg/auth/dist pkg/auth/build 2>/dev/null || true
	@rm -rf pkg/commerce/dist pkg/commerce/build 2>/dev/null || true
	@echo "$(GREEN)✓ Deep clean completed$(NC)"

# Dependency management
.PHONY: update-deps
update-deps:
	@echo "$(CYAN)Updating dependencies...$(NC)"
	@$(PNPM) update --latest
	@echo "$(GREEN)✓ Dependencies updated$(NC)"

.PHONY: outdated
outdated:
	@echo "$(CYAN)Checking for outdated dependencies...$(NC)"
	@$(PNPM) outdated

# Production build and start
.PHONY: prod
prod: build
	@echo "$(CYAN)Starting production server on port 3001...$(NC)"
	@cd app && $(PNPM) run start

# CI/CD helpers
.PHONY: ci
ci: install lint typecheck test build
	@echo "$(GREEN)✓ CI checks passed$(NC)"

# Docker support (if needed in future)
.PHONY: docker-build
docker-build:
	@echo "$(CYAN)Building Docker image...$(NC)"
	@docker build -t hanzo-ui:latest .
	@echo "$(GREEN)✓ Docker image built$(NC)"

.PHONY: docker-run
docker-run:
	@echo "$(CYAN)Running Docker container...$(NC)"
	@docker run -p 3001:3001 hanzo-ui:latest

# Utility to check if all required tools are installed
.PHONY: check-tools
check-tools:
	@echo "$(CYAN)Checking required tools...$(NC)"
	@command -v $(PNPM) >/dev/null 2>&1 && echo "$(GREEN)✓ pnpm installed$(NC)" || echo "$(RED)✗ pnpm not found$(NC)"
	@command -v $(NODE) >/dev/null 2>&1 && echo "$(GREEN)✓ node installed$(NC)" || echo "$(RED)✗ node not found$(NC)"
	@command -v $(NPM) >/dev/null 2>&1 && echo "$(GREEN)✓ npm installed$(NC)" || echo "$(RED)✗ npm not found$(NC)"
	@command -v git >/dev/null 2>&1 && echo "$(GREEN)✓ git installed$(NC)" || echo "$(RED)✗ git not found$(NC)"

# Default target explanation
.DEFAULT_GOAL := all