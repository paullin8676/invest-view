export interface Tag {
  id: string
  name: string
  color: string
}

export interface MarkdownFile {
  path: string
  name: string
  tagIds: string[]
  content?: string
}

export interface AppSettings {
  sourcePath: string
  fontSize: number
  tags: Tag[]
  files: MarkdownFile[]
}

export interface UserConfig {
  username: string
  password: string
}
