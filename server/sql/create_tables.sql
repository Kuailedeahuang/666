-- 诗词赏析平台数据库表结构
-- 创建于: 2024-10-17

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    bio TEXT,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- 诗词表
CREATE TABLE IF NOT EXISTS poems (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(100) NOT NULL,
    dynasty VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    translation TEXT,
    annotation TEXT,
    tags TEXT[] DEFAULT '{}',
    theme VARCHAR(100),
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    views INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'deleted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 诗词点赞表
CREATE TABLE IF NOT EXISTS poem_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poem_id UUID REFERENCES poems(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(poem_id, user_id)
);

-- 诗词评论表
CREATE TABLE IF NOT EXISTS poem_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poem_id UUID REFERENCES poems(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES poem_comments(id) ON DELETE CASCADE,
    like_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('published', 'deleted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户收藏表
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    poem_id UUID REFERENCES poems(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, poem_id)
);

-- 搜索历史表
CREATE TABLE IF NOT EXISTS search_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    results_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_poems_title ON poems(title);
CREATE INDEX IF NOT EXISTS idx_poems_author ON poems(author);
CREATE INDEX IF NOT EXISTS idx_poems_dynasty ON poems(dynasty);
CREATE INDEX IF NOT EXISTS idx_poems_tags ON poems USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_poems_created_at ON poems(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_poems_views ON poems(views DESC);
CREATE INDEX IF NOT EXISTS idx_poems_like_count ON poems(like_count DESC);

CREATE INDEX IF NOT EXISTS idx_poem_likes_poem_id ON poem_likes(poem_id);
CREATE INDEX IF NOT EXISTS idx_poem_likes_user_id ON poem_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_poem_comments_poem_id ON poem_comments(poem_id);
CREATE INDEX IF NOT EXISTS idx_poem_comments_user_id ON poem_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at DESC);

-- 创建全文搜索索引（如果支持）
-- CREATE INDEX IF NOT EXISTS idx_poems_content_search ON poems USING GIN(to_tsvector('chinese', content));
-- CREATE INDEX IF NOT EXISTS idx_poems_title_search ON poems USING GIN(to_tsvector('chinese', title));

-- 创建触发器函数来更新时间戳
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要更新时间戳的表创建触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_poems_updated_at BEFORE UPDATE ON poems FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_poem_comments_updated_at BEFORE UPDATE ON poem_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建函数来更新诗词的点赞数和评论数
CREATE OR REPLACE FUNCTION update_poem_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'DELETE' THEN
        UPDATE poems 
        SET like_count = (
            SELECT COUNT(*) FROM poem_likes WHERE poem_id = COALESCE(NEW.poem_id, OLD.poem_id)
        ),
        comment_count = (
            SELECT COUNT(*) FROM poem_comments WHERE poem_id = COALESCE(NEW.poem_id, OLD.poem_id) AND status = 'published'
        )
        WHERE id = COALESCE(NEW.poem_id, OLD.poem_id);
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- 为点赞和评论表创建触发器
CREATE TRIGGER update_poem_like_count AFTER INSERT OR DELETE ON poem_likes FOR EACH ROW EXECUTE FUNCTION update_poem_counts();
CREATE TRIGGER update_poem_comment_count AFTER INSERT OR DELETE ON poem_comments FOR EACH ROW EXECUTE FUNCTION update_poem_counts();