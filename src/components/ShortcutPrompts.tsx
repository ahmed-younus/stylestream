import { Sparkles, Link, Search, Shirt, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

interface ShortcutPromptsProps {
  onSelect: (prompt: string) => void;
}

const shortcuts = [
  { icon: ShoppingBag, label: "Black tracksuit", prompt: "Find me a black tracksuit under £200" },
  { icon: Shirt, label: "White sneakers", prompt: "Show me white sneakers from Nike or Adidas" },
  { icon: Search, label: "Designer jacket", prompt: "Find a designer winter jacket" },
  { icon: Sparkles, label: "Party outfit", prompt: "Suggest a party outfit for tonight" },
];

const ShortcutPrompts = ({ onSelect }: ShortcutPromptsProps) => {
  return (
    <div className="space-y-3 mb-4">
      {/* Link paste tip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-2 p-3 bg-secondary/50 rounded-lg border border-border/50"
      >
        <Link className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs text-foreground font-medium">
            Paste a link from any clothing website
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            I'll find the product and let you try it on your avatar
          </p>
        </div>
      </motion.div>

      {/* Quick prompts */}
      <div className="grid grid-cols-2 gap-2">
        {shortcuts.map((shortcut, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelect(shortcut.prompt)}
            className="flex items-center gap-2 p-2.5 text-left border border-border hover:border-foreground hover:bg-foreground/5 transition-all rounded"
          >
            <shortcut.icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs truncate">{shortcut.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default ShortcutPrompts;