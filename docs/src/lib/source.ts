import React from 'react'
import { docs } from '@/.source'
import { loader } from 'fumadocs-core/source'
import { icons } from 'lucide-react'

export const source: any = loader({
  baseUrl: '/docs', // in next.js app folder
  source: docs.toFumadocsSource(),
  icon(icon) {
    if (!icon) {
      return
    }

    if (icon in icons)
      return React.createElement(icons[icon as keyof typeof icons])
  },
})
