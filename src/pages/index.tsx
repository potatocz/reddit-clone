import { Inter } from 'next/font/google'
import {useEffect, useState} from 'react'
import PageContent from '../components/Layout/PageContent'
import {NextPage} from 'next';
import { query, collection, orderBy, limit, getDocs, where } from '@firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, firestore } from '../firebase/clientApp';
import usePosts from '../hooks/usePosts';
import { communityState } from '../atoms/communitiesAtom';
import { useRecoilValue } from 'recoil';
import { Post, postState, PostVote } from '../atoms/postAtom';
import PostLoader from '../components/Posts/PostLoader';
import {Stack} from '@chakra-ui/react';
import PostItem from '../components/Posts/PostItem';
import CreatePostLink from '../components/Community/CreatePostLink';
import useCommunityData from '../hooks/useCommunityData';
import Recommendations from '../components/Community/Recommendations';
import Premium from '../components/Community/Premium';
import PersonalHome from '../components/Community/PersonalHome';
const inter = Inter({ subsets: ['latin'] })


const Home: NextPage = () => {
  const [user, loadingUser] = useAuthState(auth);
  const [loading, setLoading] = useState(false);
  const { postStateValue, setPostStateValue, onSelectPost, onDeletePost, onVote } = usePosts();
  const {communityStateValue} = useCommunityData()

  const buildUserHomeFeed = async () => {
    setLoading(true);
    try {
      //we need to know if hes in communities
      if(communityStateValue.mySnippets.length){
        //get posts from communities
        const myCommunityIds = communityStateValue.mySnippets.map(
        (snippet) => snippet.communityId
        );
        const postQuery = query(
          collection(firestore, 'posts'), 
          where('communityId', "in", myCommunityIds),
          limit(10)
          );
          const postDocs = await getDocs(postQuery);
          const posts = postDocs.docs.map(doc => ({id: doc.id, ...doc.data() }));
      setPostStateValue((prev)=> ({
        ...prev,
        posts: posts as Post[]
      }));
      }else{
        buildNoUserHomeFeed();
      }

    } catch (error) {
      console.log('buildUserHomeFeed', error)
    }
    setLoading(false);
  }; 

  const buildNoUserHomeFeed = async () => {
    setLoading(true);
    try {
      const postQuery = query(
        collection(firestore, 'posts'), 
        orderBy('voteStatus', 'desc'),
        limit(10)
      );

      const postDocs = await getDocs(postQuery);
      const posts = postDocs.docs.map(doc => ({id: doc.id, ...doc.data() }));
      setPostStateValue((prev)=> ({
        ...prev,
        posts: posts as Post[]
      }));

    } catch (error) {
      console.log('buildNoUserHomeFeed', error)
    }
    setLoading(false);
  }; 

  const getUserPostVotes = async () => {
    try {
      const postIds = postStateValue.posts.map(post => post.id);
      const postVotesQuery = query(
        collection(firestore,`users/${user?.uid}/postVotes`),
        where('postId','in',postIds)
      );
      const postVoteDocs = await getDocs(postVotesQuery);
      const postVotes = postVoteDocs.docs.map(doc => ({id: doc.id, ...doc.data() }));
      setPostStateValue((prev)=>({
        ...prev,
        postVotes: postVotes as PostVote[]
      }));
    } catch (error) {
      console.log('getUserPostVotes', error)
    }
  };

  //useEffects
  useEffect(() => {
    if(communityStateValue.snippetsFetched) buildUserHomeFeed(); 
  },[communityStateValue.snippetsFetched])

  useEffect(() => {
    if(!user && !loadingUser) buildNoUserHomeFeed();
  },[user, loadingUser]);

  useEffect(() => {
    if(user && postStateValue.posts.length) getUserPostVotes();
    //clean up function
    return () => {
      setPostStateValue((prev)=>({
        ...prev,
        postVotes: [],
      }));
    }
  },[user, postStateValue.posts])

  return (
    <PageContent>
      <>
        <CreatePostLink />
        {loading ? (
          <PostLoader/>
        ): (
          <Stack>
            {postStateValue.posts.map( post => (
              <PostItem 
                key={post.id}
                post={post}
                onSelectPost={onSelectPost}
                onDeletePost={onDeletePost}
                onVote={onVote}
                userVoteValue={postStateValue.postVotes.find(item => item.postId === post.id)?.voteValue} 
                userIsCreator={user?.uid === post.creatorId}
                homePage
              />
            ))}
          </Stack>
        )}
      </>
      <Stack spacing={5}>
        <Recommendations />
        <Premium />
        <PersonalHome />
      </Stack>
    </PageContent>
  )
};

export default Home;
