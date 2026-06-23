import { FormControl, FormLabel, VStack , Input, InputGroup, InputRightElement, Button} from '@chakra-ui/react';
import React, { useState } from 'react';
import { useToast } from "@chakra-ui/react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Signup = () => {
    const [name, setName] = useState();
    const [email, setEmail] = useState();
    const [confirmpassword, setConfirmPassword] = useState();
    const [password, setPassword] = useState();
    const [pic, setPic] = useState();
    const [loading, setLoading] = useState(false);
    const toast = useToast();
    const [picLoading, setPicLoading] = useState(false);
    const navigate = useNavigate();

const postDetails = (pics) => {
  setPicLoading(true);

  if (!pics) {
    setPicLoading(false);
    return;
  }

  if (pics.type === "image/jpeg" || pics.type === "image/png") {
    const data = new FormData();
    data.append("file", pics);
    data.append("upload_preset", "chat-app");

    fetch("https://api.cloudinary.com/v1_1/doazgck2h/image/upload", {
      method: "POST",
      body: data,
    })
      .then((res) => res.json())
      .then((data) => {
        setPic(data.secure_url);
        setPicLoading(false);   
      })
      .catch(() => {
        setPicLoading(false);
      });
  }
};

  const submitHandler = async () => {
    setPicLoading(true);
    if (!name || !email || !password || !confirmpassword) {
      toast({
        title: "Please Fill all the Feilds",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setPicLoading(false);
      return;
    }
    if (password !== confirmpassword) {
      toast({
        title: "Passwords Do Not Match",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }
    console.log(name, email, password, pic);
    try {
      const config = {
        headers: {
          "Content-type": "application/json",
        },
      };
      const { data } = await axios.post(
        "/api/user",
        {
          name,
          email,
          password,
          pic,
        },
        config
      );
      console.log(data);
      toast({
        title: "Registration Successful",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      localStorage.setItem("userInfo", JSON.stringify(data));
      setPicLoading(false);
      navigate("/chats");
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: error.response.data.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setPicLoading(false);
    }
  };

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handlePasswordClick = () => setShowPassword(!showPassword);
    const handleConfirmClick = () => setShowConfirmPassword(!showConfirmPassword);

    return <VStack spacing='5px' color="black">
        <FormControl id="first-name" isRequired>
            <FormLabel>Name</FormLabel>
            <Input
                placeholder="Enter your Name"
                onChange={(e) => setName(e.target.value) }
            />
        </FormControl>

        <FormControl id="email" isRequired>
            <FormLabel>Email</FormLabel>
            <Input
                placeholder="Enter your Email"
                onChange={(e) => setEmail(e.target.value) }
            />
        </FormControl>

        <FormControl id="password" isRequired>
            <FormLabel>Password</FormLabel>
            <InputGroup>
                <Input type={showPassword? "text" : "password"}
                placeholder="Enter your Password"
                onChange={(e) => setPassword(e.target.value) }
                />
                <InputRightElement width="4.5rem">
                    <Button variant="ghost" h="1.75rem" size="sm" onClick={ handlePasswordClick } >
                        { showPassword ? "Hide" : "Show" }
                    </Button>                    
                </InputRightElement>
            </InputGroup>
           
        </FormControl>

        <FormControl id="confirm-password" isRequired>
            <FormLabel>Confirm Password</FormLabel>
            <InputGroup>
                <Input type={showConfirmPassword? "text" : "password"}
                placeholder="Confirm Password"
                onChange={(e) => setConfirmPassword(e.target.value) }
                />
                <InputRightElement width="4.5rem">
                    <Button variant="ghost"  h="1.75rem" size="sm" onClick={ handleConfirmClick } >
                        { showConfirmPassword ? "Hide" : "Show" }
                    </Button>                    
                </InputRightElement>
            </InputGroup>
           
        </FormControl>

      <FormControl id="pic">
            <FormLabel>Upload Your Picture</FormLabel>
                <Input type="file" p={.5}
                accept="image/*"
                onChange={(e) => postDetails(e.target.files[0]) }
                />  
        </FormControl>

        <Button
            colorScheme="blue"
            width="100%"
            style={{ marginTop: 15 }} 
            onClick={submitHandler}
            isLoading={ loading || picLoading } >
            Sign Up  
       </Button>



    </VStack >;
  
};

export default Signup;
