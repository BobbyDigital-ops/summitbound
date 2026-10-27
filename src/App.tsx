import { useEffect, useRef } from 'react';

/** Summitbound v0.9.12 - Rugged Traverse */
export default function App() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    document.title = 'Summitbound — v0.9.12: Rugged Traverse';

    const focusIframe = () => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.focus();
      }
    };

    // Auto-focus the game iframe on mount and after short delay
    focusIframe();
    const timer = setTimeout(focusIframe, 300);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'SUMMIT_KEY_DOWN',
          key: e.key,
          code: e.code,
        }, '*');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'SUMMIT_KEY_UP',
          key: e.key,
          code: e.code,
        }, '*');
      }
    };

    const handleBlur = () => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage({ type: 'SUMMIT_BLUR' }, '*');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return (
    <main
      className="summit-app"
      onClick={() => iframeRef.current?.contentWindow?.focus()}
    >
      <iframe
        ref={iframeRef}
        title="Summit Leap playable mountain ascent"
        src="/game/summit-leap-v081.html"
        allow="fullscreen; gamepad; vibrate"
        className="summit-frame"
      />
    </main>
  );
}
