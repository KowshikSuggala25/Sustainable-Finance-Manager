import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "@/components/ThemeProvider";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Settings as SettingsIcon,
  Phone,
  Mail,
  Palette,
  MessageSquare,
  Moon,
  Sun,
  Save,
} from "lucide-react";

export const Settings = () => {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    mobileNumber: "",
    emailAddress: "",
    notifications: true,
    supportMessage: "",
    fullName: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        type ProfileData = {
          avatar_url: string;
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          notes: string;
          updated_at: string;
          mobile_number?: string;
          budget?: number;
        };

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single<ProfileData>();

        if (error) {
          console.error("Error fetching profile:", error);
        } else if (data) {
          setSettings({
            mobileNumber: data.mobile_number || "",
            emailAddress: data.email || "",
            notifications: true,
            supportMessage: "",
            fullName: data.full_name || "",
          });
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: settings.fullName,
          email: settings.emailAddress,
          mobile_number: settings.mobileNumber,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        console.error("Error updating profile:", error);
        toast({
          title: "Error",
          description: "Failed to save settings",
          variant: "destructive",
        });
      } else {
        setIsEditing(false);
        toast({
          title: "Settings Saved",
          description: "Your settings have been saved successfully.",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    field: string,
    value: string | boolean | number
  ) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSendSupport = async () => {
    if (!settings.supportMessage.trim()) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke("send-support-email", {
        body: {
          name: settings.fullName || "User",
          email: "saikowshiksuggala9390@gmail.com", // Send to your email
          message: `From: ${settings.emailAddress}\nName: ${settings.fullName}\n\nMessage: ${settings.supportMessage}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Message Sent",
        description: "Your support message has been sent successfully.",
      });
      setSettings((prev) => ({ ...prev, supportMessage: "" }));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-heading">
            Settings
          </h1>
          <p className="text-muted-foreground">
            Customize your app experience and preferences
          </p>
        </div>

        {isEditing ? (
          <Button
            className="gradient-primary glow-primary hover-scale transition-transform"
            onClick={handleSave}
            disabled={isLoading}
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        ) : (
          <Button
            className="gradient-primary glow-primary hover-scale transition-transform"
            onClick={() => setIsEditing(true)}
          >
            <Save className="w-4 h-4 mr-2" />
            Edit Settings
          </Button>
        )}
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Account Settings */}
        <Card className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/20">
              <SettingsIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Account Settings
              </h3>
              <p className="text-sm text-muted-foreground">
                Manage your personal information
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-foreground">
                Full Name
              </Label>
              <div className="relative">
                <SettingsIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="fullName"
                  value={settings.fullName}
                  onChange={(e) =>
                    handleInputChange("fullName", e.target.value)
                  }
                  className="pl-10"
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="email"
                  type="email"
                  value={settings.emailAddress}
                  onChange={(e) =>
                    handleInputChange("emailAddress", e.target.value)
                  }
                  className="pl-10"
                  disabled={true}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="mobile" className="text-foreground">
                Mobile Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="mobile"
                  value={settings.mobileNumber}
                  onChange={(e) =>
                    handleInputChange("mobileNumber", e.target.value)
                  }
                  className="pl-10 pr-24"
                  disabled={!isEditing}
                />
                {isEditing && settings.mobileNumber && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="absolute right-1 top-1 h-8 text-xs"
                  >
                    Verify OTP
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Theme Preferences */}
        <Card className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-info/20">
              <Palette className="w-5 h-5 text-info" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Theme Preferences
              </h3>
              <p className="text-sm text-muted-foreground">
                Customize your visual experience
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/10 border border-white/5">
              <div className="flex items-center gap-3">
                {theme === "dark" ? (
                  <Moon className="w-5 h-5 text-info" />
                ) : (
                  <Sun className="w-5 h-5 text-warning" />
                )}
                <div>
                  <p className="font-medium text-foreground">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">
                    {theme === "dark"
                      ? "Currently using dark theme"
                      : "Currently using light theme"}
                  </p>
                </div>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) =>
                  setTheme(checked ? "dark" : "light")
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/10 border border-white/5">
              <div>
                <p className="font-medium text-foreground">Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive alerts for transactions and budgets
                </p>
              </div>
              <Switch
                checked={settings.notifications}
                onCheckedChange={(checked) =>
                  handleInputChange("notifications", checked)
                }
              />
            </div>
          </div>
        </Card>

        {/* Contact Support */}
        <Card className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-success/20">
              <MessageSquare className="w-5 h-5 text-success" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Contact Support
              </h3>
              <p className="text-sm text-muted-foreground">
                Get help when you need it
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="support" className="text-foreground">
                Message
              </Label>
              <Textarea
                id="support"
                placeholder="Describe your issue or feedback..."
                value={settings.supportMessage}
                onChange={(e) =>
                  handleInputChange("supportMessage", e.target.value)
                }
                className="min-h-[120px]"
              />
            </div>

            <Button
              className="gradient-success hover-scale transition-transform"
              disabled={!settings.supportMessage.trim() || isLoading}
              onClick={handleSendSupport}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              {isLoading ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
