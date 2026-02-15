"use client";

import { useFormContext } from "react-hook-form";
import { PHQ9Questionnaire } from "../phq9-questionnaire";

export function Step8PHQ9() {
  const { watch, setValue } = useFormContext();
  const phq9Responses = watch("phq9Responses") || [0, 0, 0, 0, 0, 0, 0, 0, 0];

  const handleResponsesChange = (responses: number[]) => {
    setValue("phq9Responses", responses);
    setValue("phq9TotalScore", responses.reduce((sum, val) => sum + val, 0));
  };

  return (
    <PHQ9Questionnaire
      responses={phq9Responses}
      onChange={handleResponsesChange}
    />
  );
}
