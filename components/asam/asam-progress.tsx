"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ASAMProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
  completedSteps?: boolean[];
  onStepClick?: (step: number) => void;
}

export function ASAMProgress({
  currentStep,
  totalSteps,
  stepLabels,
  completedSteps = [],
  onStepClick
}: ASAMProgressProps) {
  return (
    <div className="w-full">
      <div className="flex justify-between mb-2">
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = completedSteps[index] === true;
          const isCurrent = stepNumber === currentStep;

          return (
            <div
              key={stepNumber}
              className={cn(
                "flex flex-col items-center",
                stepNumber <= totalSteps ? "flex-1" : "",
                onStepClick ? "cursor-pointer" : ""
              )}
              onClick={() => onStepClick?.(stepNumber)}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors",
                  isCompleted
                    ? "bg-green-500 border-green-500 text-white"
                    : isCurrent
                    ? "border-primary text-primary bg-primary/10"
                    : "border-muted-foreground/30 text-muted-foreground hover:border-primary/50"
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
                  isCompleted
                    ? "text-green-600 font-medium"
                    : isCurrent
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
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
          className="absolute left-0 top-0 h-full bg-green-500 transition-all duration-300"
          style={{ width: `${(completedSteps.filter(Boolean).length / totalSteps) * 100}%` }}
        />
      </div>

      <p className="text-center text-sm text-muted-foreground mt-2">
        Step {currentStep} of {totalSteps}: {stepLabels[currentStep - 1]}
        <span className="ml-2 text-green-600">
          ({completedSteps.filter(Boolean).length} of {totalSteps} complete)
        </span>
      </p>
    </div>
  );
}
