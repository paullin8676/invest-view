import type { AppSettings, MarkdownFile } from './types'

// 数据库配置
const DB_NAME = 'InvestViewDB'
const DB_VERSION = 1
const SETTINGS_STORE = 'settings'
const AUTH_STORE = 'auth'

let db: IDBDatabase | null = null

// 初始化数据库
export function initDB(): Promise<IDBDatabase> {
  if (db) return Promise.resolve(db)

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)

    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result

      // 创建 settings 对象仓库
      if (!database.objectStoreNames.contains(SETTINGS_STORE)) {
        database.createObjectStore(SETTINGS_STORE, { keyPath: 'key' })
      }

      // 创建 auth 对象仓库
      if (!database.objectStoreNames.contains(AUTH_STORE)) {
        database.createObjectStore(AUTH_STORE, { keyPath: 'key' })
      }
    }
  })
}

// 保存设置（整个 settings 对象存为一条记录）
export function saveSettings(settings: AppSettings): Promise<void> {
  return initDB().then(database => {
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(SETTINGS_STORE, 'readwrite')
      const store = transaction.objectStore(SETTINGS_STORE)
      const request = store.put({ key: 'app-settings', ...settings })
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  })
}

// 加载设置
export function loadSettings(): Promise<AppSettings | null> {
  return initDB().then(database => {
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(SETTINGS_STORE, 'readonly')
      const store = transaction.objectStore(SETTINGS_STORE)
      const request = store.get('app-settings')
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        if (request.result) {
          // 移除 key 字段后返回
          const { key, ...settings } = request.result
          resolve(settings as AppSettings)
        } else {
          resolve(null)
        }
      }
    })
  })
}

// 保存登录状态
export function saveAuth(user: { username: string; loginTime: number }): Promise<void> {
  return initDB().then(database => {
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(AUTH_STORE, 'readwrite')
      const store = transaction.objectStore(AUTH_STORE)
      const request = store.put({ key: 'user-auth', ...user })
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  })
}

// 加载登录状态
export function loadAuth(): Promise<{ username: string; loginTime: number } | null> {
  return initDB().then(database => {
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(AUTH_STORE, 'readonly')
      const store = transaction.objectStore(AUTH_STORE)
      const request = store.get('user-auth')
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        if (request.result) {
          const { key, ...user } = request.result
          resolve(user as { username: string; loginTime: number })
        } else {
          resolve(null)
        }
      }
    })
  })
}

// 保存预览文件
export function savePreviewFile(file: MarkdownFile | null): Promise<void> {
  return initDB().then(database => {
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(SETTINGS_STORE, 'readwrite')
      const store = transaction.objectStore(SETTINGS_STORE)
      if (file) {
        const request = store.put({ key: 'preview-file', ...file })
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      } else {
        const request = store.delete('preview-file')
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      }
    })
  })
}

// 加载预览文件
export function loadPreviewFile(): Promise<MarkdownFile | null> {
  return initDB().then(database => {
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(SETTINGS_STORE, 'readonly')
      const store = transaction.objectStore(SETTINGS_STORE)
      const request = store.get('preview-file')
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        if (request.result) {
          const { key, ...file } = request.result
          resolve(file as MarkdownFile)
        } else {
          resolve(null)
        }
      }
    })
  })
}

// 清除登录状态
export function clearAuth(): Promise<void> {
  return initDB().then(database => {
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(AUTH_STORE, 'readwrite')
      const store = transaction.objectStore(AUTH_STORE)
      const request = store.delete('user-auth')
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  })
}
