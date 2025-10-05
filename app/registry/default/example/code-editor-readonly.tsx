import { CodeEditor } from "@/registry/default/ui/code-editor"

export default function CodeEditorReadOnlyDemo() {
  return (
    <CodeEditor
      defaultValue={`// This is a read-only code editor
// You cannot edit this content

interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'user' | 'guest'
}

class UserService {
  private users: Map<number, User> = new Map()

  addUser(user: User): void {
    this.users.set(user.id, user)
  }

  getUser(id: number): User | undefined {
    return this.users.get(id)
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values())
  }
}`}
      language="typescript"
      height="400px"
      readOnly={true}
    />
  )
}
