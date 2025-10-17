// 诗词图片配置 - 使用空白背景
export const poemImages = [
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjE2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmZmZmZmIi8+PC9zdmc+'
]

// 获取随机图片
export const getRandomImage = () => {
  return poemImages[Math.floor(Math.random() * poemImages.length)]
}

// 根据诗词ID获取固定图片（确保同一诗词显示相同图片）
export const getImageByPoemId = (poemId) => {
  const index = (poemId - 1) % poemImages.length
  return poemImages[index]
}