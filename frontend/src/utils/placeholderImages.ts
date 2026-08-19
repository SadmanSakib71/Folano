const unsplash = (photoId: string) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=1400&q=80`

export const placeholderImages = {
  mango: unsplash('photo-1553279768-865429fa0078'),
  lychee: unsplash('photo-1749947715360-2493643cbd7b'),
  banana: unsplash('photo-1571771894821-ce9b6c11b08e'),
  guava: unsplash('photo-1571156375803-479cad64e09d'),
  apple: unsplash('photo-1560806887-1e4cd0b6cbd6'),
  orange: unsplash('photo-1547514701-42782101795e'),
  grapes: unsplash('photo-1537640538966-79f369143f8f'),
  kiwi: unsplash('photo-1585059895524-72359e06133a'),
  cherry: unsplash('photo-1528821128474-27f963b062bf'),
  imported: unsplash('photo-1528821128474-27f963b062bf'),
  seasonal: unsplash('photo-1417217601328-d3c66e6f1d48'),
  preorder: unsplash('photo-1628689469838-524a4a973b8e'),
  default: unsplash('photo-1610832958506-aa56368176cf'),
}

const keywordMatches: Array<{ keywords: string[]; image: keyof typeof placeholderImages }> = [
  { keywords: ['lychee', 'litchi', 'লিচু'], image: 'lychee' },
  { keywords: ['cherry', 'cherries', 'চেরি'], image: 'cherry' },
  { keywords: ['grape', 'grapes', 'আঙ্গুর'], image: 'grapes' },
  { keywords: ['kiwi', 'কিউই'], image: 'kiwi' },
  { keywords: ['banana', 'কলা'], image: 'banana' },
  { keywords: ['guava', 'পেয়ারা', 'পেয়ারা'], image: 'guava' },
  { keywords: ['orange', 'কমলা', 'মাল্টা'], image: 'orange' },
  { keywords: ['apple', 'আপেল'], image: 'apple' },
  { keywords: ['mango', 'আম'], image: 'mango' },
  { keywords: ['seasonal', 'সিজনাল'], image: 'seasonal' },
  { keywords: ['imported', 'বিদেশি'], image: 'imported' },
  { keywords: ['preorder', 'pre-order', 'প্রি-অর্ডার'], image: 'preorder' },
]

export function getPlaceholderImage(name?: string, category?: string) {
  const haystack = `${name ?? ''} ${category ?? ''}`.toLowerCase()

  const match = keywordMatches.find(({ keywords }) =>
    keywords.some((keyword) => haystack.includes(keyword.toLowerCase())),
  )

  return placeholderImages[match?.image ?? 'default']
}
