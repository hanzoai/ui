"use client"

import * as React from "react"

import {
  AICode,
  type CodeSuggestion,
  type Explanation,
  type SecurityIssue,
} from "@/registry/default/ui/ai-code"

export default function AICodeDemo() {
  const [isGenerating, setIsGenerating] = React.useState(false)

  // Mock AI handlers for demonstration
  const handleGenerate = async (prompt: string): Promise<string> => {
    setIsGenerating(true)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock code generation based on prompt
    const codeTemplates: Record<string, string> = {
      "react component": `import React from 'react'

interface Props {
  title: string
  children: React.ReactNode
}

export const Component: React.FC<Props> = ({ title, children }) => {
  return (
    <div className="component">
      <h2>{title}</h2>
      <div>{children}</div>
    </div>
  )
}`,
      "api endpoint": `export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Process the data
    const result = await processData(data)

    return Response.json({ success: true, data: result })
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}`,
      "utility function": `export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}`,
      default: `// AI generated code based on: "${prompt}"
function generatedFunction() {
  console.log("This is AI-generated code based on your prompt")

  // TODO: Implement the specific functionality requested
  return "AI Code Assistant is working!"
}`,
    }

    setIsGenerating(false)

    // Find matching template or use default
    const matchingKey = Object.keys(codeTemplates).find((key) =>
      prompt.toLowerCase().includes(key)
    )

    return codeTemplates[matchingKey || "default"]
  }

  const handleExplain = async (
    code: string,
    line?: number
  ): Promise<Explanation[]> => {
    // Mock explanation generation
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const explanations: Explanation[] = []

    // Generate explanations for common patterns
    const lines = code.split("\n")
    lines.forEach((lineContent, index) => {
      const lineNumber = index + 1

      if (lineContent.includes("function")) {
        explanations.push({
          id: `explain-${lineNumber}`,
          line: lineNumber,
          content: "Function declaration - defines a reusable block of code",
          type: "explanation",
        })
      }

      if (lineContent.includes("const") || lineContent.includes("let")) {
        explanations.push({
          id: `explain-${lineNumber}`,
          line: lineNumber,
          content: "Variable declaration - stores a value for later use",
          type: "explanation",
        })
      }

      if (lineContent.includes("export")) {
        explanations.push({
          id: `explain-${lineNumber}`,
          line: lineNumber,
          content:
            "Export statement - makes this function/variable available to other modules",
          type: "explanation",
        })
      }

      if (lineContent.includes("// TODO")) {
        explanations.push({
          id: `explain-${lineNumber}`,
          line: lineNumber,
          content:
            "TODO comment - indicates functionality that needs to be implemented",
          type: "warning",
        })
      }
    })

    return explanations
  }

  const handleRefactor = async (code: string): Promise<string> => {
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Mock refactoring - add some improvements
    let refactoredCode = code

    // Add proper TypeScript types if missing
    if (!code.includes("interface") && code.includes("function")) {
      refactoredCode = `interface RefactoredProps {
  // TODO: Define proper prop types
}

${refactoredCode}`
    }

    // Add error handling if missing
    if (!code.includes("try") && !code.includes("catch")) {
      refactoredCode = refactoredCode.replace(
        /function\s+(\w+)/g,
        (match, funcName) => {
          return `function ${funcName} /* Added error handling */`
        }
      )
    }

    // Add JSDoc comments
    refactoredCode = `/**
 * Refactored code with improvements:
 * - Added proper TypeScript types
 * - Improved error handling
 * - Added documentation
 */
${refactoredCode}`

    return refactoredCode
  }

  const handleDebug = async (code: string): Promise<CodeSuggestion[]> => {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const suggestions: CodeSuggestion[] = []

    // Mock debugging suggestions
    if (code.includes("console.log")) {
      suggestions.push({
        id: "debug-1",
        type: "debug",
        title: "Remove Debug Logs",
        description:
          "Console.log statements found - consider using a proper logging library",
        severity: "warning",
        code: code.replace(/console\.log\([^)]*\);?\n?/g, ""),
      })
    }

    if (!code.includes("error") && !code.includes("try")) {
      suggestions.push({
        id: "debug-2",
        type: "debug",
        title: "Add Error Handling",
        description:
          "No error handling detected - consider adding try-catch blocks",
        severity: "warning",
      })
    }

    if (code.includes("any")) {
      suggestions.push({
        id: "debug-3",
        type: "debug",
        title: "Fix TypeScript Types",
        description: 'Using "any" type - consider using more specific types',
        severity: "error",
      })
    }

    return suggestions
  }

  const handleTest = async (code: string): Promise<string> => {
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Mock test generation
    const functionName =
      code.match(/function\s+(\w+)/)?.[1] || "generatedFunction"

    return `import { describe, it, expect } from '@jest/globals'
import { ${functionName} } from './module'

describe('${functionName}', () => {
  it('should work correctly', () => {
    // Arrange
    const input = 'test input'

    // Act
    const result = ${functionName}(input)

    // Assert
    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
  })

  it('should handle edge cases', () => {
    // Test edge cases
    expect(() => ${functionName}(null)).not.toThrow()
    expect(${functionName}('')).toBeTruthy()
  })

  it('should have proper error handling', () => {
    // Test error scenarios
    const invalidInput = undefined
    expect(() => ${functionName}(invalidInput)).not.toThrow()
  })
})`
  }

  const handleDocument = async (code: string): Promise<string> => {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Mock documentation generation
    const functionName = code.match(/function\s+(\w+)/)?.[1] || "Function"

    return `## ${functionName} Documentation

### Overview
This function provides core functionality for the application.

### Parameters
- **input**: The input parameter (type: any)
- **options**: Optional configuration object

### Returns
Returns the processed result based on the input.

### Usage Example
\`\`\`typescript
const result = ${functionName}('example input')
console.log(result)
\`\`\`

### Notes
- Ensure proper error handling when using this function
- Consider TypeScript types for better type safety
- Add input validation for production use

### See Also
- Related utility functions
- Error handling best practices
- TypeScript documentation`
  }

  const handleReview = async (code: string): Promise<CodeSuggestion[]> => {
    await new Promise((resolve) => setTimeout(resolve, 1200))

    const suggestions: CodeSuggestion[] = []

    // Mock code review suggestions
    suggestions.push({
      id: "review-1",
      type: "review",
      title: "Code Quality",
      description:
        "Overall code structure looks good, but consider these improvements",
      severity: "info",
    })

    if (!code.includes("export")) {
      suggestions.push({
        id: "review-2",
        type: "review",
        title: "Add Exports",
        description:
          "Consider adding export statements to make functions reusable",
        severity: "warning",
      })
    }

    if (code.length > 1000) {
      suggestions.push({
        id: "review-3",
        type: "review",
        title: "Function Length",
        description:
          "Function is quite long - consider breaking it into smaller functions",
        severity: "warning",
      })
    }

    return suggestions
  }

  const handleSecurityScan = async (code: string): Promise<SecurityIssue[]> => {
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const issues: SecurityIssue[] = []

    // Mock security scanning
    if (code.includes("eval(")) {
      issues.push({
        id: "security-1",
        line: code.split("\n").findIndex((line) => line.includes("eval(")) + 1,
        severity: "critical",
        message:
          "Use of eval() function detected - potential code injection vulnerability",
        fix: "Replace eval() with safer alternatives like JSON.parse() or Function constructor",
      })
    }

    if (code.includes("innerHTML")) {
      issues.push({
        id: "security-2",
        line:
          code.split("\n").findIndex((line) => line.includes("innerHTML")) + 1,
        severity: "high",
        message:
          "Direct innerHTML manipulation detected - potential XSS vulnerability",
        fix: "Use textContent or sanitize HTML content before setting innerHTML",
      })
    }

    if (code.includes("document.write")) {
      issues.push({
        id: "security-3",
        line:
          code
            .split("\n")
            .findIndex((line) => line.includes("document.write")) + 1,
        severity: "medium",
        message:
          "Use of document.write() detected - can lead to XSS vulnerabilities",
        fix: "Use modern DOM manipulation methods instead of document.write()",
      })
    }

    return issues
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">AI Code Assistant Demo</h2>
          <p className="text-muted-foreground">
            Try the AI-powered code assistant with features like code
            generation, explanation, refactoring, debugging, testing, and
            security scanning.
          </p>
        </div>

        <AICode
          defaultValue={`// Welcome to AI Code Assistant!
// Try these commands:
// - Type "generate a react component" in the chat
// - Click "Explain" to get code explanations
// - Use "Refactor" to improve code quality
// - Try "Debug" for error detection
// - Generate tests with "Test"
// - Create documentation with "Document"
// - Get code review with "Review"
// - Scan for security issues with "Security"

function welcome() {
  console.log("Start coding with AI assistance!")
  return "AI Code Assistant is ready to help!"
}`}
          language="typescript"
          height="500px"
          onGenerate={handleGenerate}
          onExplain={handleExplain}
          onRefactor={handleRefactor}
          onDebug={handleDebug}
          onTest={handleTest}
          onDocument={handleDocument}
          onReview={handleReview}
          onSecurityScan={handleSecurityScan}
          isGenerating={isGenerating}
          features={[
            "generate",
            "explain",
            "refactor",
            "debug",
            "test",
            "document",
            "review",
          ]}
          placeholder="Ask AI to generate code, explain functions, refactor for improvements, or help with debugging..."
          showMinimap={false}
          showLineNumbers={true}
        />

        <div className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Try these prompts:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>"Generate a React component with props"</li>
            <li>"Create an API endpoint for user authentication"</li>
            <li>"Write a utility function for debouncing"</li>
            <li>"Add error handling to this function"</li>
            <li>"Explain what this code does line by line"</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
