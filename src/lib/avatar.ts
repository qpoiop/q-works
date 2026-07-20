/** 프로필 사진: 원본 최대 4MB 허용(시안), 업로드 전 256px JPEG data URL로 리사이즈 */
export const MAX_AVATAR_FILE_BYTES = 4 * 1024 * 1024

export function fileToAvatarDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_AVATAR_FILE_BYTES) {
      reject(new Error('이미지는 최대 4MB까지 가능해요'))
      return
    }
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const size = 256
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('이미지를 처리할 수 없어요'))
        return
      }
      // 중앙 크롭 후 정방형 리사이즈
      const min = Math.min(img.width, img.height)
      const sx = (img.width - min) / 2
      const sy = (img.height - min) / 2
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('이미지를 불러올 수 없어요'))
    }
    img.src = url
  })
}
