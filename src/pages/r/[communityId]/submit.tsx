import PageContent from '@/src/components/Layout/PageContent';
import React from 'react';
import { Box, Text } from '@chakra-ui/react';
import { useRecoilValue } from 'recoil';
import NewPostForm from '@/src/components/Posts/NewPostForm';
import {useAuthState} from 'react-firebase-hooks/auth';
import {auth} from '../../../firebase/clientApp';
import {communityState} from '../../../atoms/communitiesAtom';
import useCommunityData from '@/src/hooks/useCommunityData';
import About from '../../../components/Community/About';

const SubmitHostPage:React.FC = () => {
    const [user] = useAuthState(auth);
    //const communityStateValue = useRecoilValue(communityState);
    const { communityStateValue } = useCommunityData();
    return (
        <PageContent>
            <>
                <Box p="14px 0px" borderBottom="1px solid" borderColor="white">
                    <Text>Create post</Text>

                </Box>
                {user && <NewPostForm user={user} communityImageURL={communityStateValue.currentCommunity?.imageURL} />}
            </>
            <>
                {communityStateValue.currentCommunity && (<About communityData={communityStateValue.currentCommunity}/>)}
            </>
        </PageContent>
    )
}
export default SubmitHostPage;