import React, { useEffect } from 'react'; // useEffect ko react se import kiya
import { Container, Box, Text, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import Login from "../components/Authentication/Login";
import Signup from "../components/Authentication/Signup";
import { useNavigate } from "react-router-dom";
import { ChatState } from '../Context/ChatProvider'; 

const Homepage = () => {
    const navigate = useNavigate();
    
    // ✅ FIX 1: Hook ko component ke andar call karein
    const { setUser } = ChatState(); 

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        
        if (userInfo) {
            setUser(userInfo);
            // ✅ FIX 2: Agar user pehle se login hai, toh use direct chats par bhejo
            navigate('/chats'); 
        }
    }, [navigate, setUser]); // setUser ko dependency mein add karein


    return (
        <Container maxW='xl' centerContent>
            <Box
                display="flex"  
                justifyContent="center"
                alignItems="center"
                p={3}
                bg="white"
                w="100%"
                m="40px 0 15px 0"
                borderRadius="lg"
                borderWidth="1px"
            >
                <Text
                    fontSize="3xl"
                    fontFamily="Work sans"
                    color="black"
                    textAlign="center"  
                    w="100%"            
                >
                    Talk-A-Tive
                </Text>
            </Box>

            <Box bg="white" w="100%" p={4} borderRadius="lg" borderWidth="1px">
                <Tabs variant="soft-rounded">
                    <TabList mb="1em">
                        <Tab width="50%">Login</Tab>
                        <Tab width="50%">Sign Up</Tab>
                    </TabList>

                    <TabPanels>
                        <TabPanel>
                            <Login/>
                        </TabPanel>
                        <TabPanel>
                            <Signup/>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </Box>
        </Container>
    );
};

export default Homepage;