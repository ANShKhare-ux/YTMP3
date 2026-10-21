import React, { useState } from 'react';

/**
 * FaqAccordion component ported from VengeanceUI
 * Styled with SonicWave Cursor design tokens (thick left accent border, + / - indicator, and smooth CSS grid expand)
 */
export function FaqAccordion({
  items = [],
  title = '',
  className = '',
  ...props
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  const toggleItem = (index) => {
    setActiveIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className={`v-faq-container ${className}`} {...props}>
      {title && (
        <h2 className="v-faq-title">
          {title}
        </h2>
      )}

      <ul className="v-faq-list" role="list">
        {items.map((item, index) => {
          const isActive = activeIndex === index;
          return (
            <li
              key={index}
              className={`v-faq-item ${isActive ? 'is-active' : ''}`}
            >
              <button
                type="button"
                className={`v-faq-button ${isActive ? 'is-active' : ''}`}
                onClick={() => toggleItem(index)}
                aria-expanded={isActive}
                aria-controls={`faq-answer-${index}`}
                id={`faq-btn-${index}`}
              >
                {/* Plus/Minus Indicator */}
                <span
                  className="v-faq-sign"
                  aria-hidden="true"
                >
                  {isActive ? '−' : '+'}
                </span>

                <span className="v-faq-question">{item.question}</span>

                {/* Rotating Chevron */}
                <span
                  className="v-faq-chevron"
                  aria-hidden="true"
                />
              </button>

              <div
                id={`faq-answer-${index}`}
                role="region"
                aria-labelledby={`faq-btn-${index}`}
                className={`v-faq-collapse ${isActive ? 'is-active' : ''}`}
              >
                <div className="v-faq-content-inner">
                  <div className="v-faq-answer">
                    {item.answer}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default FaqAccordion;
