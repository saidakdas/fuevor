import BrandLogo from '@/components/brand-logo';
import { useEffect, useState } from 'react';

const INTRO_DURATION_MS = 2000;
const OPENING_INTRO_EVENT = 'fuevor:opening-intro';

export function playOpeningIntro() {
    window.dispatchEvent(new Event(OPENING_INTRO_EVENT));
}

export default function OpeningIntro() {
    const [visible, setVisible] = useState(true);
    const [sequence, setSequence] = useState(0);

    useEffect(() => {
        const replay = () => {
            setVisible(true);
            setSequence((currentSequence) => currentSequence + 1);
        };

        window.addEventListener(OPENING_INTRO_EVENT, replay);

        return () => window.removeEventListener(OPENING_INTRO_EVENT, replay);
    }, []);

    useEffect(() => {
        const timeout = window.setTimeout(() => setVisible(false), INTRO_DURATION_MS);

        return () => window.clearTimeout(timeout);
    }, [sequence]);

    if (!visible) return null;

    return (
        <div key={sequence} className="opening-intro" role="status" aria-label="Fuevor — build your future self">
            <span className="opening-intro__orb opening-intro__orb--one" aria-hidden="true" />
            <span className="opening-intro__orb opening-intro__orb--two" aria-hidden="true" />

            <div className="opening-intro__glass">
                <div className="opening-intro__logo-reveal">
                    <BrandLogo variant="black" className="opening-intro__logo" />
                    <img
                        src="/fuevor-beta-text.svg"
                        alt=""
                        aria-hidden="true"
                        draggable={false}
                        className="opening-intro__beta"
                    />
                    <span className="opening-intro__shine" aria-hidden="true" />
                </div>
                <p className="opening-intro__slogan">build your future self</p>
            </div>
        </div>
    );
}
