import React, {useState, useEffect} from 'react';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { communityState, Community, CommunitySnippet } from '../atoms/communitiesAtom';
import { auth } from '../firebase/clientApp';
import { useAuthState } from 'react-firebase-hooks/auth';
import { firestore } from '@/src/firebase/clientApp';
import { writeBatch, doc, collection, getDocs, increment, getDoc } from 'firebase/firestore';
import { authModalState } from '../atoms/authModalAtom';
import { useRouter } from 'next/router';

const useCommunityData = () => {

    const [communityStateValue, setCommunityStateValue] = 
    useRecoilState(communityState);
    const setAuthModalState = useSetRecoilState(authModalState);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [user] = useAuthState(auth);
    const router = useRouter();

    const onJoinOrLeaveCommunity = (
        communityData: Community, 
        isJoined: boolean
    ) => {
        // is used signed in?
        //if not open auth modal

        if(!user){
            //open modal
            setAuthModalState({open: true, view: 'login'});
            return;
        }

        setLoading(true);
        if(isJoined){
            leaveCommunity(communityData.id);
            return;
        }
        joinCommunity(communityData);
        //if not - open auth model

    }

    const getMySnippets = async () => {
        setLoading(true);
        try {
            //get users snippets
            const snippetDocs = await getDocs(
                collection(firestore, `users/${user?.uid}/communitySnippets`)
            );
            
            const snippets = snippetDocs.docs.map((doc)=> ({...doc.data() }));

            setCommunityStateValue((prev) => ({
                ...prev,
                mySnippets: snippets as CommunitySnippet[],
                snippetsFetched: true,
            }));

            console.log('here are snippets:', snippets);

        } catch (error: any) {
            console.log('getMySnippets error: ', error); 
            setError(error.message);
        }
        setLoading(false);
    }

    const joinCommunity = async (communityData: Community) => {
        //batch write
            //updating the numberofCommunities

        try {
            const batch = writeBatch(firestore);

            //create new community snippet
            const newSnippet: CommunitySnippet = {
                communityId: communityData.id,
                imageURL: communityData.imageURL || "",
                isModerator: user?.uid === communityData.creatorId,
            };
            batch.set(
                doc(
                    firestore, 
                    `users/${user?.uid}/communitySnippets`,
                    communityData.id
                ),
                newSnippet
            );

            batch.update(doc(firestore, 'communities', communityData.id),{
                numberOfMembers: increment(1)
            });
            await  batch.commit();

            //update recoil state - communityState.mySnippets
            setCommunityStateValue((prev) => ({
                ...prev,
                mySnippets: [...prev.mySnippets, newSnippet],
            }));

        } catch (error: any) {
            console.log('joinCommunity error', error);
            setError(error.message);
        }
        setLoading(false);
    };

    const leaveCommunity = async  (communityId: string) => {
        //batch write
            //delete snippiet from user
            //update number -1

        try {
            const batch = writeBatch(firestore);
            //delete snippiet from user
            batch.delete(
                doc(firestore, `users/${user?.uid}/communitySnippets`, communityId)
            );
            batch.update(doc(firestore, 'communities', communityId),{
                numberOfMembers: increment(-1),
            });
            await batch.commit();

            //update recoil state
            setCommunityStateValue((prev) => ({
                ...prev,
                mySnippets: prev.mySnippets.filter(
                    (item) => item.communityId !== communityId
                ),
            }));
            
        } catch (error: any) {
            console.log('leaveCommunity error', error);
            setError(error.message);
        }
        setLoading(false);
    };

    const getCommunityData =  async ( communityId: string) => {
        try {
            const communityDocRef = doc(firestore, 'communities', communityId);
            const communityDoc = await getDoc(communityDocRef);

            setCommunityStateValue((prev) => ({
                ...prev,
                currentCommunity: {
                    id: communityDoc.id,
                    ...communityDoc.data(),
                } as Community,
            }));

        } catch (error) {
            console.log('getCommunutityData error', error)
        }
    }

    useEffect(() => {
        if(!user){
            setCommunityStateValue(prev => ({
                ...prev,
                mySnippets: [],
                snippetsFetched: false,
            }));
            return;
        };
        getMySnippets();
    }, [user]);

    useEffect(() => {
        const { communityId } = router.query
        if(communityId && !communityStateValue.currentCommunity){
            getCommunityData(communityId as string);
        }
    }, [router.query, communityStateValue.currentCommunity]);
    
    return {
        //returns not html but data
        communityStateValue,
        onJoinOrLeaveCommunity,
        loading,
    };
};
export default useCommunityData;