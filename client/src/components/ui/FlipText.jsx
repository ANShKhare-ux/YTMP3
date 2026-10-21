import React, { useMemo } from 'react';

/**
 * FlipText component ported from VengeanceUI
 * 3D character flip animation with sinusoidal stagger and perspective transform
 */
export function FlipText({
  className = '',
  children,
  duration = 2.4,
  delay = 0,
  loop = true,
  separator = ' ',
  together = false,
  style = {},
}) {
  const textContent = typeof children === 'string' ? children : String(children || '');
  const words = useMemo(() => textContent.split(separator), [textContent, separator]);
  const totalChars = textContent.length || 1;

  const getCharIndex = (wordIndex, charIndex) => {
    let index = 0;
    for (let i = 0; i < wordIndex; i++) {
      index += words[i].length + (separator === ' ' ? 1 : separator.length);
    }
    return index + charIndex;
  };

  return (
    <span
      className={`flip-text-wrapper inline-block ${className}`}
      style={{ perspective: '1000px', ...style }}
    >
      {words.map((word, wordIndex) => {
        const chars = word.split('');

        return (
          <span
            key={wordIndex}
            className="word inline-block whitespace-nowrap"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {chars.map((char, charIndex) => {
              const currentGlobalIndex = getCharIndex(wordIndex, charIndex);

              let calculatedDelay = delay;
              if (!together) {
                const normalizedIndex = currentGlobalIndex / totalChars;
                const sineValue = Math.sin(normalizedIndex * (Math.PI / 2));
                calculatedDelay = sineValue * (duration * 0.25) + delay;
              }

              return (
                <span
                  key={charIndex}
                  className="flip-char inline-block relative"
                  data-char={char}
                  style={{
                    '--flip-duration': `${duration}s`,
                    '--flip-delay': `${calculatedDelay}s`,
                    '--flip-iteration': loop ? 'infinite' : '1',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {char}
                </span>
              );
            })}
            {separator === ' ' && wordIndex < words.length - 1 && (
              <span className="whitespace inline-block">&nbsp;</span>
            )}
            {separator !== ' ' && wordIndex < words.length - 1 && (
              <span className="separator inline-block">{separator}</span>
            )}
          </span>
        );
      })}
    </span>
  );
}

export default FlipText;
