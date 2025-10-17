# Supabase数据库设置指南

## 1. 创建Supabase项目

1. 访问 [Supabase官网](https://supabase.com) 并注册账号
2. 创建一个新项目，选择合适的地域
3. 获取项目URL和API密钥

## 2. 配置环境变量

在项目根目录的 `.env` 文件中添加以下配置：

```env
# Supabase配置
SUPABASE_URL=你的Supabase项目URL
SUPABASE_ANON_KEY=你的Supabase匿名密钥
SUPABASE_SERVICE_ROLE_KEY=你的Supabase服务角色密钥

# 后端服务器配置
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## 3. 创建数据库表结构

登录Supabase控制台，进入SQL编辑器，执行以下SQL语句：

### 3.1 创建表结构

复制 `server/sql/create_tables.sql` 文件中的内容到SQL编辑器中执行。

### 3.2 插入示例数据

复制 `server/sql/seed_data.sql` 文件中的内容到SQL编辑器中执行。

## 4. 验证数据库连接

执行以下命令测试数据库连接：

```bash
# 测试数据库状态
curl -X GET http://localhost:3001/api/database/status

# 测试随机诗词API
curl -X GET http://localhost:3001/api/poetry/random?limit=3

# 测试搜索功能
curl -X GET "http://localhost:3001/api/poetry/search?query=李白&limit=5"
```

## 5. 数据库表说明

### 5.1 主要表结构

- **users** - 用户表
- **poems** - 诗词表
- **poem_likes** - 诗词点赞表
- **poem_comments** - 诗词评论表
- **user_favorites** - 用户收藏表
- **search_history** - 搜索历史表

### 5.2 索引优化

已为常用查询字段创建索引：
- 诗词标题、作者、朝代索引
- 标签数组索引（GIN索引）
- 创建时间、浏览量、点赞数索引

## 6. 数据管理

### 6.1 添加新诗词

可以通过以下方式添加新诗词：

1. **API方式**：使用 `/api/poetry` POST接口
2. **数据库直接插入**：在Supabase控制台中直接插入
3. **批量导入**：使用SQL脚本批量导入

### 6.2 诗词数据格式

```json
{
  "title": "诗词标题",
  "author": "作者",
  "dynasty": "朝代",
  "content": "诗词内容",
  "translation": "译文（可选）",
  "annotation": "注释（可选）",
  "tags": ["标签1", "标签2"],
  "theme": "主题",
  "difficulty_level": 1
}
```

## 7. 常见问题

### 7.1 数据库连接失败

如果出现数据库连接错误，检查：
- 环境变量配置是否正确
- Supabase项目是否正常运行
- 网络连接是否正常

### 7.2 表不存在错误

如果提示表不存在，请确保：
- 已正确执行创建表的SQL语句
- 表名拼写正确
- 数据库权限设置正确

### 7.3 搜索功能异常

如果搜索功能不正常，检查：
- 索引是否创建成功
- 搜索字段是否存在
- 中文搜索配置是否正确

## 8. 性能优化建议

1. **定期清理数据**：清理已删除的诗词和评论
2. **监控查询性能**：使用Supabase的监控工具
3. **合理使用索引**：避免过度索引影响写入性能
4. **缓存策略**：对热门诗词实施缓存

## 9. 安全考虑

1. **API密钥保护**：不要将API密钥提交到版本控制
2. **数据库权限**：合理设置行级安全策略
3. **输入验证**：对所有用户输入进行验证和清理
4. **速率限制**：实施API请求速率限制

## 10. 备份和恢复

1. **定期备份**：使用Supabase的自动备份功能
2. **数据导出**：定期导出重要数据
3. **灾难恢复**：制定数据恢复计划