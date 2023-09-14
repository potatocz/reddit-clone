import React, { useEffect } from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { Post, postState, PostVote } from '../atoms/postAtom';
import { firestore, storage, auth } from '../firebase/clientApp';
import { ref, deleteObject } from 'firebase/storage';
import { doc, deleteDoc, getDocs, writeBatch, collection, where, query } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { communityState } from '../atoms/communitiesAtom';
import { authModalState } from '../atoms/authModalAtom';
import { useRouter } from 'next/router'

const usePosts = () => {
    const [user] = useAuthState(auth);
    const router = useRouter();
    const [postStateValue, setPostStateValue] = useRecoilState(postState);
    const currentCommunity = useRecoilValue(communityState).currentCommunity;
    const setAuthModalState = useSetRecoilState(authModalState);

    const onVote = async (event: React.MouseEvent<SVGAElement, MouseEvent>,post: Post, vote: number, communityId: string) => {
        event.stopPropagation();
        //if no user -> open auth
        if(!user?.uid){
            setAuthModalState({ open: true, view: "login"});
            return;
        }

        try {
            const {voteStatus} = post;
            const existingVote = postStateValue.postVotes.find(
                (vote) => vote.postId === post.id);
            const batch = writeBatch(firestore);
            const updatedPost = {...post};
            const updatedPosts = [...postStateValue.posts];
            let updatedPostVotes = [...postStateValue.postVotes];
            let voteChange = vote;

            //new vote
            if(!existingVote){
                //create a new document
                const postVoteRef = doc(
                    collection(firestore, 'users', `${user?.uid}/postVotes`)
                )
                //create new postVote docs
                const newVote: PostVote = {
                    id: postVoteRef.id,
                    postId: post.id!,
                    communityId,
                    voteValue: vote, // + 1 or - 1
                };
                //add or substrack 1 to/from the post.voteStatus
                batch.set(postVoteRef, newVote);

                updatedPost.voteStatus = voteStatus + vote;
                updatedPostVotes = [...updatedPostVotes, newVote];

                //batch.set(postVoteRef, newVote);
            }
            // existing votes
            else {
                const postVoteRef = doc(
                    firestore,
                    'users',
                    `${user?.uid}/postVotes/${existingVote.id}`
                );
                //removing vote
                if (existingVote.voteValue === vote){
                    updatedPost.voteStatus = voteStatus - vote;
                    updatedPostVotes = updatedPostVotes.filter(
                        (vote) => vote.id !== existingVote.id
                    );
                    batch.delete(postVoteRef);
                    voteChange *= -1; 
                }
                //flipping votes
                else {
                    updatedPost.voteStatus = voteStatus + 2 * vote;
                    const voteIndex = postStateValue.postVotes.findIndex(
                        (vote) => vote.id === existingVote.id
                    );
                    updatedPostVotes[voteIndex] = {
                        ...existingVote,
                        voteValue: vote,
                    };
                    //updating the existing postVote document
                    batch.update(postVoteRef, {
                        voteValue: vote,
                    });
                    voteChange = 2 * vote;
                }
            }

            //update state with updated values
            const postIndex = postStateValue.posts.findIndex(item => item.id === post.id)
            updatedPosts[postIndex] = updatedPost;
            setPostStateValue(prev => ({
                ...prev,
                posts: updatedPosts,
                postVotes: updatedPostVotes,
            }));

            if(postStateValue.selectedPost){
                setPostStateValue(prev => ({
                    ...prev,
                    selectedPost: updatedPost,
                }))
            }

            //update our post doc
            const postRef = doc(firestore, 'posts', post.id);
            batch.update(postRef, {voteStatus: voteStatus + voteChange })

            await batch.commit();

        } 
        catch (error) {
            console.log('onVote error', error);
        }

    }   

    const onSelectPost = (post: Post) => {
        setPostStateValue((prev) => ({
            ...prev,
            selectedPost: post,
        }));
        router.push(`/r/${post.communityId}/comments/${post.id}`);
    }

    const onDeletePost = async (post: Post): Promise<boolean> => {
        try {
            //check if there is an img
            if(post.imageURL){
                const imageRef = ref(storage, `posts/$(post.id)/image`);
                await deleteObject(imageRef);
            }
            //delete post doc from firestore
            const postDocRef = doc(firestore, 'posts', post.id);
            await deleteDoc(postDocRef);
            //update recoil state
            setPostStateValue((prev) => ({
                ...prev,
                posts: prev.posts.filter((item) => item.id !== post.id)
            }))
            return true;
        } catch (error) {
            return false;   
        }
    };
    
    const getCommunityPostVotes = async (communityId: string) => {
        const postVotesQuery = query(
            collection(firestore, 'users', `${user?.uid}/postVotes`),
            where('communityId','==', communityId)
        );

        const postVoteDocs = await getDocs(postVotesQuery);
        const postVotes = postVoteDocs.docs.map((doc) => ({ 
            id: doc.id,
            ...doc.data()
        }));
        setPostStateValue((prev) => ({
            ...prev,
            postVotes: postVotes as PostVote[],
        }));
    };

    useEffect(() => {
        if (!user || !currentCommunity?.id) return;
        getCommunityPostVotes(currentCommunity?.id)
    }, [user, currentCommunity]);

    useEffect(() => {
        if(!user){
            setPostStateValue((prev) => ({
                ...prev,
                postVotes: [],
            }));
        }
    }, [user]);

    return {
        postStateValue,
        setPostStateValue,
        onVote,
        onDeletePost,
        onSelectPost,
    };
};
export default usePosts;