import React, { useEffect, useState, useRef } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  IconButton,
  Button,
  Image,
  Text,
  Box,
  Input,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { ViewIcon, EditIcon } from "@chakra-ui/icons";
import { ChatState } from "../../Context/ChatProvider";

const ProfileModal = ({ user, children, colorMode }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { setUser } = ChatState();
  const [isEditing, setIsEditing] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileEmail, setProfileEmail] = useState(user?.email || "");
  const [profilePic, setProfilePic] = useState(user?.pic || "");
  const fileInputRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      setProfileName(userInfo.name || user?.name || "");
      setProfileEmail(userInfo.email || user?.email || "");
      setProfilePic(userInfo.pic || user?.pic || "");
    }
    setIsEditing(false);
  }, [isOpen, user?.name, user?.email, user?.pic]);

  const handleClose = () => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    setProfileName(userInfo.name || user?.name || "");
    setProfileEmail(userInfo.email || user?.email || "");
    setProfilePic(userInfo.pic || user?.pic || "");
    setIsEditing(false);
    onClose();
  };

  const handleSave = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const token = userInfo.token;
      const userId = userInfo._id;

      if (!userId || !token) {
        toast({
          title: "Session Expired",
          description: "Please login again.",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "top",
        });
        return;
      }

      if (fileInputRef.current?.files?.[0]) {
        const file = fileInputRef.current.files[0];
        const reader = new FileReader();

        reader.onloadend = async () => {
          const base64Pic = reader.result;

          const response = await fetch("/api/user/profile", {
            method: "PUT",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Bearer ${token}`,
            },
            body: new URLSearchParams({
              name: profileName,
              email: profileEmail,
              pic: base64Pic,
            }),
          });

          const data = await response.json();

          if (response.ok && data._id === userId) {
            userInfo.name = data.name;
            userInfo.email = data.email;
            if (data.pic) userInfo.pic = data.pic;
            localStorage.setItem("userInfo", JSON.stringify(userInfo));
            setProfilePic(userInfo.pic);
            setProfileName(userInfo.name);
            setProfileEmail(userInfo.email);
            setUser(userInfo);
            setIsEditing(false);
            toast({
              title: "Success",
              description: "Profile updated successfully!",
              status: "success",
              duration: 4000,
              isClosable: true,
              position: "top",
            });
            setTimeout(() => {
              onClose();
            }, 1000);
          } else {
            toast({
              title: "Error",
              description: data.message || "Failed to update profile",
              status: "error",
              duration: 5000,
              isClosable: true,
              position: "top",
            });
          }
        };
        reader.readAsDataURL(file);
      } else {
        const response = await fetch("/api/user/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: profileName,
            email: profileEmail,
          }),
        });

        const data = await response.json();

        if (response.ok && data._id === userId) {
          userInfo.name = data.name;
          userInfo.email = data.email;
          localStorage.setItem("userInfo", JSON.stringify(userInfo));
          setProfileName(data.name);
          setProfileEmail(data.email);
          setUser(userInfo);
          setIsEditing(false);
          toast({
            title: "Success",
            description: "Profile updated successfully!",
            status: "success",
            duration: 4000,
            isClosable: true,
            position: "top",
          });
          setTimeout(() => {
            onClose();
          }, 1000);
        } else {
          toast({
            title: "Error",
            description: data.message || "Failed to update profile",
            status: "error",
            duration: 5000,
            isClosable: true,
            position: "top",
          });
        }
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Error saving profile: " + error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      {children ? (
        <span onClick={onOpen}>{children}</span>
      ) : (
        <IconButton
          display={{ base: "flex" }}
          icon={<ViewIcon />}
          onClick={onOpen}
        />
      )}

      <Modal
        size={{ base: "sm", md: "md" }} // Adjusted size to 'md' for cleaner dimensions
        isOpen={isOpen}
        onClose={handleClose}
        isCentered
      >
        <ModalOverlay backdropFilter="blur(6px)" />
        <ModalContent
          p={3}
          boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
          borderRadius="2xl"
          overflow="hidden"
        >
          <ModalHeader
            fontSize={{ base: "24px", md: "32px" }}
            fontFamily="Work sans"
            fontWeight="bold"
            display="flex"
            justifyContent="center"
            pt={6}
            pb={2}
            color="gray.800"
          >
            {profileName || user?.name}
          </ModalHeader>

          <ModalCloseButton
            size="lg"
            top={4}
            right={4}
            borderRadius="full"
            _hover={{ bg: "gray.100", color: "red.500" }}
            transition="all 0.2s"
          />

          <ModalBody
            display="flex"
            flexDir="column"
            alignItems="center"
            justifyContent="center"
            px={{ base: 4, md: 8 }}
            py={4}
          >
            {isEditing ? (
              <VStack spacing={5} w="100%">
                <Box position="relative">
                  <Image
                    borderRadius="full"
                    h="130px"
                    w="130px"
                    src={profilePic}
                    alt="Profile"
                    objectFit="cover"
                    border="4px solid"
                    borderColor="blue.500"
                    boxShadow="xl"
                  />
                  <IconButton
                    icon={<EditIcon />}
                    position="absolute"
                    bottom={1}
                    right={1}
                    borderRadius="full"
                    colorScheme="blue"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    boxShadow="md"
                    _hover={{ transform: "scale(1.1)" }}
                    transition="all 0.2s"
                  />
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    display="none"
                  />
                </Box>

                <VStack spacing={3} w="100%">
                  <Input
                    placeholder="Name"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    size="lg"
                    borderRadius="xl"
                    focusBorderColor="blue.400"
                    bg="gray.50"
                  />
                  <Input
                    placeholder="Email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    size="lg"
                    borderRadius="xl"
                    focusBorderColor="blue.400"
                    bg="gray.50"
                  />
                </VStack>

                <Box
                  pt={2}
                  display="flex"
                  gap={3}
                  w="100%"
                  justifyContent="center"
                >
                  <Button
                    colorScheme="green"
                    onClick={handleSave}
                    size="lg"
                    borderRadius="xl"
                    flex={1}
                    _hover={{ transform: "translateY(-1px)", boxShadow: "md" }}
                    transition="all 0.2s"
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    size="lg"
                    borderRadius="xl"
                    flex={1}
                    _hover={{ bg: "gray.50", transform: "translateY(-1px)" }}
                    transition="all 0.2s"
                  >
                    Cancel
                  </Button>
                </Box>
              </VStack>
            ) : (
              <VStack spacing={5} py={4}>
                <Image
                  borderRadius="full"
                  h="150px"
                  w="150px"
                  src={profilePic}
                  alt={profileName || user?.name}
                  boxShadow="0 10px 25px -5px rgba(0,0,0,0.15)"
                  border="3px solid white"
                  outline="2px solid"
                  outlineColor="gray.200"
                  _hover={{ transform: "scale(1.03)" }}
                  transition="all 0.3s ease-in-out"
                />
                <Text
                  fontSize={{ base: "15px", md: "18px" }}
                  fontFamily="Work sans"
                  textAlign="center"
                  wordBreak="break-word"
                  color={colorMode === "dark" ? "whiteAlpha.700" : "gray.600"}
                  fontWeight="500"
                >
                  {profileEmail || user?.email}
                </Text>
              </VStack>
            )}
          </ModalBody>

          <ModalFooter justifyContent="center" pb={6} pt={2}>
            {!isEditing && (
              <Button
                colorScheme="blue"
                size="lg"
                borderRadius="xl"
                w={{ base: "100%", md: "auto" }}
                onClick={() => setIsEditing(true)}
                _hover={{ transform: "translateY(-1px)", boxShadow: "lg" }}
                transition="all 0.2s"
                px={12}
              >
                Edit Profile
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ProfileModal;
