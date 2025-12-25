import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Crown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { usePlan } from "@/contexts/PlanContext";
import LanguageSwitcher from "./LanguageSwitcher";

const GlassNav = () => {
  const { t } = useLanguage();
  const { isAuthenticated, login, logout, signup, forgotPassword, resetPassword } = useAuth();
  const { plan, setPlan } = usePlan();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Forgot password states
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<"email" | "otp" | "reset">("email");
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      setIsOpen(false);
      resetForm();
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      alert("Please enter your full name");
      return;
    }
    
    if (!age || parseInt(age) < 1 || parseInt(age) > 150) {
      alert("Please enter a valid age (1-150)");
      return;
    }
    
    if (password !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    
    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      const fullName = `${firstName} ${lastName}`;
      await signup(email, password, parseInt(age), fullName);
      setIsOpen(false);
      resetForm();
    } catch (error) {
      console.error("Signup failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFirstName("");
    setLastName("");
    setIsSignupMode(false);
  };

  const toggleMode = () => {
    setIsSignupMode(!isSignupMode);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFirstName("");
    setLastName("");
  };

  const handleForgotPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail.trim()) {
      alert("Please enter your email address");
      return;
    }

    setForgotPasswordLoading(true);
    try {
      await forgotPassword(forgotPasswordEmail);
      setForgotPasswordStep("otp");
    } catch (error) {
      console.error("Forgot password request failed:", error);
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp.trim()) {
      alert("Please enter the OTP from your email");
      return;
    }

    if (!newPassword.trim() || !confirmNewPassword.trim()) {
      alert("Please enter your new password");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      alert("Passwords don't match!");
      return;
    }

    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    setForgotPasswordLoading(true);
    try {
      await resetPassword(forgotPasswordEmail, otp, newPassword);
      // Reset forgot password state and close dialog
      setIsForgotPasswordOpen(false);
      setForgotPasswordStep("email");
      setForgotPasswordEmail("");
      setOtp("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error) {
      console.error("Password reset failed:", error);
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const closeForgotPasswordDialog = () => {
    setIsForgotPasswordOpen(false);
    setForgotPasswordStep("email");
    setForgotPasswordEmail("");
    setOtp("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  const openForgotPassword = () => {
    setIsOpen(false);
    setIsForgotPasswordOpen(true);
  };

  // Upgrade dialog removed per request; keep plan state for potential future use
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const DEMO_MODE = false; // Production mode - Razorpay enabled

  const planLabel = plan === "standard" ? "Upgrade" : plan === "premium" ? "Premium" : "Pro";

  const handlePayment = async (target: "premium" | "pro") => {
    setProcessingPayment(true);
    
    // DEMO MODE - Simulate payment without Razorpay
    if (DEMO_MODE) {
      setTimeout(() => {
        setPlan(target);
        setUpgradeOpen(false);
        setProcessingPayment(false);
        alert(`✅ Demo: Successfully upgraded to ${target.charAt(0).toUpperCase() + target.slice(1)}! (Demo Mode)`);
      }, 1500);
      return;
    }

    // ⚠️ TODO: MOVE TO BACKEND ON DEPLOYMENT
    // Security: This payment logic should be moved to backend server for production:
    // 1. Backend creates Razorpay order (POST /api/payment/create-order)
    // 2. Frontend calls checkout with order ID only
    // 3. Backend verifies signature with secret key (NEVER expose in frontend code)
    // 4. Backend updates database with new plan
    // Currently in frontend for development only - move to server/routes before deploying!
    
    // PRODUCTION MODE - Real Razorpay payment
    try {
      const amount = target === "premium" ? 299 : 599;
      
      // Get Razorpay key from environment or use fallback
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_RtYUA2drSIhQYW";
      
      // Load Razorpay script
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => {
        const options = {
          key: razorpayKey, // Use environment variable
          amount: amount * 100, // Amount in paise
          currency: "INR",
          name: "MediLingo",
          description: `${target === "premium" ? "Premium" : "Pro"} Plan Subscription`,
          image: "/medilingo-logo.png",
          handler: function (response: any) {
            // Payment successful
            console.log("Payment successful:", response);
            setPlan(target);
            setUpgradeOpen(false);
            alert(`Successfully upgraded to ${target.charAt(0).toUpperCase() + target.slice(1)}!`);
          },
          prefill: {
            email: email || "",
            name: firstName ? `${firstName} ${lastName}` : "",
          },
          theme: {
            color: "#16a34a", // Green color matching login theme
          },
          modal: {
            ondismiss: function () {
              setProcessingPayment(false);
            },
          },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        setProcessingPayment(false);
      };
      script.onerror = () => {
        setProcessingPayment(false);
        alert("Payment gateway unavailable. Please try again.");
      };
      document.body.appendChild(script);
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed. Please try again.");
      setProcessingPayment(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-nav">
      <div className="container flex items-center justify-between h-16 px-5">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">M</span>
          </div>
          <span className="font-bold text-xl text-secondary">{t.nav.appName}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Login/Logout Button */}
          {isAuthenticated ? (
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              {t.nav.logout}
            </Button>
          ) : (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <LogIn className="w-4 h-4" />
                  {t.nav.login}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{isSignupMode ? "Sign Up for MediLingo" : `${t.nav.login} to MediLingo`}</DialogTitle>
                  <DialogDescription>
                    {isSignupMode ? "Create a new account to get started" : "Enter your credentials to access your account"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={isSignupMode ? handleSignup : handleLogin} className="space-y-4 mt-4">
                  {isSignupMode && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          placeholder="First name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          placeholder="Last name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  )}
                  {isSignupMode && (
                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        placeholder="Your age"
                        min="1"
                        max="150"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  {isSignupMode && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Processing..." : (isSignupMode ? "Create Account" : "Login")}
                  </Button>
                  <div className="text-center space-y-2">
                    <div>
                      <Button
                        type="button"
                        variant="link"
                        onClick={toggleMode}
                        className="text-sm"
                      >
                        {isSignupMode ? "Already have an account? Login" : "New user? Sign up"}
                      </Button>
                    </div>
                    {!isSignupMode && (
                      <div>
                        <Button
                          type="button"
                          variant="link"
                          onClick={openForgotPassword}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Forgot your password?
                        </Button>
                      </div>
                    )}
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {/* Forgot Password Dialog */}
          <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Reset Your Password</DialogTitle>
                <DialogDescription>
                  {forgotPasswordStep === "email" && "Enter your email address to receive a password reset code"}
                  {forgotPasswordStep === "otp" && "Enter the OTP code sent to your email and set a new password"}
                </DialogDescription>
              </DialogHeader>

              {forgotPasswordStep === "email" && (
                <form onSubmit={handleForgotPasswordRequest} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgotEmail">Email Address</Label>
                    <Input
                      id="forgotEmail"
                      type="email"
                      placeholder="Enter your email address"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      required
                      disabled={forgotPasswordLoading}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={forgotPasswordLoading}>
                    {forgotPasswordLoading ? "Sending..." : "Send Reset Code"}
                  </Button>
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="link"
                      onClick={closeForgotPasswordDialog}
                      className="text-sm"
                    >
                      Back to Login
                    </Button>
                  </div>
                </form>
              )}

              {forgotPasswordStep === "otp" && (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">OTP Code</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter 6-digit code from your email"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      required
                      disabled={forgotPasswordLoading}
                    />
                    <p className="text-xs text-gray-500">Check your email for the 6-digit code (valid for 10 minutes)</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      disabled={forgotPasswordLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmNewPassword">Confirm Password</Label>
                    <Input
                      id="confirmNewPassword"
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      required
                      disabled={forgotPasswordLoading}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={forgotPasswordLoading}>
                    {forgotPasswordLoading ? "Resetting..." : "Reset Password"}
                  </Button>
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="link"
                      onClick={closeForgotPasswordDialog}
                      className="text-sm"
                    >
                      Back to Login
                    </Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>

          {/* Upgrade Button */}
          <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-2 border-primary text-primary hover:bg-primary hover:text-white hover:border-primary"
              >
                <Crown className="w-4 h-4" />
                {planLabel}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-900">Choose Your Plan</DialogTitle>
                <DialogDescription className="text-base text-gray-600">
                  Select the plan that best fits your healthcare needs
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 px-4">
                {/* Standard Plan */}
                <div className="border border-gray-200 rounded-lg p-6 text-center space-y-4 h-full hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-lg text-gray-900 mb-3">Standard</h3>
                  <div className="text-3xl font-bold mb-4 text-gray-900">
                    Free
                  </div>
                  <ul className="text-sm space-y-3 mb-6 min-h-[140px] text-gray-700">
                    <li>✓ 5 scans per month</li>
                    <li>✓ 2 languages</li>
                    <li>✓ Basic support</li>
                    <li>✓ Prescription analysis</li>
                  </ul>
                  {plan === "standard" ? (
                    <Button className="w-full py-3 bg-green-600 hover:bg-green-800 text-white text-sm font-semibold transition-colors" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full py-3 border-2 border-green-600 text-green-600 hover:bg-green-700 hover:text-white hover:border-green-700 text-sm font-semibold transition-colors" disabled>
                      Downgrade to Standard
                    </Button>
                  )}
                </div>

                {/* Premium Plan */}
                <div className="border-2 border-green-600 rounded-lg p-6 text-center relative space-y-4 h-full shadow-lg hover:shadow-xl transition-shadow bg-white">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-3 mt-4">Premium</h3>
                  <div className="text-4xl font-bold mb-4 text-gray-900">
                    ₹299
                    <span className="text-base font-normal text-gray-600">/month</span>
                  </div>
                  <ul className="text-sm space-y-3 mb-6 min-h-[140px] text-gray-700">
                    <li>✓ 50 scans per month</li>
                    <li>✓ 5 languages</li>
                    <li>✓ Priority support</li>
                    <li>✓ Advanced analytics</li>
                    <li>✓ Medicine reminders</li>
                  </ul>
                  {plan === "premium" ? (
                    <Button className="w-full py-3 bg-green-600 hover:bg-green-800 text-white text-sm font-semibold transition-colors" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handlePayment("premium")} 
                      disabled={processingPayment}
                      className="w-full py-3 bg-green-600 hover:bg-green-800 text-white text-sm font-semibold transition-colors"
                    >
                      {processingPayment ? "Processing..." : "Upgrade to Premium"}
                    </Button>
                  )}
                </div>

                {/* Pro Plan */}
                <div className="border border-gray-200 rounded-lg p-6 text-center space-y-4 h-full hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-lg text-gray-900 mb-3">Pro</h3>
                  <div className="text-4xl font-bold mb-4 text-gray-900">
                    ₹599
                    <span className="text-base font-normal text-gray-600">/month</span>
                  </div>
                  <ul className="text-sm space-y-3 mb-6 min-h-[140px] text-gray-700">
                    <li>✓ Unlimited scans</li>
                    <li>✓ 10 languages</li>
                    <li>✓ 24/7 priority support</li>
                    <li>✓ Export reports</li>
                    <li>✓ API access</li>
                    <li>✓ Custom integrations</li>
                  </ul>
                  {plan === "pro" ? (
                    <Button className="w-full py-3 bg-green-600 hover:bg-green-800 text-white text-sm font-semibold transition-colors" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handlePayment("pro")} 
                      disabled={processingPayment}
                      variant="outline" 
                      className="w-full py-3 border-2 border-green-600 text-green-600 hover:bg-green-700 hover:text-white hover:border-green-700 text-sm font-semibold transition-colors"
                    >
                      {processingPayment ? "Processing..." : "Upgrade to Pro"}
                    </Button>
                  )}
                </div>
              </div>
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-xs text-gray-700">
                <p>💳 Secure payment powered by Razorpay. Your payment information is encrypted and safe.</p>
                {DEMO_MODE && <p className="mt-2 text-blue-600 font-semibold">🎮 Demo Mode Active - Click to test upgrades!</p>}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
};

export default GlassNav;
