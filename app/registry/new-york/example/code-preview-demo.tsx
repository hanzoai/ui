import { CodePreview } from "@/registry/new-york/ui/code-preview"

const files = [
  {
    filename: "index.html",
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Live Preview Demo</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h1>Welcome to Live Preview</h1>
    <p class="subtitle">Edit the code to see changes in real-time</p>
    <button onclick="handleClick()">Click Me!</button>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
    language: "html",
    type: "html" as const,
  },
  {
    filename: "styles.css",
    content: `body {
  margin: 0;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
}

h1 {
  color: #333;
  margin: 0 0 10px;
}

.subtitle {
  color: #666;
  margin: 0 0 20px;
}

button {
  background: #667eea;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.3s;
}

button:hover {
  background: #5568d3;
}`,
    language: "css",
    type: "css" as const,
  },
  {
    filename: "script.js",
    content: `function handleClick() {
  alert('Button clicked! 🎉');
  console.log('User clicked the button');
}

console.log('Script loaded successfully');`,
    language: "javascript",
    type: "js" as const,
  },
]

export default function CodePreviewDemo() {
  return (
    <div className="w-full min-h-[600px] flex items-center justify-center p-8">
      <div className="w-full max-w-6xl">
        <CodePreview
          files={files}
          defaultFile="index.html"
          showPreview
          showConsole
          autoRun
          allowFullscreen
          maxHeight="600px"
        />
      </div>
    </div>
  )
}
