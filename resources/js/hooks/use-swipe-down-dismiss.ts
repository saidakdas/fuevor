import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';

type SwipeDownDismissResult<T extends HTMLElement> = {
    ref: RefObject<T | null>;
    style: CSSProperties;
};

export function useSwipeDownDismiss<T extends HTMLElement>(onDismiss: () => void, threshold = 92): SwipeDownDismissResult<T> {
    const ref = useRef<T>(null);
    const onDismissRef = useRef(onDismiss);
    const [offset, setOffset] = useState(0);
    const [dragging, setDragging] = useState(false);

    useEffect(() => {
        onDismissRef.current = onDismiss;
    }, [onDismiss]);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        let startY = 0;
        let startTime = 0;
        let currentOffset = 0;
        let started = false;
        let captured = false;
        let dismissTimer = 0;

        const reset = () => {
            started = false;
            captured = false;
            currentOffset = 0;
            setDragging(false);
            setOffset(0);
        };

        const handleTouchStart = (event: TouchEvent) => {
            if (event.touches.length !== 1 || element.scrollTop > 0) return;
            const target = event.target as HTMLElement | null;
            if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;

            startY = event.touches[0].clientY;
            startTime = performance.now();
            currentOffset = 0;
            started = true;
            captured = false;
        };

        const handleTouchMove = (event: TouchEvent) => {
            if (!started || event.touches.length !== 1) return;
            const deltaY = event.touches[0].clientY - startY;

            if (deltaY <= 0) {
                if (captured) reset();
                return;
            }
            if (!captured && element.scrollTop > 0) {
                started = false;
                return;
            }
            if (!captured && deltaY < 7) return;

            captured = true;
            event.preventDefault();
            currentOffset = Math.min(deltaY * 0.72, window.innerHeight * 0.38);
            setDragging(true);
            setOffset(currentOffset);
        };

        const handleTouchEnd = () => {
            if (!started) return;
            const elapsed = Math.max(1, performance.now() - startTime);
            const velocity = currentOffset / elapsed;
            const shouldDismiss = captured && (currentOffset >= threshold || (currentOffset >= 48 && velocity > 0.42));

            started = false;
            captured = false;
            setDragging(false);

            if (shouldDismiss) {
                setOffset(Math.min(window.innerHeight * 0.42, 360));
                dismissTimer = window.setTimeout(() => onDismissRef.current(), 150);
                return;
            }

            currentOffset = 0;
            setOffset(0);
        };

        element.addEventListener('touchstart', handleTouchStart, { passive: true });
        element.addEventListener('touchmove', handleTouchMove, { passive: false });
        element.addEventListener('touchend', handleTouchEnd, { passive: true });
        element.addEventListener('touchcancel', reset, { passive: true });

        return () => {
            window.clearTimeout(dismissTimer);
            element.removeEventListener('touchstart', handleTouchStart);
            element.removeEventListener('touchmove', handleTouchMove);
            element.removeEventListener('touchend', handleTouchEnd);
            element.removeEventListener('touchcancel', reset);
        };
    }, [threshold]);

    return {
        ref,
        style: {
            transform: offset > 0 ? `translate3d(0, ${offset}px, 0)` : undefined,
            transition: dragging ? 'none' : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
            willChange: 'transform',
        },
    };
}
