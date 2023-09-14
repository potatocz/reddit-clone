import { atom } from 'recoil';
import { Timestamp } from 'firebase/firestore';

export interface Community{
    id: string;
    creatorId: string;
    numberOfMembers: number;
    privacyType: 'public' | 'restricted' | 'private';
    createdAt?: Timestamp; //? means optional
    imageURL?: string;
}

export interface CommunitySnippet{
    communityId: string;
    isModerator?: boolean;
    imageURL?: string;
}

interface CommunityState{
    mySnippets: CommunitySnippet[];
    currentCommunity?: Community;
    snippetsFetched: boolean;
}

const defaultCommunityState: CommunityState = {
    mySnippets:[],
    snippetsFetched: false,
}

export const communityState = atom<CommunityState>({
    key: 'communitiesState',
    default: defaultCommunityState,
})