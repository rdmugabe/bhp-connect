"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const PHQ9_QUESTIONS = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself - or that you are a failure or have let yourself or your family down",
  "Trouble concentrating on things, such as reading the newspaper or watching television",
  "Moving or speaking so slowly that other people could have noticed. Or the opposite - being so fidgety or restless that you have been moving around a lot more than usual",
  "Thoughts that you would be better off dead, or of hurting yourself in some way",
];

const RESPONSE_OPTIONS = [
  { value: 0, label: "Not at all" },
  { value: 1, label: "Several days" },
  { value: 2, label: "More than half the days" },
  { value: 3, label: "Nearly every day" },
];

interface PHQ9QuestionnaireProps {
  responses: number[];
  onChange: (responses: number[]) => void;
}

function getSeverity(score: number): { label: string; color: string } {
  if (score <= 4) return { label: "Minimal depression", color: "text-green-600" };
  if (score <= 9) return { label: "Mild depression", color: "text-yellow-600" };
  if (score <= 14) return { label: "Moderate depression", color: "text-orange-600" };
  if (score <= 19) return { label: "Moderately severe depression", color: "text-red-500" };
  return { label: "Severe depression", color: "text-red-700" };
}

export function PHQ9Questionnaire({ responses, onChange }: PHQ9QuestionnaireProps) {
  const totalScore = responses.reduce((sum, val) => sum + val, 0);
  const severity = getSeverity(totalScore);

  const handleResponseChange = (questionIndex: number, value: number) => {
    const newResponses = [...responses];
    newResponses[questionIndex] = value;
    onChange(newResponses);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>PHQ-9 Depression Screening</CardTitle>
        <CardDescription>
          Over the last 2 weeks, how often has the resident been bothered by any of the following problems?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Response scale header */}
        <div className="hidden md:grid grid-cols-[1fr_repeat(4,100px)] gap-2 pb-2 border-b">
          <div></div>
          {RESPONSE_OPTIONS.map((option) => (
            <div key={option.value} className="text-center text-xs text-muted-foreground">
              {option.label}
              <div className="text-sm font-medium">({option.value})</div>
            </div>
          ))}
        </div>

        {/* Questions */}
        {PHQ9_QUESTIONS.map((question, index) => (
          <div key={index} className="space-y-2">
            <div className="md:grid md:grid-cols-[1fr_repeat(4,100px)] md:gap-2 md:items-center">
              <Label className="text-sm leading-relaxed">
                {index + 1}. {question}
              </Label>

              {/* Mobile: Show as buttons */}
              <div className="md:hidden flex flex-wrap gap-2 mt-2">
                {RESPONSE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleResponseChange(index, option.value)}
                    className={cn(
                      "px-3 py-1.5 text-xs rounded-full border transition-colors",
                      responses[index] === option.value
                        ? "bg-primary text-white border-primary"
                        : "bg-white hover:bg-muted"
                    )}
                  >
                    {option.label} ({option.value})
                  </button>
                ))}
              </div>

              {/* Desktop: Radio buttons aligned */}
              {RESPONSE_OPTIONS.map((option) => (
                <div key={option.value} className="hidden md:flex justify-center">
                  <button
                    type="button"
                    onClick={() => handleResponseChange(index, option.value)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      responses[index] === option.value
                        ? "bg-primary border-primary text-white"
                        : "bg-white border-muted-foreground/30 hover:border-primary/50"
                    )}
                  >
                    {responses[index] === option.value && (
                      <span className="text-sm font-medium">{option.value}</span>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Score summary */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Score</p>
              <p className="text-3xl font-bold">{totalScore}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Severity</p>
              <p className={cn("text-lg font-semibold", severity.color)}>
                {severity.label}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-3 bg-gradient-to-r from-green-500 via-yellow-500 via-orange-500 to-red-700 rounded-full">
              <div
                className="w-3 h-3 bg-white border-2 border-gray-800 rounded-full relative"
                style={{ marginLeft: `${Math.min((totalScore / 27) * 100, 100)}%`, transform: "translateX(-50%)" }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0</span>
              <span>27</span>
            </div>
          </div>
        </div>

        {/* Scoring guide */}
        <div className="text-xs text-muted-foreground space-y-1 border-t pt-4">
          <p className="font-medium">PHQ-9 Scoring Guide:</p>
          <p>0-4: Minimal depression | 5-9: Mild | 10-14: Moderate | 15-19: Moderately severe | 20-27: Severe</p>
        </div>
      </CardContent>
    </Card>
  );
}
