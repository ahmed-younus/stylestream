import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Camera, Save, Loader2, ChevronDown, ChevronUp, Ruler, Home, Heart, X, Upload, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

const TRAINER_SIZES = ["UK 3", "UK 4", "UK 5", "UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11", "UK 12", "UK 13", "UK 14"];

const POPULAR_BRANDS = [
  "A Bathing Ape", "Balenciaga", "Burberry", "Calvin Klein", "Casablanca", 
  "Cole Buxton", "CP Company", "DSquared2", "Fendi", "Gucci", "Hugo Boss",
  "Lacoste", "Louis Vuitton", "Nike", "Off-White", "Polo Ralph Lauren", 
  "Prada", "Represent", "Stone Island", "Tommy Hilfiger", "Versace", "Zara"
];

interface OriginalValues {
  displayName: string;
  avatarUrl: string | null;
  heightCm: string;
  trainerSize: string;
  genderPreference: string;
  neckCm: string;
  wristCm: string;
  pantsLengthCm: string;
  chestCm: string;
  waistCm: string;
  hipCm: string;
  inseamCm: string;
  shoulderCm: string;
  favoriteBrands: string[];
}

interface SavedBodyImage {
  id: string;
  image_url: string;
  name: string | null;
  created_at: string;
}

const EditProfile = () => {
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [originalValues, setOriginalValues] = useState<OriginalValues | null>(null);
  
  // Saved body images
  const [savedBodyImages, setSavedBodyImages] = useState<SavedBodyImage[]>([]);
  const [loadingBodyImages, setLoadingBodyImages] = useState(false);
  const [uploadingBodyImage, setUploadingBodyImage] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const bodyImageInputRef = useRef<HTMLInputElement>(null);
  
  // Body measurements
  const [heightCm, setHeightCm] = useState<string>("");
  const [trainerSize, setTrainerSize] = useState<string>("");
  const [genderPreference, setGenderPreference] = useState<string>("");
  const [neckCm, setNeckCm] = useState<string>("");
  const [wristCm, setWristCm] = useState<string>("");
  const [pantsLengthCm, setPantsLengthCm] = useState<string>("");
  const [chestCm, setChestCm] = useState<string>("");
  const [waistCm, setWaistCm] = useState<string>("");
  const [hipCm, setHipCm] = useState<string>("");
  const [inseamCm, setInseamCm] = useState<string>("");
  const [shoulderCm, setShoulderCm] = useState<string>("");
  const [favoriteBrands, setFavoriteBrands] = useState<string[]>([]);
  const [brandInput, setBrandInput] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchSavedBodyImages();
    }
  }, [user]);

  const fetchSavedBodyImages = async () => {
    if (!user) return;
    
    setLoadingBodyImages(true);
    // Only fetch metadata, not full image to improve load speed
    const { data, error } = await supabase
      .from('user_body_images')
      .select('id, name, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    setLoadingBodyImages(false);
    
    if (error) {
      console.error('Error fetching body images:', error);
      return;
    }
    
    // Set without image_url - will be loaded lazily when needed
    setSavedBodyImages((data || []).map(img => ({
      ...img,
      image_url: ''
    })));
  };

  // Load a single image's full data
  const loadBodyImageData = async (imageId: string): Promise<string | null> => {
    const { data, error } = await supabase
      .from('user_body_images')
      .select('image_url')
      .eq('id', imageId)
      .single();
    
    if (error || !data) return null;
    
    setSavedBodyImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, image_url: data.image_url } : img
    ));
    
    return data.image_url;
  };

  const handleBodyImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }

    setUploadingBodyImage(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        const { error } = await supabase
          .from('user_body_images')
          .insert({
            user_id: user.id,
            image_url: base64,
            name: `Body Image ${savedBodyImages.length + 1}`
          });

        if (error) throw error;

        toast.success("Body image saved!");
        fetchSavedBodyImages();
        setUploadingBodyImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error uploading body image:", err);
      toast.error("Failed to upload image");
      setUploadingBodyImage(false);
    }
  };

  const confirmDeleteBodyImage = (imageId: string) => {
    setImageToDelete(imageId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteBodyImage = async () => {
    if (!imageToDelete) return;
    
    try {
      const { error } = await supabase
        .from('user_body_images')
        .delete()
        .eq('id', imageToDelete);

      if (error) throw error;

      toast.success("Image deleted");
      fetchSavedBodyImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error("Failed to delete image");
    } finally {
      setDeleteDialogOpen(false);
      setImageToDelete(null);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const values = {
          displayName: data.display_name || "",
          avatarUrl: data.avatar_url,
          heightCm: data.height_cm?.toString() || "",
          trainerSize: data.trainer_size || "",
          genderPreference: data.gender_preference || "",
          neckCm: data.neck_cm?.toString() || "",
          wristCm: data.wrist_cm?.toString() || "",
          pantsLengthCm: data.pants_length_cm?.toString() || "",
          chestCm: data.chest_cm?.toString() || "",
          waistCm: data.waist_cm?.toString() || "",
          hipCm: data.hip_cm?.toString() || "",
          inseamCm: data.inseam_cm?.toString() || "",
          shoulderCm: data.shoulder_cm?.toString() || "",
          favoriteBrands: (data as any).favorite_brands || [],
        };
        
        setDisplayName(values.displayName);
        setAvatarUrl(values.avatarUrl);
        setHeightCm(values.heightCm);
        setTrainerSize(values.trainerSize);
        setGenderPreference(values.genderPreference);
        setNeckCm(values.neckCm);
        setWristCm(values.wristCm);
        setPantsLengthCm(values.pantsLengthCm);
        setChestCm(values.chestCm);
        setWaistCm(values.waistCm);
        setHipCm(values.hipCm);
        setInseamCm(values.inseamCm);
        setShoulderCm(values.shoulderCm);
        setFavoriteBrands(values.favoriteBrands);
        
        // Store original values for comparison
        setOriginalValues(values);
        
        // Auto-expand advanced if any advanced measurements exist
        if (data.neck_cm || data.wrist_cm || data.pants_length_cm || 
            data.chest_cm || data.waist_cm || data.hip_cm || 
            data.inseam_cm || data.shoulder_cm) {
          setShowAdvanced(true);
        }
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    if (!originalValues) return false;
    const brandsChanged = JSON.stringify(favoriteBrands.sort()) !== JSON.stringify(originalValues.favoriteBrands.sort());
    return (
      displayName !== originalValues.displayName ||
      avatarUrl !== originalValues.avatarUrl ||
      heightCm !== originalValues.heightCm ||
      trainerSize !== originalValues.trainerSize ||
      genderPreference !== originalValues.genderPreference ||
      neckCm !== originalValues.neckCm ||
      wristCm !== originalValues.wristCm ||
      pantsLengthCm !== originalValues.pantsLengthCm ||
      chestCm !== originalValues.chestCm ||
      waistCm !== originalValues.waistCm ||
      hipCm !== originalValues.hipCm ||
      inseamCm !== originalValues.inseamCm ||
      shoulderCm !== originalValues.shoulderCm ||
      brandsChanged
    );
  }, [originalValues, displayName, avatarUrl, heightCm, trainerSize, genderPreference, neckCm, wristCm, pantsLengthCm, chestCm, waistCm, hipCm, inseamCm, shoulderCm, favoriteBrands]);

  const addBrand = (brand: string) => {
    const trimmed = brand.trim();
    if (trimmed && !favoriteBrands.includes(trimmed) && favoriteBrands.length < 10) {
      setFavoriteBrands([...favoriteBrands, trimmed]);
      setBrandInput("");
    }
  };

  const removeBrand = (brand: string) => {
    setFavoriteBrands(favoriteBrands.filter(b => b !== brand));
  };

  const handleBack = () => {
    if (hasUnsavedChanges()) {
      setShowUnsavedDialog(true);
    } else {
      navigate(-1);
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    navigate(-1);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      setAvatarUrl(publicUrl);
      toast.success("Avatar uploaded!");
    } catch (err) {
      console.error("Error uploading avatar:", err);
      toast.error("Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    const trimmedName = displayName.trim();
    if (trimmedName.length > 50) {
      toast.error("Display name must be less than 50 characters");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: trimmedName || null,
          avatar_url: avatarUrl,
          height_cm: heightCm ? parseInt(heightCm) : null,
          trainer_size: trainerSize || null,
          gender_preference: genderPreference || null,
          neck_cm: neckCm ? parseFloat(neckCm) : null,
          wrist_cm: wristCm ? parseFloat(wristCm) : null,
          pants_length_cm: pantsLengthCm ? parseInt(pantsLengthCm) : null,
          chest_cm: chestCm ? parseInt(chestCm) : null,
          waist_cm: waistCm ? parseInt(waistCm) : null,
          hip_cm: hipCm ? parseInt(hipCm) : null,
          inseam_cm: inseamCm ? parseInt(inseamCm) : null,
          shoulder_cm: shoulderCm ? parseInt(shoulderCm) : null,
          favorite_brands: favoriteBrands,
        } as any)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Profile saved!");
      navigate(`/profile/${user.id}`);
    } catch (err) {
      console.error("Error saving profile:", err);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border border-foreground/30 border-t-foreground animate-spin" />
      </div>
    );
  }

  const initials = (displayName || user?.email || "??").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Floating Save Button */}
      <div className="fixed top-20 right-4 z-40">
        <Button
          onClick={handleSave}
          variant="default"
          size="sm"
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4 mr-1" />
              SAVE
            </>
          )}
        </Button>
      </div>

      <div className="max-w-md mx-auto px-4 pt-24 pb-8">
        <h1 className="font-display text-xl tracking-[0.15em] text-center mb-8">EDIT PROFILE</h1>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <Avatar 
                className="w-28 h-28 border-2 border-border cursor-pointer"
                onClick={handleAvatarClick}
              >
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="bg-secondary text-foreground font-display text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              
              <div 
                onClick={handleAvatarClick}
                className="absolute inset-0 rounded-full bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              >
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Camera className="w-6 h-6" />
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <p className="text-sm text-muted-foreground mt-3 font-body">
              Tap to change photo
            </p>
          </div>

          {/* Saved Body Images Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-display text-sm tracking-[0.1em]">SAVED BODY IMAGES</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Save body images for quick try-on sessions without re-uploading
            </p>

            {/* Hidden file input for body images */}
            <input
              ref={bodyImageInputRef}
              type="file"
              accept="image/*"
              onChange={handleBodyImageUpload}
              className="hidden"
            />

            {/* Upload Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => bodyImageInputRef.current?.click()}
              disabled={uploadingBodyImage}
              className="w-full"
            >
              {uploadingBodyImage ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Body Image
                </>
              )}
            </Button>

            {/* Saved Images Grid */}
            {loadingBodyImages ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : savedBodyImages.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {savedBodyImages.map((img) => (
                  <div key={img.id} className="relative group">
                    <div className="aspect-[3/4] border border-border overflow-hidden bg-secondary">
                      <img
                        src={img.image_url}
                        alt={img.name || "Saved body image"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={() => confirmDeleteBodyImage(img.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-md"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <p className="text-[10px] text-muted-foreground mt-1 truncate">
                      {img.name || "Body Image"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-border rounded-lg">
                <User className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">
                  No saved body images yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload images to use in Try-On Studio
                </p>
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="font-display text-xs tracking-wider">
                DISPLAY NAME
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
                className="bg-card border-border"
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground text-right">
                {displayName.length}/50
              </p>
            </div>

            <div className="space-y-2">
              <Label className="font-display text-xs tracking-wider">
                EMAIL
              </Label>
              <Input
                value={user?.email || ""}
                disabled
                className="bg-secondary border-border text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>
          </div>

          {/* Gender Preference */}
          <div className="space-y-2">
            <Label className="font-display text-xs tracking-wider">
              CLOTHING PREFERENCE
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGenderPreference("mens")}
                className={`py-3 border text-sm transition-all ${
                  genderPreference === "mens"
                    ? "border-foreground bg-foreground/5"
                    : "border-border hover:border-muted-foreground"
                }`}
              >
                👔 Menswear
              </button>
              <button
                type="button"
                onClick={() => setGenderPreference("womens")}
                className={`py-3 border text-sm transition-all ${
                  genderPreference === "womens"
                    ? "border-foreground bg-foreground/5"
                    : "border-border hover:border-muted-foreground"
                }`}
              >
                👗 Womenswear
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Unisex items will always be shown
            </p>
          </div>

          {/* Favorite Brands Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-display text-sm tracking-[0.1em]">FAVORITE BRANDS</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Select your favorite brands for personalized AI stylist recommendations
            </p>

            {/* Selected Brands */}
            {favoriteBrands.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {favoriteBrands.map((brand) => (
                  <span
                    key={brand}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-foreground/10 border border-border text-sm"
                  >
                    {brand}
                    <button
                      type="button"
                      onClick={() => removeBrand(brand)}
                      className="ml-1 hover:text-destructive transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Brand Input */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={brandInput}
                  onChange={(e) => setBrandInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addBrand(brandInput);
                    }
                  }}
                  placeholder="Type a brand name..."
                  className="bg-card border-border"
                  maxLength={50}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addBrand(brandInput)}
                  disabled={!brandInput.trim() || favoriteBrands.length >= 10}
                >
                  Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {favoriteBrands.length}/10 brands selected
              </p>
            </div>

            {/* Popular Brands */}
            <div className="space-y-2">
              <Label className="font-display text-xs tracking-wider text-muted-foreground">
                POPULAR BRANDS
              </Label>
              <div className="flex flex-wrap gap-2">
                {POPULAR_BRANDS.filter(b => !favoriteBrands.includes(b)).slice(0, 12).map((brand) => (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => addBrand(brand)}
                    disabled={favoriteBrands.length >= 10}
                    className="px-3 py-1 text-xs border border-border hover:border-foreground hover:bg-foreground/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    + {brand}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Body Measurements Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Ruler className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-display text-sm tracking-[0.1em]">BODY MEASUREMENTS</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Add your measurements for better size recommendations
            </p>

            {/* Essential Measurements */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height" className="font-display text-xs tracking-wider">
                  HEIGHT (CM)
                </Label>
                <Input
                  id="height"
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  placeholder="175"
                  className="bg-card border-border"
                  min={100}
                  max={250}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trainerSize" className="font-display text-xs tracking-wider">
                  TRAINER SIZE
                </Label>
                <Select value={trainerSize} onValueChange={setTrainerSize}>
                  <SelectTrigger className="bg-card border-border">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {TRAINER_SIZES.map((size) => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Advanced Measurements (Collapsible) */}
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between mt-4">
                  <span className="text-xs tracking-[0.1em]">
                    {showAdvanced ? "HIDE" : "SHOW"} DETAILED MEASUREMENTS
                  </span>
                  {showAdvanced ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-4 mt-4">
                <p className="text-xs text-muted-foreground">
                  These optional measurements help with precise sizing
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-display text-xs tracking-wider">
                      CHEST (CM)
                    </Label>
                    <Input
                      type="number"
                      value={chestCm}
                      onChange={(e) => setChestCm(e.target.value)}
                      placeholder="100"
                      className="bg-card border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-display text-xs tracking-wider">
                      WAIST (CM)
                    </Label>
                    <Input
                      type="number"
                      value={waistCm}
                      onChange={(e) => setWaistCm(e.target.value)}
                      placeholder="80"
                      className="bg-card border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-display text-xs tracking-wider">
                      HIP (CM)
                    </Label>
                    <Input
                      type="number"
                      value={hipCm}
                      onChange={(e) => setHipCm(e.target.value)}
                      placeholder="95"
                      className="bg-card border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-display text-xs tracking-wider">
                      SHOULDER (CM)
                    </Label>
                    <Input
                      type="number"
                      value={shoulderCm}
                      onChange={(e) => setShoulderCm(e.target.value)}
                      placeholder="45"
                      className="bg-card border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-display text-xs tracking-wider">
                      NECK (CM)
                    </Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={neckCm}
                      onChange={(e) => setNeckCm(e.target.value)}
                      placeholder="38"
                      className="bg-card border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-display text-xs tracking-wider">
                      WRIST (CM)
                    </Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={wristCm}
                      onChange={(e) => setWristCm(e.target.value)}
                      placeholder="17"
                      className="bg-card border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-display text-xs tracking-wider">
                      INSEAM (CM)
                    </Label>
                    <Input
                      type="number"
                      value={inseamCm}
                      onChange={(e) => setInseamCm(e.target.value)}
                      placeholder="80"
                      className="bg-card border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-display text-xs tracking-wider">
                      PANTS LENGTH (CM)
                    </Label>
                    <Input
                      type="number"
                      value={pantsLengthCm}
                      onChange={(e) => setPantsLengthCm(e.target.value)}
                      placeholder="105"
                      className="bg-card border-border"
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Save Button (mobile) */}
          <Button
            onClick={handleSave}
            variant="primary"
            className="w-full sm:hidden"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Profile
              </>
            )}
          </Button>
        </motion.div>
      </div>

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display tracking-wider">
              UNSAVED CHANGES
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-display text-xs tracking-wider">
              KEEP EDITING
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDiscardChanges}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-display text-xs tracking-wider"
            >
              DISCARD CHANGES
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Body Image Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display tracking-wider">
              DELETE IMAGE
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this body image? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-display text-xs tracking-wider">
              CANCEL
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBodyImage}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-display text-xs tracking-wider"
            >
              DELETE
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EditProfile;