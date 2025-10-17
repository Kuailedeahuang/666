-- 诗词赏析平台数据库表结构

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar VARCHAR(500),
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
    dynasty VARCHAR(20) NOT NULL CHECK (dynasty IN ('唐', '宋', '元', '明', '清', '现代')),
    content TEXT NOT NULL,
    translation TEXT,
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'deleted')),
    views INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 收藏表
CREATE TABLE IF NOT EXISTS favorites (
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
    query VARCHAR(200) NOT NULL,
    results_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_poems_dynasty ON poems(dynasty);
CREATE INDEX IF NOT EXISTS idx_poems_author ON poems(author);
CREATE INDEX IF NOT EXISTS idx_poems_status ON poems(status);
CREATE INDEX IF NOT EXISTS idx_poems_created_at ON poems(created_at);
CREATE INDEX IF NOT EXISTS idx_poems_views ON poems(views);
CREATE INDEX IF NOT EXISTS idx_poems_like_count ON poems(like_count);
CREATE INDEX IF NOT EXISTS idx_poems_tags ON poems USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_poem_likes_poem_id ON poem_likes(poem_id);
CREATE INDEX IF NOT EXISTS idx_poem_comments_poem_id ON poem_comments(poem_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);

-- 创建全文搜索索引
CREATE INDEX IF NOT EXISTS idx_poems_search_title ON poems USING gin(to_tsvector('simple', title));
CREATE INDEX IF NOT EXISTS idx_poems_search_author ON poems USING gin(to_tsvector('simple', author));
CREATE INDEX IF NOT EXISTS idx_poems_search_content ON poems USING gin(to_tsvector('simple', content));

-- 插入示例数据
INSERT INTO users (username, email, password_hash, bio, role) VALUES
('admin', 'admin@poetry.com', '$2b$10$examplehash', '系统管理员', 'admin'),
('poetry_lover', 'lover@poetry.com', '$2b$10$examplehash', '诗词爱好者', 'user'),
('classic_reader', 'reader@poetry.com', '$2b$10$examplehash', '古典文学爱好者', 'user');

INSERT INTO poems (title, author, dynasty, content, tags, user_id) VALUES
('静夜思', '李白', '唐', '床前明月光，疑是地上霜。举头望明月，低头思故乡。', '{"思乡", "月亮", "夜晚"}', (SELECT id FROM users WHERE username = 'admin')),
('春晓', '孟浩然', '唐', '春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。', '{"春天", "自然", "生活"}', (SELECT id FROM users WHERE username = 'poetry_lover')),
('登鹳雀楼', '王之涣', '唐', '白日依山尽，黄河入海流。欲穷千里目，更上一层楼。', '{"登高", "壮丽", "哲理"}', (SELECT id FROM users WHERE username = 'classic_reader')),
('水调歌头', '苏轼', '宋', '明月几时有？把酒问青天。不知天上宫阙，今夕是何年。', '{"中秋", "思念", "月亮"}', (SELECT id FROM users WHERE username = 'admin')),
('声声慢', '李清照', '宋', '寻寻觅觅，冷冷清清，凄凄惨惨戚戚。乍暖还寒时候，最难将息。', '{"忧愁", "秋天", "思念"}', (SELECT id FROM users WHERE username = 'poetry_lover'));

-- 更新统计信息
UPDATE poems SET 
    like_count = (SELECT COUNT(*) FROM poem_likes WHERE poem_id = poems.id),
    comment_count = (SELECT COUNT(*) FROM poem_comments WHERE poem_id = poems.id);