import { motion } from "framer-motion";
import { useState } from "react";

interface BodyPartSelectorProps {
  onSelectPart: (category: string, subcategories: string[]) => void;
}

interface BodyPart {
  id: string;
  label: string;
  category: string;
  subcategories: string[];
  path: string;
  hoverColor: string;
}

const bodyParts: BodyPart[] = [
  {
    id: "head",
    label: "Head",
    category: "accessories",
    subcategories: ["Hats", "Caps", "Beanies", "Sunglasses"],
    path: "M50 4 C35 4 24 16 24 32 C24 48 35 60 50 60 C65 60 76 48 76 32 C76 16 65 4 50 4 Z",
    hoverColor: "hsl(var(--primary))",
  },
  {
    id: "neck",
    label: "Neck",
    category: "accessories",
    subcategories: ["Chains", "Necklaces", "Scarves"],
    path: "M40 58 L40 72 L60 72 L60 58 Q50 65 40 58 Z",
    hoverColor: "hsl(var(--primary))",
  },
  {
    id: "torso",
    label: "Torso",
    category: "tops",
    subcategories: ["T-Shirts", "Shirts", "Hoodies", "Jackets", "Coats", "Knitwear"],
    path: "M40 70 L20 78 L15 130 L35 135 L35 115 L65 115 L65 135 L85 130 L80 78 L60 70 Q50 75 40 70 Z",
    hoverColor: "hsl(var(--primary))",
  },
  {
    id: "left-arm",
    label: "Left Arm",
    category: "accessories",
    subcategories: ["Watches", "Bracelets"],
    path: "M20 78 L8 85 L5 140 L15 145 L20 130 L15 130 Z",
    hoverColor: "hsl(var(--primary))",
  },
  {
    id: "right-arm",
    label: "Right Arm",
    category: "accessories",
    subcategories: ["Watches", "Bracelets"],
    path: "M80 78 L92 85 L95 140 L85 145 L80 130 L85 130 Z",
    hoverColor: "hsl(var(--primary))",
  },
  {
    id: "legs",
    label: "Legs",
    category: "bottoms",
    subcategories: ["Jeans", "Trousers", "Joggers", "Shorts", "Tracksuits"],
    path: "M35 133 L30 195 L45 195 L50 160 L55 195 L70 195 L65 133 Z",
    hoverColor: "hsl(var(--primary))",
  },
  {
    id: "feet",
    label: "Feet",
    category: "footwear",
    subcategories: ["Trainers", "Boots", "Loafers", "Sandals", "Sliders"],
    path: "M28 193 L20 200 L48 200 L48 193 Z M52 193 L52 200 L80 200 L72 193 Z",
    hoverColor: "hsl(var(--primary))",
  },
];

const BodyPartSelector = ({ onSelectPart }: BodyPartSelectorProps) => {
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);

  const handlePartClick = (part: BodyPart) => {
    setSelectedPart(part.id);
    onSelectPart(part.category, part.subcategories);
  };

  return (
    <div className="relative w-full max-w-[200px] mx-auto">
      {/* Info text */}
      <p className="text-center text-xs text-muted-foreground mb-3">
        Tap a body part to search
      </p>

      {/* SVG Body */}
      <svg
        viewBox="0 0 100 205"
        className="w-full h-auto"
        style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))" }}
      >
        {bodyParts.map((part) => (
          <motion.path
            key={part.id}
            d={part.path}
            fill={
              hoveredPart === part.id || selectedPart === part.id
                ? part.hoverColor
                : "hsl(var(--muted))"
            }
            stroke="hsl(var(--border))"
            strokeWidth="1"
            className="cursor-pointer transition-colors"
            onMouseEnter={() => setHoveredPart(part.id)}
            onMouseLeave={() => setHoveredPart(null)}
            onClick={() => handlePartClick(part)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          />
        ))}
      </svg>

      {/* Hover label */}
      {hoveredPart && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        >
          <div className="bg-foreground text-background px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap">
            {bodyParts.find((p) => p.id === hoveredPart)?.label}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default BodyPartSelector;
