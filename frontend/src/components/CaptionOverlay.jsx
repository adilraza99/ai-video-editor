import React from 'react';

const CaptionOverlay = ({ caption, enabled, style = {} }) => {
    if (!enabled || !caption) {
        return null;
    }

    const defaultStyle = {
        fontSize: style.fontSize || 20,
        fontFamily: style.fontFamily || 'Arial, sans-serif',
        color: style.color || '#FFFFFF',
        backgroundColor: style.backgroundColor || 'rgba(0, 0, 0, 0.8)',
        position: style.position || 'bottom'
    };

    return (
        <div 
            className="caption-overlay" 
            style={{
                fontSize: `${defaultStyle.fontSize}px`,
                fontFamily: defaultStyle.fontFamily,
                color: defaultStyle.color,
                backgroundColor: defaultStyle.backgroundColor,
                [defaultStyle.position]: '60px'
            }}
        >
            <span className="caption-text">{caption.text}</span>
        </div>
    );
};

export default CaptionOverlay;
