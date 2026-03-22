'use client'

import { Box } from '@mui/material'
import { useId, useRef, useState } from 'react'

interface TrendGraphProps {
  data: number[]
  isPositive: boolean
  width?: number
  height?: number
  variant?: 'compact' | 'detailed'
}

export default function TrendGraph({
  data,
  isPositive,
  width = 60,
  height = 30,
  variant = 'detailed',
}: TrendGraphProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const gradientId = useId().replace(/:/g, '')
  const isCompact = variant === 'compact'

  const safeData = data.length >= 2 ? data : [data[0] ?? 0, data[0] ?? 0]
  const minVal = Math.min(...safeData)
  const maxVal = Math.max(...safeData)
  const range = maxVal - minVal
  const normalizedData = safeData.map((val) => (range === 0 ? 50 : ((val - minVal) / range) * 100))

  // Chart dimensions with padding
  const padding = isCompact
    ? { top: 8, right: 8, bottom: 8, left: 8 }
    : { top: 20, right: 40, bottom: 40, left: 50 }
  const chartWidth = Math.max(width - padding.left - padding.right, 1)
  const chartHeight = Math.max(height - padding.top - padding.bottom, 1)
  const svgViewBox = `0 0 ${width} ${height}`

  // Calculate line points
  const graphPoints = normalizedData.map((value, index) => {
    const x = padding.left + (index / (normalizedData.length - 1)) * chartWidth
    const y = padding.top + (1 - value / 100) * chartHeight
    return { x, y }
  })
  const polylinePoints = graphPoints.map(({ x, y }) => `${x},${y}`).join(' ')
  const linePath = `M ${graphPoints.map(({ x, y }) => `${x} ${y}`).join(' L ')}`

  // Create area path
  const areaPathData = `${linePath} L ${padding.left + chartWidth} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`

  const lineColor = isPositive ? '#00ff88' : '#ff4d4d'
  const tooltipValue = hoveredIndex === null ? null : safeData[hoveredIndex]

  // Generate Y-axis labels (price)
  const yAxisLabels = [
    { value: maxVal, percent: 0 },
    { value: (maxVal + minVal) / 2, percent: 50 },
    { value: minVal, percent: 100 },
  ]

  // Generate X-axis labels (dates) - show first, middle, last
  const getDateLabel = (index: number) => {
    const dateStr = new Date()
    dateStr.setDate(dateStr.getDate() - (safeData.length - 1 - index))
    return dateStr.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const xAxisLabels = [
    { index: 0, label: getDateLabel(0) },
    { index: Math.floor((safeData.length - 1) / 2), label: getDateLabel(Math.floor((safeData.length - 1) / 2)) },
    { index: safeData.length - 1, label: getDateLabel(safeData.length - 1) },
  ]

  // Handle mouse move to find hovered point
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return

    const svg = svgRef.current
    const rect = svg.getBoundingClientRect()
    
    // Get mouse position relative to SVG element
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    // Convert to SVG coordinates (0 to viewBox dimensions)
    const scaleX = width / rect.width
    const scaleY = height / rect.height
    const svgX = mouseX * scaleX
    const svgY = mouseY * scaleY

    // Find closest point on the line
    let closestIndex = 0
    let closestDistance = Infinity

    normalizedData.forEach((_, index) => {
      const pointX = padding.left + (index / (normalizedData.length - 1)) * chartWidth
      const pointY = padding.top + (1 - normalizedData[index] / 100) * chartHeight
      
      // Calculate distance to this point
      const dx = svgX - pointX
      const dy = svgY - pointY
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < closestDistance) {
        closestDistance = distance
        closestIndex = index
      }
    })

    // Only show tooltip if close enough to a point (30 pixels in SVG coords)
    if (closestDistance < 40) {
      setHoveredIndex(closestIndex)
    } else {
      setHoveredIndex(null)
    }
  }

  const handleMouseLeave = () => {
    setHoveredIndex(null)
  }

  // Get hovered point data
  let hoveredX = 0
  let hoveredY = 0
  let tooltipX = 0
  let tooltipY = 0
  const tooltipWidth = 90
  const tooltipHeight = 24
  
  if (hoveredIndex !== null) {
    hoveredX = padding.left + (hoveredIndex / (normalizedData.length - 1)) * chartWidth
    hoveredY = padding.top + (1 - normalizedData[hoveredIndex] / 100) * chartHeight
    tooltipX = Math.min(Math.max(hoveredX, tooltipWidth / 2 + 6), width - tooltipWidth / 2 - 6)
    tooltipY = Math.max(hoveredY - 32, 10)
  }

  return (
    <Box
      sx={{
        width: isCompact ? `${width}px` : '100%',
        height: isCompact ? `${height}px` : '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        px: isCompact ? 0 : 2,
      }}
    >
      <svg
        ref={svgRef}
        viewBox={svgViewBox}
        preserveAspectRatio={isCompact ? 'none' : 'xMidYMid meet'}
        style={{
          width: '100%',
          height: '100%',
          maxWidth: isCompact ? `${width}px` : '760px',
          minHeight: isCompact ? `${height}px` : '240px',
          display: 'block',
          cursor: isCompact ? 'inherit' : 'crosshair',
        }}
        onMouseMove={isCompact ? undefined : handleMouseMove}
        onMouseLeave={isCompact ? undefined : handleMouseLeave}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0.05" />
          </linearGradient>
          <filter id="lineShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.3)" />
          </filter>
        </defs>

        {!isCompact && (
          <>
            {/* Min/Max micro-text */}
            <text
              x={padding.left + chartWidth}
              y={padding.top - 8}
              textAnchor="end"
              fontSize="11"
              fill="rgba(255,255,255,0.85)"
              fontWeight="600"
              style={{ textShadow: '0px 0px 3px rgba(0,0,0,0.6)' }}
            >
              <tspan x={padding.left + chartWidth} dy="0">Max: ${maxVal.toFixed(2)}</tspan>
              <tspan x={padding.left + chartWidth} dy="14">Min: ${minVal.toFixed(2)}</tspan>
            </text>

            {/* Grid lines (light background) */}
            {yAxisLabels.map((label, i) => {
              const y = padding.top + (label.percent / 100) * chartHeight
              return (
                <line
                  key={`grid-${i}`}
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartWidth}
                  y2={y}
                  stroke="rgba(255,255,255,0.07)"
                  strokeWidth="1"
                  strokeDasharray="4,2"
                />
              )
            })}

            {/* Vertical grid lines */}
            {Array.from({ length: Math.max(4, safeData.length) }, (_, i) => {
              const x = padding.left + (i / (Math.max(4, safeData.length) - 1)) * chartWidth
              return (
                <line
                  key={`vgrid-${i}`}
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + chartHeight}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
              )
            })}

            {/* Y-axis */}
            <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + chartHeight} stroke="rgba(255,255,255,0.25)" strokeWidth="1" />

            {/* X-axis */}
            <line x1={padding.left} y1={padding.top + chartHeight} x2={padding.left + chartWidth} y2={padding.top + chartHeight} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

            {/* Y-axis labels (prices) */}
            {yAxisLabels.map((label, i) => {
              const y = padding.top + (label.percent / 100) * chartHeight
              return (
                <text
                  key={`ylabel-${i}`}
                  x={padding.left - 10}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize="14"
                  fill="rgba(255,255,255,0.9)"
                  fontWeight="700"
                >
                  ${label.value.toFixed(2)}
                </text>
              )
            })}

            {/* X-axis labels (dates) */}
            {xAxisLabels.map((label, i) => {
              const x = padding.left + (label.index / (safeData.length - 1)) * chartWidth
              return (
                <text
                  key={`xlabel-${i}`}
                  x={x}
                  y={padding.top + chartHeight + 24}
                  textAnchor="middle"
                  dominantBaseline="text-before-edge"
                  fontSize="14"
                  fill="rgba(255,255,255,0.9)"
                  fontWeight="700"
                >
                  {label.label}
                </text>
              )
            })}
          </>
        )}

        {/* Filled area under the line */}
        <path d={areaPathData} fill={`url(#${gradientId})`} stroke="none" />

        {/* Line */}
        <polyline
          fill="none"
          stroke={lineColor}
          strokeWidth={isCompact ? '3' : '2.5'}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={polylinePoints}
          filter="url(#lineShadow)"
        />

        {isCompact && (
          <circle
            cx={graphPoints[graphPoints.length - 1].x}
            cy={graphPoints[graphPoints.length - 1].y}
            r="3.5"
            fill={lineColor}
          />
        )}

        {/* Cursor vertical line and tooltip on hover */}
        {!isCompact && hoveredIndex !== null && tooltipValue !== null && (
          <>
            {/* Vertical line */}
            <line
              x1={hoveredX}
              y1={padding.top}
              x2={hoveredX}
              y2={padding.top + chartHeight}
              stroke={lineColor}
              strokeWidth="1"
              strokeDasharray="3,3"
              opacity="0.5"
            />

            {/* Hovered point circle */}
            <circle cx={hoveredX} cy={hoveredY} r="4" fill={lineColor} opacity="0.8" />

            {/* Tooltip background */}
            <rect
              x={tooltipX - tooltipWidth / 2}
              y={tooltipY}
              width={tooltipWidth}
              height={tooltipHeight}
              rx="4"
              fill="rgba(0, 0, 0, 0.8)"
              stroke={lineColor}
              strokeWidth="1"
            />

            {/* Tooltip text - price */}
            <text
              x={tooltipX}
              y={tooltipY + 8}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="13"
              fill={lineColor}
              fontWeight="bold"
            >
              ${tooltipValue.toFixed(2)}
            </text>

            {/* Tooltip text - date */}
            <text
              x={tooltipX}
              y={tooltipY + 18}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fill="rgba(255,255,255,0.9)"
              fontWeight="600"
            >
              {getDateLabel(hoveredIndex)}
            </text>
          </>
        )}
      </svg>
    </Box>
  )
}
