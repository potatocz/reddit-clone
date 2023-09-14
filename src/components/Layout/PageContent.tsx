import React from 'react';
import { Flex } from '@chakra-ui/react'; 

type PageContentProps = {
    maxWidth?: string;
};

const PageContent:React.FC<PageContentProps> = ({ children, maxWidth }) => {
    
    return (
    <Flex justifyContent="center" padding="16px 0px">
        <Flex width="95%" justify="center" maxWidth={maxWidth || "860px"}>
            {/* LEFT HANDSIDE*/}
            <Flex 
                direction="column" 
                width={{base: '100%', md: '65%'}}
                mr={{base: 0, md: 6}}
            >
                {children && children[0 as keyof typeof children]}
            </Flex>
            {/* RIGHT HANDSIDE (is also hidden on mobiles */}
            <Flex direction='column' display={{base: 'none', md: 'flex'}} flexGrow={1}>
                {children && children[1 as keyof typeof children]}
            </Flex>
        </Flex>
    </Flex>
        )
}
export default PageContent;