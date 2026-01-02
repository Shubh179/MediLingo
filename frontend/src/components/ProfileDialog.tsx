import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Mail, User, Cake, Edit2, Save, X, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UserProfile {
  name: string;
  email: string;
  age: string;
}

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProfileDialog = ({ open, onOpenChange }: ProfileDialogProps) => {
  const { isAuthenticated, user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changePasswordMode, setChangePasswordMode] = useState(false);

  // Sharing Code state (female users only)
  const [sharingCode, setSharingCode] = useState<string | null>(null);
  const [showSharingCode, setShowSharingCode] = useState(false);

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

  // Fetch latest profile from backend (MongoDB) and sync UI
  useEffect(() => {
    const refreshProfile = async () => {
      if (!isAuthenticated || !open) return;
      try {
        const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:5001";
        console.log("📱 Fetching profile from:", `${API_BASE_URL}/api/auth/profile`);
        
        const resp = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          method: "GET",
          credentials: "include",
        });
        
        if (!resp.ok) {
          const errorData = await resp.json();
          throw new Error(errorData.message || `Failed to fetch profile (${resp.status})`);
        }
        
        const data = await resp.json();
        console.log("✅ Profile data received:", data);
        
        const u = data?.user || user;
        setProfile({
          name: u?.name || "",
          email: u?.email || "",
          age: u?.age ? String(u.age) : "",
        });
        setEditedProfile({
          name: u?.name || "",
          email: u?.email || "",
          age: u?.age ? String(u.age) : "",
        });
        
        // Load sharing code only for female users
        if (user?.gender === 'Female') {
          try {
            console.log("👩 Fetching sharing code for female user...");
            const codeResp = await fetch(`${API_BASE_URL}/api/share/code`, {
              method: 'GET',
              credentials: 'include',
            });
            
            if (codeResp.ok) {
              const codeData = await codeResp.json();
              console.log("✅ Sharing code received:", codeData);
              setSharingCode(codeData?.sharingCode || null);
            } else {
              const errorData = await codeResp.json();
              console.warn("⚠️ Failed to fetch sharing code:", errorData);
            }
          } catch (e) {
            console.error("❌ Error fetching sharing code:", e);
          }
        }
      } catch (err) {
        console.error("❌ Profile fetch error:", err);
        toast({
          title: "Error",
          description: `Failed to fetch profile: ${err instanceof Error ? err.message : 'Unknown error'}`,
          variant: "destructive",
        });
      }
    };

    refreshProfile();
  }, [isAuthenticated, open, user]);

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
      const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:5001";
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: editedProfile.name,
          age: parseInt(editedProfile.age),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const data = await response.json();
      const u = data?.user || editedProfile;
      setProfile({
        name: u?.name || editedProfile.name,
        email: u?.email || profile.email,
        age: u?.age ? String(u.age) : editedProfile.age,
      });
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

  const handleRegenerateCode = async () => {
    try {
      const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:5001";
      console.log("🔄 Regenerating sharing code...");
      
      const response = await fetch(`${API_BASE_URL}/api/share/regenerate-code`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to regenerate code');
      }

      const data = await response.json();
      console.log("✅ New sharing code generated:", data.sharingCode);
      
      setSharingCode(data.sharingCode);
      toast({
        title: "Success",
        description: "New unique sharing code generated!",
      });
    } catch (error) {
      console.error("❌ Error regenerating code:", error);
      toast({
        title: "Error",
        description: "Failed to generate new code. Please try again.",
        variant: "destructive",
      });
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
      const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:5001";
      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
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
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[75vh] p-4">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
              <User className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <div className="text-base font-bold">{profile.name || "User Profile"}</div>
              <div className="text-xs text-muted-foreground font-normal">Manage your information</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2.5 overflow-y-auto max-h-[calc(75vh-80px)] pr-1">
          {/* Personal Information Card */}
          <Card className="border-0 shadow-sm rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-teal-50 to-blue-50 border-b border-teal-100 px-3 py-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-lg bg-teal-100 flex items-center justify-center">
                    <User className="w-3 h-3 text-teal-600" />
                  </div>
                  <h2 className="text-xs font-bold text-gray-900">Personal Info</h2>
                </div>
                {!isEditing && !changePasswordMode && (
                  <Button
                    onClick={handleEditClick}
                    className="gap-0.5 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs h-6 px-2"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                    Edit
                  </Button>
                )}
              </div>
            </div>

            <CardContent className="pt-2 pb-2 px-3">
              {!isEditing ? (
                // View Mode
                <div className="space-y-1.5">
                  <div className="grid gap-1.5 grid-cols-2">
                    {/* Full Name */}
                    <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-md p-2 border border-teal-200/50">
                      <Label className="text-[10px] font-semibold text-gray-600 flex items-center gap-0.5">
                        <User className="w-2 h-2 text-teal-600" />
                        Name
                      </Label>
                      <p className="text-xs font-bold text-gray-900 mt-0.5">
                        {profile.name || "Not provided"}
                      </p>
                    </div>

                    {/* Age */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-md p-2 border border-blue-200/50">
                      <Label className="text-[10px] font-semibold text-gray-600 flex items-center gap-0.5">
                        <Cake className="w-2 h-2 text-blue-600" />
                        Age
                      </Label>
                      <p className="text-xs font-bold text-gray-900 mt-0.5">
                        {profile.age || "Not provided"} {profile.age ? "y" : ""}
                      </p>
                    </div>
                  </div>

                  {/* Email - Full width row */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-md p-2 border border-purple-200/50">
                    <Label className="text-[10px] font-semibold text-gray-600 flex items-center gap-0.5">
                      <Mail className="w-2 h-2 text-purple-600" />
                      Email
                    </Label>
                    <p className="text-xs font-bold text-gray-900 mt-0.5 break-all">
                      {profile.email}
                    </p>
                  </div>

                  {/* Account Actions */}
                  <div className="pt-1.5 border-t border-gray-200">
                    <Button
                      onClick={() => setChangePasswordMode(true)}
                      variant="outline"
                      size="sm"
                      className="w-full flex items-center justify-center gap-1.5 rounded-md border border-yellow-400 text-yellow-800 font-semibold py-1 bg-gradient-to-r from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 h-7 text-xs"
                    >
                      <span role="img" aria-label="password">🔒</span> Change Password
                    </Button>
                  </div>
                </div>
              ) : (
                // Edit Mode
                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-1.5">
                    {/* Name Input */}
                    <div className="space-y-0.5">
                      <Label htmlFor="name" className="text-[10px] font-semibold text-gray-700">
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
                        className="border border-teal-200 focus:border-teal-500 rounded-md h-7 text-xs"
                      />
                    </div>

                    {/* Age Input */}
                    <div className="space-y-0.5">
                      <Label htmlFor="age" className="text-[10px] font-semibold text-gray-700">
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
                        placeholder="Age"
                        min="1"
                        max="150"
                        className="border border-blue-200 focus:border-blue-500 rounded-md h-7 text-xs"
                      />
                    </div>
                  </div>

                  {/* Email Display (Read-only) */}
                  <div className="space-y-0.5">
                    <Label htmlFor="email" className="text-[10px] font-semibold text-gray-700">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={editedProfile.email}
                      disabled
                      className="bg-gray-100 border border-gray-300 cursor-not-allowed rounded-md h-7 text-xs text-gray-600"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-1.5 pt-1.5 border-t border-gray-200">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      size="sm"
                      className="bg-teal-600 hover:bg-teal-700 text-white gap-0.5 rounded-md h-7 flex-1 text-xs font-semibold"
                    >
                      <Save className="w-2.5 h-2.5" />
                      Save
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      size="sm"
                      className="gap-0.5 rounded-md h-7 flex-1 border border-gray-300 text-xs font-semibold"
                    >
                      <X className="w-3 h-3" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Change Password Section */}
              {changePasswordMode && (
                <div className="space-y-1.5 border-t border-gray-200 pt-2 mt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">🔐</span>
                    <h3 className="text-xs font-bold text-gray-900">Change Password</h3>
                  </div>

                  {/* Current Password */}
                  <div className="space-y-0.5">
                    <Label htmlFor="currentPassword" className="text-[10px] font-semibold text-gray-700 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-red-600"></span>
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
                        placeholder="Current password"
                        className="border border-gray-200 focus:border-red-500 rounded-md h-7 pr-8 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-0.5">
                    <Label htmlFor="newPassword" className="text-[10px] font-semibold text-gray-700 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-green-600"></span>
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
                        placeholder="New password"
                        className="border border-gray-200 focus:border-green-500 rounded-md h-7 pr-8 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-0.5">
                    <Label htmlFor="confirmPassword" className="text-[10px] font-semibold text-gray-700 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-green-600"></span>
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
                        placeholder="Confirm password"
                        className="border border-gray-200 focus:border-green-500 rounded-md h-7 pr-8 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-1.5 pt-1.5 border-t border-gray-200">
                    <Button
                      onClick={handleChangePassword}
                      disabled={isSaving}
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white gap-0.5 rounded-md h-7 flex-1 text-xs font-semibold"
                    >
                      <Save className="w-2.5 h-2.5" />
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
                      size="sm"
                      className="gap-0.5 rounded-md h-7 flex-1 border border-gray-300 text-xs font-semibold"
                    >
                      <X className="w-2.5 h-2.5" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sharing Code Section - Visible only for Female users */}
          {user?.gender === 'Female' && (
            <Card className="border-0 shadow-sm rounded-lg overflow-hidden">
              <div className="bg-gradient-to-r from-rose-50 to-pink-50 border-b border-rose-100 px-3 py-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-lg bg-rose-100 flex items-center justify-center">
                    <span className="text-rose-600 text-[10px] font-bold">SC</span>
                  </div>
                  <h2 className="text-xs font-bold text-gray-900">Sharing Code</h2>
                </div>
              </div>
              <CardContent className="pt-2 pb-2 px-3 space-y-1.5">
                <p className="text-[10px] text-muted-foreground">
                  Share this code with someone you trust to grant access to your period tracker.
                </p>
                <div className="space-y-1">
                  <Label className="text-[13px] font-semibold text-gray-700">Your Code</Label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <div className="h-8 px-3 rounded-md border border-rose-200 bg-white text-xs font-mono tracking-wider flex items-center">
                      {showSharingCode ? (sharingCode || '--------') : '********'}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSharingCode(!showSharingCode)}
                      className="h-8 text-xs px-3"
                    >
                      {showSharingCode ? 'Hide' : 'Show'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs px-3"
                      onClick={() => {
                        if (sharingCode) {
                          navigator.clipboard.writeText(sharingCode);
                          toast({ title: 'Copied', description: 'Code copied to clipboard' });
                        }
                      }}
                    >
                      Copy
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs px-3 border-rose-300 text-rose-600 hover:bg-rose-50"
                      onClick={handleRegenerateCode}
                    >
                      Regenerate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDialog;
