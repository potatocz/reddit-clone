import React, {useEffect, useState} from 'react';
import { Community } from '@/src/atoms/communitiesAtom';
import {collection, query, where, orderBy, getDocs} from 'firebase/firestore';
import { firestore, auth } from '@/src/firebase/clientApp';
import usePosts from '@/src/hooks/usePosts';
import { Post } from '@/src/atoms/postAtom';
import {useAuthState} from 'react-firebase-hooks/auth';
import PostItem from './PostItem';
import { Stack } from '@chakra-ui/react';
import PostLoader from './PostLoader';
 
type PostsProps = {
    communityData: Community;
};

const Posts:React.FC<PostsProps> = ({ communityData  }) => {

    const [user] = useAuthState(auth);
    const [loading, setLoading] = useState(false);
    //const [error, setError] = useState("");
    const { postStateValue, setPostStateValue, onVote, onDeletePost, onSelectPost } = usePosts();
    const getPosts = async () => {
        try {
            setLoading(true);
            //get posts for this community
            const postsQuery = query(
                collection(firestore, 'posts'),
                where('communityId','==',communityData.id),
                orderBy('createdAt', 'desc') 
            );
            //get all docs
            const postDocs = await getDocs(postsQuery);
            // store in post state
            const posts = postDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPostStateValue((prev) => ({
                ...prev,
                posts: posts as Post[]
            }));
            
        } catch (error: any) {
            console.log('getPosts error', error.message);
            //setError()
        }
        setLoading(false);
    };

    useEffect(()=>{
        getPosts();
    }, [communityData]);
    
    return (
    <>
    {loading ? (
        <PostLoader/>
    ) : (
        <Stack>
        {postStateValue.posts.map(item => (
            <PostItem 
                key={item.id}
                post={item} 
                userIsCreator={user?.uid === item.creatorId}
                userVoteValue={postStateValue.postVotes.find(
                    (vote) => vote.postId === item.id)?.voteValue}
                onVote={onVote}
                onSelectPost={onSelectPost} 
                onDeletePost={onDeletePost}
            />
        ))}
        </Stack>
        )
    }
    </>
    )
}
export default Posts;