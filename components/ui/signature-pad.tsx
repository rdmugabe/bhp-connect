"use client";

import { useRef, useEffect, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eraser, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignaturePadProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function SignaturePad({
  value,
  onChange,
  label,
  disabled = false,
  className,
}: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  // Load existing signature if value is provided
  useEffect(() => {
    if (value && sigCanvas.current) {
      // If value is a base64 image, load it
      if (value.startsWith("data:image")) {
        sigCanvas.current.fromDataURL(value);
        setIsEmpty(false);
      }
    }
  }, [value]);

  const handleClear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      setIsEmpty(true);
      onChange("");
    }
  };

  const handleEnd = () => {
    if (sigCanvas.current) {
      const isEmpty = sigCanvas.current.isEmpty();
      setIsEmpty(isEmpty);
      if (!isEmpty) {
        // Get signature as base64 PNG
        const dataUrl = sigCanvas.current.toDataURL("image/png");
        onChange(dataUrl);
      }
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      <Card className={cn(
        "relative overflow-hidden",
        disabled && "opacity-50 pointer-events-none"
      )}>
        <div className="bg-gray-50 border-b px-3 py-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {isEmpty ? "Sign in the box below" : "Signature captured"}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={disabled || isEmpty}
              className="h-7 px-2"
            >
              <Eraser className="h-3.5 w-3.5 mr-1" />
              Clear
            </Button>
          </div>
        </div>
        <div className="relative bg-white" style={{ touchAction: "none" }}>
          <SignatureCanvas
            ref={sigCanvas}
            penColor="black"
            canvasProps={{
              className: "w-full h-[150px] cursor-crosshair",
              style: { width: "100%", height: "150px" },
            }}
            onEnd={handleEnd}
          />
          {/* Signature line */}
          <div className="absolute bottom-8 left-4 right-4 border-b border-gray-300" />
          <div className="absolute bottom-2 left-4 text-xs text-gray-400">
            Sign above the line
          </div>
        </div>
        {!isEmpty && (
          <div className="absolute top-2 right-2">
            <div className="bg-green-100 text-green-700 rounded-full p-1">
              <Check className="h-3 w-3" />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
