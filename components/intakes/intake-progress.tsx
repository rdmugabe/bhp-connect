"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface IntakeProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
  completedSteps?: boolean[];
  onStepClick?: (step: number) => void;
}

export function IntakeProgress({
  currentStep,
  totalSteps,
  stepLabels,
  completedSteps = [],
  onStepClick
}: IntakeProgressProps) {
  return (
    <div className="w-full">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-sm text-muted-foreground">
          {stepLabels[currentStep - 1]}
          <span className="ml-2 text-green-600">
            ({completedSteps.filter(Boolean).length} of {totalSteps} complete)
          </span>
        </span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            onClick={() => onStepClick?.(i + 1)}
            className={cn(
              "h-2 flex-1 rounded-full transition-colors",
              onStepClick ? "cursor-pointer hover:opacity-80" : "",
              completedSteps[i]
                ? "bg-green-500"
                : i === currentStep - 1
                ? "bg-primary"
                : "bg-muted"
            )}
          />
        ))}
      </div>
      <div className="flex justify-between mt-4 overflow-x-auto pb-2">
        {stepLabels.map((label, i) => (
          <div
            key={i}
            onClick={() => onStepClick?.(i + 1)}
            className={cn(
              "flex flex-col items-center min-w-[60px] text-center",
              onStepClick ? "cursor-pointer" : "",
              completedSteps[i]
                ? "text-green-600"
                : i === currentStep - 1
                ? "text-primary font-medium"
                : "text-muted-foreground"
            )}
          >
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs mb-1 transition-colors",
                completedSteps[i]
                  ? "bg-green-500 text-white"
                  : i === currentStep - 1
                  ? "bg-primary text-white"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              {completedSteps[i] ? <Check className="w-3 h-3" /> : i + 1}
            </div>
            <span className="text-[10px] leading-tight hidden md:block">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
