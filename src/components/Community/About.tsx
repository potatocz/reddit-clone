import { Community, communityState } from '@/src/atoms/communitiesAtom';
import React, { useRef, useState } from 'react';
import { Box, Flex, Text, Icon, Stack, Divider, Link, Button, Image, Spinner } from '@chakra-ui/react';
import { HiOutlineDotsHorizontal } from 'react-icons/hi';
import { RiCakeLine } from 'react-icons/ri'
import { FaReddit } from 'react-icons/fa';
import moment from "moment";
import { auth, storage, firestore } from '../../firebase/clientApp';
import { useAuthState } from 'react-firebase-hooks/auth';
import useSelectFile from '@/src/hooks/useSelectFile';
import { ref, getDownloadURL, uploadString } from 'firebase/storage';
import { updateDoc, doc} from 'firebase/firestore';
import { useSetRecoilState } from 'recoil';

type AboutProps = {
    communityData: Community;
};

const About:React.FC<AboutProps> = ({ communityData }) => {
    const [user] = useAuthState(auth);
    const selectedFileRef = useRef<HTMLInputElement>(null);
    const { selectedFile, setSelectedFile, onSelectFile} = useSelectFile();
    const [uploadingImage, setUploadingImage] = useState(false);
    const setCommunityStateValue = useSetRecoilState(communityState);

    const onUpdateImage = async () => {
        if(!selectedFile) return;
        try {
            const imageRef = ref(storage, `communities/${communityData.id}/image`);
            await uploadString(imageRef, selectedFile, 'data_url');
            const downloadURL = await getDownloadURL(imageRef);
            await updateDoc(doc(firestore, "communities", communityData.id), {
                imageURL: downloadURL,
            });

            setCommunityStateValue(prev => ({
                ...prev,
                currentCommunity: {
                    ...prev.currentCommunity,
                    imageURL: downloadURL
                } as Community,
            }));
        } catch (error) {
            console.log('onUpdateLoading error', error);
        }
        setUploadingImage(false);
    };

    return (
    <Box position="sticky" top="14px">
        <Flex justify="space-between" align="center" bg="blue.400" color="white" p={3} borderRadius="4px 4px 0px 0px">
            <Text fontSize="10pt" fontWeight={700}>About Community</Text>
            <Icon as={HiOutlineDotsHorizontal} />
        </Flex>
        <Flex direction="column" padding={3} bg="white" borderRadius="0px 0px 4px 4px">
            <Stack>
                <Flex width="100%" p={2} fontSize="10pt" fontWeight={700}>
                    <Flex direction="column" flexGrow={1}>
                        <Text>{communityData.numberOfMembers.toLocaleString()}</Text>
                        <Text>Members</Text>
                    </Flex>
                    <Flex direction="column" flexGrow={1}>
                        <Text>1</Text>
                        <Text>Online</Text>
                    </Flex>
                </Flex>
                <Divider />
                <Flex align="center" width="100%" p={1} fontSize="10pt" fontWeight={500}>
                    <Icon as={RiCakeLine} fontSize={18} mr={2} />
                    {communityData.createdAt && (
                    <Text>
                        Created {" "}{moment(new Date(communityData.createdAt.seconds * 1000)).format('MMM DD, YYYY')}
                    </Text>
                    )}
                </Flex>
                <Link href={`/r/${communityData.id}/submit`}>
                    <Button mt={3} height="30px">Create Post</Button>
                </Link>
                {communityData.creatorId === user?.uid && (
                    <>
                        <Divider />
                        <Stack spacing={1} fontSize="10pt">
                            <Text fontWeight={600}>Admin</Text>
                            <Flex align="center" justify="space-between">
                                <Text 
                                    color="blue.500" 
                                    cursor="pointer" 
                                    _hover={{ textDecoration: "underline"}}
                                    onClick={() => selectedFileRef.current?.click()}    
                                >
                                    Change Profile Image
                                </Text>
                                {communityData.imageURL || selectedFile ?(
                                    <Image src={selectedFile || communityData.imageURL} borderRadius="full" boxSize="40px" alt="Community Img"/> 
                                ) : <Icon as={FaReddit} fontSize={40} color="brand.100" mr={2} />}
                            </Flex>
                            {selectedFile && 
                                (uploadingImage ? <Spinner /> : (<Text onClick={onUpdateImage} cursor="pointer">Save changes</Text>))}
                            <input
                                id="file-upload"
                                type="file"
                                accept="image/x-png,image/gif,image/jpg,image/png"
                                hidden
                                ref={selectedFileRef}
                                onChange={onSelectFile}
                            />
                        </Stack>
                    </>
                )}
            </Stack>
        </Flex>
    </Box>
        )
}
export default About;