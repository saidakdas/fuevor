import BrandLogo from '@/components/brand-logo';
import { useEffect, useState } from 'react';

const INTRO_DURATION_MS = 2000;

export default function OpeningIntro() {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timeout = window.setTimeout(() => setVisible(false), INTRO_DURATION_MS);

        return () => window.clearTimeout(timeout);
    }, []);

    if (!visible) return null;

    return (
        <div className="opening-intro" role="status" aria-label="Fuevor — build your future self">
            <div className="opening-intro__stage">
                <div className="opening-intro__logo-reveal">
                    <BrandLogo variant="black" className="opening-intro__logo" />
                    <span className="opening-intro__shine" aria-hidden="true" />
                </div>
                <p className="opening-intro__slogan">build your future self</p>
            </div>
        </div>
    );
}
