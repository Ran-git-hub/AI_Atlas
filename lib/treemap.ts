export type TreemapRect = { x: number; y: number; w: number; h: number }

export function squarify<T extends { value: number }>(items: T[], rect: TreemapRect): (T & TreemapRect)[] {
  const remaining = items.filter((item) => item.value > 0).sort((a, b) => b.value - a.value)
  const total = remaining.reduce((sum, item) => sum + item.value, 0)
  if (total === 0 || rect.w <= 0 || rect.h <= 0) return []

  const scale = (rect.w * rect.h) / total
  const out: (T & TreemapRect)[] = []
  let { x, y, w, h } = rect
  let index = 0

  while (index < remaining.length) {
    const short = Math.min(w, h)
    const worst = (sum: number, min: number, max: number) =>
      Math.max((short * short * max) / (sum * sum), (sum * sum) / (short * short * min))

    const first = remaining[index].value * scale
    let end = index + 1
    let sum = first
    while (end < remaining.length) {
      const area = remaining[end].value * scale
      const last = remaining[end - 1].value * scale
      if (worst(sum + area, area, first) > worst(sum, last, first)) break
      sum += area
      end += 1
    }

    const thickness = sum / short
    let offset = 0
    for (let i = index; i < end; i += 1) {
      const length = (remaining[i].value * scale) / thickness
      out.push(
        w >= h
          ? { ...remaining[i], x, y: y + offset, w: thickness, h: length }
          : { ...remaining[i], x: x + offset, y, w: length, h: thickness },
      )
      offset += length
    }

    if (w >= h) {
      x += thickness
      w -= thickness
    } else {
      y += thickness
      h -= thickness
    }
    index = end
  }

  return out
}
