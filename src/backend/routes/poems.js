router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: '搜索内容不能为空' });
    }

    const poems = await Poem.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } },
        { author: { $regex: query, $options: 'i' } }
      ]
    });
    
    res.json(poems);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '搜索服务暂时不可用' });
  }
});

router.get('/random', async (req, res) => {
  try {
    // 获取随机诗词
    const poems = await Poem.aggregate([{ $sample: { size: 10 } }]);
    res.json(poems);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});