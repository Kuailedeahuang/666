const mongoose = require('mongoose');
const Poem = require('../src/backend/models/Poem');
const poemsData = require('./poems_dataset.json'); // 你的扩展数据集

async function importPoems() {
  await mongoose.connect('mongodb://localhost:27017/poetryDB');
  
  for (const poemData of poemsData) {
    const poem = new Poem({
      title: poemData.title,
      author: poemData.author,
      content: poemData.content,
      dynasty: poemData.dynasty,
      theme: poemData.theme // 添加意境关键词
    });
    await poem.save();
  }
  
  console.log('诗词导入完成');
  process.exit();
}

importPoems();