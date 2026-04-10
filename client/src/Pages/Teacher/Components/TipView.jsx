import React from 'react'
import ContentViewer from './ContentViewer'

export const TipView = ({ content }) => {
    if (!content) return null
    return (

        <ContentViewer content={content} />
    )
}

export default TipView
