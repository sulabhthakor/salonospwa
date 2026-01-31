import { getMemberships, getMyClientMemberships } from '@/actions/memberships';
import MembershipList from '@/components/client/membership-list';

export default async function MembershipsPage() {
    const membershipsData = await getMemberships();
    const myMembershipsData = await getMyClientMemberships();

    // Check for errors or default to empty
    const available = membershipsData.memberships || [];
    const myMemberships = myMembershipsData.memberships || [];

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Memberships</h1>
                <p className="text-muted-foreground">Unlock exclusive benefits and savings with our membership plans.</p>
            </div>
            <MembershipList available={available} myMemberships={myMemberships} />
        </div>
    );
}
