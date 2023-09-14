import React, {useState} from 'react';
import { Box, Input, Icon, Flex, Text, Divider,Checkbox, Stack, Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter} from '@chakra-ui/react'
import { BsFillEyeFill, BsFillPersonFill } from 'react-icons/bs';
import { HiLockClosed } from 'react-icons/hi';
import { doc, getDoc, setDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { auth, firestore } from '@/src/firebase/clientApp';
import { useAuthState } from 'react-firebase-hooks/auth';
import useDirectory from '@/src/hooks/useDirectory';
import {useRouter} from 'next/router';


type CreateCommunityModalProps = {
    open: boolean;
    handleClose: () => void;
};

const CreateCommunityModal:React.FC<CreateCommunityModalProps> = ({
    open,
    handleClose,
}) => {
    const [user] = useAuthState(auth);
    const [communityName, setCommunityName] = useState('');
    const [charsRemaining, setCharsRemaining] = useState(21);
    const [communityType, setCommunityType] = useState("public");
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const {toggleMenuOpen} = useDirectory();

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.value.length > 21) return;

        setCommunityName(event.target.value);
        setCharsRemaining(21 - event.target.value.length)
    };

    const onCommunityTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setCommunityType(event.target.name);
    }

    const handleCreateCommunity = async () => {

        //if there is previous error, delete that
        if (error) setError("");
        //Validate the community name (unique, long enough etc)
        const format = /[ `!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?~]/;
        if (format.test(communityName) || communityName.length < 3){
            setError('Communitites must be longer then 3 characters and only contain numbers nad letters.');
        }

        setLoading(true);

        try {
            //Create the community in firestore
            //Check name isnt taken
            const communityDocRef = doc(firestore, 'communities', communityName);

            await runTransaction(firestore, async (transaction) => {
                const communityDoc = await transaction.get(communityDocRef);    
                if (communityDoc.exists()){
                    throw new Error(`Sorry, r/${communityName} is already taken, try another one.`);
                }
            //If valid, create
            
                transaction.set(communityDocRef, {
                    creatorId: user?.uid,
                    createdAt: serverTimestamp(),
                    numberOfMembers: 1,
                    privacyType: communityType
                });              

            //create Community Snippet on user
                transaction.set(
                    doc(firestore, `users/${user?.uid}/communitySnippets`, communityName),{
                    communityId: communityName,
                    isModerator: true,
                });
             });
             handleClose();
             toggleMenuOpen();
             router.push(`r/${communityName}`);

        } catch (error: any) {
            console.log('handleCreateCommunity error', error);
            setError(error.message);
        }   

        setLoading(false);
    };

    return (
        <>
            <Modal isOpen={open} onClose={handleClose} size="lg">
                <ModalOverlay />
                <ModalContent>
                <ModalHeader 
                    display="flex"
                    flexDirection="column"
                    fontSize={15}
                    padding={3}
                >
                    Create a Community
                </ModalHeader>
                <Box pl={3} pr={3}>
                    <Divider/>
                    <ModalCloseButton />
                    <ModalBody
                        display="flex"
                        flexDirection="column"
                        padding="10px 0px"
                    >
                        <Text fontWeight={600} fontSize={15}>Name</Text>
                        <Text fontSize={11} color="gray.500">Community names icluding capitalization cannot be changed</Text>
                        <Text position="relative" top="28px" left="10px" width="20px" color="gray.400">r/</Text>
                        <Input position="relative" value={communityName} size="sm" pl="22px" onChange={handleChange}/>
                        <Text fontSize="9pt" color={charsRemaining === 0 ? "red" : "gray.500"}>{charsRemaining} Characters remaining</Text>
                        <Text fontSize="9pt" color="red" pt={1}>{error}</Text> 
                        <Box mt={4} mb={4}>
                            <Text fontWeight={600} fontSize={15}>
                                Community Type
                            </Text>
                            {/*checkbox*/}
                            <Stack spacing={2}>
                                <Checkbox 
                                    name="public" 
                                    isChecked={communityType === "public"}
                                    onChange={onCommunityTypeChange}
                                >
                                    <Flex align="center">
                                        <Icon color="gray.500" mr={2} as={BsFillPersonFill}/>
                                        <Text mr={3} fontSize="10pt">Public</Text>
                                        <Text fontSize="8pt" color="gray.500" pt={1}>Anyone can view, post or comment to this community</Text>
                                    </Flex>
                                </Checkbox>
                                <Checkbox 
                                    name="restricted" 
                                    isChecked={communityType === "restricted"}
                                    onChange={onCommunityTypeChange}
                                >
                                    <Flex align="center">
                                        <Icon color="gray.500" mr={2} as={BsFillEyeFill}/>
                                        <Text mr={3} fontSize="10pt">Restricted</Text>
                                        <Text fontSize="8pt" color="gray.500" pt={1}>Anyone can view this community, but only approved users can post</Text>
                                    </Flex>
                                </Checkbox>
                                <Checkbox 
                                    name="private" 
                                    isChecked={communityType === "private"}
                                    onChange={onCommunityTypeChange}
                                >
                                    <Flex align="center">
                                        <Icon color="gray.500" mr={2} as={HiLockClosed}/>
                                        <Text mr={3} fontSize="10pt">Private</Text>
                                        <Text fontSize="8pt" color="gray.500" pt={1}>Only approved users can view and submit to this community</Text>
                                    </Flex>
                                </Checkbox>
                            </Stack>
                        </Box>
                    </ModalBody>
                </Box>
        
                <ModalFooter bg="gray.100" borderRadius="0px 0px 10px 10px">
                    <Button 
                        variant="outline" 
                        height="30px"
                        mr={3} 
                        onClick={handleClose}
                    >
                        Close
                    </Button>
                    <Button 
                        height="30px" 
                        onClick={handleCreateCommunity}
                        isLoading={loading}>
                        Create Community
                    </Button>
                </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    )
};
export default CreateCommunityModal;