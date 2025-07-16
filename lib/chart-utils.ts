interface ChartData {
  label: string
  value: number
  color: string
}

export function generateBarChart(data: ChartData[], title: string, maxValue = 10): string {
  const chartHeight = 200
  const barWidth = Math.max(40, Math.min(80, 300 / data.length))
  const chartWidth = data.length * (barWidth + 10) + 20

  const bars = data
    .map((item, index) => {
      const barHeight = (item.value / maxValue) * (chartHeight - 40)
      const x = index * (barWidth + 10) + 10
      const y = chartHeight - barHeight - 20

      return `
        <g>
          <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" 
                fill="${item.color}" rx="4" opacity="0.8"/>
          <text x="${x + barWidth / 2}" y="${chartHeight - 5}" 
                text-anchor="middle" font-size="12" fill="#374151">
            ${item.label}
          </text>
          <text x="${x + barWidth / 2}" y="${y - 5}" 
                text-anchor="middle" font-size="11" font-weight="bold" fill="#1f2937">
            ${item.value}
          </text>
        </g>
      `
    })
    .join("")

  return `
    <div class="chart-container">
      <h4 class="chart-title">${title}</h4>
      <svg width="${chartWidth}" height="${chartHeight}" style="background: #f9fafb; border-radius: 8px; padding: 10px;">
        ${bars}
        <!-- Y-axis -->
        <line x1="5" y1="20" x2="5" y2="${chartHeight - 20}" stroke="#d1d5db" stroke-width="1"/>
        <!-- X-axis -->
        <line x1="5" y1="${chartHeight - 20}" x2="${chartWidth - 10}" y2="${chartHeight - 20}" stroke="#d1d5db" stroke-width="1"/>
        <!-- Y-axis labels -->
        ${Array.from({ length: 6 }, (_, i) => {
          const value = (maxValue / 5) * i
          const y = chartHeight - 20 - (i * (chartHeight - 40)) / 5
          return `<text x="0" y="${y + 3}" font-size="10" fill="#6b7280" text-anchor="end">${value.toFixed(0)}</text>`
        }).join("")}
      </svg>
    </div>
  `
}

export function generatePieChart(data: ChartData[], title: string): string {
  const radius = 80
  const centerX = 100
  const centerY = 100
  const total = data.reduce((sum, item) => sum + item.value, 0)

  let currentAngle = 0
  const slices = data.map((item) => {
    const percentage = (item.value / total) * 100
    const sliceAngle = (item.value / total) * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + sliceAngle

    const startX = centerX + radius * Math.cos((startAngle * Math.PI) / 180)
    const startY = centerY + radius * Math.sin((startAngle * Math.PI) / 180)
    const endX = centerX + radius * Math.cos((endAngle * Math.PI) / 180)
    const endY = centerY + radius * Math.sin((endAngle * Math.PI) / 180)

    const largeArcFlag = sliceAngle > 180 ? 1 : 0

    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${startX} ${startY}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
      "Z",
    ].join(" ")

    currentAngle += sliceAngle

    return {
      path: pathData,
      color: item.color,
      label: item.label,
      percentage: percentage.toFixed(1),
    }
  })

  const legend = data
    .map(
      (item, index) => `
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <div style="width: 16px; height: 16px; background-color: ${item.color}; border-radius: 3px; margin-right: 8px;"></div>
        <span style="font-size: 14px; color: #374151;">${item.label}: ${((item.value / total) * 100).toFixed(1)}%</span>
      </div>
    `,
    )
    .join("")

  return `
    <div class="chart-container">
      <h4 class="chart-title">${title}</h4>
      <div style="display: flex; align-items: center; gap: 30px;">
        <svg width="200" height="200" style="background: #f9fafb; border-radius: 8px;">
          ${slices
            .map(
              (slice) => `
            <path d="${slice.path}" fill="${slice.color}" opacity="0.8" stroke="#fff" stroke-width="2"/>
          `,
            )
            .join("")}
        </svg>
        <div class="chart-legend">
          ${legend}
        </div>
      </div>
    </div>
  `
}

export function generateRadarChart(data: ChartData[], title: string, maxValue = 10): string {
  const centerX = 100
  const centerY = 100
  const radius = 80
  const numPoints = data.length

  // Generate pentagon/hexagon points for radar chart
  const points = data.map((item, index) => {
    const angle = (index * 2 * Math.PI) / numPoints - Math.PI / 2
    const value = (item.value / maxValue) * radius
    const x = centerX + value * Math.cos(angle)
    const y = centerY + value * Math.sin(angle)
    return { x, y, angle, label: item.label, value: item.value }
  })

  // Generate grid lines
  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const gridRadius = ((i + 1) * radius) / 5
    const gridPoints = Array.from({ length: numPoints }, (_, j) => {
      const angle = (j * 2 * Math.PI) / numPoints - Math.PI / 2
      const x = centerX + gridRadius * Math.cos(angle)
      const y = centerY + gridRadius * Math.sin(angle)
      return `${x},${y}`
    }).join(" ")

    return `<polygon points="${gridPoints}" fill="none" stroke="#e5e7eb" stroke-width="1" opacity="0.5"/>`
  }).join("")

  // Generate axis lines
  const axisLines = data
    .map((_, index) => {
      const angle = (index * 2 * Math.PI) / numPoints - Math.PI / 2
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)
      return `<line x1="${centerX}" y1="${centerY}" x2="${x}" y2="${y}" stroke="#d1d5db" stroke-width="1"/>`
    })
    .join("")

  // Generate data polygon
  const dataPoints = points.map((point) => `${point.x},${point.y}`).join(" ")
  const dataPolygon = `<polygon points="${dataPoints}" fill="#3b82f6" fill-opacity="0.3" stroke="#3b82f6" stroke-width="2"/>`

  // Generate labels
  const labels = points
    .map((point, index) => {
      const angle = (index * 2 * Math.PI) / numPoints - Math.PI / 2
      const labelRadius = radius + 20
      const x = centerX + labelRadius * Math.cos(angle)
      const y = centerY + labelRadius * Math.sin(angle)

      return `
        <text x="${x}" y="${y}" text-anchor="middle" font-size="12" fill="#374151" dominant-baseline="middle">
          ${point.label}
        </text>
        <text x="${x}" y="${y + 15}" text-anchor="middle" font-size="10" fill="#6b7280" font-weight="bold">
          ${point.value}
        </text>
      `
    })
    .join("")

  return `
    <div class="chart-container">
      <h4 class="chart-title">${title}</h4>
      <svg width="240" height="240" style="background: #f9fafb; border-radius: 8px; padding: 20px;">
        ${gridLines}
        ${axisLines}
        ${dataPolygon}
        ${points.map((point) => `<circle cx="${point.x}" cy="${point.y}" r="4" fill="#3b82f6"/>`).join("")}
        ${labels}
      </svg>
    </div>
  `
}

export function generateProgressChart(data: ChartData[], title: string): string {
  const bars = data
    .map(
      (item) => `
      <div class="progress-item">
        <div class="progress-label">
          <span>${item.label}</span>
          <span class="progress-value">${item.value}/10</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar-fill" style="width: ${item.value * 10}%; background-color: ${item.color};"></div>
        </div>
      </div>
    `,
    )
    .join("")

  return `
    <div class="chart-container">
      <h4 class="chart-title">${title}</h4>
      <div class="progress-chart">
        ${bars}
      </div>
    </div>
  `
}
