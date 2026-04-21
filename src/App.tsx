import { useState, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Badge, Button, Form, InputGroup, Modal } from 'react-bootstrap'
import {
  Folder, FileText, Tags, X,
  Database, Eye, MapPin, Tag as TagIcon, Files,
  Minus, Plus, ChevronRight, ChevronDown, List, Grid, LogOut
} from 'lucide-react'
import type { Tag, MarkdownFile, AppSettings } from './types'
import { initDB, saveSettings, loadSettings, savePreviewFile, loadPreviewFile, saveAuth, loadAuth, clearAuth } from './db'

// 预定义标签颜色
const TAG_COLORS = [
  '#0d6efd', '#198754', '#ffc107', '#dc3545',
  '#6f42c1', '#d63384', '#20c997', '#fd7e14'
]

// 用户配置 - 从环境变量读取（见根目录 .env 文件）
const USER_CONFIG = {
  username: import.meta.env.VITE_AUTH_USERNAME ?? '',
  password: import.meta.env.VITE_AUTH_PASSWORD ?? ''
}

// 默认设置
const DEFAULT_SETTINGS: AppSettings = {
  sourcePath: '',
  fontSize: 16,
  tags: [],
  files: []
}

// 用户信息类型
interface User {
  username: string
  loginTime: number
}

// 导航菜单类型
type MenuSection = 'main' | 'view'
type MainMenuItem = 'path' | 'tags' | 'files'

function App() {
  // 登录状态
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [loginError, setLoginError] = useState('')

  // 应用状态
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [previewFile, setPreviewFile] = useState<MarkdownFile | null>(null)

  // 数据加载状态（IndexedDB 异步加载）
  const [isLoading, setIsLoading] = useState(true)

  // 导航状态
  const [menuSection, setMenuSection] = useState<MenuSection>('main')
  const [expandedMainMenu, setExpandedMainMenu] = useState(true)
  const [expandedViewTags, setExpandedViewTags] = useState<Set<string>>(new Set())
  const [selectedMainItem, setSelectedMainItem] = useState<MainMenuItem | null>(null)

  // 标签管理状态
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0])
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [showFileTagModal, setShowFileTagModal] = useState<MarkdownFile | null>(null)

  // 文件列表视图
  const [fileListView, setFileListView] = useState<'grid' | 'list'>('list')

  // 加载设置和认证状态（从 IndexedDB）
  useEffect(() => {
    Promise.all([loadAuth(), loadSettings(), loadPreviewFile()]).then(([auth, savedSettings, savedPreview]) => {
      if (auth) {
        setUser(auth)
        setIsAuthenticated(true)
      }
      if (savedSettings) {
        setSettings({ ...DEFAULT_SETTINGS, ...savedSettings })
      }
      if (savedPreview) {
        setPreviewFile(savedPreview)
      }
      setIsLoading(false)
    }).catch(e => {
      console.error('Failed to load data:', e)
      setIsLoading(false)
    })
  }, [])

  // 保存设置（到 IndexedDB）
  const saveSettingsToDB = useCallback(() => {
    saveSettings(settings)
    savePreviewFile(previewFile)
  }, [settings, previewFile])

  // 自动保存
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      saveSettingsToDB()
    }
  }, [settings, saveSettingsToDB, isAuthenticated, isLoading])

  // 处理登录
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (loginForm.username === USER_CONFIG.username && loginForm.password === USER_CONFIG.password) {
      const userInfo: User = {
        username: loginForm.username,
        loginTime: Date.now()
      }
      setUser(userInfo)
      setIsAuthenticated(true)
      setLoginError('')
      // 保存登录状态到 IndexedDB
      saveAuth(userInfo)
    } else {
      setLoginError('用户名或密码错误')
    }
  }

  // 登出
  const handleLogout = () => {
    setIsAuthenticated(false)
    setUser(null)
    setLoginForm({ username: '', password: '' })
    setPreviewFile(null)
    // 清除登录状态（IndexedDB）
    clearAuth()
  }

  // 选择文件夹（首次选择）
  const handleSelectFolder = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.webkitdirectory = true
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files && files.length > 0) {
        const folderPath = files[0].webkitRelativePath.split('/')[0]
        const mdFiles: MarkdownFile[] = []

        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          if (file.name.endsWith('.md')) {
            const content = await file.text()
            mdFiles.push({
              path: `${folderPath}/${file.webkitRelativePath}`,
              name: file.name.replace(/\.md$/i, ''),
              tagIds: [],
              content
            })
          }
        }

        mdFiles.sort((a, b) => a.path.localeCompare(b.path))

        setSettings(prev => ({
          ...prev,
          sourcePath: folderPath,
          files: mdFiles
        }))
      }
    }
    input.click()
  }

  // 刷新文件列表（保留已有文件的标签关联）
  const handleRefreshFiles = async () => {
    if (!settings.sourcePath) {
      // 未设置过路径，先选择文件夹
      handleSelectFolder()
      return
    }

    const input = document.createElement('input')
    input.type = 'file'
    input.webkitdirectory = true
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files && files.length > 0) {
        const folderPath = files[0].webkitRelativePath.split('/')[0]
        const mdFiles: MarkdownFile[] = []

        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          if (file.name.endsWith('.md')) {
            const content = await file.text()
            // 查找已有文件的标签关联（按 name 匹配）
            const existingFile = settings.files.find(f => f.name === file.name.replace(/\.md$/i, ''))
            mdFiles.push({
              path: `${folderPath}/${file.webkitRelativePath}`,
              name: file.name.replace(/\.md$/i, ''),
              tagIds: existingFile ? existingFile.tagIds : [],
              content
            })
          }
        }

        mdFiles.sort((a, b) => a.path.localeCompare(b.path))

        setSettings(prev => ({
          ...prev,
          sourcePath: folderPath,
          files: mdFiles
        }))
      }
    }
    input.click()
  }

  // 获取已有文件的标签（只显示有关联文件的标签）
  const tagsWithFiles = settings.tags.filter(tag =>
    settings.files.some(file => file.tagIds.includes(tag.id))
  )

  // 获取某标签下的文件
  const getFilesByTag = (tagId: string) =>
    settings.files.filter(file => file.tagIds.includes(tagId))

  // 切换标签展开/收起
  const toggleTagExpand = (tagId: string) => {
    setExpandedViewTags(prev => {
      const newSet = new Set(prev)
      if (newSet.has(tagId)) {
        newSet.delete(tagId)
      } else {
        newSet.add(tagId)
      }
      return newSet
    })
  }

  // 选择文件预览
  const selectFile = (file: MarkdownFile) => {
    // 从 settings.files 中获取最新文件（包含内容）
    const fullFile = settings.files.find(f => f.path === file.path)
    const targetFile = fullFile || file
    
    if (previewFile?.path === targetFile.path) {
      setPreviewFile(null)
    } else {
      setPreviewFile({ ...targetFile })
    }
  }

  // 创建标签
  const handleCreateTag = () => {
    if (!newTagName.trim()) return
    const tag: Tag = {
      id: `tag-${Date.now()}`,
      name: newTagName.trim(),
      color: newTagColor
    }
    setSettings(prev => ({ ...prev, tags: [...prev.tags, tag] }))
    setNewTagName('')
  }

  // 更新标签
  const handleUpdateTag = () => {
    if (!editingTag || !newTagName.trim()) return
    setSettings(prev => ({
      ...prev,
      tags: prev.tags.map(t =>
        t.id === editingTag.id ? { ...t, name: newTagName.trim(), color: newTagColor } : t
      )
    }))
    setEditingTag(null)
    setNewTagName('')
  }

  // 删除标签
  const handleDeleteTag = (tagId: string) => {
    setSettings(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t.id !== tagId),
      files: prev.files.map(f => ({
        ...f,
        tagIds: f.tagIds.filter(id => id !== tagId)
      }))
    }))
  }

  // 为文件切换标签
  const handleToggleFileTag = (file: MarkdownFile, tagId: string) => {
    const newTagIds = file.tagIds.includes(tagId)
      ? file.tagIds.filter(id => id !== tagId)
      : [...file.tagIds, tagId]

    setSettings(prev => ({
      ...prev,
      files: prev.files.map(f =>
        f.path === file.path ? { ...f, tagIds: newTagIds } : f
      )
    }))

    if (previewFile?.path === file.path) {
      setPreviewFile({ ...previewFile, tagIds: newTagIds })
    }
  }

  // 加载中
  if (isLoading) {
    return (
      <div className="login-page">
        <div className="card login-card">
          <div className="card-body p-5 text-center">
            <div className="spinner-border text-primary mb-3" role="status" />
            <p className="text-muted">加载数据...</p>
          </div>
        </div>
      </div>
    )
  }

  // 登录页面
  if (!isAuthenticated) {
    return (
      <div className="login-page">
        <div className="card login-card">
          <div className="card-body p-5">
            <div className="text-center mb-4">
              <div className="bg-primary bg-opacity-10 d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                style={{ width: 80, height: 80 }}>
                <FileText size={40} className="text-primary" />
              </div>
              <h3 className="mb-1">InvestView</h3>
              <p className="text-muted">Markdown 文件管理器</p>
            </div>

            <Form onSubmit={handleLogin}>
              <Form.Group className="mb-3">
                <Form.Label><FileText size={14} className="me-1" /> 用户名</Form.Label>
                <Form.Control
                  type="text"
                  value={loginForm.username}
                  onChange={e => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="请输入用户名"
                  autoFocus
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>密码</Form.Label>
                <Form.Control
                  type="password"
                  value={loginForm.password}
                  onChange={e => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="请输入密码"
                />
              </Form.Group>

              {loginError && (
                <div className="alert alert-danger py-2 mb-3">{loginError}</div>
              )}

              <Button type="submit" variant="primary" className="w-100" size="lg">
                登录
              </Button>
            </Form>
          </div>
        </div>
      </div>
    )
  }

  // 主应用
  return (
    <div className="app-layout-simple">
      {/* 左侧导航栏 */}
      <nav className="nav-sidebar">
        {/* 头部 */}
        <div className="nav-header">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <FileText size={24} className="me-2 text-primary" />
              <h5 className="mb-0">InvestView</h5>
            </div>
          </div>
          {/* 用户信息 */}
          <div className="mt-2 pt-2 border-top d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold" style={{ width: 28, height: 28, fontSize: '12px' }}>
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="small">
                <div className="fw-medium">{user?.username || '用户'}</div>
              </div>
            </div>
            <Button variant="outline-secondary" size="sm" onClick={handleLogout} title="退出登录">
              <LogOut size={14} />
            </Button>
          </div>
        </div>

        {/* 标签树 - 直接显示在导航中 */}
        <div className="nav-section">
          {tagsWithFiles.length === 0 ? (
            <div className="nav-item text-muted ps-4 small">
              暂无标签文件
            </div>
          ) : (
            tagsWithFiles.map(tag => {
              const isExpanded = expandedViewTags.has(tag.id)
              const tagFiles = getFilesByTag(tag.id)
              const hasPreview = tagFiles.some(f => f.path === previewFile?.path)

              return (
                <div key={tag.id} className="nav-tag-group">
                  <div
                    className={`nav-tag-header ${hasPreview ? 'has-preview' : ''}`}
                    onClick={() => toggleTagExpand(tag.id)}
                  >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <div className="rounded-circle" style={{ width: 10, height: 10, backgroundColor: tag.color }} />
                    <span className="tag-name">{tag.name}</span>
                    <Badge bg="secondary" className="ms-auto" style={{ fontSize: '10px' }}>
                      {tagFiles.length}
                    </Badge>
                  </div>
                  {isExpanded && (
                    <div className="nav-tag-files">
                      {tagFiles.map(file => {
                        const isPreview = previewFile?.path === file.path
                        return (
                          <div
                            key={file.path}
                            className={`nav-file-item ${isPreview ? 'active' : ''}`}
                            onClick={() => selectFile(file)}
                            title={file.name}
                          >
                            <FileText size={14} className="me-1 text-primary" />
                            <span className="file-name text-truncate">{file.name}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* 主数据菜单 */}
        <div className="nav-section">
          <div
            className="nav-section-header"
            onClick={() => { setExpandedMainMenu(!expandedMainMenu); setMenuSection('main'); }}
          >
            {expandedMainMenu ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <Database size={18} className="me-2" />
            <span>主数据</span>
          </div>
          {expandedMainMenu && (
            <div className="nav-section-items">
              <div
                className={`nav-item ${selectedMainItem === 'path' ? 'active' : ''}`}
                onClick={() => { setSelectedMainItem('path'); setMenuSection('main'); setPreviewFile(null); }}
              >
                <MapPin size={16} className="me-2" />
                <span>路径配置</span>
              </div>
              <div
                className={`nav-item ${selectedMainItem === 'tags' ? 'active' : ''}`}
                onClick={() => { setSelectedMainItem('tags'); setMenuSection('main'); setPreviewFile(null); }}
              >
                <TagIcon size={16} className="me-2" />
                <span>标签管理</span>
              </div>
              <div
                className={`nav-item ${selectedMainItem === 'files' ? 'active' : ''}`}
                onClick={() => { setSelectedMainItem('files'); setMenuSection('main'); setPreviewFile(null); }}
              >
                <Files size={16} className="me-2" />
                <span>文件管理</span>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* 右侧操作区域 */}
      <main className="content-main">
        {/* 文件预览 - 始终优先显示 */}
        {previewFile && (
          <div className="page-content fade-in">
            <div className="card" style={{ height: 'calc(100vh - 3rem)' }}>
              <div className="card-header d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <FileText size={18} className="text-primary" />
                  <span className="fw-medium">{previewFile.name}</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div className="btn-group btn-group-sm">
                    <Button variant="outline-secondary" size="sm" onClick={() => setSettings(prev => ({ ...prev, fontSize: Math.max(12, prev.fontSize - 1) }))}>
                      <Minus size={14} />
                    </Button>
                    <span className="btn btn-outline-secondary" style={{ cursor: 'default', padding: '0.25rem 0.5rem' }}>{settings.fontSize}px</span>
                    <Button variant="outline-secondary" size="sm" onClick={() => setSettings(prev => ({ ...prev, fontSize: Math.min(28, prev.fontSize + 1) }))}>
                      <Plus size={14} />
                    </Button>
                  </div>
                  <Button variant="outline-secondary" size="sm" onClick={() => setPreviewFile(null)}>
                    <X size={14} />
                  </Button>
                </div>
              </div>
              <div className="card-body" style={{ fontSize: `${settings.fontSize}px`, padding: 0 }}>
                <div className="markdown-content selectable-text" style={{ padding: '1.5rem' }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {previewFile.content || ''}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 主数据页面 - 无预览文件时显示 */}
        {!previewFile && menuSection === 'main' && selectedMainItem === 'path' && (
          <div className="page-content fade-in">
            <h4 className="mb-4"><MapPin size={24} className="me-2 text-primary" />路径配置</h4>
            <div className="card">
              <div className="card-body">
                <Form.Group className="mb-3">
                  <Form.Label>Markdown 文件夹路径</Form.Label>
                  <InputGroup>
                    <Form.Control
                      value={settings.sourcePath || '未设置'}
                      readOnly
                      placeholder="请选择文件夹"
                    />
                    <Button variant="primary" onClick={handleSelectFolder}>
                      <Folder size={16} className="me-1" /> 选择文件夹
                    </Button>
                  </InputGroup>
                  <Form.Text className="text-muted">
                    当前文件数量: {settings.files.length}
                  </Form.Text>
                </Form.Group>
              </div>
            </div>
          </div>
        )}

        {/* 主数据页面 - 标签管理 */}
        {!previewFile && menuSection === 'main' && selectedMainItem === 'tags' && (
          <div className="page-content fade-in">
            <h4 className="mb-4"><TagIcon size={24} className="me-2 text-primary" />标签管理</h4>
            <div className="card mb-4">
              <div className="card-body">
                <Form.Label className="fw-medium">{editingTag ? '编辑标签' : '新建标签'}</Form.Label>
                <InputGroup className="mb-2">
                  <Form.Control
                    value={newTagName}
                    onChange={e => setNewTagName(e.target.value)}
                    placeholder="输入标签名称"
                  />
                  <Button
                    variant={editingTag ? 'success' : 'primary'}
                    onClick={editingTag ? handleUpdateTag : handleCreateTag}
                    disabled={!newTagName.trim()}
                  >
                    {editingTag ? '保存' : '创建'}
                  </Button>
                  {editingTag && (
                    <Button variant="outline-secondary" onClick={() => { setEditingTag(null); setNewTagName(''); }}>
                      取消
                    </Button>
                  )}
                </InputGroup>
                <div className="d-flex gap-2 flex-wrap">
                  {TAG_COLORS.map(color => (
                    <div
                      key={color}
                      onClick={() => setNewTagColor(color)}
                      className={`rounded-circle border ${newTagColor === color ? 'border-2' : ''}`}
                      style={{
                        width: 28, height: 28,
                        backgroundColor: color,
                        cursor: 'pointer',
                        boxShadow: newTagColor === color ? `0 0 0 2px white, 0 0 0 4px ${color}` : 'none'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <span className="fw-medium">已有标签 ({settings.tags.length})</span>
              </div>
              <div className="card-body p-0">
                {settings.tags.length === 0 ? (
                  <div className="p-4 text-center text-muted">暂无标签</div>
                ) : (
                  <div className="list-group list-group-flush">
                    {settings.tags.map(tag => (
                      <div key={tag.id} className="list-group-item d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                          <div className="rounded-circle" style={{ width: 12, height: 12, backgroundColor: tag.color }} />
                          <span>{tag.name}</span>
                          <Badge bg="secondary">
                            {settings.files.filter(f => f.tagIds.includes(tag.id)).length} 个文件
                          </Badge>
                        </div>
                        <div className="d-flex gap-1">
                          <Button variant="outline-primary" size="sm" onClick={() => { setEditingTag(tag); setNewTagName(tag.name); setNewTagColor(tag.color); }}>
                            编辑
                          </Button>
                          <Button variant="outline-danger" size="sm" onClick={() => handleDeleteTag(tag.id)}>
                            <X size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 主数据页面 - 文件管理 */}
        {menuSection === 'main' && !previewFile && selectedMainItem === 'files' && (
          <div className="page-content fade-in">
            <h4 className="mb-4"><Files size={24} className="me-2 text-primary" />文件管理</h4>
            {settings.files.length === 0 ? (
              <div className="card">
                <div className="card-body text-center py-5">
                  <Folder size={64} className="text-secondary opacity-25 mb-3" />
                  <p className="text-muted mb-3">暂无文件</p>
                  <Button variant="primary" onClick={handleSelectFolder}>
                    <Folder size={16} className="me-1" /> 选择文件夹
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <span className="text-muted">共 {settings.files.length} 个文件</span>
                  <div className="d-flex align-items-center gap-2">
                    <Button variant="outline-secondary" size="sm" onClick={handleRefreshFiles}>
                      <Folder size={14} className="me-1" /> 刷新文件
                    </Button>
                    <div className="btn-group btn-group-sm">
                      <button
                        className={`btn ${fileListView === 'list' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setFileListView('list')}
                      >
                        <List size={14} />
                      </button>
                      <button
                        className={`btn ${fileListView === 'grid' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setFileListView('grid')}
                      >
                        <Grid size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-body p-0" style={{ maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
                    {fileListView === 'list' ? (
                      <div className="list-group list-group-flush">
                        {settings.files.map(file => (
                          <div key={file.path} className="list-group-item">
                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                              <div className="d-flex align-items-center gap-2">
                                <FileText size={18} className="text-primary" />
                                <div>
                                  <div className="fw-medium">{file.name}</div>
                                  <div className="small text-muted text-truncate" style={{ maxWidth: 200 }}>
                                    {file.path}
                                  </div>
                                </div>
                              </div>
                              <div className="d-flex align-items-center gap-2 flex-wrap">
                                {settings.tags.map(tag => {
                                  const isSelected = file.tagIds.includes(tag.id)
                                  return (
                                    <Badge
                                      key={tag.id}
                                      onClick={() => handleToggleFileTag(file, tag.id)}
                                      className="cursor-pointer d-flex align-items-center gap-1"
                                      style={{
                                        backgroundColor: isSelected ? tag.color : '#f0f0f0',
                                        color: isSelected ? '#ffffff' : '#999999',
                                        cursor: 'pointer',
                                        padding: '0.25rem 0.5rem'
                                      }}
                                    >
                                      {isSelected && <span className="rounded-circle" style={{ width: 6, height: 6, backgroundColor: '#ffffff' }} />}
                                      {tag.name}
                                    </Badge>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="row g-3 p-3">
                        {settings.files.map(file => (
                          <div key={file.path} className="col-6 col-md-4 col-lg-3">
                            <div className="card h-100">
                              <div className="card-body d-flex flex-column">
                                <div className="d-flex align-items-start justify-content-between mb-2">
                                  <FileText size={24} className="text-primary" />
                                </div>
                                <div className="text-truncate fw-medium mb-2">{file.name}</div>
                                <div className="d-flex gap-1 flex-wrap mt-auto">
                                  {settings.tags.map(tag => {
                                    const isSelected = file.tagIds.includes(tag.id)
                                    return (
                                      <Badge
                                        key={tag.id}
                                        onClick={() => handleToggleFileTag(file, tag.id)}
                                        className="cursor-pointer d-flex align-items-center gap-1"
                                        style={{
                                          backgroundColor: isSelected ? tag.color : '#f0f0f0',
                                          color: isSelected ? '#ffffff' : '#999999',
                                          cursor: 'pointer',
                                          fontSize: '10px'
                                        }}
                                      >
                                        {isSelected && <span className="rounded-circle" style={{ width: 5, height: 5, backgroundColor: '#ffffff' }} />}
                                        {tag.name}
                                      </Badge>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* 主数据概览 */}
        {!previewFile && menuSection === 'main' && !selectedMainItem && (
          <div className="page-content fade-in">
            <h4 className="mb-4"><Database size={24} className="me-2 text-primary" />主数据</h4>
            <div className="row g-3">
              <div className="col-md-4">
                <div
                  className="card h-100 cursor-pointer hover-card"
                  onClick={() => setSelectedMainItem('path')}
                >
                  <div className="card-body text-center">
                    <MapPin size={48} className="text-primary mb-3" />
                    <h5>路径配置</h5>
                    <p className="text-muted small mb-0">
                      {settings.sourcePath ? settings.sourcePath : '未设置'}
                    </p>
                    <p className="text-muted small">{settings.files.length} 个文件</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div
                  className="card h-100 cursor-pointer hover-card"
                  onClick={() => setSelectedMainItem('tags')}
                >
                  <div className="card-body text-center">
                    <TagIcon size={48} className="text-success mb-3" />
                    <h5>标签管理</h5>
                    <p className="text-muted small">{settings.tags.length} 个标签</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div
                  className="card h-100 cursor-pointer hover-card"
                  onClick={() => setSelectedMainItem('files')}
                >
                  <div className="card-body text-center">
                    <Files size={48} className="text-warning mb-3" />
                    <h5>文件管理</h5>
                    <p className="text-muted small">{settings.files.length} 个文件</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 文件标签选择弹窗 */}
      <Modal show={!!showFileTagModal} onHide={() => setShowFileTagModal(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title><Tags size={20} className="me-2" />管理文件标签</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {showFileTagModal && (
            <>
              <p className="text-muted mb-3">{showFileTagModal.name}</p>
              {settings.tags.length === 0 ? (
                <p className="text-muted py-3 text-center">暂无标签，请先在标签管理中创建</p>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {settings.tags.map(tag => {
                    const isSelected = showFileTagModal.tagIds.includes(tag.id)
                    return (
                      <div
                        key={tag.id}
                        onClick={() => handleToggleFileTag(showFileTagModal, tag.id)}
                        className="d-flex align-items-center justify-content-between p-3 rounded border cursor-pointer transition"
                        style={{
                          borderColor: isSelected ? tag.color : '#dee2e6',
                          backgroundColor: isSelected ? `${tag.color}10` : '#ffffff'
                        }}
                      >
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center"
                            style={{
                              width: 16, height: 16,
                              backgroundColor: isSelected ? tag.color : '#e0e0e0'
                            }}
                          >
                            {isSelected && <span className="text-white" style={{ fontSize: '10px' }}>✓</span>}
                          </div>
                          <span className="fw-medium">{tag.name}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowFileTagModal(null)}>完成</Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default App
