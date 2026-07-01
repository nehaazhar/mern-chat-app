import React, { useEffect } from "react";
import {
  Container,
  Box,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorMode,
} from "@chakra-ui/react";
import Login from "../components/Authentication/Login";
import Signup from "../components/Authentication/Signup";
import { useNavigate } from "react-router-dom";
import { ChatState } from "../Context/ChatProvider";

const Homepage = () => {
  const navigate = useNavigate();
  const { colorMode } = useColorMode();

  const { setUser } = ChatState();

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));

    if (userInfo) {
      setUser(userInfo);
      // ✅ FIX 2: Agar user pehle se login hai, toh use direct chats par bhejo
      navigate("/chats");
    }
  }, [navigate, setUser]); // setUser ko dependency mein add karein

  return (
    <Container maxW="xl" centerContent>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        p={3}
        bg={colorMode === "dark" ? "gray.800" : "white"}
        color={colorMode === "dark" ? "whiteAlpha.900" : "gray.800"}
        w="100%"
        m="40px 0 15px 0"
        borderRadius="lg"
        borderWidth="1px"
        borderColor={colorMode === "dark" ? "whiteAlpha.200" : "gray.200"}
      >
        <Text
          fontSize="3xl"
          fontFamily="Work sans"
          color={colorMode === "dark" ? "whiteAlpha.900" : "black"}
          textAlign="center"
          w="100%"
        >
          Talk-A-Tive
        </Text>
      </Box>

      <Box
        bg={colorMode === "dark" ? "gray.800" : "white"}
        color={colorMode === "dark" ? "whiteAlpha.900" : "gray.800"}
        w="100%"
        p={4}
        borderRadius="lg"
        borderWidth="1px"
        borderColor={colorMode === "dark" ? "whiteAlpha.200" : "gray.200"}
      >
        <Tabs variant="soft-rounded">
          <TabList mb="1em">
            <Tab width="50%">Login</Tab>
            <Tab width="50%">Sign Up</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <Login />
            </TabPanel>
            <TabPanel>
              <Signup />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Container>
  );
};

export default Homepage;
