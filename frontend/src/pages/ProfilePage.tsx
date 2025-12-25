import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import GlassNav from "@/components/layout/GlassNav";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Mail, User, Cake, Edit2, Save, X, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UserProfile {
  name: string;
  email: string;
  age: string;
}

const ProfilePage = () => {
  const { t } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changePasswordMode, setChangePasswordMode] = useState(false);

  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    email: "",
    age: "",
  });

  const [editedProfile, setEditedProfile] = useState<UserProfile>({
    name: "",
    email: "",
    age: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Fetch user profile
  useEffect(() => {
    if (isAuthenticated && user) {
      setProfile({
        name: user.name || "",
        email: user.email || "",
        age: user.age ? String(user.age) : "",
      });
      setEditedProfile({
        name: user.name || "",
        email: user.email || "",
        age: user.age ? String(user.age) : "",
      });
    }
  }, [isAuthenticated, user]);

  const handleEditClick = () => {
    setIsEditing(true);
    setEditedProfile(profile);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedProfile(profile);
  };

  const handleSaveProfile = async () => {
    if (!editedProfile.name.trim()) {
      toast({
        title: "Error",
        description: "Name is required.",
        variant: "destructive",
      });
      return;
    }

    if (!editedProfile.age || parseInt(editedProfile.age) < 1) {
      toast({
        title: "Error",
        description: "Please enter a valid age.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name: editedProfile.name,
          age: parseInt(editedProfile.age),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      setProfile(editedProfile);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to change password");
      }

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setChangePasswordMode(false);
      toast({
        title: "Success",
        description: "Password changed successfully!",
      });
    } catch (error) {
      console.error("Error changing password:", error);
      toast({
        title: "Error",
        description: "Failed to change password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <GlassNav />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Not Authenticated</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Please login to view your profile.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>User Profile - MediLingo</title>
        <meta name="description" content="Manage your MediLingo profile" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <GlassNav />

        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8">
          <div className="w-full max-w-md">
            {/* Back Button */}
            <div className="mb-4 flex">
              <button
                onClick={() => navigate("/")}
                className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 transition-colors text-sm font-medium"
                title="Go back"
              >
                <span>⬅️</span>
                Back
              </button>
            </div>
            
            <div className="space-y-3">
            {/* Profile Header Card */}
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl shadow-lg p-4 text-white relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-teal-400 rounded-full opacity-20 -mr-12 -mt-12"></div>
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-teal-400 rounded-full opacity-20 -ml-10 -mb-10"></div>
              
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30 backdrop-blur-sm mx-auto mb-2">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-xl font-bold">{profile.name || "User Profile"}</h1>
                <p className="text-teal-100 text-xs mt-0.5">Manage your information</p>
              </div>
            </div>

            {/* Personal Information Card */}
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-teal-50 to-blue-50 border-b border-teal-100 px-5 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-teal-600" />
                    </div>
                    <h2 className="text-base font-bold text-gray-900">Personal Info</h2>
                  </div>
                  {!isEditing && !changePasswordMode && (
                    <Button
                      onClick={handleEditClick}
                      className="gap-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs h-8 px-2.5"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>

              <CardContent className="pt-4 pb-3">
                {!isEditing ? (
                  // View Mode
                  <div className="space-y-2">
                    <div className="space-y-2">
                      {/* Full Name */}
                      <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-lg p-3 border border-teal-200/50">
                        <Label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                          <User className="w-2.5 h-2.5 text-teal-600" />
                          Full Name
                        </Label>
                        <p className="text-sm font-bold text-gray-900 mt-0.5">
                          {profile.name || "Not provided"}
                        </p>
                      </div>

                      {/* Age */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-3 border border-blue-200/50">
                        <Label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                          <Cake className="w-2.5 h-2.5 text-blue-600" />
                          Age
                        </Label>
                        <p className="text-sm font-bold text-gray-900 mt-0.5">
                          {profile.age || "Not provided"} {profile.age ? "y" : ""}
                        </p>
                      </div>

                      {/* Email */}
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg p-3 border border-purple-200/50">
                        <Label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                          <Mail className="w-2.5 h-2.5 text-purple-600" />
                          Email
                        </Label>
                        <p className="text-xs font-bold text-gray-900 mt-0.5 break-all">
                          {profile.email}
                        </p>
                      </div>
                    </div>

                    {/* Account Actions */}
                    <div className="pt-2 border-t border-gray-200">
                      <Button
                        onClick={() => setChangePasswordMode(true)}
                        variant="outline"
                        className="w-full gap-1.5 border border-teal-600 text-teal-600 hover:bg-teal-50 rounded-lg text-xs h-8"
                      >
                        🔐 Password
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Edit Mode
                  <div className="space-y-2.5">
                    {/* Name Input */}
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-xs font-semibold text-gray-700">
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        value={editedProfile.name}
                        onChange={(e) =>
                          setEditedProfile({
                            ...editedProfile,
                            name: e.target.value,
                          })
                        }
                        placeholder="Enter full name"
                        className="border-2 border-teal-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 rounded-lg h-9 text-xs"
                      />
                    </div>

                    {/* Age Input */}
                    <div className="space-y-1.5">
                      <Label htmlFor="age" className="text-xs font-semibold text-gray-700">
                        Age
                      </Label>
                      <Input
                        id="age"
                        type="number"
                        value={editedProfile.age}
                        onChange={(e) =>
                          setEditedProfile({
                            ...editedProfile,
                            age: e.target.value,
                          })
                        }
                        placeholder="Enter age"
                        min="1"
                        max="150"
                        className="border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg h-9 text-xs"
                      />
                    </div>

                    {/* Email Display (Read-only) */}
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-semibold text-gray-700">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={editedProfile.email}
                        disabled
                        className="bg-gray-100 border-2 border-gray-300 cursor-not-allowed rounded-lg h-9 text-xs text-gray-600"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-1.5 pt-2 border-t border-gray-200">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="bg-teal-600 hover:bg-teal-700 text-white gap-0.5 rounded-lg h-9 flex-1 text-xs font-semibold"
                      >
                        <Save className="w-3 h-3" />
                        Save
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        variant="outline"
                        className="gap-0.5 rounded-lg h-9 flex-1 border border-gray-300 text-xs font-semibold"
                      >
                        <X className="w-3 h-3" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Change Password Section */}
                {changePasswordMode && (
                  <div className="space-y-4 border-t border-gray-200 pt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🔐</span>
                      <h3 className="text-base font-bold text-gray-900">Change Password</h3>
                    </div>

                    {/* Current Password */}
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                        Current Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPassword ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              currentPassword: e.target.value,
                            })
                          }
                          placeholder="Enter current password"
                          className="border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 rounded-lg h-10 pr-10 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                        New Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              newPassword: e.target.value,
                            })
                          }
                          placeholder="Enter new password"
                          className="border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-lg h-10 pr-10 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              confirmPassword: e.target.value,
                            })
                          }
                          placeholder="Confirm new password"
                          className="border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-lg h-10 pr-10 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-3 border-t border-gray-200">
                      <Button
                        onClick={handleChangePassword}
                        disabled={isSaving}
                        className="bg-red-600 hover:bg-red-700 text-white gap-1 rounded-lg h-10 flex-1 text-sm font-semibold"
                      >
                        <Save className="w-3 h-3" />
                        {isSaving ? "Updating..." : "Update"}
                      </Button>
                      <Button
                        onClick={() => {
                          setChangePasswordMode(false);
                          setPasswordData({
                            currentPassword: "",
                            newPassword: "",
                            confirmPassword: "",
                          });
                        }}
                        variant="outline"
                        className="gap-1 rounded-lg h-10 flex-1 border-2 border-gray-300 text-sm font-semibold"
                      >
                        <X className="w-3 h-3" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
