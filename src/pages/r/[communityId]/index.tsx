import React, {useEffect} from 'react';
import { GetServerSidePropsContext } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/src/firebase/clientApp';
import { Community } from '@/src/atoms/communitiesAtom';
import safeJsonStringify from 'safe-json-stringify';
import NotFound from '@/src/components/Community/NotFound';
import Header from '@/src/components/Community/Header';
import PageContent from '@/src/components/Layout/PageContent';
import CreatePostLink from '@/src/components/Community/CreatePostLink';
import Posts from '@/src/components/Posts/Posts';
import { useSetRecoilState } from 'recoil';
import {communityState} from '../../../atoms/communitiesAtom';
import About from '@/src/components/Community/About';


type CommunityPageProps = {
    communityData: Community;
};

const CommunityPage:React.FC<CommunityPageProps> = ({ communityData }) => {
    console.log("here are the data", communityData);
    const setCommunityStateValue = useSetRecoilState(communityState);

    //check if the community we want to load exists or not
    if (!communityData){
        return (
            <NotFound/>
        )
    }

    useEffect(() => {
        setCommunityStateValue(prev => ({
            ...prev, 
            currentCommunity: communityData,
        }));
    }, [communityData]);

    return (
    <>
        <Header communityData={communityData}/>
        <PageContent>
            <>
                <CreatePostLink/>
                <Posts communityData={communityData} />
            </>
            <>
                <About communityData={communityData} />
            </>
        </PageContent>
    </>)
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    //get community data and pass them into client
    try {
        const communityDocRef = doc(
            firestore,
            'communities', 
            context.query.communityId as string
        );
        const communityDoc = await getDoc(communityDocRef);

        return {
            props: {
                communityData: communityDoc.exists() ? JSON.parse(
                    safeJsonStringify({ id: communityDoc.id, ...communityDoc.data() })
                ) : "",
            },
        };
    } catch (error) {
        // Could add error page here
        console.log('getServerSideProps error', error);
    } 
}

export default CommunityPage;