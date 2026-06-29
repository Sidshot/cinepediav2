'use client';

import { useEffect, useRef, useState } from 'react';

const KOFI_BUTTON_TEXT = 'Support me on Ko-fi';
const KOFI_BUTTON_COLOR = '#72a4f2';
const KOFI_PAGE_ID = 'L7E6229SY5';
const KOFI_FALLBACK_URL = 'https://ko-fi.com/L7E6229SY5';
const KOFI_WIDGET_SCRIPT_ID = 'kofi-widget-script';

export default function KoFiButton() {
    const widgetRef = useRef(null);
    const [widgetReady, setWidgetReady] = useState(false);

    useEffect(() => {
        let isCancelled = false;

        const drawWidget = () => {
            if (isCancelled || !widgetRef.current || typeof window === 'undefined') {
                return;
            }

            const widgetHost = widgetRef.current;
            if (widgetHost.dataset.loaded === 'true') {
                setWidgetReady(true);
                return;
            }

            if (!window.kofiwidget2?.init || !window.kofiwidget2?.draw) {
                return;
            }

            widgetHost.innerHTML = '';

            const initScript = document.createElement('script');
            initScript.type = 'text/javascript';
            initScript.text = `kofiwidget2.init('${KOFI_BUTTON_TEXT}', '${KOFI_BUTTON_COLOR}', '${KOFI_PAGE_ID}');kofiwidget2.draw();`;
            widgetHost.appendChild(initScript);
            widgetHost.dataset.loaded = 'true';
            setWidgetReady(true);
        };

        const loadScript = () => {
            const existingScript = document.getElementById(KOFI_WIDGET_SCRIPT_ID);

            if (existingScript) {
                if (window.kofiwidget2) {
                    drawWidget();
                } else {
                    existingScript.addEventListener('load', drawWidget, { once: true });
                }
                return;
            }

            const script = document.createElement('script');
            script.id = KOFI_WIDGET_SCRIPT_ID;
            script.src = 'https://storage.ko-fi.com/cdn/widget/Widget_2.js';
            script.async = true;
            script.addEventListener('load', drawWidget, { once: true });
            document.body.appendChild(script);
        };

        loadScript();

        return () => {
            isCancelled = true;
        };
    }, []);

    return (
        <div className="flex items-center">
            {!widgetReady && (
                <a
                    href={KOFI_FALLBACK_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-[#72a4f255] bg-[#72a4f220] px-4 py-2 text-sm font-bold text-[#cfe0ff] transition-all hover:scale-105 hover:bg-[#72a4f235] hover:text-white"
                >
                    <span>Support me on Ko-fi</span>
                </a>
            )}
            <div
                ref={widgetRef}
                className={widgetReady ? 'kofi-widget-slot' : 'hidden'}
                aria-hidden={!widgetReady}
            />
        </div>
    );
}
