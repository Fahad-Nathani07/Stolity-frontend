import React, { useState, useEffect, useCallback } from "react";
import CustomGoogleAuthButton from "../components/CustomGoogleAuthButton";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AOS from "aos";
import "aos/dist/aos.css";
import Illustration from "../images/Illustration.svg";
import { Link } from "react-router-dom";
import LogoStolity from "../images/prelogin-img/logo-stolity.svg";
import { ReactComponent as PasswordShow } from "../images/icon-eye.svg";
import { ReactComponent as PasswordHide } from "../images/icon-eye-hide.svg";

import { useDispatch, useSelector } from "react-redux";
import { setGoogleAuth } from "../store/fileSlicer";
import { showToast } from "../components/ToastProvider";
import AvatarDefault from "../images/AvatarDefault.jpg";
import { loginUser } from "../store/subscriptionSlice"; // adjust the path if needed
import { setUserProfileFromUserData, normalizeAvatarUrl } from "../store/userProfileSlice";

import { FaArrowLeft } from "react-icons/fa";
import "../css/LoginGraphicTip.css";

const REMEMBER_EMAIL_KEY = "stolity_remember_email";

const slides = [
  {
    title: "Upload Files",
    text: "Store up to 5GB data in a centralised location for easy access and management.",
  },
  { title: "Fast Access", text: "Experience quicker uploads for every file type — faster, smoother, better." },
  {
    title: "Generate Link",
    text: "Generate links and shorten them for efficient sharing of files.",
  },
  {
    title: "Generate QR code",
    text: "Generate and scan the QR code to download all files with one click.",
  },
  {
    title: "Share Securely",
    text: "Securely share files to multiple people from any location.",
  },
];

const Login = ({ setSpanExpanded, spanExpanded }) => {
  // ────────────────────────────────────────────────
  //   States - existing
  // ────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const apiEndPoint = process.env.REACT_APP_API_ENDPOINT;
  const [currentSlide, setCurrentSlide] = useState(0);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isPageReady, setIsPageReady] = useState(false); // to avoid flash of form before check

  // ────────────────────────────────────────────────
  //   NEW - login attempt & lockout states
  // ────────────────────────────────────────────────
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(null);
  const [countdownSeconds, setCountdownSeconds] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isGoogleLoggingIn, setIsGoogleLoggingIn] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // ────────────────────────────────────────────────
  //   Password visibility
  // ────────────────────────────────────────────────
  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  // ────────────────────────────────────────────────
  //   Slide animation
  // ────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Opening animation (same as PreLogin / Industries)
  useEffect(() => {
    AOS.init({
      duration: 1000,
      offset: 100,
      easing: "ease-in-out",
      once: true,
    });
  }, []);

  useEffect(() => {
    if (isPageReady) {
      AOS.refresh();
    }
  }, [isPageReady]);

  // ────────────────────────────────────────────────
  //   Clear storage on mount
  // ────────────────────────────────────────────────
  useEffect(() => {
    const sessionExpired = sessionStorage.getItem("sessionExpired") === "1";
    sessionStorage.clear();
    if (sessionExpired) {
      showToast(
        "warning",
        "Please log in to continue. Your session may have expired.",
        "Session expired"
      );
    }
  }, []);

  useEffect(() => {
    dispatch(setGoogleAuth(false));
    console.log("google value reset to false");
  }, [dispatch]);

  // Pre-fill email when user previously chose "Remember me"
  useEffect(() => {
    const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (!savedEmail?.trim()) return;

    const normalized = savedEmail.trim();
    setEmail(normalized);
    setRememberMe(true);
    setEmailError(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? "" : "");
  }, []);

  // ────────────────────────────────────────────────
  //   Load attempt data when email changes
  // ────────────────────────────────────────────────
  // Run once on mount — small delay to let persisted email appear
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageReady(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Load & refresh lock status when email changes (or on mount)
  useEffect(() => {
    if (!email?.trim()) {
      setLoginAttempts(0);
      setLockoutUntil(null);
      setCountdownSeconds(null);
      return;
    }

    const key = `login_attempts_${email.toLowerCase().trim()}`;
    const saved = localStorage.getItem(key);

    let data = { attempts: 0, lockoutUntil: null };
    if (saved) {
      try {
        data = JSON.parse(saved);
      } catch {
        localStorage.removeItem(key); // clean corrupt data
      }
    }

    const now = Date.now();
    const isCurrentlyLocked = data.lockoutUntil && data.lockoutUntil > now;

    setLoginAttempts(data.attempts || 0);
    setLockoutUntil(data.lockoutUntil);

    if (isCurrentlyLocked) {
      const remainingMs = data.lockoutUntil - now;
      const remainingSec = Math.max(1, Math.ceil(remainingMs / 1000));
      setCountdownSeconds(remainingSec);
    } else {
      setCountdownSeconds(null);
      // Clean up expired lockout
      if (data.lockoutUntil) {
        localStorage.removeItem(key);
      }
    }
  }, [email]);

  // ────────────────────────────────────────────────
  //   Countdown timer
  // ────────────────────────────────────────────────
  useEffect(() => {
    if (!countdownSeconds || countdownSeconds <= 0) return;

    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          // Lockout ended
          const key = `login_attempts_${email.toLowerCase().trim()}`;
          localStorage.removeItem(key);
          setLockoutUntil(null);
          setLoginAttempts(0);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdownSeconds, email]);

  // ────────────────────────────────────────────────
  //   Form input handlers (existing)
  // ────────────────────────────────────────────────
  const handleEmail = (event) => {
    const value = event.target.value;
    setEmail(value);

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value === "") {
      setEmailError("Email is required");
    } else if (!emailPattern.test(value)) {
      setEmailError("Invalid email address");
    } else {
      setEmailError("");
    }
  };

  const handlePass = (event) => {
    const value = event.target.value;
    setPassword(value);

    // Login only needs a non-empty password; strength rules belong on Signup
    if (value.trim() === "") {
      setPasswordError("Password is required");
    } else {
      setPasswordError("");
    }
  };

  // ────────────────────────────────────────────────
  //   LOGIN REQUEST - with attempt logic
  // ────────────────────────────────────────────────
  const handleReq = useCallback(async () => {
    // Already locked?
    if (lockoutUntil && lockoutUntil > Date.now()) {
      showToast("warning", `Account locked. Try again in ${Math.ceil(countdownSeconds / 60)} minutes.`);
      return;
    }

    if (isLoggingIn) return;
    setIsLoggingIn(true);

    try {
      const res = await axios.post(
        `${apiEndPoint}login-user`,
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );

      if (res.status === 200) {
        // SUCCESS → reset attempts
        const key = `login_attempts_${email.toLowerCase().trim()}`;
        localStorage.removeItem(key);
        setLoginAttempts(0);
        setLockoutUntil(null);
        setCountdownSeconds(null);

        setButtonClicked(true);
        setSpanExpanded(true);

        setTimeout(() => {
          navigate("/Files");
        }, 1000);

        const responseData = res.data;
        const accessToken = responseData.accessToken;
        const userId = responseData.loginId;
        const userData = responseData.userData;

        console.log("asdfgh", responseData)

        sessionStorage.clear();
        sessionStorage.setItem("userData", JSON.stringify(responseData));
        sessionStorage.setItem("number", accessToken.toString());
        sessionStorage.setItem("userId", userId.toString());
        sessionStorage.setItem("email", userData.email.toString());
        sessionStorage.setItem("name", userData.name.toString());

        if (userData.contact) {
          sessionStorage.setItem("num", userData.contact.toString());
        }

        // sessionStorage.setItem(
        //   "avatar",
        //   userData.userAvatar?.toString() || AvatarDefault
        // );
        const rawAvatar = normalizeAvatarUrl(userData?.userAvatar);
        sessionStorage.setItem("avatar", rawAvatar);

        dispatch(
          setUserProfileFromUserData({
            userData,
            userId,
            avatar: rawAvatar,
          })
        );

        setError(null);
        dispatch(loginUser({ email, password }));

        if (rememberMe) {
          localStorage.setItem(REMEMBER_EMAIL_KEY, email.toLowerCase().trim());
        } else {
          localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }
      } else {
        setIsLoggingIn(false);
      }
    } catch (err) {
      console.error("Login error:", err);
      setIsLoggingIn(false);

      const isAuthError =
        err.response?.status === 401 ||
        err.response?.data?.message?.toLowerCase().includes("invalid") ||
        err.response?.data?.message?.toLowerCase().includes("password") ||
        err.response?.data?.message?.toLowerCase().includes("credentials");

      let newAttempts = loginAttempts;

      if (isAuthError) {
        newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);

        const key = `login_attempts_${email.toLowerCase().trim()}`;

        if (newAttempts >= 5) {
          const lockUntil = Date.now() + 15 * 60 * 1000;
          setLockoutUntil(lockUntil);
          setCountdownSeconds(15 * 60);

          localStorage.setItem(
            key,
            JSON.stringify({
              attempts: newAttempts,
              lockoutUntil: lockUntil,
            })
          );

          showToast(
            "error",
            "Too many failed attempts. Account locked for 15 minutes."
          );
        } else {
          localStorage.setItem(
            key,
            JSON.stringify({
              attempts: newAttempts,
              lockoutUntil: null,
            })
          );

          showToast(
            "error",
            `Invalid credentials. ${5 - newAttempts} attempts remaining.`
          );
        }
      } else {
        // network error, 500, etc. → don't count attempt
        showToast("error", err.response?.data?.message || "Login failed");
      }

      setError(err.response?.data?.message || "An error occurred during login");
    }
  }, [
    email,
    password,
    navigate,
    lockoutUntil,
    countdownSeconds,
    loginAttempts,
    showToast,
    dispatch,
    apiEndPoint,
    isLoggingIn,
    rememberMe,
  ]);

  const canSubmitLogin =
    email.trim() !== "" &&
    password.trim() !== "" &&
    !isLoggingIn &&
    !(lockoutUntil && lockoutUntil > Date.now());

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canSubmitLogin) return;
    if (emailError === "" && passwordError === "") {
      handleReq();
    }
  };

  // ────────────────────────────────────────────────
  //   Button animation timeout
  // ────────────────────────────────────────────────
  const [buttonClicked, setButtonClicked] = useState(false);

  useEffect(() => {
    if (buttonClicked) {
      const t = setTimeout(() => {
        setButtonClicked(false);
      }, 2750);
      return () => clearTimeout(t);
    }
  }, [buttonClicked]);

  useEffect(() => {
    if (spanExpanded) {
      const t = setTimeout(() => setSpanExpanded(false), 1700);
      return () => clearTimeout(t);
    }
  }, [spanExpanded]);

  // ────────────────────────────────────────────────
  //   Google login handlers
  // ────────────────────────────────────────────────

  const handleSignUpSuccess = async (response) => {
    if (isGoogleLoggingIn) return;
    if (!response?.credential) {
      showToast("error", "Google Sign-In failed. Please try again.");
      return;
    }

    setIsGoogleLoggingIn(true);
    setSpanExpanded(true); // show loader immediately (don't wait for API)

    try {
      const res = await axios.post(
        `${apiEndPoint}firebaseAuth`,
        { googleToken: response.credential },
        { withCredentials: true }
      );
      const data = res.data;

      showToast("success", `${data.message}`);
      console.log("Google Login Response: ", data);

      const a = data.accessToken;
      const a2 = data.loginId;
      const b = data.userData;
      const c = data.userData.email;
      const avatar = normalizeAvatarUrl(data.userData?.userAvatar);

      sessionStorage.setItem("avatar", avatar);
      sessionStorage.setItem("userData", JSON.stringify(b));
      sessionStorage.setItem("number", a.toString());
      sessionStorage.setItem("userId", a2.toString());
      sessionStorage.setItem("email", c.toString());
      if (b?.name) {
        sessionStorage.setItem("name", String(b.name));
      }
      if (b?.contact) {
        sessionStorage.setItem("num", String(b.contact));
      }

      dispatch(
        setUserProfileFromUserData({
          userData: b,
          userId: a2,
          avatar,
        })
      );
      dispatch(setGoogleAuth(true));
      navigate("/Files");
    } catch (error) {
      setSpanExpanded(false);
      const apiMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Authentication failed. Please try again.";
      showToast("error", apiMsg);
    } finally {
      setIsGoogleLoggingIn(false);
    }
  };

  const handleFailure = () => {
    showToast("error", "Google Sign-In Failed. Please try again.");
  };

  // ────────────────────────────────────────────────
  //   RENDER
  // ────────────────────────────────────────────────
  const isLocked = lockoutUntil && lockoutUntil > Date.now();

  return (
    <>
      <div className="form_container">
        <button
          type="button"
          className="login-back-btn"
          onClick={() => navigate("/")}
          aria-label="Back to home"
          data-aos="fade-right"
        >
          <FaArrowLeft />
          <span>Back</span>
        </button>

        <div className="login_left_col" data-aos="zoom-out">
          <div className="login_graphic_text">
            <div key={currentSlide} className="login_graphic_text_inner">
              <h2>{slides[currentSlide].title}</h2>
              <p>{slides[currentSlide].text}</p>
            </div>
            <div className="login_graphic_dots" aria-hidden="true">
              {slides.map((_, i) => (
                <span
                  key={i}
                  className={`login_graphic_dot${i === currentSlide ? " is-active" : ""}`}
                />
              ))}
            </div>
          </div>
          <div className="login_graphic">
            <img src={Illustration} className="img_responsive" alt="" />
          </div>
        </div>

        <div className="login_content" data-aos="zoom-in">
          <div className="login_form">
            <div className="logo_login">
              <button
                type="button"
                onClick={() => navigate("/")}
                aria-label="Back to home"
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  display: "inline-flex",
                }}
              >
                <img src={LogoStolity} alt="Stolity home" style={{ height: "50px" }} />
              </button>
            </div>
            <h3 className="mt-4">Welcome Back!</h3>

            <form onSubmit={handleSubmit}>
              <div className="mt-4">
                {!isPageReady ? (
                  <div style={{
                    textAlign: "center",
                    padding: "80px 20px",
                    color: "#6b7280",
                    minHeight: "300px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    Checking your login status...
                  </div>
                ) : isLocked ? (
                  <div className="login-lock-alert" role="alert">
                    <div className="login-lock-alert__icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="5" y="11" width="14" height="10" rx="2" />
                        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                      </svg>
                    </div>
                    <h4 className="login-lock-alert__title">Account Temporarily Locked</h4>
                    <p className="login-lock-alert__desc">
                      Too many incorrect password attempts.
                    </p>
                    <div className="login-lock-alert__timer">
                      <span className="login-lock-alert__timer-label">Wait</span>
                      <strong>
                        {Math.floor(countdownSeconds / 60)} min {String(countdownSeconds % 60).padStart(2, "0")} sec
                      </strong>
                    </div>
                    <p className="login-lock-alert__hint">
                      You can sign in right now using your{" "}
                      <strong>Google account</strong> below.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="form_group">
                      <label className="login_label">Email address</label>
                      <input
                        type="email"
                        className={`form-control form_control ${emailError ? "is-invalid" : ""}`}
                        name="email"
                        placeholder="Enter Email address"
                        value={email}
                        onChange={handleEmail}
                      />
                    </div>
                    {emailError && <div className="error-message">{emailError}</div>}

                    <div className="form_group">
                      <label className="login_label">Password</label>
                      <div className="text_field">
                        <input
                          type={showPassword ? "text" : "password"}
                          className="form-control form_control"
                          placeholder="Enter your Password"
                          value={password}
                          onChange={handlePass}
                        />
                        <div className="icon_field" onClick={togglePasswordVisibility}>
                          {showPassword ? <PasswordShow /> : <PasswordHide />}
                        </div>
                      </div>
                      {passwordError && <div className="error-message">{passwordError}</div>}
                    </div>

                    <div className="group_flexend mt-3">
                      <div className="radio-buttons custom_radio_btn login-remember">
                        <input
                          type="checkbox"
                          id="Remember"
                          checked={rememberMe}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setRememberMe(checked);
                            if (!checked) {
                              localStorage.removeItem(REMEMBER_EMAIL_KEY);
                            }
                          }}
                        />
                        <label htmlFor="Remember">Remember me</label>
                      </div>

                      <div>
                        <Link
                          to="/ForgotPassword"
                          style={{ color: "#c4231c", textDecoration: "underline", fontSize: "12px" }}
                        >
                          Forgot password?
                        </Link>
                      </div>
                    </div>

                    <div className="btn_login_group">
                      <button
                        type="submit"
                        className={`btn_login ripple_effect ${buttonClicked ? "btn--clicked" : ""}`}
                        disabled={!canSubmitLogin}
                        aria-disabled={!canSubmitLogin}
                        style={
                          !canSubmitLogin
                            ? { opacity: 0.55, cursor: "not-allowed" }
                            : undefined
                        }
                        title={
                          !email.trim() || !password.trim()
                            ? "Enter email and password to continue"
                            : undefined
                        }
                      >
                        {isLoggingIn ? "Logging in…" : "Login"}
                      </button>
                    </div>

                    {error && <div className="error-message mt-3" style={{ textAlign: "center" }}>{error}</div>}
                  </>
                )}

                <div className="divider">
                  <span>OR</span>
                </div>

                <div className="stolity-google-login">
                  <CustomGoogleAuthButton
                    onSuccess={handleSignUpSuccess}
                    onError={handleFailure}
                    label="Continue with Google"
                    text="continue_with"
                    disabled={isGoogleLoggingIn || isLocked}
                  />
                </div>

                <div className="have_acc mt-3">
                  Don’t have an Account?{" "}
                  <Link to="/Signup" style={{ color: "#c4231c", fontWeight: 500, }}>
                    Sign up
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;