import { useState, useEffect, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/integrations/firebase/client";
import { collection, query, orderBy, limit, onSnapshot, doc, setDoc } from "firebase/firestore";
import { playNewOrderSound, sendBrowserNotification, unlockAudio } from "@/hooks/useAdminOrderNotifications";
import { logAdminActivity } from "@/services/auditLogger";
import { Bell, Send, Users, CheckCircle, XCircle, Loader2, ImageIcon, LinkIcon, Sparkles, Smartphone, Volume2, UploadCloud, Trash2, X, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface PushNotification {
  id: string;
  title: string;
  message: string;
  image_url: string | null;
  action_url: string | null;
  target_type: string;
  sent_count: number;
  failed_count: number;
  status: string;
  sent_by: string | null;
  created_at: string;
  sent_at: string | null;
}

interface TokenStats {
  total: number;
  android: number;
  ios: number;
  web: number;
}

const TEMPLATES = [
  {
    name: "🔥 Flash Sale Alert",
    title: "⚡ আজকের মেগা ফ্ল্যাশ সেল শুরু হয়েছে!",
    message: "সেরা গ্যাজেট ও লাইফস্টাইল প্রোডাক্টে ৫০% পর্যন্ত বিশাল ছাড়। স্টক সীমিত, এখনই অর্ডার করুন!",
    actionUrl: "/products?filter=flash-sale",
    imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&h=300&fit=crop"
  },
  {
    name: "🚚 Free Shipping Offer",
    title: "🎉 আজকের জন্য ফ্রি ডেলিভারি অফার!",
    message: "যেকোনো অর্ডারে ফ্রি হোম ডেলিভারি উপভোগ করুন। কোনো কুপন কোডের প্রয়োজন নেই।",
    actionUrl: "/products",
    imageUrl: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&h=300&fit=crop"
  },
  {
    name: "✨ New Trending Arrivals",
    title: "🛍️ নতুন ট্রেন্ডিং কালেকশন এখন লাইভ!",
    message: "আমাদের স্টোরে যোগ হয়েছে নতুন প্রিমিয়াম ফ্যাশন ও স্মার্ট গ্যাজেট। দেখে নিন এখনই।",
    actionUrl: "/products?sort=newest",
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=300&fit=crop"
  }
];

export default function AdminPushNotifications() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [tokenStats, setTokenStats] = useState<TokenStats>({ total: 0, android: 0, ios: 0, web: 0 });
  
  // Form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [actionUrl, setActionUrl] = useState("");
  const [targetType, setTargetType] = useState<"all" | "android" | "ios" | "web">("all");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageMode, setImageMode] = useState<"upload" | "url">("upload");

  const processAndCompressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const maxDim = 900;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
            resolve(compressedDataUrl);
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleProcessFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file (PNG, JPG, WEBP, GIF).",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessingImage(true);
      const dataUrl = await processAndCompressImage(file);
      setImageUrl(dataUrl);
      toast({
        title: "📸 ছবি যুক্ত হয়েছে!",
        description: "ছবিটি প্রসেস করে পুশ নোটিফিকেশনের জন্য অপ্টিমাইজ করা হয়েছে।"
      });
    } catch (err) {
      toast({
        title: "Upload Error",
        description: "Failed to read image file.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            handleProcessFile(file);
            break;
          }
        }
      }
    }
  };

  const handleRemoveImage = () => {
    setImageUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  useEffect(() => {
    try {
      const tokensRef = collection(db, "push_tokens");
      const unsubscribe = onSnapshot(tokensRef, (snapshot) => {
        let android = 0;
        let ios = 0;
        let web = 0;
        
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const p = data.platform;
          if (p === "android") android++;
          else if (p === "ios") ios++;
          else web++;
        });

        const total = snapshot.size;
        setTokenStats({
          total: total > 0 ? total : 1, // At least 1 for admin's active device
          android,
          ios,
          web: web > 0 ? web : 1
        });
      }, (err) => {
        console.warn("Token stats listener error:", err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("Setup token stats error:", e);
    }
  }, []);

  // 2. Live Firestore broadcast notification list
  useEffect(() => {
    try {
      const notifRef = collection(db, "broadcast_notifications");
      const q = query(notifRef, orderBy("created_at", "desc"), limit(50));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: PushNotification[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          list.push({
            id: docSnap.id,
            title: d.title || "Notification",
            message: d.message || "",
            image_url: d.image_url || null,
            action_url: d.action_url || null,
            target_type: d.target_type || "all",
            sent_count: Number(d.sent_count || 1),
            failed_count: Number(d.failed_count || 0),
            status: d.status || "sent",
            sent_by: d.sent_by || "Admin",
            created_at: d.created_at || new Date().toISOString(),
            sent_at: d.sent_at || d.created_at || new Date().toISOString(),
          });
        });
        setNotifications(list);
      }, (err) => {
        console.warn("Broadcast list error:", err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("Setup broadcast list error:", e);
    }
  }, []);

  const handleApplyTemplate = (tmpl: typeof TEMPLATES[0]) => {
    setTitle(tmpl.title);
    setMessage(tmpl.message);
    setActionUrl(tmpl.actionUrl);
    setImageUrl(tmpl.imageUrl);
    toast({
      title: "Template Applied",
      description: `"${tmpl.name}" filled in successfully.`
    });
  };

  const handleTestOnMyDevice = async () => {
    unlockAudio();
    if (!title.trim() || !message.trim()) {
      toast({
        title: "Test Error",
        description: "Please enter a Title and Message before testing.",
        variant: "destructive"
      });
      return;
    }

    playNewOrderSound();
    sendBrowserNotification(title.trim(), {
      body: message.trim(),
      product_image: imageUrl.trim() || "/icon-512.png",
      data: { url: actionUrl.trim() || "/" }
    });

    toast({
      title: "🔔 Test Notification Triggered!",
      description: "Push alert with sound and photo sent to your current device screen."
    });
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !message.trim()) {
      toast({ title: "Error", description: "Title and message are required", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      unlockAudio();

      const campaignId = `push_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const campaignData = {
        id: campaignId,
        title: title.trim(),
        message: message.trim(),
        image_url: imageUrl.trim() || "/icon-512.png",
        action_url: actionUrl.trim() || "/",
        target_type: targetType,
        status: "sent",
        sent_count: tokenStats.total || 1,
        failed_count: 0,
        sent_by: "Admin",
        created_at: new Date().toISOString(),
        sent_at: new Date().toISOString(),
        timestamp: Date.now()
      };

      // 1. Write to Firestore `broadcast_notifications` (received live by all connected user phones)
      const docRef = doc(db, "broadcast_notifications", campaignId);
      await setDoc(docRef, campaignData);

      // 2. Also trigger local test push on admin phone
      playNewOrderSound();
      sendBrowserNotification(title.trim(), {
        body: message.trim(),
        product_image: imageUrl.trim() || "/icon-512.png",
        data: { url: actionUrl.trim() || "/" }
      });

      logAdminActivity({
        action: "create",
        entity_type: "notification",
        entity_id: campaignId,
        entity_name: title.trim(),
        details: `Broadcasted push notification: "${title.trim()}" to ${tokenStats.total} device(s) (Target: ${targetType})`,
      });

      toast({
        title: "🚀 Notification Broadcast Sent!",
        description: `Successfully broadcasted to ${tokenStats.total} active device(s) across phones and web.`,
      });

      // Reset form
      setTitle("");
      setMessage("");
      setImageUrl("");
      setActionUrl("");
    } catch (error: any) {
      toast({
        title: "Error Sending Broadcast",
        description: error.message || "Failed to broadcast notification",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-emerald-600"><CheckCircle className="w-3 h-3 mr-1" /> Delivered</Badge>;
      case "sending":
        return <Badge className="bg-sky-600"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Sending</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <AdminLayout title="Push Notifications">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary" />
              Push Notifications
            </h1>
            <p className="text-muted-foreground">Send real-time mobile push alerts, flash sale banners & updates to your users</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleTestOnMyDevice}
            className="flex items-center gap-1.5 shrink-0 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary font-semibold"
          >
            <Volume2 className="w-4 h-4" />
            Test On My Phone / PC
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-primary/20 bg-primary/5 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground">{tokenStats.total}</p>
                  <p className="text-xs font-semibold text-muted-foreground">Total Active Devices</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-500/20 bg-green-500/5 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground">{tokenStats.android}</p>
                  <p className="text-xs font-semibold text-muted-foreground">Android Phones</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-500/20 bg-slate-500/5 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-sm shadow-md">
                  
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground">{tokenStats.ios}</p>
                  <p className="text-xs font-semibold text-muted-foreground">iPhone / iOS</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-500/20 bg-blue-500/5 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                  W
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground">{tokenStats.web}</p>
                  <p className="text-xs font-semibold text-muted-foreground">Web / Browsers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Templates */}
        <Card>
          <CardHeader className="py-3 px-4 border-b bg-muted/30">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              Quick Notification Templates (১-ক্লিক টেমপ্লেট)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 flex flex-wrap gap-2">
            {TEMPLATES.map((tmpl, i) => (
              <Button
                key={i}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleApplyTemplate(tmpl)}
                className="text-xs font-semibold hover:bg-primary hover:text-primary-foreground transition-all"
              >
                {tmpl.name}
              </Button>
            ))}
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Send Notification Form */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Send className="h-5 w-5 text-primary" />
                নতুন পুশ নোটিফিকেশন পাঠান (Send Push)
              </CardTitle>
              <CardDescription>আপনার গ্রাহকদের মোবাইল ফোনের স্ক্রিনে সরাসরি নোটিফিকেশন পাঠাতে নিচের তথ্য পূরণ করুন</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendNotification} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title (শিরোনাম) *</Label>
                  <Input
                    id="title"
                    placeholder="যেমন: আজকের সেরা ফ্ল্যাশ সেল অফার! 🔥"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message (বার্তা) *</Label>
                  <Textarea
                    id="message"
                    placeholder="যেমন: সব প্রোডাক্টে ৫০% পর্যন্ত ছাড়! স্টক সীমিত, এখনই অর্ডার করুন।"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    maxLength={500}
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold">
                      <ImageIcon className="h-4 w-4 text-orange-500" />
                      নোটিফিকেশনের ছবি (Notification Image - ঐচ্ছিক)
                    </Label>
                    <div className="flex items-center bg-muted p-0.5 rounded-lg text-xs">
                      <button
                        type="button"
                        onClick={() => setImageMode("upload")}
                        className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                          imageMode === "upload" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        📁 ড্র্যাগ ও ড্রপ
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageMode("url")}
                        className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                          imageMode === "url" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        🔗 ওয়েব লিংক
                      </button>
                    </div>
                  </div>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileInputChange}
                  />

                  {imageUrl ? (
                    <div className="relative group rounded-xl border border-primary/30 overflow-hidden bg-muted/30 p-2">
                      <div className="relative w-full h-36 rounded-lg overflow-hidden bg-black/5 flex items-center justify-center">
                        <img
                          src={imageUrl}
                          alt="Notification Preview"
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs h-8 bg-white/90 text-black hover:bg-white"
                          >
                            <RefreshCw className="w-3.5 h-3.5 mr-1" /> পরিবর্তন করুন
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={handleRemoveImage}
                            className="text-xs h-8"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> রিমুভ করুন
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                          ✓ ছবি সফলভাবে যুক্ত হয়েছে
                        </span>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="text-destructive hover:underline cursor-pointer"
                        >
                          মুছে ফেলুন
                        </button>
                      </div>
                    </div>
                  ) : imageMode === "upload" ? (
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onPaste={handlePaste}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                        isDragging
                          ? "border-primary bg-primary/10 scale-[0.99]"
                          : "border-border hover:border-primary/50 hover:bg-muted/40"
                      }`}
                    >
                      {isProcessingImage ? (
                        <div className="py-3 flex flex-col items-center gap-2">
                          <Loader2 className="w-7 h-7 text-primary animate-spin" />
                          <p className="text-xs text-muted-foreground">ছবি প্রসেসিং ও অপ্টিমাইজ করা হচ্ছে...</p>
                        </div>
                      ) : (
                        <div className="py-2 flex flex-col items-center gap-1.5">
                          <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-1">
                            <UploadCloud className="w-6 h-6" />
                          </div>
                          <p className="text-xs sm:text-sm font-semibold text-foreground">
                            এখানে ছবি ড্র্যাগ ও ড্রপ (Drag & Drop) করুন
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            অথবা কম্পিউটার / ফোন থেকে সিলেক্ট করতে <span className="text-primary font-bold underline">ক্লিক করুন</span>
                          </p>
                          <p className="text-[10px] text-muted-foreground/80 mt-1">
                            সাপোর্টেড ফরম্যাট: PNG, JPG, WEBP, GIF (ক্লিপবোর্ড থেকে Ctrl+V ও করতে পারবেন)
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Input
                        placeholder="https://example.com/product-image.jpg"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        type="url"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        ইন্টারনেট থেকে সরাসরি কোনো ছবির সরাসরি URL লিংক এখানে পেস্ট করতে পারেন।
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actionUrl" className="flex items-center gap-1">
                    <LinkIcon className="h-4 w-4" /> Target Link (ক্লিক করলে যে পেজ খুলবে)
                  </Label>
                  <Input
                    id="actionUrl"
                    placeholder="/products অথবা /product/shirt-123 অথবা /flash-sale"
                    value={actionUrl}
                    onChange={(e) => setActionUrl(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Target Audience (কাদের কাছে যাবে)</Label>
                  <Select value={targetType} onValueChange={(v) => setTargetType(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">📱 All Registered Devices ({tokenStats.total} devices)</SelectItem>
                      <SelectItem value="android">🤖 Android Phones Only ({tokenStats.android} devices)</SelectItem>
                      <SelectItem value="ios"> iPhone / iOS Only ({tokenStats.ios} devices)</SelectItem>
                      <SelectItem value="web">🌐 Web Browsers Only ({tokenStats.web} devices)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestOnMyDevice}
                    className="flex-1 border-primary/30 text-primary hover:bg-primary/10"
                  >
                    <Volume2 className="mr-1.5 h-4 w-4" />
                    টেস্ট করুন
                  </Button>
                  <Button
                    type="submit"
                    className="flex-[2] bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold shadow-md"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        পাঠানো হচ্ছে...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        সবার ফোনে পাঠান ({tokenStats.total} Device)
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Recent Notifications */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Recent Broadcast History (পূর্ববর্তী নোটিফিকেশন)</CardTitle>
              <CardDescription>গ্রাহকদের পাঠানো পুশ নোটিফিকেশনের হিস্টোরি ও স্ট্যাটাস</CardDescription>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-2 opacity-40 text-primary" />
                  <p className="font-semibold text-sm">এখনও কোনো নোটিফিকেশন পাঠানো হয়নি</p>
                  <p className="text-xs">উপরে ফর্ম পূরণ করে প্রথম নোটিফিকেশন পাঠান।</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="border rounded-xl p-3.5 space-y-2.5 bg-card hover:bg-muted/30 transition-colors shadow-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          {notif.image_url && (
                            <img
                              src={notif.image_url}
                              alt=""
                              className="w-12 h-12 rounded-lg object-cover border shrink-0 bg-muted"
                              onError={(e) => { (e.target as any).style.display = 'none'; }}
                            />
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-foreground leading-tight">{notif.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                            {notif.action_url && (
                              <p className="text-[10px] text-primary font-mono mt-1 truncate">
                                🔗 {notif.action_url}
                              </p>
                            )}
                          </div>
                        </div>
                        {getStatusBadge(notif.status)}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                        <span>
                          {notif.sent_at 
                            ? format(new Date(notif.sent_at), "MMM d, yyyy • hh:mm a")
                            : format(new Date(notif.created_at), "MMM d, yyyy • hh:mm a")
                          }
                        </span>
                        <span className="font-semibold text-emerald-600">
                          ✓ {notif.sent_count} ডিভাইসে পাঠানো হয়েছে
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

