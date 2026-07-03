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
} from "@chakra-ui/react";
import { ViewIcon, EditIcon } from "@chakra-ui/icons";

const ProfileModal = ({ user, children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
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
  }, [isOpen, user?.name, user?.email]);

  const handleClose = () => {
    setProfileName(user?.name || "");
    setProfileEmail(user?.email || "");
    setProfilePic(user?.pic || "");
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

      // Check if there's a file to upload
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
            setProfilePic(data.pic || userInfo.pic);
            setProfileName(data.name);
            setProfileEmail(data.email);
            setIsEditing(false);
            toast({
              title: "Success",
              description: "Profile updated successfully!",
              status: "success",
              duration: 4000,
              isClosable: true,
              position: "top",
            });
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
        // No image upload, just update name and email
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
          setIsEditing(false);
          toast({
            title: "Success",
            description: "Profile updated successfully!",
            status: "success",
            duration: 4000,
            isClosable: true,
            position: "top",
          });
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
        size={{ base: "sm", md: "xl" }}
        isOpen={isOpen}
        onClose={handleClose}
        isCentered
      >
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent
          h={{ base: "auto", md: "500px" }}
          p={{ base: 2, md: 0 }}
          boxShadow="0 20px 60px rgba(0,0,0,0.3)"
          borderRadius={{ base: "md", md: "xl" }}
        >
          <ModalHeader
            fontSize={{ base: "24px", md: "48px" }}
            fontFamily="Work sans"
            fontWeight="bold"
            display="flex"
            justifyContent="center"
            p={{ base: "16px", md: "32px 24px 24px" }}
            borderBottom={{ base: "none", md: "2px solid" }}
            borderColor={{ base: "transparent", md: "blue.100" }}
          >
            {profileName || user?.name}
          </ModalHeader>

          <ModalCloseButton
            size={{ base: "sm", md: "lg" }}
            _hover={{ bg: "transparent", color: "red.400" }}
            transition="all 0.2s"
          />

          <ModalBody
            display="flex"
            flexDir="column"
            alignItems="center"
            justifyContent="center"
            p={{ base: "12px", md: "40px 24px" }}
            gap={{ base: 3, md: 6 }}
          >
            {isEditing ? (
              <Box w="100%" display="flex" flexDir="column" alignItems="center">
                <Box position="relative" mb={6}>
                  <Image
                    borderRadius="full"
                    h={{ base: "100px", md: "140px" }}
                    w={{ base: "100px", md: "140px" }}
                    src={profilePic}
                    alt="Profile"
                    objectFit="cover"
                  />
                  <IconButton
                    icon={<EditIcon />}
                    position="absolute"
                    bottom={0}
                    right={0}
                    borderRadius="full"
                    bg="blue.500"
                    color="white"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    _hover={{ bg: "blue.600" }}
                  />
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    display="none"
                  />
                </Box>
                <Input
                  placeholder="Name"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  mb={4}
                  size={{ base: "md", md: "lg" }}
                  fontSize={{ base: "14px", md: "16px" }}
                  p={{ base: "10px 14px", md: "12px 16px" }}
                  w="100%"
                  _focus={{
                    borderColor: "blue.400",
                    boxShadow: "0 0 0 3px rgba(66, 153, 225, 0.1)",
                  }}
                />
                <Input
                  placeholder="Email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  size={{ base: "md", md: "lg" }}
                  fontSize={{ base: "14px", md: "16px" }}
                  p={{ base: "10px 14px", md: "12px 16px" }}
                  w="100%"
                  _focus={{
                    borderColor: "blue.400",
                    boxShadow: "0 0 0 3px rgba(66, 153, 225, 0.1)",
                  }}
                />
                <Box
                  mt={6}
                  display="flex"
                  gap={3}
                  flexDir={{ base: "column", md: "row" }}
                  w="100%"
                  justifyContent="center"
                >
                  <Button
                    colorScheme="green"
                    onClick={handleSave}
                    size={{ base: "md", md: "lg" }}
                    w={{ base: "100%", md: "auto" }}
                    px={{ base: 8, md: 12 }}
                    _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
                    transition="all 0.2s"
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    size={{ base: "md", md: "lg" }}
                    w={{ base: "100%", md: "auto" }}
                    px={{ base: 8, md: 12 }}
                    _hover={{ transform: "translateY(-2px)" }}
                    transition="all 0.2s"
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            ) : (
              <>
                <Image
                  borderRadius="full"
                  h={{ base: "100px", md: "160px" }}
                  w={{ base: "100px", md: "160px" }}
                  src={user?.pic}
                  alt={profileName || user?.name}
                  boxShadow="0 8px 20px rgba(0,0,0,0.15)"
                  _hover={{ transform: "scale(1.05)", transition: "all 0.3s" }}
                  transition="all 0.3s"
                />
                <Text
                  fontSize={{ base: "14px", md: "20px" }}
                  fontFamily="Work sans"
                  textAlign="center"
                  wordBreak="break-word"
                  color={{ base: "blue.300", md: "blue.400" }}
                  fontWeight="600"
                >
                  Email: {profileEmail || user?.email}
                </Text>
              </>
            )}
          </ModalBody>

          <ModalFooter
            display="flex"
            gap={{ base: 2, md: 4 }}
            justifyContent="center"
            flexDir={{ base: "column", md: "row" }}
            p={{ base: "12px", md: "24px" }}
            borderTop={{ base: "none", md: "1px solid" }}
            borderColor={{ base: "transparent", md: "blue.100" }}
          >
            {!isEditing && (
              <Button
                colorScheme="blue"
                size={{ base: "md", md: "lg" }}
                w={{ base: "100%", md: "auto" }}
                onClick={() => setIsEditing(true)}
                _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
                transition="all 0.2s"
                px={{ base: 8, md: 12 }}
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
