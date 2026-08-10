import AppLogoIcon from './app-logo-icon';
import BrandLogo from './brand-logo';

export default function AppLogo() {
    return (
        <>
            <BrandLogo className="h-10 w-28 group-data-[collapsible=icon]:hidden" />
            <div className="hidden size-8 items-center justify-center group-data-[collapsible=icon]:flex">
                <AppLogoIcon className="h-6 w-4 fill-current" />
            </div>
        </>
    );
}
