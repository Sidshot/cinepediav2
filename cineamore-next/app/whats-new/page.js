
import WhatsNewPage from './WhatsNewContent';

export const dynamic = 'force-static';
export const revalidate = 604800; // 7 days

export default function Page() {
    return <WhatsNewPage />;
}
