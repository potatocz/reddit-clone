import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Flex,
  Icon,
  Input,
  Stack,
  Textarea,
  Image,
  Text, 
  Alert,
  AlertIcon
} from "@chakra-ui/react";
import { User } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useRouter } from "next/router";
import { BiPoll } from "react-icons/bi";
import { BsLink45Deg, BsMic } from "react-icons/bs";
import { IoDocumentText, IoImageOutline } from "react-icons/io5";
import { AiFillCloseCircle } from "react-icons/ai";
import { useRecoilState, useSetRecoilState } from "recoil";
import { firestore, storage } from "../../firebase/clientApp";
import TabItem from "./TabItem";
import { Post } from "../../atoms/postAtom";
import { getDownloadURL, ref, uploadString } from "firebase/storage";
import TextInputs from "./PostForm/TextInputs";
import ImageUpload from "./PostForm/ImageUpload";
import { Timestamp } from "@google-cloud/firestore";
import useSelectFile from "@/src/hooks/useSelectFile";

type NewPostFormProps = {
    user: User;
    communityImageURL?: string; 
};

const formTabs: TabItem[] = [
    {
        title: 'Post',
        icon: IoDocumentText
    },
    {
        title: 'Image & Video',
        icon: IoImageOutline
    },
    {
        title: 'Link',
        icon: BsLink45Deg
    },
    {
        title: 'Poll',
        icon: BiPoll
    },
    {
        title: 'Talk',
        icon: BsMic
    },
]

export type TabItem = {
    title: string;
    icon: typeof Icon.arguments;
}

const NewPostForm:React.FC<NewPostFormProps> = ({ user, communityImageURL }) => {
        const [selectedTab, setSelectedTab] = useState(formTabs[0].title);
        const [textInputs, setTextInputs] = useState({
            title: '',
            body: '',
        });
        //const [selectedFile, setSelectedFile] = useState<string>()
        const { selectedFile, setSelectedFile, onSelectFile} = useSelectFile();
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState(false);
        const router = useRouter();

        const handleCreatePost = async () => {

            //get community id from URL
            const { communityId } = router.query
            // construct new object - type post
            const newPost: Post = {
                communityId: communityId as string,
                communityImageURL: communityImageURL || "",
                creatorId: user.uid,
                creatorDisplayName:  user.email!.split('@')[0],
                title: textInputs.title,
                body: textInputs.body,
                numberOfComments: 0,
                voteStatus: 0,
                createdAt: serverTimestamp() as Timestamp,
            };
            setLoading(true);
            //store post in DB
            try {
                const postDocRef = await addDoc(collection(firestore, "posts"),newPost);

                // see if we are including IMG (use of firestore)
                if (selectedFile){
                    //store in storage
                    const imageRef = ref(storage, `post/${postDocRef.id}/image`);
                    await uploadString(imageRef, selectedFile, 'data_url');
                    // return URL to that saved img
                    const downloadURL = await getDownloadURL(imageRef);

                    // update post with that url
                    await updateDoc(postDocRef, {
                        imageURL: downloadURL,
                    });
                }
                //reload user to community page
                router.back();
                
            } catch (error: any) {
                console.log('createPost error', error.message)
                setError(true);
            }
            setLoading(false);

        };

        //const onSelectImage = (
        //    event: React.ChangeEvent<HTMLInputElement>) => {
        //       const reader = new FileReader();

        //       if (event.target.files?.[0]){
        //        reader.readAsDataURL(event.target.files[0]);
        //       }

        //       reader.onload = (readerEvent) => {
        //            if (readerEvent.target?.result) {
        //               setSelectedFile(readerEvent.target.result as string)
        //            };
        //       };
        //    };

        const onTextChange = (
            event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
        ) => {
            const {
                target: { name, value },
            } = event;
            setTextInputs((prev)=>({
                ...prev,
                [name]: value,
            }));
        };

    return (
        <Flex direction="column" bg="white" borderRadius={4} mt={2}>
            <Flex width="100%" >
                {formTabs.map((item) => (
                    <TabItem 
                        key={item.title}
                        item={item} 
                        selected={item.title === selectedTab}
                        setSelectedTab={setSelectedTab}
                    />
                ))}
            </Flex>
            <Flex p={4}>
                {selectedTab === 'Post' && (<TextInputs 
                    textInputs={textInputs} 
                    handleCreatePost={handleCreatePost} 
                    onChange={onTextChange} 
                    loading={loading }
                />)}
                {selectedTab === 'Image & Video' && (
                    <ImageUpload 
                        selectedFile={selectedFile} 
                        onSelectImage={onSelectFile} 
                        setSelectedFile={setSelectedFile}
                        setSelectedTab={setSelectedTab}
                    />)} 
            </Flex>
            {error && (
                <Alert status="error">
                    <AlertIcon />
                    <Text mr={2}>Error creating post</Text>
                </Alert>
            )}
        </Flex>
    )
}
export default NewPostForm;