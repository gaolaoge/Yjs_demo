import React, { useEffect, useState } from "react"
import * as Y from "yjs"
// import { RichText } from "y-richtext"
// import { WebrtcProvider } from "y-webrtc" // 注意：纯前端模拟用 localStorage

// 生成随机颜色
const getRandomColor = () => `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`

// 创建用户数据
const createUser = () => {
  const hash = Math.floor(Math.random() * 1000)
  return {
    id: `Id-${hash}`,
    name: `User-${hash}`,
    color: getRandomColor(),
    avatar: `https://i.pravatar.cc/150?u=${hash}`,
  }
}

class LocalStorageProvider {
  doc: Y.Doc
  storageKey: string
  constructor(doc: Y.Doc) {
    this.doc = doc
    this.storageKey = "yjs-demo"

    // 监听 localStorage 变化
    window.addEventListener("storage", this.handleStorageEvent)
    // 初始加载数据
    this.loadFromStorage()
  }

  // 保存数据到 localStorage
  saveToStorage() {
    const update = Y.encodeStateAsUpdate(this.doc)
    localStorage.setItem(this.storageKey, JSON.stringify(Array.from(update)))
  }

  // 从 localStorage 加载数据
  loadFromStorage() {
    const savedData = localStorage.getItem(this.storageKey)
    if (savedData) {
      const update = new Uint8Array(JSON.parse(savedData))
      Y.applyUpdate(this.doc, update)
    }
  }

  // 处理其他窗口的数据变化
  handleStorageEvent = (e: StorageEvent) => {
    if (e.key === this.storageKey && e.newValue) {
      const update = new Uint8Array(JSON.parse(e.newValue))
      Y.applyUpdate(this.doc, update)
    }
  }

  // 销毁时清理监听
  destroy() {
    window.removeEventListener("storage", this.handleStorageEvent)
  }
}

type User = {
  id: string
  name: string
  color: string
  avatar: string
}

function App() {
  const [ydoc] = useState(() => new Y.Doc())
  const [users, setUsers] = useState<{
    [key: string]: User
  }>({})
  const [provider, setProvider] = useState<LocalStorageProvider>(
    null as unknown as LocalStorageProvider
  )
  const [text, setText] = useState("")
  const [currentUser] = useState(createUser())

  // 初始化 Yjs 和 Provider
  useEffect(() => {
    const ytext = ydoc.getText("content")
    const yusers = ydoc.getMap("users")

    // 注册当前用户
    yusers.set(currentUser.id, currentUser)

    const provider = new LocalStorageProvider(ydoc)

    // 监听文本变化
    ytext.observe(() => {
      setText(ytext.toString())
    })

    // 监听用户变化
    yusers.observe(() => {
      setUsers(
        Object.fromEntries(yusers.entries() as unknown as [string, User][])
      )
    })

    // 保存 Provider 实例
    setProvider(provider)

    // 清理
    return () => provider.destroy()
  }, [ydoc])

  // 处理文本编辑
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const ytext = ydoc.getText("content")
    ytext.delete(0, ytext.length) // 清空旧文本
    ytext.insert(0, e.target.value) // 插入新文本
    provider.saveToStorage() // 保存到 localStorage
  }

  return (
    <div style={{ margin: "8px" }}>
      <div style={{ padding: "20px", margin: "10px auto" }}>
        {Object.values(users).map((user) => (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              color: user.color,
            }}
          >
            <img
              src={user.avatar}
              alt={user.name}
              style={{ width: "20px", height: "20px", borderRadius: "50%" }}
            />
            <span>name: {user.name}</span>
            <span>id: {user.id}</span>
          </div>
        ))}
      </div>

      <textarea
        value={text}
        onChange={handleTextChange}
        style={{ width: "100%", height: "200px" }}
        placeholder="输入内容，在其他窗口打开此页面即可实时同步"
      />
    </div>
  )
}

{
  /* 鼠标光标位置的实时同步需要高频更新（每秒可能触发数十次）， localStorage 的机制（同步延迟 > 100ms）决定了它不适合这种场景。 */
}

export default App
