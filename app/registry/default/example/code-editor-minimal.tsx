import { CodeEditor } from "@/registry/default/ui/code-editor"

export default function CodeEditorMinimalDemo() {
  return (
    <CodeEditor
      defaultValue={`SELECT
  u.name,
  u.email,
  COUNT(o.id) as total_orders,
  SUM(o.total_amount) as total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY u.id, u.name, u.email
HAVING total_orders > 0
ORDER BY total_spent DESC
LIMIT 10;`}
      language="sql"
      height="250px"
      showCopyButton={false}
      showLanguageSelector={false}
    />
  )
}
