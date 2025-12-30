import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { FilterOption, FilterGroup } from "@/data/filterCategories";

interface FilterSectionProps {
  title: string;
  options: FilterOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  defaultExpanded?: boolean;
  variant?: "chips" | "list";
}

export function FilterSection({
  title,
  options,
  selectedIds,
  onToggle,
  defaultExpanded = false,
  variant = "chips",
}: FilterSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border-b border-border/50 pb-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full py-2 text-left"
      >
        <span className="text-xs font-body font-semibold uppercase tracking-wider text-foreground">
          {title}
        </span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {variant === "chips" ? (
              <div className="flex flex-wrap gap-2 pt-2">
                {options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => onToggle(opt.id)}
                    className={cn(
                      "px-3 py-1.5 text-[10px] font-body font-medium uppercase tracking-wider rounded-full transition-all duration-300",
                      selectedIds.includes(opt.id)
                        ? "bg-gold text-noir"
                        : "bg-transparent border border-border text-muted-foreground hover:border-gold/30"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-1 pt-2">
                {options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => onToggle(opt.id)}
                    className={cn(
                      "block w-full text-left px-2 py-1.5 text-xs font-body rounded transition-all duration-200",
                      selectedIds.includes(opt.id)
                        ? "bg-gold/20 text-gold"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface FilterGroupSectionProps {
  group: FilterGroup;
  selectedIds: string[];
  onToggle: (id: string) => void;
  defaultExpanded?: boolean;
}

export function FilterGroupSection({
  group,
  selectedIds,
  onToggle,
  defaultExpanded = false,
}: FilterGroupSectionProps) {
  return (
    <FilterSection
      title={group.label}
      options={group.options}
      selectedIds={selectedIds}
      onToggle={onToggle}
      defaultExpanded={defaultExpanded}
      variant="list"
    />
  );
}
