import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

import Illustration from "../images/Illustration.svg";
import IconFacebook from "../images/icon-fb.svg";
import IconApple from "../images/icon-apple.svg";
import Logo from "../images/logo.png";
import LogoStolity from "../images/prelogin-img/logo-stolity.svg";
import IconMail from "../images/iconMail.svg";
import IconLock from "../images/iconLock.svg";
import IconLGoogle from "../images/iconGLogin.svg";
import { Link } from "react-router-dom";
import LogoMini from "../images/logo-mini.svg";
import NewLogo from "../images/NewLogo.svg";
import { motion } from "framer-motion";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { ReactComponent as PasswordShow } from "../images/icon-eye.svg";
import { ReactComponent as PasswordHide } from "../images/icon-eye-hide.svg";
import axios from "axios";
import {
  background,
  ChakraProvider,
  position,
  Stack,
  useToast,
} from "@chakra-ui/react";

const Signup = () => {
  const apiUrl = process.env.REACT_APP_API_ENDPOINT;
  const token = sessionStorage.getItem("number");

  const [inputs, setInputs] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs((prevInputs) => ({
      ...prevInputs,
      [name]: value,
    }));
  };

  const handleInputFocus = (e) => {
    const targetName = e.target.name;
    document.querySelector(`.f-label-${targetName}`).classList.add("f-up");
  };

  const handleInputBlur = (e) => {
    const { name, value } = e.target;
    const label = document.querySelector(`.f-label-${name}`);
    if (value === "") {
      label.classList.remove("f-up");
    }
  };

  const navigate = useNavigate();

  // LOGIN ANIMATION
  const [buttonClicked, setButtonClicked] = useState(false);
  const [spanExpanded, setSpanExpanded] = useState(false);

  useEffect(() => {
    if (buttonClicked) {
      const buttonTimeout = setTimeout(() => {
        setButtonClicked(false);
        navigate("/login"); // Navigate after button animation
      }, 1500);
      return () => clearTimeout(buttonTimeout);
    }
  }, [buttonClicked, navigate]);

  useEffect(() => {
    if (spanExpanded) {
      const spanTimeout = setTimeout(() => setSpanExpanded(false), 1500);
      return () => clearTimeout(spanTimeout);
    }
  }, [spanExpanded]);

  const handleClick = async (e) => {
    if (!name || !email || !password || !confirmPassword) {
      alert("Please fill out all fields.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    e.preventDefault();
    setButtonClicked(true);
    setSpanExpanded(true);

    // Your sign-up logic goes here
    try {
      const res = await axios.post(
        // for mapbox
        // `${apiUrl}register-user`,

        // for Stolity
        `${apiUrl}create-user`,
        {
          name: name,
          email: email,
          password: password,
          confirmPassword: confirmPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log(res.data);
      showToast("success", "Account has been created successfully!");
    } catch (error) {
      showToast("error", "There`s an error creating a user account!");
    }
  };

  const pathVariants = {
    hidden: { pathLength: 0, fill: "" },
    animate: {
      scale: [1, 2, 2, 1, 1],
      rotate: [0, 0, 180, 180, 0],
      borderRadius: ["0%", "0%", "50%", "50%", "0%"],
    },
    transition: {
      duration: 2,
      ease: "easeInOut",
      times: [0, 0.2, 0.5, 0.8, 1],
      repeat: Infinity,
      repeatDelay: 1,
    },
  };

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  const toast = useToast();

  const showToast = (status, message) => {
    toast({
      title: `${status.charAt(0).toUpperCase() + status.slice(1)}`,
      description: message,
      status: status, // Set this to 'error' for a red-colored pop-up
      duration: 3000,
      isClosable: true,
    });
  };
  const clientid = process.env.REACT_APP_GOOGLE_AUTH_CLIENT_ID;

  const clientId = clientid;

  const handleSignUpSuccess = (response) => {
    console.log("Google Sign-Up Success:", response);

    // Send the response token to your backend
    fetch(`${apiUrl}firebaseAuth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ googleToken: response.credential }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("User registration or sign-in handled", data);
        const a = data.accessToken;
        const b = data.userData;
        const c = data.userData.email;

        console.log("Accesstoken is", a, "User data is", b, "Email is", c);

        sessionStorage.setItem("userData", JSON.stringify(b));
        sessionStorage.setItem("number", a.toString());
        sessionStorage.setItem("email", c.toString());
        navigate("/Files");
        // Handle user registration in your app (e.g., navigate, store tokens, etc.)
      });
  };

  const handleFailure = (error) => {
    console.error("Google Sign-Up Failed:", error);
  };

  return (
    <>
      <ChakraProvider></ChakraProvider>
      <div className="form_container">
        <div className="login_left_col">
          <div className="login_graphic_text">
            <h2>Upload Files</h2>
            <p>
              Store upto 5GB data in a centralised location for easy access and
              management.
            </p>
          </div>
          <div className="login_graphic">
            <img src={Illustration} className="img_responsive" />
          </div>
        </div>

        <div className="login_content">
          <div className="login_form">
            <div className="logo_login">
              <img src={LogoStolity} alt="logo" style={{ height: "50px" }} />
            </div>
            <h3 className="mt-4">Create an Account</h3>
            <form>
              <div className="row custom_row">
                <div className="col-md-12 mt-3">
                  <label className="login_label">Full Name</label>
                  <input
                    type="email"
                    className="form-control form_control"
                    placeholder="Enter full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
              <div className="row custom_row">
                <div className="col-md-12 mt-3">
                  <label className="login_label">Email Address</label>
                  <input
                    type="text"
                    className="form-control form_control"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="row custom_row">
                <div className="col-md-12 mt-3">
                  <label className="login_label">Password</label>
                  <div className="text_field">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      className="form-control form_control"
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your Password"
                    />

                    <div
                      className="icon_field"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? <PasswordShow /> : <PasswordHide />}
                    </div>
                  </div>
                </div>
              </div>

              <div className="row custom_row">
                <div className="col-md-12 mt-3">
                  <label className="login_label">Confirm Password</label>
                  <div className="text_field">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      className="form-control form_control"
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Enter your Confirm Password"
                    />

                    <div
                      className="icon_field"
                      onClick={toggleConfirmPasswordVisibility}
                    >
                      {showConfirmPassword ? (
                        <PasswordShow />
                      ) : (
                        <PasswordHide />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="btn_login_group">
                  <button
                    type="button"
                    className={`btn_login ripple_effect ${
                      buttonClicked ? "btn--clicked" : ""
                    }`}
                    onClick={handleClick}
                  >
                    Sign up
                  </button>
                </div>
                <div class="divider">
                  <span>OR</span>
                </div>
                
                  <GoogleOAuthProvider clientId={clientId}>
                    <div style={{ justifySelf: "center" }}>
                      <GoogleLogin
                        onSuccess={handleSignUpSuccess}
                        onError={handleFailure}
                        text="signup_with" // Changes the button text to "Sign up with Google"
                        shape="rectangular" // Customize the button shape
                        theme="filled_blue" // Customize button theme (e.g., outline, filled)
                        size="large" // Size of the button (small, medium, large)
                        // Optional width for the button
                      />
                    </div>
                  </GoogleOAuthProvider>
                
                <div className="have_acc mt-3">
                  Already have an Account ?{" "}
                  <Link to="/login" className="" style={{ color: "#E94545" }}>
                    Login
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <span
        className={`animate_logo animate_logo_loader ${
          spanExpanded ? "expanded" : ""
        }`}
        data-value="1"
        style={{
          background: `conic-gradient(from 0deg at 50% 50%, #E5252A 0deg, #E7400C 120deg, #FFAB49 240deg, #E5252A 360deg)`,
          // display: 'flex',
          // alignItems: 'center',
          // justifyContent: 'center'
        }}
      >
        <div className="logo__load" style={{ width: "100px", height: "100px" }}>
          <motion.img
            src={NewLogo}
            alt="Logo"
            style={{
              width: "90px",
              height: "90px",
              filter: "brightness(0) invert(1)",
            }}
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 360],
            }}
            transition={{
              duration: 2,
              ease: "easeInOut",
              repeat: Infinity,
              repeatDelay: 1,
            }}
          />
        </div>
      </span>
    </>
  );
};

export default Signup;
