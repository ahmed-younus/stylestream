import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Send, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface SaveOutfitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (caption: string, isPublic: boolean) => void;
  isSaving: boolean;
}

const SaveOutfitDialog = ({ open, onOpenChange, onSave, isSaving }: SaveOutfitDialogProps) => {
  const [caption, setCaption] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const handleSave = () => {
    onSave(caption.trim(), isPublic);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setCaption("");
      setIsPublic(true);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-card border-border max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-display text-lg tracking-wider flex items-center gap-2">
            <Heart className="w-5 h-5" />
            SAVE OUTFIT
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Save this outfit to your collection and optionally share it with the community.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Caption Input */}
          <div className="space-y-2">
            <Label htmlFor="caption" className="font-body text-sm text-muted-foreground">
              Add a caption (optional)
            </Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Share your thoughts about this look..."
              className="bg-secondary border-border resize-none min-h-[100px]"
              maxLength={500}
              autoFocus={false}
              data-autofocus="false"
            />
            <p className="text-xs text-muted-foreground text-right">
              {caption.length}/500
            </p>
          </div>

          {/* Public/Private Toggle */}
          <div className="flex items-center justify-between p-4 bg-secondary/50 border border-border">
            <div className="flex items-center gap-3">
              {isPublic ? (
                <Globe className="w-5 h-5 text-foreground" />
              ) : (
                <Lock className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-display text-xs tracking-wider">
                  {isPublic ? "PUBLIC" : "PRIVATE"}
                </p>
                <p className="text-xs text-muted-foreground font-body">
                  {isPublic 
                    ? "Visible on the feed for everyone" 
                    : "Only you can see this outfit"}
                </p>
              </div>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          {/* What happens next tip */}
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-xs text-muted-foreground font-body leading-relaxed">
              <span className="font-medium text-foreground">After saving:</span> View your outfits in{" "}
              <span className="text-primary">Saved Outfits</span>, share them on the{" "}
              <span className="text-primary">Feed</span>, and get ratings from the community!
            </p>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            variant="primary"
            className="w-full"
          >
            {isSaving ? (
              <>Saving...</>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {isPublic ? "Save & Share" : "Save Privately"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaveOutfitDialog;
