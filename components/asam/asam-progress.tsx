"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ASAMProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export function ASAMProgress({ currentStep, totalSteps, stepLabels }: ASAMProgressProps) {
  return (
    <div className="w-full">
      <div className="flex justify-between mb-2">
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div
              key={stepNumber}
              className={cn(
                "flex flex-col items-center",
                stepNumber <= totalSteps ? "flex-1" : ""
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors",
                  isCompleted
                    ? "bg-primary border-primary text-primary-foreground"
                    : isCurrent
                    ? "border-primary text-primary bg-primary/10"
                    : "border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  stepNumber
                )}
              </div>
              <span
                className={cn(
                  "text-xs mt-1 text-center hidden md:block",
                  isCurrent ? "text-primary font-medium" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden mt-4">
        <div
          className="absolute left-0 top-0 h-full bg-primary transition-all duration-300"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />
      </div>

      <p className="text-center text-sm text-muted-foreground mt-2">
        Step {currentStep} of {totalSteps}: {stepLabels[currentStep - 1]}
      </p>
    </div>
  );
}
