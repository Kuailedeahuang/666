-- 诗歌赏析平台数据库初始化脚本
-- 在Supabase SQL编辑器中执行此脚本

-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned', 'deleted')),
    bio TEXT,
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- 诗词表
CREATE TABLE IF NOT EXISTS poems (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    author VARCHAR(50) NOT NULL,
    dynasty VARCHAR(10) CHECK (dynasty IN ('唐', '宋', '元', '明', '清', '现代')),
    content TEXT NOT NULL,
    translation TEXT,
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    views INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'deleted')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 诗词点赞表
CREATE TABLE IF NOT EXISTS poem_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    poem_id UUID REFERENCES poems(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(poem_id, user_id)
);

-- 收藏表
CREATE TABLE IF NOT EXISTS favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    poem_id UUID REFERENCES poems(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(poem_id, user_id)
);

-- 诗词评论表
CREATE TABLE IF NOT EXISTS poem_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    poem_id UUID REFERENCES poems(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES poem_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('published', 'deleted')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 诗词分析表
CREATE TABLE IF NOT EXISTS poem_analyses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    poem_id UUID REFERENCES poems(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_poems_user_id ON poems(user_id);
CREATE INDEX IF NOT EXISTS idx_poems_dynasty ON poems(dynasty);
CREATE INDEX IF NOT EXISTS idx_poems_status ON poems(status);
CREATE INDEX IF NOT EXISTS idx_poems_created_at ON poems(created_at);
CREATE INDEX IF NOT EXISTS idx_poems_tags ON poems USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_poem_likes_poem_id ON poem_likes(poem_id);
CREATE INDEX IF NOT EXISTS idx_poem_likes_user_id ON poem_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_poem_id ON favorites(poem_id);

CREATE INDEX IF NOT EXISTS idx_poem_comments_poem_id ON poem_comments(poem_id);
CREATE INDEX IF NOT EXISTS idx_poem_comments_user_id ON poem_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_poem_comments_parent_id ON poem_comments(parent_id);

CREATE INDEX IF NOT EXISTS idx_poem_analyses_poem_id ON poem_analyses(poem_id);
CREATE INDEX IF NOT EXISTS idx_poem_analyses_user_id ON poem_analyses(user_id);

-- 启用行级安全（RLS）
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE poems ENABLE ROW LEVEL SECURITY;
ALTER TABLE poem_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE poem_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE poem_analyses ENABLE ROW LEVEL SECURITY;

-- 用户表策略
CREATE POLICY "用户可查看活跃用户" ON users FOR SELECT USING (status = 'active');
CREATE POLICY "用户可更新自己的资料" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "仅管理员可查看所有用户" ON users FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));

-- 诗词表策略
CREATE POLICY "所有人可查看已发布诗词" ON poems FOR SELECT USING (status = 'published');
CREATE POLICY "用户可创建诗词" ON poems FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "作者可更新自己的诗词" ON poems FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "作者可删除自己的诗词" ON poems FOR DELETE USING (auth.uid() = user_id);

-- 点赞表策略
CREATE POLICY "所有人可查看点赞" ON poem_likes FOR SELECT USING (true);
CREATE POLICY "用户可点赞" ON poem_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可取消自己的点赞" ON poem_likes FOR DELETE USING (auth.uid() = user_id);

-- 收藏表策略
CREATE POLICY "用户可查看自己的收藏" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户可收藏" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可取消自己的收藏" ON favorites FOR DELETE USING (auth.uid() = user_id);

-- 评论表策略
CREATE POLICY "所有人可查看已发布评论" ON poem_comments FOR SELECT USING (status = 'published');
CREATE POLICY "用户可评论" ON poem_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "作者可更新自己的评论" ON poem_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "作者可删除自己的评论" ON poem_comments FOR DELETE USING (auth.uid() = user_id);

-- 分析表策略
CREATE POLICY "用户可查看公开分析或自己的分析" ON poem_analyses FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "用户可创建分析" ON poem_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "作者可更新自己的分析" ON poem_analyses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "作者可删除自己的分析" ON poem_analyses FOR DELETE USING (auth.uid() = user_id);

-- 插入示例数据
INSERT INTO users (id, username, email, password, role, bio) VALUES 
(
    '00000000-0000-0000-0000-000000000001',
    'admin',
    'admin@poetry.com',
    -- 密码: admin123 (bcrypt加密)
    '$2a$12$LQv3c1yqBWGZhNKu1BqkOe8Q8SZTRfsj4U6wHX7Xr7n6JtYV6XJZu',
    'admin',
    '系统管理员'
);

INSERT INTO poems (id, user_id, title, author, dynasty, content, tags) VALUES 
(
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '静夜思',
    '李白',
    '唐',
    '床前明月光，疑是地上霜。举头望明月，低头思故乡。',
    ARRAY['思乡', '明月', '抒情']
),
(
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '春晓',
    '孟浩然',
    '唐',
    '春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。',
    ARRAY['春天', '自然', '抒情']
),
(
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    '登鹳雀楼',
    '王之涣',
    '唐',
    '白日依山尽，黄河入海流。欲穷千里目，更上一层楼。',
    ARRAY['登高', '哲理', '抒情']
);

-- 创建更新时间的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要更新时间的表创建触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_poems_updated_at BEFORE UPDATE ON poems FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_poem_comments_updated_at BEFORE UPDATE ON poem_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建全文搜索索引（如果需要高级搜索功能）
-- CREATE INDEX IF NOT EXISTS idx_poems_search ON poems USING GIN(to_tsvector('chinese', title || ' ' || author || ' ' || content));