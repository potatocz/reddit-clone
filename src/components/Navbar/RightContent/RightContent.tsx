import { Flex, Button } from "@chakra-ui/react";
import React from 'react';
import AuthModal from "../../Modal/Auth/AuthModal";
import AuthButtons from "./AuthButtons";
import {signOut, User} from 'firebase/auth';
import {auth} from '../../../firebase/clientApp'
import Icons from "../Icons";
import UserMenu from "./UserMenu";


type RightContentProps = {
    user?: User | null; //user, undefined or null
};

const RightContent:React.FC<RightContentProps> = ({ user }) => {
    
    return (
        <>
            <AuthModal />
            <Flex justify='center' align='center'>
                {user ? <Icons /> : <AuthButtons />}
                <UserMenu user={user} />
            </Flex>
        </>
    )
}
export default RightContent;