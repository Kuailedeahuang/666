// ... existing imports ...

function HomePage() {
  const [poems, setPoems] = useState([]);
  
  useEffect(() => {
    // 获取随机诗词
    axios.get('/api/poems/random')
      .then(response => {
        const poemsWithImages = response.data.map(poem => ({
          ...poem,
          // 根据诗词ID或意境关键词匹配图片
          imageUrl: `/images/poems/${poem.id}.jpg` 
          // 或者使用意境关键词: `/images/poems/${poem.theme}.jpg`
        }));
        setPoems(poemsWithImages);
      })
      .catch(error => console.error('Error fetching poems:', error));
  }, []);

  // ... existing render code ...
}